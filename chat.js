function offline() {
    var elem = document.getElementById("statusMessage");
    elem.textContent = "offline";
    elem.classList.remove('online');
    elem.classList.add('offline');
}

function online() {
    var elem = document.getElementById("statusMessage");
    elem.textContent = "online";
    elem.classList.remove('offline');
    elem.classList.add('online');
}

var App = React.createClass({
    getInitialState: function () {
        return (
            {
                messages: [],
                children: [],
                sorted: [],
                parent: null,
                username: "tivvit"
            }
        )
    },

    handleClick: function (e) {
        if (this.state.parent !== null) {
            document.getElementById(this.state.parent).classList.toggle("active")
        }
        this.setState({parent: e.currentTarget.dataset.id});
        e.currentTarget.classList.toggle("active");
        document.getElementById("input").focus();
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
        this.connection = new WebSocket('ws://127.0.0.1:1337');

        this.connection.onopen = function () {
            online();
            this.connection.send(JSON.stringify({
                "op": "history",
            }))
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

            if (json.action === 'history') { // entire message history
                // insert every single message to the chat window
                this.setState({
                    messages: [],
                    children: [],
                    sorted: []
                });
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
            } else {
                console.log('Hmm..., I\'ve never seen JSON like this: ', json);
            }
        };
    },

    componentDidMount: function () {
        var content = document.getElementById("content");
        var input = document.getElementById('input');

        this.connect();

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
                    "parent": this.state.parent,
                    // "parent": "0e67bbc3-4329-42a0-845a-9fdd4e5ae65d",
                    // "parent": "c1a861bc-2c01-4777-909a-97bd57dbe80d",
                }));
                // event.target.value = "";
                event.target.textContent = "";
                // disable the input field to make the user wait until server
                // sends back response
                // input.attr('disabled', 'disabled');
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
        // this.connection.onmessage = evt => {
        //     // add the new message to state
        //     this.setState({
        //         messages: this.state.messages.concat([evt.data])
        //     })
        // };
    },

    addMessage: function (message) {
        //create a unike key for each new fruit item
        // var timestamp = (new Date()).getTime();
        // update the state object
        message.unread = true; // todo backend
        if (message.children === undefined) {
            message.children = [];
            this.state.children[message.id] = message.children
        }
        if (message.parent !== undefined) {
            if (this.state.children[message.parent] === undefined) {
                this.state.children[message.parent] = []
            }
            this.state.children[message.parent].push(message)
        } else {
            this.state.messages[message.id] = message;
            recurseChildren.bind(this)(message);
            this.state.sorted.push(message);
        }
        // set the state
        this.setState({messages: this.state.messages});
    },

    render: function () {
        return (
            <div className="component-wrapper">
                <Messages messages={this.state.messages}
                          sorted={this.state.sorted}
                          onClick={this.handleClick}
                />
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
                    <div className="controls">
                        <i className="fas fa-edit"></i>
                        <i className="fas fa-external-link-alt"></i>
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

ReactDOM.render(
    <App/>,
    document.getElementById('content')
);


// var input = document.getElementById('input');
//
// input.addEventListener('keydown', function (event) {
//     if (event.keyCode === 13) {
//         var msg = event.srcElement.value;
//         // if (!msg) {
//         //     return;
//         // }
//         // send the message as an ordinary text
//         connection.send(msg);
//
//         this.props.addMessage(fruit);
//         //reset the form
//         // this.refs.fruitForm.reset();
//         // App.addMessage(msg);
//         event.srcElement.value = "";
//         // disable the input field to make the user wait until server
//         // sends back response
//         // input.attr('disabled', 'disabled');
//
//         // we know that the first message sent from a user their name
//         if (myName === false) {
//             myName = msg;
//         }
//     }
// });
