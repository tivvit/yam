function offline() {
    let elem = document.getElementById("statusMessage");
    elem.textContent = "offline";
    elem.classList.remove('online');
    elem.classList.add('offline');
}

function online() {
    let elem = document.getElementById("statusMessage");
    elem.textContent = "online";
    elem.classList.remove('offline');
    elem.classList.add('online');
}

function onSignIn(googleUser) {
    // Useful data for your client-side scripts:
    let profile = googleUser.getBasicProfile();
    // console.log("ID: " + profile.getId()); // Don't send this directly to your server!
    // console.log('Full Name: ' + profile.getName());
    // console.log('Given Name: ' + profile.getGivenName());
    // console.log('Family Name: ' + profile.getFamilyName());
    // console.log("Image URL: " + profile.getImageUrl());
    // console.log("Email: " + profile.getEmail());
    //
    // // The ID token you need to pass to your backend:
    let id_token = googleUser.getAuthResponse().id_token;
    // console.log("ID Token: " + id_token);
    // this.setUsername(profile.getEmail());
    chat.setUsername(profile.getEmail(), id_token);
    document.getElementById("gsignin").classList.toggle("hide");
    document.getElementById("logout").classList.toggle("hide");
}

let App = React.createClass({
    getInitialState: function () {
        return (
            {
                children: {
                    "0": [],
                },
                sorted: [],
                // rooms: {
                //     "0": {
                //         // messages: [],
                //         children: [],
                //         sorted: [],
                //     }
                // },
                parent: null,
                username: "",
                token: "",
                logged: false,
                room: "0",
                rooms: [],
            }
        )
    },

    setUsername: function (username, token) {
        this.setState({
            username: username,
            token: token,
            logged: true,
        });
        this.login();
    },

    setRoom: function (id) {
        this.setState({"room": id})
    },

    loginMsg: function () {
        this.addMessage({
            "id": "m0",
            "author": "admin",
            "text": "please login",
            "sent": Math.floor(Date.now()),
            "received": Math.floor(Date.now()),
            "parent": "0",
        });
        this.addMessage({
            "id": "m1",
            "author": "admin",
            "text": "Lower left corner",
            "sent": Math.floor(Date.now()),
            "received": Math.floor(Date.now()),
            "parent": "0",
        });
    },

    logout: function () {
        this.setState(this.getInitialState());
        this.loginMsg();
        // todo logout from backend
    },

    handleClick: function (e) {
        if (this.state.parent !== null) {
            document.getElementById(this.state.parent).classList.toggle("active")
        }
        this.setState({parent: e.currentTarget.dataset.id});
        e.currentTarget.classList.toggle("active");
        document.getElementById("input").focus();
    },

    changeRoom: function (e) {
        this.setState({room: e.currentTarget.dataset.id});
    },


    login: function () {
        if (!this.logged && this.state.username !== "") {
            this.connection.send(JSON.stringify({
                "op": "login",
                "login": this.state.username,
                "token": this.state.token,
            }))
        }
    },

    getParent: function () {
        if (this.state.parent !== null) {
            return this.state.parent;
        }
        return this.state.room;
    },

    connect: function () {
        // if user is running mozilla then use it's built-in WebSocket
        window.WebSocket = window.WebSocket || window.MozWebSocket;

        // if browser doesn't support WebSocket, just show some notification and exit
        if (!window.WebSocket) {
            content.textContent = 'Sorry, but your browser' +
                ' doesn\'t '
                + 'support WebSockets.';
            // input.hide();
            // $('span').hide();
            // return;
        }

        // open connection
        this.connection = new WebSocket($conf["server"]);

        this.connection.onopen = function () {
            online();
            this.login();
        }.bind(this);

        this.connection.onerror = function (error) {
            // just in there were some problems with conenction...
            offline();
            // todo disable input
            // content.html($('<p>', {
            //     text: 'Sorry, but there\'s some problem with your '
            //     + 'connection or the server is down.'
            // }));
        };

        this.connection.onmessage = (message) => {
            // try to parse JSON message. Because we know that the server always returns
            // JSON this should work without any problem but we should make sure that
            // the massage is not chunked or otherwise damaged.
            try {
                var json = JSON.parse(message.data);
            } catch (e) {
                console.log('This doesn\'t look like a valid JSON: ', message.data);
                // return;
            }

            // console.log(json);

            if (json.action === 'history') { // entire message history
                // insert every single message to the chat window

                if (json.messages !== null) {
                    for (var i = 0; i < json.messages.length; i++) {
                        this.addMessage(json.messages[i]);
                        // console.log(json.messages[i])
                        // addMessage(json.data[i].author, json.data[i].text,
                        //     json.data[i].color, new Date(json.data[i].time));
                    }
                }

                // this.props.sortBy("text");
                // console.log(this.state.messages.items.sort((a, b) => a.text > b.text));
                // console.log(this.state.messages.sort(function (a, b) {
                //     return a.localeCompare(b);
                //     // if (a.text < b.text) {
                //     //     return -1;
                //     // }
                //     // if (a.text > b.text) {
                //     //     return 1;
                //     // }
                //     // return 0;
                // }));
                // console.log(this.state.messages);
                this.setState({messages: this.state.messages});
                content.scrollTo(0, content.scrollHeight);
            } else if (json.action === 'message') { // it's a single message
                // input.removeAttr('disabled'); // let the user write another message
                this.addMessage(json);
                document.getElementById(json.id).scrollIntoView(false);
                // content.scrollTo(0, content.scrollHeight);
            } else if (json.action === 'rooms') {
                rooms = [];
                for (let i = 0; i < json.rooms.length; i++) {
                    this.state.children[json.rooms[json.rooms[i].id]] = [];
                    rooms.push(json.rooms[i]);
                    // room = json.rooms[i];
                    // rooms[room.id] = {
                    //     messages: [],
                    //     sorted: [],
                    //     children: [],
                    // }
                }
                this.setState({
                    // todo tmp
                    room: json.rooms[0].id,
                    rooms: rooms,
                });
            } else if (json.action === 'room') {
                this.state.rooms.push(json.room);
                this.setState({
                    rooms: this.state.rooms,
                })
            } else {
                console.log('Hmm..., I\'ve never seen JSON like this: ', json);
            }
        };
    },

    componentDidMount: function () {
        var content = document.getElementById("content");
        var input = document.getElementById('input');

        this.loginMsg();
        this.connect();

        document.getElementById("roomName").value = Math.random().toString(36).substr(2, 8);

        input.addEventListener('keydown', function (event) {
            if (event.keyCode === 13) {
                event.preventDefault();
                // var msg = event.target.value; // for input
                var msg = event.target.textContent;
                if (!msg) {
                    return;
                }
                this.connection.send(JSON.stringify({
                    "op": "m",
                    "author": this.state.username,
                    "text": msg,
                    "sent": Math.floor(Date.now()),
                    "parent": this.getParent(),
                }));
                // event.target.value = "";
                event.target.textContent = "";
                // disable the input field to make the user wait until server
                // sends back response
                // input.attr('disabled', 'disabled');
            } else if (event.keyCode === 27) {
                if (this.state.parent !== null) {
                    document.getElementById(this.state.parent).classList.toggle("active")
                }
                this.setState({parent: null});
            }
        }.bind(this));

        /**
         * This method is optional. If the server wasn't able to respond to the
         * in 3 seconds then show some error message to notify the user that
         * something is wrong.
         */

        // todo chage to react component
        // todo reconnect on offline (serviceworker?)
        setInterval(function () {
            if (this.connection.readyState !== 1) {
                offline();
                this.connect();
            } else {
                online();
            }
        }.bind(this), 1000);


        // this is an "echo" websocket service for testing pusposes
        // this.connection = new WebSocket('wss://echo.websocket.org');
        // // listen to onmessage event
        // this.connection.onmessage = evt => {fs
        //     // add the new message to state
        //     this.setState({
        //         messages: this.state.messages.concat([evt.data])
        //     })
        // };
    },

    addMessage: function (message) {
        message.sent = new Date(message.sent);
        message.received = new Date(message.received);

        // todo room has to be defined per message !!!
        // todo maybe children does not have to be in scopes

        // message.unread = true; // todo backend

        message.children = [];
        this.state.children[message.id] = message.children;
        // if (message.children === undefined) {
        //     message.children = [];
        //     this.state.children[message.id] = message.children;
        // }

        // todo it should never be undefined
        if (message.parent !== undefined) {
            // if (Object.keys(chat.state.rooms).includes(message.parent)) {
            //     // parent is room
            //     // this.state.rooms[message.parent].messages[message.id] = message;
            //     this.state.rooms[message.parent].sorted.push(message);
            // } else {
            // parent is message (room does not match)
            if (this.state.children[message.parent] === undefined) {
                this.state.children[message.parent] = []
            }
            this.state.children[message.parent].push(message)
            // }
        } else {
            console.log("no parent " + message);
            // this.state.rooms[this.state.room].messages[message.id] = message;
            // this.state.rooms[this.state.room].sorted.push(message);
        }
        recurseChildren.bind(this)(message);
        // set the state
        // this.setState({rooms: this.state.rooms});
        this.setState({children: this.state.children});
    },

    signOut: function signOut() {
        let auth2 = gapi.auth2.getAuthInstance();
        auth2.signOut().then(function () {
            console.log('User signed out.');
            document.getElementById("gsignin").classList.toggle("hide");
            document.getElementById("logout").classList.toggle("hide");
            chat.logout();
        });
    },

    showRooms: function (event) {
        document.getElementById("addRoom").classList.toggle("hide");
    },

    roomCancel: function (event) {
        document.getElementById("addRoom").classList.toggle("hide");
        event.preventDefault()
    },

    addRoom: function (event) {
        users = document.getElementById("roomUsers").value.split(",").map(function (e) {
            return e.trim();
        }).filter(function (e) {
            return e
        });
        users.push(this.state.username);
        this.connection.send(JSON.stringify({
                "op": "room",
                "name": document.getElementById("roomName").value,
                "users": users,
            }
        ));
        document.getElementById("roomUsers").value = "";
        document.getElementById("roomName").value = Math.random().toString(36).substr(2, 8);
        document.getElementById("addRoom").classList.toggle("hide");
        event.preventDefault()
    },

    render: function () {
        return (
            <div id="yamWrap">
                <div id="addRoom" className="hide">
                    <h1>Add rooom</h1>
                    <div>
                        Name: <input type="text" name="name" id="roomName"/>
                    </div>
                    <div>
                        Users: <input type="text" name="users" id="roomUsers"/>
                    </div>
                    <div>
                        <a href="" id="roomOk" onClick={this.addRoom}>Ok</a>
                    </div>
                    <div><a href="" id="roomCancel"
                            onClick={this.roomCancel}>Cancel</a></div>
                </div>
                <div id="menu">
                    <div id="rooms">
                        <Rooms
                            rooms={this.state.rooms}
                            username={this.state.username}
                            changeRoom={this.changeRoom}
                        />
                        <div
                            onClick={this.showRooms}
                            className="room"
                        >+
                        </div>
                    </div>
                    <div id="status">
                        <div id="gsignin"
                             className="g-signin2"
                             data-onsuccess="onSignIn"
                             data-theme="dark">
                        </div>
                        <div id="statusMessage">Unknown</div>
                        <div id="user">
                            <User
                                username={this.state.username}
                            />
                        </div>
                        <a href="#"
                           id="logout"
                           className="hide"
                           onClick={this.signOut}>Sign out</a>
                    </div>
                </div>
                <div id="chat">
                    <div id="content">
                        <div className="component-wrapper">
                            <Messages
                                sorted={this.state.children[this.state.room]}
                                onClick={this.handleClick}
                            />
                        </div>
                    </div>
                    <div id="controls">
                        <div id="input" contentEditable="true"></div>
                    </div>
                </div>
            </div>
        );
    }
});

