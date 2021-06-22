# validator

Verifies a Starling webhook signature in Java.

## Setup

```
javac StarlingWebhookSignatureValidator.java
```

## Run

Tests a single signature and payload

```
java StarlingWebhookSignatureValidator <signature> <payload>
```

For example:

```
java StarlingWebhookSignatureValidator "rI8mXteeS8sPXEs9FRywLGhbxJV2ae5yGje58ovn3P6wfLXC5xe457VKEgMojMbWF0qDQ4gTogPdA484tgwtPg==" "{\"webhookNotificationUid\":\"606d5b72-863a-452f-96f4-c2acdc104c1d\"}"
```