package structs

type Operation struct {
	Operation string `json:"op"`
}

type Login struct {
	Login string `json:"login"`
	Token string `json:"token"`
}
