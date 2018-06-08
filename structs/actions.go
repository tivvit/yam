package structs

type History struct {
	Action   string    `json:"action"`
	Messages []Message `json:"messages"`
}

type Rooms struct {
	Action string `json:"action"`
	Rooms  []Room `json:"rooms"`
}

type RoomAction struct {
	Action string `json:"action"`
	Room  Room `json:"room"`
}