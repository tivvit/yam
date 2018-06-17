package yam

import (
	"gopkg.in/couchbase/gocb.v1"
	"github.com/tivvit/yam/structs"
	"log"
	"encoding/json"
	"fmt"
	"errors"
	"github.com/getlantern/deepcopy"
)

func AddUser(bucket *gocb.Bucket, name string) {
	var usr structs.User
	_, err := bucket.Get(name, &usr)
	// todo upsert?
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
	TraverseAllParents(bucket, msg.Parent, &msg.Id)
	return &msg
}

func TraverseAllParents(bucket *gocb.Bucket, parentId string, id *string) ([]string, error) {
	var m  map[string]interface {}
	_, err := bucket.Get(parentId, &m)
	if err == gocb.ErrKeyNotFound {
		log.Println("Parent not found")
	} else {
		switch t := m["type"]; t {
		case "room":
			log.Printf("found room %v\n", m["name"])
			var users []string
			for _, user := range m["users"].([]interface{}) {
				users = append(users, user.(string))
			}
			return users, nil
		default: // message
			//log.Println(m)
		    var msg structs.Message
			_, err := bucket.Get(m["id"].(string), &msg)
			if err != nil {
				log.Print(err)
			}
			msg.Children = append(msg.Children, *id)
			_, err = bucket.Upsert(msg.Id, msg, 0)
			if err != nil {
				log.Print(err)
			}
			return TraverseAllParents(bucket, m["parent"].(string), id)
		}
	}
	return []string{}, errors.New("parent not found")
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
	// todo limit 10??!
	query := gocb.NewN1qlQuery(fmt.Sprintf("SELECT `%s`.* FROM `%s` WHERE $1 = parent LIMIT 10",
		conf.DbBucket, conf.DbBucket))
	rows, err := bucket.ExecuteN1qlQuery(query, []interface{}{room})
	if err != nil {
		log.Print(err)
	}

	var row structs.Message
	var messages []structs.Message
	for rows.Next(&row) {
		r := structs.Message{}
		deepcopy.Copy(&r, row)
		messages = append(messages, row)
	}
	return messages
}

//func GetMessages(bucket *gocb.Bucket, room string) []structs.Message {
//	var m  map[string]interface {}
//	_, err := bucket.Get(parentId, &m)
//	if err == gocb.ErrKeyNotFound {
//		log.Println("Parent not found")
//	} else
//}

func CreateSelfRoom(bucket *gocb.Bucket, username string) {
	r := structs.NewRoom(bucket)
	r.Name = "personal"
	r.Users = []string{username}
	StoreRoom(bucket, r)
	m := structs.Message{}
	structs.NewMessage(bucket, &m)
	m.Text = "Hi, this is your space, you can chat here with the most gorgeous person on the World"
	m.Parent = r.Id
	m.Author = "admin"
	StoreMessage(bucket, &m)
}
