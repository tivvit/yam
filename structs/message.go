package structs

import (
	"github.com/tivvit/yam/util"
	"gopkg.in/couchbase/gocb.v1"
)

type Message struct {
	Text     string   `json:"text"`
	Id       string   `json:"id,omitempty"`
	Action   string   `json:"action,omitempty"`
	Sent     int64    `json:"sent,omitempty"`
	Author   string   `json:"author,omitempty"`
	Received int64    `json:"received,omitempty"`
	Parent   string   `json:"parent,omitempty"`
	Seen     int64    `json:"seen,omitempty"`
	Children []string `json:"children,omitempty"`
}

func (message *Message) MarkSeen() {
	// todo only if not seen
	// todo seen by who?
	message.Seen = util.UnixTimeMiliNow()
}

func NewMessage(bucket *gocb.Bucket, message *Message) {
	// todo store / edit message
	if message.Id == "" {
		message.Id = util.UniqueID(bucket)
	}
	message.Received = util.UnixTimeMiliNow()
	message.Action = "message" // todo unify with op
}

type MessageChildrenStub struct {
	Children []string `json:"children"`
}
