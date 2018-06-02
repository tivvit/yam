package yam

import (
	"gopkg.in/couchbase/gocb.v1"
	"fmt"
	"log"
	"github.com/tivvit/yam/structs"
)

func GetRooms(bucket *gocb.Bucket, conf *structs.Config, user string) []structs.Room {
	query := gocb.NewN1qlQuery(fmt.Sprintf("SELECT `%s`.* FROM `%s` WHERE type = 'room' AND $1 IN users",
		conf.DbBucket, conf.DbBucket))
	rows, err := bucket.ExecuteN1qlQuery(query, []interface{}{user})
	if err != nil {
		log.Print(err)
	}

	var row structs.Room
	var rooms []structs.Room
	for rows.Next(&row) {
		rooms = append(rooms, row)
	}
	return rooms
}

// todo add user to group

func StoreRoom(bucket *gocb.Bucket, r *structs.Room) {
	_, err := bucket.Upsert(r.Id, *r, 0)
	if err != nil {
		log.Print(err)
	}
}
