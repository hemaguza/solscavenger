package app.solscavenger.resource;

import app.solscavenger.dto.AuthNonceResponse;
import app.solscavenger.service.Base58;
import io.quarkus.test.junit.QuarkusTest;
import org.bouncycastle.crypto.generators.Ed25519KeyPairGenerator;
import org.bouncycastle.crypto.params.Ed25519KeyGenerationParameters;
import org.bouncycastle.crypto.params.Ed25519PublicKeyParameters;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.security.SecureRandom;

import static io.restassured.RestAssured.given;

@QuarkusTest
public class AuthResourceTest {

    @Test
    public void testNonceGeneration() {
        // 1. Generate test wallet keypair
        Ed25519KeyPairGenerator keyGen = new Ed25519KeyPairGenerator();
        keyGen.init(new Ed25519KeyGenerationParameters(new SecureRandom()));
        var pair = keyGen.generateKeyPair();
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
        Assertions.assertTrue(nonceRes.statement().contains(nonceRes.nonce()));
    }
}
