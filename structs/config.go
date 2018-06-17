package structs

type Config struct {
	Address string `default:"localhost:1337"`
	DbAddress string `default:"couchbase://localhost"`
	DbUser string `default:"test"`
	DbPass string `default:"123456"`
	DbBucket string `default:"test"`
	Cert string `default:"cert/srv.pem"`
	CertKey string `default:"cert/srv-key.pem"`
}
