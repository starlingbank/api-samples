package main

import (
	"crypto/sha512"
	"encoding/base64"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
)

// Don't hardcode this in production
var sharedSecret = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa"

func handleWebhook(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		fmt.Printf("Received a %s request but expecting only POST\n", r.Method)
		http.Error(w, "Only POST is supported", 405)
		return
	}
	data, err := ioutil.ReadAll(r.Body)
	if err != nil {
		panic(err)
	}

	hash := sha512.New()
	hash.Write([]byte(sharedSecret))
	hash.Write(data)
	calculatedSignature := base64.StdEncoding.EncodeToString(hash.Sum(nil))

	if calculatedSignature != r.Header.Get("X-Hook-Signature") {
		fmt.Printf("Bad webhook signature. Expected %s but was %s\n", calculatedSignature, r.Header.Get("X-Hook-Signature"))
		http.Error(w, "Bad webhook signature", 403)
		return
	}

	fmt.Printf("Good webhook signature %s\n%s\n", calculatedSignature, data)
}

func main() {
	http.HandleFunc("/", handleWebhook)
	if err := http.ListenAndServe(":8000", nil); err != nil {
		log.Fatal(err)
	}
}
