# signer

Signs a message for the Starling API in Java.

## Setup

```
javac StarlingMessageSigner.java
```

## Run

Sign a message:

```
java StarlingMessageSigner <apiKeyUid> <privateApiKey> <signingAlgorithm> <requestTarget> <payload> <accessToken>
```

For example:

```
java StarlingMessageSigner "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa" "starling-api-private.key" "RSA_SHA512" "put /api/v2/payments/local/account/90d14796-c59f-4944-9146-7fc84deb253c/category/46168325-8d23-4efe-ba48-b3a74f85f23b" "{\"externalIdentifier\":\"7cb1a2e1-812a-49dc-9399-84f45acaff26\",\"destinationPayeeAccountUid\":\"db61037a-c9db-40e9-9507-01e932b114eb\",\"reference\":\"Some reference\",\"amount\":{\"currency\":\"GBP\",\"minorUnits\":1234}}" "eyJhbGciOiJQUzI1NiIsInppcCI6IkdaSVAifQ.H4sIAAQ-_pT1TALVKOt8.uLjFJikw--DDv3Pf"
```