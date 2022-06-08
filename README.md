WHAT THIS IS
------------

- Javascript code that calls all BAAS endpoints involved in user onboarding
- Allows you to create BAAS customers in demo

USAGE
------------

- Setup javascript
  - download nodejs.org
  - in terminal, navigate to this directory
  - download all necessary javascript libraries by running `npm install`

- Generate keys
  - in terminal, navigate to this directory
  - use the directions in `API keys and message signing > 1. Generate key pairs` to generate keys within this directory
  - at this point, you should see a private and public key, and a private and public rotation key in this directory

- Setup registered application
  - Go to your developer.starlingbank.com account
  - Create a new application at developer.starlingbank.com/application/list
  - In your application, go to "Keys" on the left navigation panel
  - Navigate to "Sandbox"
  - Click "Add key"
  - Paste in your public key and public rotation key generated above in the appropriate slots (they are both RSA)
  - Copy the "key uid" from your newly created Sandbox API key into the `keyUid` field in index.js

- Run the application
  - each time you onboard a customer, you need new values for `externalIdentifier` and `mobileNumber` in `index.js` `main()`
  - in terminal, navigate to this directory
  - run  `node index.js`
  - you should see a serious of API calls without output, and ultimately, a success message



