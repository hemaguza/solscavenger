package app.solscavenger.service;

import app.solscavenger.dto.DormantAccountDto;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

public class SolanaTransactionBuilderTest {

    private final SolanaTransactionBuilder builder = new SolanaTransactionBuilder();

    // Standard valid 32-byte Base58 addresses
    private static final String WALLET = "4Nd1mBQtrMJVYVfKf2PJy9NZqda883jLFb5cg5vdKSnR";
    private static final String TREASURY = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";
    private static final String BLOCKHASH = "EkSnNWid2cvwEVnPx9aZaWuYSpMm2S4iaPXJ3mtE2g5a";

    @Test
    void testBuildBatchTransactionsEmpty() throws Exception {
        var result = builder.buildBatchTransactions(WALLET, List.of(), BLOCKHASH, TREASURY, 0.10);
        Assertions.assertEquals(0, result.totalAccounts());
        Assertions.assertTrue(result.transactionsBase64().isEmpty());
    }

    @Test
    void testBuildSingleTransactionSerialization() throws Exception {
        List<DormantAccountDto> accounts = List.of(
                new DormantAccountDto(
                        "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
                        "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
                        BigDecimal.ZERO,
                        6,
                        2039280L,
                        BigDecimal.valueOf(0.00203928),
                        SolanaTransactionBuilder.SPL_TOKEN_PROGRAM
                )
        );

        var result = builder.buildBatchTransactions(WALLET, accounts, BLOCKHASH, TREASURY, 0.10);

        Assertions.assertEquals(1, result.totalAccounts());
        Assertions.assertEquals(1, result.transactionsBase64().size());
        Assertions.assertEquals(2039280L, result.totalReclaimableLamports());
        Assertions.assertEquals(203928L, result.totalPlatformFeeLamports()); // 10% fee

        String txBase64 = result.transactionsBase64().get(0);
        Assertions.assertNotNull(txBase64);
        byte[] txBytes = Base64.getDecoder().decode(txBase64);

        // Verification of Solana wire format header
        // 1 signature (compact-u16: 1) + 64 zero bytes signature slot = 65 bytes
        Assertions.assertTrue(txBytes.length > 65);
        Assertions.assertEquals(1, txBytes[0]); // 1 signature
    }

    @Test
    void testChunkingMoreThan16Accounts() throws Exception {
        List<DormantAccountDto> accounts = new ArrayList<>();
        for (int i = 0; i < 35; i++) {
            byte[] keyBytes = new byte[32];
            keyBytes[0] = (byte) ((i + 1) & 0xFF);
            keyBytes[1] = 5;
            String pubkey = Base58.encode(keyBytes);
            accounts.add(new DormantAccountDto(
                    pubkey,
                    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
                    BigDecimal.ZERO,
                    6,
                    2039280L,
                    BigDecimal.valueOf(0.00203928),
                    SolanaTransactionBuilder.SPL_TOKEN_PROGRAM
            ));
        }

        var result = builder.buildBatchTransactions(WALLET, accounts, BLOCKHASH, TREASURY, 0.10);

        // 35 distinct accounts split into chunks of 16 -> 16 + 16 + 3 = 3 transactions
        Assertions.assertEquals(35, result.totalAccounts());
        Assertions.assertEquals(3, result.transactionsBase64().size());
    }

    @Test
    void testDeduplicationOfDuplicateAccounts() throws Exception {
        List<DormantAccountDto> accounts = List.of(
                new DormantAccountDto(
                        "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
                        "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
                        BigDecimal.ZERO,
                        6,
                        2039280L,
                        BigDecimal.valueOf(0.00203928),
                        SolanaTransactionBuilder.SPL_TOKEN_PROGRAM
                ),
                new DormantAccountDto(
                        "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
                        "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
                        BigDecimal.ZERO,
                        6,
                        2039280L,
                        BigDecimal.valueOf(0.00203928),
                        SolanaTransactionBuilder.SPL_TOKEN_PROGRAM
                )
        );

        var result = builder.buildBatchTransactions(WALLET, accounts, BLOCKHASH, TREASURY, 0.10);

        // 2 identical accounts must be deduplicated to 1
        Assertions.assertEquals(1, result.totalAccounts());
        Assertions.assertEquals(1, result.transactionsBase64().size());
    }
}

