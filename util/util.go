package util

import (
	"time"
	"gopkg.in/couchbase/gocb.v1"
	"github.com/satori/go.uuid"
)

func UnixTimeMiliNow() int64 {
	return time.Now().UnixNano() / int64(time.Millisecond)
}

func UniqueID(bucket *gocb.Bucket) string {
	for {
		id := uuid.NewV4().String()
		var val interface{}
		_, err := bucket.Get(id, val)
		if err == gocb.ErrKeyNotFound {
			return id
		}
	}
}