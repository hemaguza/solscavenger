package app.solscavenger.service;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.bouncycastle.crypto.generators.Ed25519KeyPairGenerator;
import org.bouncycastle.crypto.params.Ed25519KeyGenerationParameters;
import org.bouncycastle.crypto.params.Ed25519PrivateKeyParameters;
import org.bouncycastle.crypto.params.Ed25519PublicKeyParameters;
import org.bouncycastle.crypto.signers.Ed25519Signer;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;

@QuarkusTest
public class CryptoServiceTest {

    @Inject
    CryptoService cryptoService;

    @Test
    public void testEd25519SignatureVerification() {
        // Generate key pair
        Ed25519KeyPairGenerator keyPairGenerator = new Ed25519KeyPairGenerator();
        keyPairGenerator.init(new Ed25519KeyGenerationParameters(new SecureRandom()));
        var keyPair = keyPairGenerator.generateKeyPair();

        Ed25519PrivateKeyParameters privateKey = (Ed25519PrivateKeyParameters) keyPair.getPrivate();
        Ed25519PublicKeyParameters publicKey = (Ed25519PublicKeyParameters) keyPair.getPublic();

        String walletAddressBase58 = Base58.encode(publicKey.getEncoded());
        String statement = "SolScavenger Authentication Session: solscavenger_12345";

        // Sign statement
        Ed25519Signer signer = new Ed25519Signer();
        signer.init(true, privateKey);
        byte[] msgBytes = statement.getBytes(StandardCharsets.UTF_8);
        signer.update(msgBytes, 0, msgBytes.length);
        byte[] signatureBytes = signer.generateSignature();
        String signatureBase58 = Base58.encode(signatureBytes);

        // Verify with CryptoService
        boolean isValid = cryptoService.verifySignature(walletAddressBase58, statement, signatureBase58);
        Assertions.assertTrue(isValid, "Cryptographic signature should be valid");

        // Verify tampered message fails
        boolean isTamperedValid = cryptoService.verifySignature(walletAddressBase58, statement + "_tampered", signatureBase58);
        Assertions.assertFalse(isTamperedValid, "Tampered statement should fail verification");
    }
}
