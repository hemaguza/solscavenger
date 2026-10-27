package app.solscavenger.service;

import jakarta.enterprise.context.ApplicationScoped;
import org.bouncycastle.crypto.Signer;
import org.bouncycastle.crypto.params.Ed25519PublicKeyParameters;
import org.bouncycastle.crypto.signers.Ed25519Signer;

import java.nio.charset.StandardCharsets;

@ApplicationScoped
public class CryptoService {

    /**
     * Verifies an Ed25519 cryptographic signature.
     *
     * @param base58PublicKey Solana wallet address in Base58
     * @param message Text statement signed by the wallet
     * @param base58Signature Signature output in Base58
     * @return true if valid, false otherwise
     */
    public boolean verifySignature(String base58PublicKey, String message, String base58Signature) {
        try {
            byte[] publicKeyBytes = Base58.decode(base58PublicKey);
            byte[] signatureBytes = Base58.decode(base58Signature);
            byte[] messageBytes = message.getBytes(StandardCharsets.UTF_8);

            if (publicKeyBytes.length != 32 || signatureBytes.length != 64) {
                return false;
            }

            Ed25519PublicKeyParameters pubKeyParams = new Ed25519PublicKeyParameters(publicKeyBytes, 0);
            Signer signer = new Ed25519Signer();
            signer.init(false, pubKeyParams);
            signer.update(messageBytes, 0, messageBytes.length);

            return signer.verifySignature(signatureBytes);
        } catch (Exception e) {
            return false;
        }
    }
}
