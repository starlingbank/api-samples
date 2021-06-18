# 📖 Starling Message Signature Validator Sample

This sample tool starts a simple local server that can receive and provide debug information on signed requests intended for the Starling Public APIs.

The tool aims to provide further clarity on the message signing process used by the APIs by allowing developers to test and debug their requests with more verbose error logging than is available through the Public APIs themselves.

**Usage:**
1) Check the `USER CONFIG` static values in `src/main/java/com.starlingbank/StarlingMessageSignatureValidator.java`.
2) Run `mvn package` to build the project.
3) Run `java -jar target/StarlingMessageSignatureValidator.jar`.
4) Send your requests to the resulting local server to validate your signed message.

As with everything we do at Starling, we'd love to learn how we could make stuff better. If you have any feedback, contact us on the [Starling Developer Slack](https://developer.starlingbank.com/community).

For more information, see the documentation on our developer portal for the [Public API](https://developer.starlingbank.com/docs) or [Payment Services API](https://developer.starlingbank.com/payments/docs).