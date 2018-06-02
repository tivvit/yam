package structs

type Config struct {
	DbUser string `default:"test"`
	DbPass string `default:"123456"`
}
