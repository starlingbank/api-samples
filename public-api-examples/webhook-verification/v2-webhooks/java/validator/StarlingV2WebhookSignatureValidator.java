import java.security.InvalidKeyException;
import java.security.KeyFactory;
import java.security.NoSuchAlgorithmException;
import java.security.Signature;
import java.security.SignatureException;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

class StarlingV2WebhookSignatureValidator {

  public static void main(String[] args) throws InvalidKeySpecException, NoSuchAlgorithmException, InvalidKeyException, SignatureException {

    if (args.length != 3) {
      System.err.println("Expected 3 arguments but got " + args.length);
      System.out.println("Usage: java StarlingV2WebhookSignatureValidator <public key> <signature> <payload>");
      System.out.println("You may need to surround the arguments in quotes, and escape any inner quotes");
      return;
    }

    if (isValid(args[0], args[1], args[2])) {
      System.out.println("Good webhook signature");
    } else {
      System.out.println("Bad webhook signature");
    }
  }

  static boolean isValid(String publicKey, String signature, String jsonPayload)
      throws NoSuchAlgorithmException, InvalidKeySpecException, InvalidKeyException, SignatureException {

    X509EncodedKeySpec x509publicKey = new X509EncodedKeySpec(Base64.getDecoder().decode(publicKey));

    Signature signAlg = Signature.getInstance("SHA512withRSA");
    signAlg.initVerify(KeyFactory.getInstance("RSA").generatePublic(x509publicKey));
    signAlg.update(jsonPayload.getBytes());

    return signAlg.verify(Base64.getDecoder().decode(signature));
  }
}
