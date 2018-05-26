package main

import (
	"github.com/gorilla/websocket"
	"flag"
	"log"
	"encoding/json"
	"net/http"
	"time"
	"github.com/satori/go.uuid"
)

var addr = flag.String("addr", "localhost:1337", "http service address")

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type Message struct {
	Text     string    `json:"text"`
	Id       string    `json:"id,omitempty"`
	Action   string    `json:"action,omitempty"`
	Sent     time.Time `json:"sent,omitempty"`
	Author   string    `json:"author,omitempty"`
	Received time.Time `json:"received,omitempty"`
	Parent   string    `json:"parent,omitempty"`
	Seen     time.Time `json:"seen,omitempty"`
	Children []Message `json:"children,omitempty"`
}

func (message *Message) markSeen() {
	// todo only if not seen
	message.Seen = time.Now()
}

func newMessage(message *Message) {
	// todo store / edit message
	if message.Id == "" {
		message.Id = uuid.NewV4().String()
	}
	message.Action = "message" // todo unify with op
}

type Operation struct {
	Operation string `json:"op"`
}

type History struct {
	Action   string    `json:"action"`
	Messages []Message `json:"messages"`
}


func fakeMesages() []Message {
	return []Message{
		{
			Text: "Hi",
			Id: uuid.NewV4().String(),
			Children: []Message{
				{
					Text: "Hello",
					Id: uuid.NewV4().String(),
				},
			},
		},
		{
			Text: "I wanted to ask",
			Id: uuid.NewV4().String(),
			Children: []Message{
				{
					Text: "About?",
					Id: uuid.NewV4().String(),
				},
				{
					Text: "The project",
					Id: uuid.NewV4().String(),

				},
				{
					Text: "Which one?",
					Id: uuid.NewV4().String(),
				},
				{
					Text: "The Main one",
					Id: uuid.NewV4().String(),
					Children: []Message{
						{
							Text: "What do you want to know?",
							Id: uuid.NewV4().String(),
						},
						{
							Text: "Is the design ready?",
							Id: uuid.NewV4().String(),
						},
						{
							Text: "Yes",
							Id: uuid.NewV4().String(),
						},
					},
				},
				{
					Text: "Oh and about the second too",
					Id: uuid.NewV4().String(),
					Children: []Message{
						{
							Text: "Which one is it?",
							Id: uuid.NewV4().String(),
						},
						{
							Text: "The secret one",
							Id: uuid.NewV4().String(),
						},
						{
							Text: "I nee to know if you told to Phillip",
							Id: uuid.NewV4().String(),
						},
						{
							Text: "I definitely did not",
							Id: uuid.NewV4().String(),
						},
					},
				},
			},
		},
		{
			Text: "Bye",
			Id: uuid.NewV4().String(),
			Children: []Message{
				{
					Text: "Bye and thx",
					Id: uuid.NewV4().String(),
				},
			},
		},
	}
}

var storage []Message

func handler(w http.ResponseWriter, r *http.Request) {
	c, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Print("upgrade:", err)
		return
	}
	defer c.Close()
	for {
		mt, msg, err := c.ReadMessage()
		if err != nil {
			log.Println("ERR read:", err)
			break
		}
		op := Operation{}
		err = json.Unmarshal(msg, &op)
		if err != nil {
			log.Println("Unknown OP")
		} else {
			switch op.Operation {
			case "m": // message
				m := processMessage(msg)
				storage = append(storage, *m)
				log.Println(len(storage))
				sendResponse(m, c, mt)
			case "history":
				sendResponse(History{
					Messages: storage,
					Action:   "history",
				}, c, mt)
			default:
				log.Println("Unknown operation, ignororing ", msg)
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

//func sendHistory() *Message {
//	return newMessage("a")
//}

func processMessage(message []byte) *Message {
	log.Printf("recv: %s", message)
	msg := Message{}
	err := json.Unmarshal(message, &msg)
	if err != nil {
		log.Printf("json problem: %s %s", err, message)
	}
	newMessage(&msg)
	return &msg
}

func main() {
	storage = fakeMesages()
	flag.Parse()
	log.SetFlags(0)
	http.HandleFunc("/", handler)
	log.Fatal(http.ListenAndServe(*addr, nil))
}
