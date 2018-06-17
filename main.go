package main

import (
	"github.com/gorilla/websocket"
	"flag"
	"log"
	"encoding/json"
	"net/http"
	"github.com/kelseyhightower/envconfig"
	"github.com/tivvit/yam/structs"
	"gopkg.in/couchbase/gocb.v1"
	"github.com/tivvit/yam/yam"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func closer(login *structs.Login, con *websocket.Conn) func(code int, text string) error {
	return func(code int, text string) error {
		if login != nil {
			log.Printf("CLOSING! %v\n", login.Login)
			var newConn []*websocket.Conn
			for _, c := range connected[login.Login] {
				if c != con {
					newConn = append(newConn, c)
				}
			}
			if len(newConn) == 0 {
				delete(connected, login.Login)
			}
		} else {
			log.Print("CLOSING! unknown")
		}
		return nil
	}
}

var bucket *gocb.Bucket
var conf structs.Config
var connected map[string][]*websocket.Conn

func handler(w http.ResponseWriter, r *http.Request) {
	c, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Print("upgrade:", err)
		return
	}
	defer c.Close()
	logged := false
	var login *structs.Login
	// todo goroutine ?
	for {
		// todo this will be routine with channels
		mt, msg, err := c.ReadMessage()
		if err != nil {
			// todo handle "ERR read: websocket: close 1001 (going away)"
			switch err.(type) {
			case *websocket.CloseError:
				log.Printf("Connection closed %p\n", c)
			default:
				log.Println("ERR read: ", err)
			}
			break
		}
		//log.Print(logged)
		// todo send groups after login
		// todo send new groups
		op := structs.Operation{}
		err = json.Unmarshal(msg, &op)
		log.Printf("recv: %s", msg)
		if err != nil {
			log.Println("Unknown OP")
		} else {
			switch op.Operation {
			case "m": // message
				if logged {
					m := yam.ProcessMessage(bucket, msg)
					//storage = append(storage, *m)
					//log.Println(len(storage))
					// todo send to appropriate users (notification)
					sendResponse(m, c, mt)
				}
			case "history":
				if logged {
					rooms := yam.GetRooms(bucket, &conf, login.Login)
					sendResponse(structs.History{
						Messages: yam.ProcessHistory(bucket, &conf, rooms[0].Id),
						Action:   "history",
					}, c, mt)
				}
			case "room":
				r := structs.NewRoom(bucket)
				room := structs.Room{}
				err := json.Unmarshal(msg, &room)
				if err != nil {
					log.Printf("json problem: %s %s", err, msg)
				}
				r.Users = room.Users
				r.Name = room.Name
				yam.StoreRoom(bucket, r)
				// todo send new room notification
				sendResponse(structs.RoomAction{
					Room:   *r,
					Action: "room",
				}, c, mt)
				// todo logout
			case "login":
				// todo add user to logged users
				login = yam.ProcessLogin(msg)
				connected[login.Login] = append(connected[login.Login], c)
				log.Print("Logged: ", connected)
				logged = true
				rooms := yam.GetRooms(bucket, &conf, login.Login)
				// todo validate token
				if len(rooms) == 0 {
					yam.CreateSelfRoom(bucket, login.Login)
					rooms = yam.GetRooms(bucket, &conf, login.Login)
				}
				yam.AddUser(bucket, login.Login)
				sendResponse(structs.Rooms{
					Rooms:  rooms,
					Action: "rooms",
				}, c, mt)
				var messages []structs.Message
				for _, room := range rooms {
					for _, message := range yam.ProcessHistory(bucket, &conf, room.Id) {
						messages = append(messages, message)
					}
				}
				sendResponse(structs.History{
					Messages: messages,
					Action:   "history",
				}, c, mt)
				// todo store exact connection
				c.SetCloseHandler(closer(login, c))
			default:
				log.Printf("Unknown operation, ignororing %s %s", op.Operation, msg)
			}
		}
	}
}

func sendResponse(response interface{}, c *websocket.Conn, messageType int) {
	m, err := json.Marshal(response)
	if err != nil {
		log.Println("send json err")
	}
	log.Println(string(m))
	err = c.WriteMessage(messageType, m)
	if err != nil {
		log.Println("ERR write:", err)
	}
}

func main() {
	// todo keep all connected clients
	flag.Parse()
	log.SetFlags(0)
	// todo config
	err := envconfig.Process("yam", &conf)
	if err != nil {
		log.Fatal(err.Error())
	}
	connected = map[string][]*websocket.Conn{}
	bucket = yam.GetCB(&conf)
	http.HandleFunc("/", handler)
	log.Printf("serving on %s\n", conf.Address)
	log.Fatal(http.ListenAndServeTLS(conf.Address, conf.Cert, conf.CertKey, nil))
}
