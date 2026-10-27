package app.solscavenger.resource;

import app.solscavenger.dto.AuthNonceResponse;
import app.solscavenger.dto.AuthTokenResponse;
import app.solscavenger.dto.VerifySignatureRequest;
import app.solscavenger.service.Base58;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.bouncycastle.crypto.generators.Ed25519KeyPairGenerator;
import org.bouncycastle.crypto.params.Ed25519KeyGenerationParameters;
import org.bouncycastle.crypto.params.Ed25519PrivateKeyParameters;
import org.bouncycastle.crypto.params.Ed25519PublicKeyParameters;
import org.bouncycastle.crypto.signers.Ed25519Signer;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;

import static io.restassured.RestAssured.given;

@QuarkusTest
public class AuthResourceTest {

    @Test
    public void testNonceAndVerificationFlow() {
        // 1. Generate test wallet keypair
        Ed25519KeyPairGenerator keyGen = new Ed25519KeyPairGenerator();
        keyGen.init(new Ed25519KeyGenerationParameters(new SecureRandom()));
        var pair = keyGen.generateKeyPair();
        var priv = (Ed25519PrivateKeyParameters) pair.getPrivate();
        var pub = (Ed25519PublicKeyParameters) pair.getPublic();

        String walletAddress = Base58.encode(pub.getEncoded());

        // 2. Request Nonce
        AuthNonceResponse nonceRes = given()
                .queryParam("wallet", walletAddress)
                .when()
                .get("/api/v1/auth/nonce")
                .then()
                .statusCode(200)
                .extract().as(AuthNonceResponse.class);

        Assertions.assertNotNull(nonceRes.nonce());
        Assertions.assertNotNull(nonceRes.statement());

        // 3. Sign statement with private key
        Ed25519Signer signer = new Ed25519Signer();
        signer.init(true, priv);
        byte[] statementBytes = nonceRes.statement().getBytes(StandardCharsets.UTF_8);
        signer.update(statementBytes, 0, statementBytes.length);
        byte[] sigBytes = signer.generateSignature();
        String signatureBase58 = Base58.encode(sigBytes);

        // 4. Verify signature and get JWT
        VerifySignatureRequest verifyReq = new VerifySignatureRequest(
                walletAddress,
                nonceRes.nonce(),
                signatureBase58
        );

        AuthTokenResponse authRes = given()
                .contentType(ContentType.JSON)
                .body(verifyReq)
                .when()
                .post("/api/v1/auth/verify")
                .then()
                .statusCode(200)
                .extract().as(AuthTokenResponse.class);

        Assertions.assertNotNull(authRes.token());
        Assertions.assertEquals("Bearer", authRes.tokenType());
        Assertions.assertEquals(walletAddress, authRes.walletAddress());
    }
}
