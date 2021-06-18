using System;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;

namespace ps_signing_sample
{
    internal static class Program
    {
        // TODO: Replace values with your own... 
        private const string PrivateKeyFilePath = "starling-api-private.key"; // path to private.key
        private const string SortCode = "SORT_CODE";
        private const string ExampleAccountName = "EXAMPLE_ACCOUNT_NAME";
        private static readonly Guid ApiKeyGuid = new("API_KEY_GUID");
        private static readonly Guid PaymentBusinessGuid = new("PAYMENT_BUSINESS_GUID");
        private static readonly Guid AccountGuid = new("ACCOUNT_GUID");

        private const int KeySizeBits = 4096;
        private const string BaseUrl = "https://payment-api-sandbox.starlingbank.com"; // sandbox url
        private const string AuthHeaderTemplate = "Signature keyid=\"{0}\",algorithm=\"rsa-sha512\",headers=\"(request-target) Date Digest\",signature=\"{1}\"";
        private const string JsonMediaType = "application/json";

        private static readonly HttpClient Client = new()
        {
            BaseAddress = new Uri(BaseUrl),
            DefaultRequestHeaders =
            {
                {"User-Agent", "dotnet-ps-signing-sample"}
            }
        };

        private static void Main(string[] args)
        {
            using var rsa = CreateRsaFromPrivateKey(PrivateKeyFilePath);
            if (rsa == null) return;

            // GET request
            Console.WriteLine("Get account...");
            var getRequest = GetRequestExample(rsa);
            var response = Client.Send(getRequest);
            WriteResponse(getRequest.RequestUri?.AbsoluteUri, response);
            
            // PUT request
            Console.WriteLine("\nAdd address to account...");
            var putRequest = PutRequestExample(rsa);
            var putResponse = Client.Send(putRequest);
            WriteResponse(putRequest.RequestUri?.AbsoluteUri, putResponse);
        }

        #region Examples
        
        /// <summary>
        /// A GET request example calling the account endpoint with a signed request.
        /// </summary>
        /// <param name="rsa">RSA AsymmetricAlgorithm</param>
        /// <returns>GET http request</returns>
        private static HttpRequestMessage GetRequestExample(AsymmetricAlgorithm rsa)
        {            
            // No payload == empty digest
            const string digest = ""; 
            
            var date = DateTime.UtcNow.ToString("o");
            var url = $"/api/v1/{PaymentBusinessGuid}/account/{AccountGuid}";

            // compute signature for message
            var textToSign = $"(request-target): get {url}\nDate: {date}\nDigest: {digest}";
            var signature = GenerateSignature(rsa, textToSign);
                
            var getAccountRequest = new HttpRequestMessage(HttpMethod.Get, url);
            var authHeader = CreateAuthHeader(ApiKeyGuid, signature);
            getAccountRequest.Headers.Authorization = AuthenticationHeaderValue.Parse(authHeader);
            getAccountRequest.Headers.TryAddWithoutValidation("Date", date);
            getAccountRequest.Headers.TryAddWithoutValidation("Digest", digest);
            return getAccountRequest;
        }

        /// <summary>
        /// A PUT request example calling the account address endpoint with a signed request.
        /// </summary>
        /// <param name="rsa">RSA AsymmetricAlgorithm</param>
        /// <returns>PUT http request</returns>
        private static HttpRequestMessage PutRequestExample(AsymmetricAlgorithm rsa)
        {
            // put has a payload so we have a digest to compute 
            var payloadJson = $"{{ \"accountName\":\"{ExampleAccountName}\", \"sortCode\":\"{SortCode}\"}}";
            var digest = Convert.ToBase64String(ComputeSha512Hash(payloadJson));

            var addressGuid = Guid.NewGuid();
            var date = DateTime.UtcNow.ToString("o");
            var url = $"/api/v1/{PaymentBusinessGuid}/account/{AccountGuid}/address/{addressGuid}";
            
            // generate message signature
            var textToSign = $"(request-target): put {url}\nDate: {date}\nDigest: {digest}";
            var signature = GenerateSignature(rsa, textToSign);

            var putAddressRequest = new HttpRequestMessage(HttpMethod.Put, url)
            {
                Content = new StringContent(payloadJson, Encoding.UTF8, JsonMediaType)
            };

            var authHeader = CreateAuthHeader(ApiKeyGuid, signature);
            putAddressRequest.Headers.Authorization = AuthenticationHeaderValue.Parse(authHeader);
            putAddressRequest.Headers.TryAddWithoutValidation("Date", date);
            putAddressRequest.Headers.TryAddWithoutValidation("Digest", digest);
            putAddressRequest.Headers.Accept.Add(MediaTypeWithQualityHeaderValue.Parse(JsonMediaType));
            return putAddressRequest;
        }

        #endregion
        
        #region Crypto

        /// <summary>
        /// Create the message signature from a SHA512 hash of the message data.
        /// </summary>
        /// <param name="rsa">RSA AsymmetricAlgorithm</param>
        /// <param name="data">The string to be signed</param>
        /// <returns>Base64 encoded signature</returns>
        private static string GenerateSignature(AsymmetricAlgorithm rsa, string data)
        {
            // hash to sign
            var hash = ComputeSha512Hash(data);
            
            // create signature
            var rsaFormatter = new RSAPKCS1SignatureFormatter(rsa);
            rsaFormatter.SetHashAlgorithm("SHA512");
            var signature = rsaFormatter.CreateSignature(hash);
            return Convert.ToBase64String(signature);
        }

        /// <summary>
        /// Create RSA algo instance from our private key.
        /// </summary>
        /// <param name="privateKeyFilePath">The file path to your 4096 bit RSA private key</param>
        /// <returns>RSA AsymmetricAlgorithm</returns>
        private static RSA CreateRsaFromPrivateKey(string privateKeyFilePath)
        {
            var rsa = RSA.Create(KeySizeBits);
            try
            {
                var privateKeyContents = File.ReadAllText(privateKeyFilePath);
                rsa.ImportFromPem(privateKeyContents);
                return rsa;
            }
            catch (IOException)
            {
                Console.WriteLine($"Unable to locate private key file '{privateKeyFilePath}'. Verify the file exists.");
                rsa.Dispose();
                return null;
            }
        }
        
        /// <summary>
        /// Plain old SHA512 hash of some bytes.
        /// </summary>
        /// <param name="data">String to hash</param>
        /// <returns>SHA512 hash of some bytes</returns>
        private static byte[] ComputeSha512Hash(string data)
        {
            using var sha512 = SHA512.Create();
            return sha512.ComputeHash(Encoding.Default.GetBytes(data));
        }
        
        #endregion

        #region Helpers

        private static string CreateAuthHeader(Guid apiKeyGuid, string signature)
        {
            return string.Format(AuthHeaderTemplate, apiKeyGuid, signature);
        }

        private static void WriteResponse(string url, HttpResponseMessage responseMessage)
        {
            Console.WriteLine($"Request to {url} response status: {responseMessage.StatusCode}");
            if (!responseMessage.IsSuccessStatusCode) return;
            
            Console.WriteLine("Response content: ");
            using var reader = new StreamReader(responseMessage.Content.ReadAsStream(), Encoding.UTF8);
            Console.WriteLine(reader.ReadToEnd());
        }

        #endregion
    }
}
