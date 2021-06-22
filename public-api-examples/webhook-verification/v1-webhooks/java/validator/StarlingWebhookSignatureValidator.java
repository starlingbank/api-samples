import static java.nio.charset.StandardCharsets.UTF_8;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

class StarlingWebhookSignatureValidator {

  // Don't hardcode this in production
  public static final String SHARED_SECRET = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";

  public static void main(String[] args) throws NoSuchAlgorithmException {
    if (args.length != 2) {
      System.err.println("Expected 2 arguments but got " + args.length);
      System.out.println("Usage: java StarlingWebhookSignatureValidator <signature> <payload>");
      System.out.println("You may need to surround the arguments in quotes, and escape any inner quotes");
      return;
    }

    if (isValid(args[0], args[1])) {
      System.out.println("Good webhook signature");
    } else {
      System.out.println("Bad webhook signature");
    }
  }

  public static boolean isValid(String signature, String payload) throws NoSuchAlgorithmException {
    MessageDigest messageDigest = MessageDigest.getInstance("SHA-512");
    messageDigest.update(SHARED_SECRET.getBytes(UTF_8));
    messageDigest.update(payload.getBytes(UTF_8));
    String calculatedSignature = Base64.getEncoder().encodeToString(messageDigest.digest());

    return calculatedSignature.equals(signature);
  }
}