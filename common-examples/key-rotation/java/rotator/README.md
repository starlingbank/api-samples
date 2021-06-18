# rotator

Signs a request to rotate an API key for the Starling API in Java.

## Setup

```
javac StarlingKeyRotator.java
```

## Run

Sign a key rotation:

```
java StarlingKeyRotator <rotationKeyUid> <privateRotationKey> <publicApiKey> <signingAlgorithm>
```

For example:

```
java StarlingKeyRotator "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa" "starling-rotation-private.key" "starling-api-public.key" "RSA_SHA512"
```