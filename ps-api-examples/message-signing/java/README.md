# ps-signing

Example for signing messages on the Starling Payment Services APIs

## Request Signing Sample Code

This project provides sample Java code to generate valid signatures for authorising requests to the Starling Bank payment APIs. You can execute the code by running the `Mainline` class, uncommenting respective lines according to the numbered instructions.

The sample takes you through the process of:
- Generating a key pair to upload to the portal
- Validating the uploaded key by reading payment business information
- Creating an account to hold funds for instructing payments
- Creating an address for the account to send payments from
- Sending an outbound payment from the address