function recurseChildren(message) {
    if (message.children !== undefined) {
        this.state.children[message.id] = message.children;
        message.children.forEach(function (m) {
            recurseChildren.bind(this)(m)
        }.bind(this));
    }
}

let Messages = React.createClass({
    render: function () {
        if (this.props.sorted === null || this.props.sorted === undefined) {
            return null
        }
        this.props.sorted.sort(function (a, b) {
            // return a.text.localeCompare(b.text);
            return a.received > b.received;
        });
        return (
            <div className="container messages">
                {
                    // console.log(Object.keys(this.props.messages).map(function (key) {
                    //     // console.log(key);
                    //    return <Message key={this.props.messages[key].id}
                    //                     id="ahoj"
                    //                     // value={this.props.messages[key]}
                    //                     value={{"text":"test"}}
                    //    />
                    // }.bind(this)))

                    this.props.sorted.map(function (m) {
                        // console.log(this.props.onClick);
                        return <Message key={m.id}
                                        id={m.id}
                                        value={m}
                                        onClick={this.props.onClick}
                        />
                    }.bind(this))
                }
            </div>
        );
    }
});

let Message = React.createClass({
    render: function () {
        return (
            <div className="message-wrap"
                 key={this.props.id}
            >
                <div className=
                         {"message" + (this.props.value.unread ? ' unread' : '')}
                     id={this.props.id}
                     data-id={this.props.id}
                     onClick={(e) => this.props.onClick(e)}
                >
                    <div className="content">
                        <span className="author">
                            {this.props.value.author}:&nbsp;
                        </span>
                        <span
                            className="body"
                        >
                            {this.props.value.text}
                        </span>
                    </div>
                    <div className="datetime">
                        {this.props.value.received ? this.props.value.received.toLocaleString() : ''}
                    </div>
                    <div className="controls">
                        <i className="fas fa-edit"/>
                        <i className="fas fa-external-link-alt"/>
                    </div>
                </div>
                <div className="nested">
                    {/* todo do not create nested is not nested*/}
                    <Messages
                        sorted={this.props.value.children}
                        onClick={this.props.onClick}
                    />
                </div>
            </div>
        )
    }
});

let User = React.createClass({
    render: function () {
        return (
            <span>
                {this.props.username}
            </span>
        );
    }
});


let Rooms = React.createClass({
    render: function () {
        return (
            <div className="rooms">
                {
                    this.props.rooms.map(function (r) {
                        return <div
                            key={r.id}
                            id={r.id}
                            data-id={r.id}
                            onClick={this.props.changeRoom}
                            className="room"
                        >{r.name}
                            <div className="users">
                                {
                                    r.users.filter(function (e) {
                                        return e !== this.props.username
                                    }.bind(this)).map(function (u, i) {
                                        return <div key={r.id + u + i}>{u}</div>
                                    }.bind(this))
                                }
                            </div>
                        </div>
                    }.bind(this))
                }
            </div>
        );
    }
});

let chat = ReactDOM.render(
    <App/>,
    document.getElementById('yam')
);
