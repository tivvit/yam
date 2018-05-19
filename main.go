package main

import (
	"github.com/gorilla/websocket"
	"flag"
	"log"
	"encoding/json"
	"net/http"
)

var addr = flag.String("addr", "localhost:1337", "http service address")

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type Message struct {
	//time: (new Date()).getTime(),
	Text string `json:"text"`
	//author: userName,
	//color: userColor
	Action string `json:"action"`
}

func newMessage(text string) *Message {
	return &Message{
		Text:   text,
		Action: "message",
	}
}

func echo(w http.ResponseWriter, r *http.Request) {
	c, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Print("upgrade:", err)
		return
	}
	defer c.Close()
	for {
		mt, message, err := c.ReadMessage()
		if err != nil {
			log.Println("read:", err)
			break
		}
		log.Printf("recv: %s", message)
		m, err := json.Marshal(newMessage(string(message)))
		if err != nil {
			log.Println("json err")
		}
		err = c.WriteMessage(mt, m)
		if err != nil {
			log.Println("write:", err)
			break
		}
	}
}

func main() {
	flag.Parse()
	log.SetFlags(0)
	http.HandleFunc("/", echo)
	log.Fatal(http.ListenAndServe(*addr, nil))
}
