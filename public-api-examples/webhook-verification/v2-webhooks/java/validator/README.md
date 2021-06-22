# validator

Verifies a Starling V2 webhook signature in Java.

## Setup

```
javac StarlingV2WebhookSignatureValidator.java
```

## Run

Tests a single signature and payload

```
java StarlingV2WebhookSignatureValidator <public key> <signature> <payload>
```

For example:

```
java StarlingV2WebhookSignatureValidator "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAgIdCVYnz6JOFT7GGtjrMg4uaPRGGs5VlglSSd9i2i73zRp7AwZm8O/3LM5kPuPONOysJpdVSz9x6VGsRcaKkvMaOfYWYa6fe4l5IFiM8Z+WaL0WjIebdJOOjWxH3q/kW6KclwKBW0+2iNZPcZocllCOjPn/swp2MdhKLJOQkdB/1Q8Emxr6tsOlJkc2lWpXdtPHWUbBp31eF5/eDmuVCCBhTL76UyogQNgRV5qH2g/a2bNcNgTThR0PntXJLy2HLi9cEfXepevpoJM8HXNdaFwZV4pQUEzm3/jG7zI3isXnvtffG4uTIR8Q35yDrYeN8pX+zOAcnJYNbr9xdFEv7JQIDAQAB" "KDGgtd7VDeyvNdyafyXNVZM8l/0zohWze5UCt1N0mbzCZ1f23nYEgnLrFvTRYADnToat/axKOGeXjiOBWJh/FcPvcWParx8x5d35j2u76/UmRPKjo8jxtMspmN27WlPdtTRr9kqHdDHUg80/9z1qKuEcUfm4EQX52NOvozDMb4qyYorgxaFCwUwMdZNskArIBTeJBtULAOtJqnEGipKRtRjeU6j2xD2uNzc3Vcy3+tdImRfqbX6SkS44zgkcFua6xEc09qRnRvLd+bxjSIufQ/wU695Uej9AtFg7MlrRCUaEZ2SVkNcmOUdRP2q882Y9mWGDIXdk66QHCVfCVu7pog==" "{\"one\":\"Value\",\"two\":\"Other\"}"
```
