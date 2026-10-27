package app.solscavenger.service;

import java.util.Arrays;

/**
 * Standard Base58 encoder and decoder for Solana addresses and Ed25519 signatures.
 */
public final class Base58 {

    private static final String ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    private static final char[] ENCODED_CHARS = ALPHABET.toCharArray();
    private static final int[] INDEXES = new int[128];

    static {
        Arrays.fill(INDEXES, -1);
        for (int i = 0; i < ENCODED_CHARS.length; i++) {
            INDEXES[ENCODED_CHARS[i]] = i;
        }
    }

    private Base58() {}

    public static String encode(byte[] input) {
        if (input.length == 0) {
            return "";
        }
        int zeroes = 0;
        while (zeroes < input.length && input[zeroes] == 0) {
            ++zeroes;
        }
        byte[] temp = Arrays.copyOf(input, input.length);
        char[] encoded = new char[temp.length * 2];
        int outputStart = encoded.length;
        int inputStart = zeroes;
        while (inputStart < temp.length) {
            encoded[--outputStart] = ENCODED_CHARS[divmod(temp, inputStart, 256, 58)];
            if (temp[inputStart] == 0) {
                ++inputStart;
            }
        }
        while (outputStart < encoded.length && encoded[outputStart] == ENCODED_CHARS[0]) {
            ++outputStart;
        }
        while (--zeroes >= 0) {
            encoded[--outputStart] = ENCODED_CHARS[0];
        }
        return new String(encoded, outputStart, encoded.length - outputStart);
    }

    public static byte[] decode(String input) {
        if (input.isEmpty()) {
            return new byte[0];
        }
        byte[] input58 = new byte[input.length()];
        for (int i = 0; i < input.length(); ++i) {
            char c = input.charAt(i);
            int digit = c < 128 ? INDEXES[c] : -1;
            if (digit < 0) {
                throw new IllegalArgumentException("Illegal character " + c + " at " + i);
            }
            input58[i] = (byte) digit;
        }
        int zeroes = 0;
        while (zeroes < input58.length && input58[zeroes] == 0) {
            ++zeroes;
        }
        byte[] decoded = new byte[input.length()];
        int outputStart = decoded.length;
        int inputStart = zeroes;
        while (inputStart < input58.length) {
            decoded[--outputStart] = divmod(input58, inputStart, 58, 256);
            if (input58[inputStart] == 0) {
                ++inputStart;
            }
        }
        while (outputStart < decoded.length && decoded[outputStart] == 0) {
            ++outputStart;
        }
        return Arrays.copyOfRange(decoded, outputStart - zeroes, decoded.length);
    }

    private static byte divmod(byte[] number, int firstDigit, int base, int divisor) {
        int remainder = 0;
        for (int i = firstDigit; i < number.length; i++) {
            int digit = (int) number[i] & 0xFF;
            int temp = remainder * base + digit;
            number[i] = (byte) (temp / divisor);
            remainder = temp % divisor;
        }
        return (byte) remainder;
    }
}
