import binascii
import hashlib
import json
import M2Crypto


V2_HOOK_PUBLIC_KEY = M2Crypto.RSA.load_pub_key_bio(
    M2Crypto.BIO.MemoryBuffer(b"""
-----BEGIN PUBLIC KEY-----
<<< Base64-encoded public key.
    This is shown on https://developer.starlingbank.com/ as one long
    string but newlines may be inserted as desired.
    Keep the ---BEGIN--- and ---END--- sections and paste key
    in between. >>>
-----END PUBLIC KEY-----
        """))


class HookError(Exception):
    pass


def hook(environ):
    """Starling v2 webhook with signature verification.

    Args:
      environ: WSGI environment
    Returns:
      None (no response is expected from web hooks).
    """
    # PATH_INFO may vary depending on how this WSGI application
    # is called by the web server.
    if environ['PATH_INFO'] != '/hook/feed-item':
        raise HookError('404 Not Found')

    if environ['REQUEST_METHOD'] != 'POST':
        raise HookError('405 Method Not Allowed')

    try:
        signature = binascii.a2b_base64(environ['HTTP_X_HOOK_SIGNATURE'])
    except KeyError:
        raise HookError('403 Missing hook signature')
    except binascii.Error:
        raise HookError('400 Unparseable base64 in hook signature')

    body = environ['wsgi.input'].read()

    try:
        good_signature = V2_HOOK_PUBLIC_KEY.verify(
            hashlib.sha512(body).digest(),
            signature,
            algo='sha512')
    except Exception:
        good_signature = False
    if not good_signature:
        raise HookError('403 Signature mismatch')

    try:
        payload = json.loads(body.decode('utf-8'))
    except Exception as e:
        raise HookError('400 ' + str(e))

    do_something_with(payload)


def application(environ, start_response):
    """WSGI application implementing a Starling v2 webhook."""

    try:
        hook(environ)
    except HookError as e:
        status = str(e)
        body = str(e) + '\r\n' 
    except Exception:
        status = '500 Server Error'
        body = str(e) + '\r\n'
    else:
        status = '200 OK'
        body = ''

    start_response(status, [('Content-Type', 'text/plain')])
    yield body.encode('ascii', errors='replace')
