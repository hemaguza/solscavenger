package app.solscavenger.service;

import app.solscavenger.dto.DormantAccountDto;
import jakarta.enterprise.context.ApplicationScoped;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.*;

/**
 * Compiles atomic Solana legacy transactions in standard wire format.
 * Encapsulates CloseAccount and Platform Fee transfer instructions entirely on the backend,
 * ensuring treasury wallet and fee percentage cannot be tampered with by the client.
 */
@ApplicationScoped
public class SolanaTransactionBuilder {

    public static final String SPL_TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
    public static final String TOKEN_2022_PROGRAM = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
    public static final String SYSTEM_PROGRAM = "11111111111111111111111111111111";

    public static final long STANDARD_SPL_RENT_LAMPORTS = 2_039_280L;
    public static final int CHUNK_SIZE = 16; // 16 accounts safely fits Solana MTU limit

    public record CompiledBatchResult(
            List<String> transactionsBase64,
            int totalAccounts,
            long totalReclaimableLamports,
            long totalPlatformFeeLamports
    ) {}

    /**
     * Builds serialized Base64 Solana transactions chunked by 16 accounts.
     */
    public CompiledBatchResult buildBatchTransactions(
            String walletAddress,
            List<DormantAccountDto> accountsToClose,
            String recentBlockhashBase58,
            String treasuryWallet,
            double feePercentage
    ) throws Exception {
        if (accountsToClose == null || accountsToClose.isEmpty()) {
            return new CompiledBatchResult(List.of(), 0, 0L, 0L);
        }

        // Deduplicate input accounts by pubkey to prevent atomic execution aborts in Solana
        Map<String, DormantAccountDto> uniqueMap = new LinkedHashMap<>();
        for (DormantAccountDto acc : accountsToClose) {
            if (acc != null && acc.pubkey() != null && !acc.pubkey().isBlank()) {
                uniqueMap.putIfAbsent(acc.pubkey().trim(), acc);
            }
        }
        List<DormantAccountDto> dedupedAccounts = new ArrayList<>(uniqueMap.values());
        if (dedupedAccounts.isEmpty()) {
            return new CompiledBatchResult(List.of(), 0, 0L, 0L);
        }

        List<String> serializedTxs = new ArrayList<>();
        long totalReclaimableLamports = 0L;
        long totalPlatformFeeLamports = 0L;

        for (int i = 0; i < dedupedAccounts.size(); i += CHUNK_SIZE) {
            int end = Math.min(i + CHUNK_SIZE, dedupedAccounts.size());
            List<DormantAccountDto> chunk = dedupedAccounts.subList(i, end);

            // Anti-tamper fee calculation: Enforce minimum standard rent for CLOSE accounts,
            // preventing malicious clients from evading platform fees with reclaimableLamports: 0
            long chunkLamports = 0L;
            for (DormantAccountDto acc : chunk) {
                boolean isWithdrawExcess = "WITHDRAW_EXCESS".equalsIgnoreCase(acc.actionType())
                        || "EXCESS".equalsIgnoreCase(acc.actionType());
                long effective = isWithdrawExcess
                        ? Math.max(acc.reclaimableLamports(), 1_000L)
                        : Math.max(acc.reclaimableLamports(), STANDARD_SPL_RENT_LAMPORTS);
                chunkLamports += effective;
            }

            long feeLamports = Math.max(0L, (long) Math.floor(chunkLamports * feePercentage));

            totalReclaimableLamports += chunkLamports;
            totalPlatformFeeLamports += feeLamports;

            byte[] wireBytes = compileSingleTransaction(
                    walletAddress,
                    chunk,
                    recentBlockhashBase58,
                    treasuryWallet,
                    feeLamports
            );

            serializedTxs.add(Base64.getEncoder().encodeToString(wireBytes));
        }

        return new CompiledBatchResult(
                serializedTxs,
                dedupedAccounts.size(),
                totalReclaimableLamports,
                totalPlatformFeeLamports
        );
    }

