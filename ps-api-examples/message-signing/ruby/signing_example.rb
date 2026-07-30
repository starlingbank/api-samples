require "digest" # For SHA-512
require "base64" # for encoding
require "openssl" # for cryptography
require "time" # ISO8601 formatting
require "faraday" # Adapter for most HTTP clients

class RequestSigningMiddleware < Faraday::Middleware
  # @option key_id[String] UID of the signing key; found in the Starling dev portal
  # @option key[OpenSSL::PKey::RSA] the private key used to sign requests
  # def initialize(app, key_id:, key:)...
  def on_request(env)
    env[:request_headers].merge!(generate_auth_headers(env, Time.now))
  end

  def generate_auth_headers(env, at_request_time)
    body_to_digest = (env[:request_body].nil? || env[:request_body].empty?) ? "X" : env[:request_body]
    raise "The request_body must be a String - this middleware has to be mounted below :json" unless body_to_digest.is_a?(String)

    body_digest = Base64.strict_encode64(Digest::SHA512.digest(body_to_digest))
    date = at_request_time.utc.iso8601
    string_to_sign = "(request-target): #{request_target(env)}\nDate: #{date}\nDigest: #{body_digest}"
    msg_digest = Base64.strict_encode64(key.sign("SHA256", string_to_sign))

    {
      "Authorization" => "Signature keyid=\"#{key_id}\",algorithm=\"rsa-sha256\",headers=\"(request-target) Date Digest\",signature=\"#{msg_digest}\"",
      "Digest" => body_digest,
      "Date" => date
    }
  end

  private

  # Should be the request path + eventually query string if set
  def request_target(env)
    path_and_query = [env[:url].path, env[:url].query].compact.join("?")
    "#{env[:method].downcase} #{path_and_query}"
  end

  def key_id
    options.fetch(:key_id)
  end

  def key
    options.fetch(:private_key)
  end
end
Faraday::Request.register_middleware(starling_request_signing: RequestSigningMiddleware)


# You can generate a new keypair using
#   keypair = OpenSSL::PKey::RSA.new(2048)
# For the signing you need the private key only
#   pem = keypair.private_to_pem (if you use Ruby's openssl version 3 or above)
# or
#   pem = keypair.to_pem (older "openssl" versions)
private_key = OpenSSL::PKey::RSA.new(<<~PEM)
  -----BEGIN RSA PRIVATE KEY-----
  MIIEpAIBAAKCAQEAyQtOhiSj+7+UblUGADTPDGTuXP1YuLSE25+R+Lj71AmQUD+6
  qcAu4CUdfJ48p13Bg7veY0Dxk9VmSnZ12IST8dLfM80625ILMpLEdESihPzaCnjE
  /Y4eGlFCefIL9b4DUasOaXOJzyvloS1/tQX/cwT8yAIfK/hXlsq38dt50w+9i58C
  k9dhrq5nxAXwIfkqytcSyQipIYUkp8qyKTpsswO0m/LOk8KRd/NybIxCD+cVm4eQ
  0xfFFa8jhN9CpP5onUDGugVm2zlqheaAYS9GxEJc/Z5oh78tuyuH+PGv+cRxNUCq
  y0pZHsK+qp8tZGRqsBprgqAV4itZ7M6UiKPHBQIDAQABAoIBACSjbl6M++OLwPmw
  fgT4mskX9ca1lv8mStYZiQkqcR5t1cKCMrrv3rsTmIGW9tfLgtJGoRs2gTAfYmJs
  n0JjuvCFrQ6sNq9AONExJSNJRNL2n6fr5X6N8Vd7eqFtppdU1xcBlQFLwJAkYFdU
  yuLLIogsHwM2O8cQHapJ7GbjyBpZ/6LkF6Cz80Nnud5mKrJIOIwzcS5/rTszlVdA
  cdtwAfHZIKWqccMxd/ukZ3s3cFgub+DtW49uYdfTOXbPsWbZbyTugBIPvP7rldeI
  hm+AExHmq7/q0m3baJuIFm7ISNd/noS4guRAbtgk1pvVemwOad3gq1geKTo1uStO
  tXvJz8sCgYEA8mHBNH7iezDpA1IMgsKaZQwuWgVWKp9OVzMXyYuQ6Be57YQr2d1O
  skMNcCV+wJGGDX79PEJvp/t6kZDrAq7duYJqKtRdRfu+99R3tsYz6eY4G4uNp0mF
  gFdRdMtOTZHVhtk3E4zEi2I7i/I8Ce4WbPVB27kR4gTNx7tNKhRELKMCgYEA1Fb7
  CnotoHf76kyoEkyrq+WP/TdLkpsabDZRrjiET4cbNj6f8nWLdN5yIfcrRBe5b5wU
  bnZQsuxgofwo+To9ECa7McvVI5z3UX/mq4Lbf85CYMUUKouz8GURxcgvbCRMXlJ/
  ozWp0mWQwJx/2t0TH6SxYAaRZk1hyRX50Qc8EDcCgYAJXjfedI0CX+iRpUkwgJ8B
  CtB70Dr9WLzpZ+Mieg92uPwJrxMWz5PsFeVeEUTt4nIA8YiOHK8+Gd0p5SUALIwL
  UHwT/bNBMjK2V3LtEIoPH0PJ5MHr1k6foEBYuEblfp53IMwdKFKsZHaSuSES7S3W
  tj/+Yw/K4Y6mipm356Ke6wKBgQC6tvFwuRa98EOYN2fjD4A1W1tN8f2GINUPKoSQ
  iinuNIN9I3xKG4pRbfk2XL2y1pm8xqZAq9EyRCCEz9LHtKpVNXmNxArbkf73r1wK
  nLqem6RKq4GcF9RWIsmJ/QmWMiTlG+4YeeumkqDCfdr/fT5/qLZAFgZsysadp7FQ
  WOg76QKBgQCrDvcFaCVM+GipRyxaOG+TZttAoaaFTrhVrZbEPIH1rP+7aTbFTZt0
  Sm37XdDoRlnUtF1CbLWSEeBsGZ2qIiQQ4MKcwU4Bw+Pp4wKpe7sRBrDeZAzbVOqe
  zSZPRlOta72qhsE+lDeks63CRZpuEXYvQOXqgVxGGMoUzJZ1U1VdVg==
  -----END RSA PRIVATE KEY-----
PEM

key_id = "a937ba2a-7b67-4903-9355-ae90f6bf015d"
base_url = "https://payment-api-sandbox.starlingbank.com"
faraday ||= Faraday.new(base_url, _connection_opts = {}) do |conn|
  conn.request :json # JSON has to be serialized before the request gets signed
  conn.request :starling_request_signing, private_key: private_key, key_id: key_id
  conn.response :json, parser_options: {symbolize_names: true}
end

response = faraday.get("/api/v1/7d0b3a0a-f0f9-4579-b7fa-9c091d243d48")
warn response.status
warn response.body