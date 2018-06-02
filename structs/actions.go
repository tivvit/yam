package structs

type History struct {
	Action   string    `json:"action"`
	Messages []Message `json:"messages"`
}

type Rooms struct {
	Action string `json:"action"`
	Rooms  []Room `json:"rooms"`
}
