package yam

import (
	"github.com/tivvit/yam/structs"
	"gopkg.in/couchbase/gocb.v1"
	"log"
)

func GetCB(conf *structs.Config) *gocb.Bucket {
	cluster, err := gocb.Connect(conf.DbAddress)
	cluster.Authenticate(gocb.PasswordAuthenticator{
		Username: conf.DbUser,
		Password: conf.DbPass,
	})
	if err != nil {
		log.Fatal(err)
	}
	bucket, err := cluster.OpenBucket(conf.DbBucket, "")
	if err != nil {
		log.Fatal(err)
	}

	bucket.Manager("", "").CreatePrimaryIndex("", true, false)
	return bucket
}
