package yam

import (
	"gopkg.in/couchbase/gocb.v1"
	"github.com/tivvit/yam/structs"
	"log"
	"encoding/json"
	"fmt"
)

func AddUser(bucket *gocb.Bucket, name string) {
	var usr structs.User
	_, err := bucket.Get(name, &usr)
	if err == gocb.ErrKeyNotFound {
		usr := structs.NewUser()
		usr.Name = name
		_, err := bucket.Insert(name, usr, 0)
		if err != nil {
			log.Print(err)
		}
	}
}

func StoreMessage(bucket *gocb.Bucket, m *structs.Message) {
	_, err := bucket.Upsert(m.Id, m, 0)
	if err != nil {
		log.Print(err)
	}
}

func ProcessMessage(bucket *gocb.Bucket, message []byte) *structs.Message {
	msg := structs.Message{}
	err := json.Unmarshal(message, &msg)
	if err != nil {
		log.Printf("json problem: %s %s", err, message)
	}
	structs.NewMessage(bucket, &msg)
	StoreMessage(bucket, &msg)
	return &msg
}

func ProcessLogin(message []byte) *structs.Login {
	login := structs.Login{}
	err := json.Unmarshal(message, &login)
	if err != nil {
		log.Printf("json problem: %s %s", err, message)
	}
	return &login
}


func ProcessHistory(bucket *gocb.Bucket, conf *structs.Config, room string) []structs.Message {
	// todo sort
	query := gocb.NewN1qlQuery(fmt.Sprintf("SELECT `%s`.* FROM `%s` WHERE $1 = parent LIMIT 10",
		conf.DbBucket, conf.DbBucket))
	rows, err := bucket.ExecuteN1qlQuery(query, []interface{}{room})
	if err != nil {
		log.Print(err)
	}

	var row structs.Message
	var messages []structs.Message
	for rows.Next(&row) {
		messages = append(messages, row)
	}
	return messages
}

func CreateSelfGroup(bucket *gocb.Bucket, username string) {
	r := structs.NewRoom(bucket)
	r.Users = []string{username}
	StoreRoom(bucket, r)
	m := structs.Message{}
	structs.NewMessage(bucket, &m)
	m.Text = "Hi, this is your space, you can chat here with the most gorgeous person on the World"
	m.Parent = r.Id
	m.Author = "admin"
	StoreMessage(bucket, &m)
}