    /**
     * Compiles a single Solana legacy transaction into wire format bytes.
     */
    public byte[] compileSingleTransaction(
            String walletAddress,
            List<DormantAccountDto> chunk,
            String recentBlockhashBase58,
            String treasuryWallet,
            long feeLamports
    ) throws Exception {
        byte[] walletKey = Base58.decode(walletAddress);
        byte[] treasuryKey = Base58.decode(treasuryWallet);
        byte[] blockhash = Base58.decode(recentBlockhashBase58);

        // 1. Account Keys categorization
        // Writable signer: wallet (index 0)
        // Writable non-signers: treasury (if fee > 0), plus all ATA pubkeys
        // Readonly non-signers: TokenProgram, Token2022Program (if used), SystemProgram (if fee > 0)
        List<byte[]> accountKeys = new ArrayList<>();
        accountKeys.add(walletKey); // Index 0: Fee payer and account owner

        boolean includeTreasury = feeLamports > 0;
        int treasuryIndex = -1;
        if (includeTreasury) {
            treasuryIndex = accountKeys.size();
            accountKeys.add(treasuryKey);
        }

        Map<String, Integer> ataIndexMap = new LinkedHashMap<>();
        boolean usesSpl = false;
        boolean usesToken2022 = false;

        for (DormantAccountDto acc : chunk) {
            String pubkey = acc.pubkey();
            if (!ataIndexMap.containsKey(pubkey)) {
                ataIndexMap.put(pubkey, accountKeys.size());
                accountKeys.add(Base58.decode(pubkey));
            }
            if (TOKEN_2022_PROGRAM.equalsIgnoreCase(acc.programId())) {
                usesToken2022 = true;
            } else {
                usesSpl = true;
            }
        }

        int readonlyUnsignedCount = 0;
        int splProgramIndex = -1;
        if (usesSpl) {
            splProgramIndex = accountKeys.size();
            accountKeys.add(Base58.decode(SPL_TOKEN_PROGRAM));
            readonlyUnsignedCount++;
        }

        int token2022ProgramIndex = -1;
        if (usesToken2022) {
            token2022ProgramIndex = accountKeys.size();
            accountKeys.add(Base58.decode(TOKEN_2022_PROGRAM));
            readonlyUnsignedCount++;
        }

        int systemProgramIndex = -1;
        if (includeTreasury) {
            systemProgramIndex = accountKeys.size();
            accountKeys.add(Base58.decode(SYSTEM_PROGRAM));
            readonlyUnsignedCount++;
        }

        // 2. Build Instructions
        List<CompiledInstruction> instructions = new ArrayList<>();

        // Add CloseAccount (opcode 9) or WithdrawExcessLamports (opcode 38) for each ATA
        for (DormantAccountDto acc : chunk) {
            int programIndex = TOKEN_2022_PROGRAM.equalsIgnoreCase(acc.programId())
                    ? token2022ProgramIndex
                    : splProgramIndex;
            int ataIdx = ataIndexMap.get(acc.pubkey());

            // Instruction accounts layout for both CloseAccount and WithdrawExcessLamports:
            // [source ATA (writable), destination wallet (0, writable), owner/authority (0, signer)]
            byte[] accIndices = new byte[]{(byte) ataIdx, 0, 0};

            // Opcode 38 = WithdrawExcessLamports (SIMD-0437 / Token-2022 / SPL Token)
            // Opcode 9 = CloseAccount (Standard SPL Token)
            boolean isWithdrawExcess = "WITHDRAW_EXCESS".equalsIgnoreCase(acc.actionType())
                    || "EXCESS".equalsIgnoreCase(acc.actionType());
            byte opcode = isWithdrawExcess ? (byte) 38 : (byte) 9;
            byte[] data = new byte[]{opcode};

            instructions.add(new CompiledInstruction(programIndex, accIndices, data));
        }

        // Add platform fee transfer instruction if feeLamports > 0
        if (includeTreasury) {
            // SystemProgram.transfer: [from (0, writable, signer), to (treasuryIndex, writable)]
            byte[] accIndices = new byte[]{0, (byte) treasuryIndex};

            // Instruction data: 4 bytes type (2 = Transfer) + 8 bytes lamports (little endian)
            ByteBuffer buf = ByteBuffer.allocate(12).order(ByteOrder.LITTLE_ENDIAN);
            buf.putInt(2); // Transfer instruction index
            buf.putLong(feeLamports);
            byte[] data = buf.array();

            instructions.add(new CompiledInstruction(systemProgramIndex, accIndices, data));
        }

        // 3. Assemble Solana Wire Format
        ByteArrayOutputStream txOut = new ByteArrayOutputStream();

        // Number of signatures: Compact-u16 (1 signer)
        writeCompactU16(txOut, 1);
        // Signature slot: 64 zero bytes placeholder
        txOut.write(new byte[64]);

        // --- MESSAGE ---
        // Header:
        // 1. num_required_signatures = 1
        // 2. num_readonly_signed_accounts = 0
        // 3. num_readonly_unsigned_accounts = readonlyUnsignedCount
        txOut.write(1);
        txOut.write(0);
        txOut.write(readonlyUnsignedCount);

        // Account Keys array
        writeCompactU16(txOut, accountKeys.size());
        for (byte[] key : accountKeys) {
            txOut.write(key);
        }

        // Recent Blockhash (32 bytes)
        txOut.write(blockhash);

        // Instructions array
        writeCompactU16(txOut, instructions.size());
        for (CompiledInstruction ix : instructions) {
            txOut.write(ix.programIdIndex);
            writeCompactU16(txOut, ix.accountIndices.length);
            txOut.write(ix.accountIndices);
            writeCompactU16(txOut, ix.data.length);
            txOut.write(ix.data);
        }

        return txOut.toByteArray();
    }

    private record CompiledInstruction(int programIdIndex, byte[] accountIndices, byte[] data) {}

    public static void writeCompactU16(ByteArrayOutputStream out, int value) {
        while (true) {
            int elem = value & 0x7f;
            value >>= 7;
            if (value == 0) {
                out.write(elem);
                break;
            } else {
                elem |= 0x80;
                out.write(elem);
            }
        }
    }
}

