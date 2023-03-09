package com.starlingbank;

import static com.starlingbank.SignatureUtils.createAuthorizationHeader;
import static com.starlingbank.SignatureUtils.createDigest;
import static com.starlingbank.SignatureUtils.sign;
import static com.starlingbank.SigningAlgorithm.RSA_SHA256;
import static java.time.format.DateTimeFormatter.ISO_OFFSET_DATE_TIME;

import com.google.gson.Gson;
import com.starlingbank.dto.Account;
import com.starlingbank.dto.AccountsResponse;
import com.starlingbank.dto.Payee;
import com.starlingbank.dto.PayeesResponse;
import com.starlingbank.dto.PaymentInitiationResponse;
import com.starlingbank.dto.PaymentRequest;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpRequest.BodyPublishers;
import java.net.http.HttpResponse;
import java.net.http.HttpResponse.BodyHandlers;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.time.ZonedDateTime;
import java.util.Optional;
import java.util.UUID;

class StarlingApiClient {

  private static final Gson GSON = new Gson();
  private static final String HOSTNAME = "https://api.starlingbank.com";

  private static final String PAY_LOCAL_ENDPOINT = "/api/v2/payments/local/account/%s/category/%s";
  private static final String ACCOUNTS_ENDPOINT = "/api/v2/accounts";
  private static final String PAYEES_ENDPOINT = "/api/v2/payees";

  private final String accessToken;
  private final UUID keyUid;
  private final PrivateKey signingKey;
  private final HttpClient client = HttpClient.newBuilder().build();

  StarlingApiClient(
      String accessToken,
      String signingKeyFilename,
      UUID keyUid) {
    this.accessToken = accessToken;
    this.keyUid = keyUid;
    try {
      KeyFactory keyFactory = KeyFactory.getInstance("RSA");
      this.signingKey = KeyUtils.getPrivateKey(signingKeyFilename, keyFactory);
    } catch (Exception e) {
      throw new RuntimeException(e);
    }
  }

  Account getPrimaryGbpAccount() throws RequestFailureException {
    HttpRequest request = HttpRequest.newBuilder()
        .header("Authorization", "Bearer " + accessToken)
        .header("Content-Type", "application/json")
        .GET()
        .uri(URI.create(HOSTNAME + ACCOUNTS_ENDPOINT))
        .build();

    AccountsResponse response = send(request, AccountsResponse.class);

    return response.accounts()
        .stream()
        .filter(a -> a.accountType().equals("PRIMARY") && a.currency().equals("GBP"))
        .findFirst()
        .orElseThrow(() -> new IllegalStateException("Unable to find GBP primary account"));
  }

  PaymentInitiationResponse initiatePayment(
      Account sourceAccount,
      PaymentRequest request) throws RequestFailureException {

    String date = ISO_OFFSET_DATE_TIME.format(ZonedDateTime.now());
    String path = PAY_LOCAL_ENDPOINT.formatted(sourceAccount.accountUid(),
        sourceAccount.defaultCategory());
    String json = GSON.toJson(request);
    String digest = createDigest(json);
    String textToSign = "(request-target): put %s\nDate: %s\nDigest: %s".formatted(path, date,
        digest);

    String signature = sign(signingKey, RSA_SHA256, textToSign);
    String authorizationHeader = createAuthorizationHeader(accessToken, keyUid, RSA_SHA256,
        signature);

    HttpRequest req = HttpRequest.newBuilder()
        .header("Date", date)
        .header("Digest", digest)
        .header("Authorization", authorizationHeader)
        .header("Content-Type", "application/json")
        .PUT(BodyPublishers.ofString(json))
        .uri(URI.create(HOSTNAME + path))
        .build();

    return send(req, PaymentInitiationResponse.class);
  }

  public Optional<Payee> findPayee(String payeeName) throws RequestFailureException {

    HttpRequest request = HttpRequest.newBuilder()
        .header("Authorization", "Bearer " + accessToken)
        .header("Content-Type", "application/json")
        .GET()
        .uri(URI.create(HOSTNAME + PAYEES_ENDPOINT))
        .build();

    return send(request, PayeesResponse.class)
        .payees()
        .stream()
        .filter(p -> p.payeeName().equals(payeeName))
        .findFirst();

  }

  private <T> T send(HttpRequest request, Class<T> responseType) throws RequestFailureException {
    try {
      HttpResponse<String> resp = client.send(request, BodyHandlers.ofString());
      if (resp.statusCode() < 200 || resp.statusCode() >= 300) {
        throw new RequestFailureException(resp.body(), resp.statusCode());
      }
      // System.out.println(resp.body());
      return GSON.fromJson(resp.body(), responseType);
    } catch (RequestFailureException rfe) {
      throw rfe;
    } catch (Exception e) {
      throw new RuntimeException(e);
    }
  }

  static class RequestFailureException extends Exception {

    private final String body;
    private final int code;

    RequestFailureException(String body, int code) {
      super("HTTP request failed with status code " + code + " and response body: " + body);
      this.body = body;
      this.code = code;
    }

    public String getBody() {
      return body;
    }

    public int getCode() {
      return code;
    }
  }
}
