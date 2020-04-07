from flask import Flask, request
import hashlib
import base64

# Don't hardcode this in production
SHARED_SECRET = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa'

app = Flask(__name__)

@app.route('/', methods=['POST'])
def handleWebhook():
    hash = hashlib.sha512()
    hash.update(SHARED_SECRET.encode('utf-8'))
    hash.update(request.data)
    calculatedSignature = base64.b64encode(hash.digest()).decode('utf-8')

    if calculatedSignature != request.headers["x-hook-signature"]:
        print(request.headers)
        print('Bad webhook signature. Expected', calculatedSignature, 'but was', request.headers["x-hook-signature"])
        return 'Bad webhook signature', 403
    else:
        print('Good webhook signature', calculatedSignature)
        print(request.json)
        return '', 204

if __name__ == '__main__':
    app.run(port=8000, debug=True)