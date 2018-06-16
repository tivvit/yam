#cfssl selfsign localhost crt.json | cfssljson -bare local
cfssl genkey -initca crt.json | cfssljson -bare ca
cfssl gencert -ca ca.pem -ca-key ca-key.pem crt.json  | cfssljson -bare srv
