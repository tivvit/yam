package structs

import "github.com/tivvit/yam/util"

type User struct {
	Name   string `json:"name"`
	Joined int64  `json:"joined"`
	Type string `json:"type"`
}


func NewUser() *User {
	return &User{
		Type: "user",
		Joined: util.UnixTimeMiliNow(),
	}
}