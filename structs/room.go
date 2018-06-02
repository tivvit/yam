package structs

import (
	"github.com/tivvit/yam/util"
	"gopkg.in/couchbase/gocb.v1"
)

type Room struct {
	Id	   string   `json:"id"`
	Name   string   `json:"name,omitempty"`
	Users  []string `json:"users"`
	Joined int64    `json:"joined"`
	Type   string   `json:"type"`
}

func NewRoom(bucket *gocb.Bucket) *Room {
	return &Room{
		Type: "room",
		Id: util.UniqueID(bucket),
		Joined: util.UnixTimeMiliNow(),
	}
}