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
                messages: []
            }
        )
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
                this.setState({messages: []});
                if (json.messages !== null) {
                    for (var i = 0; i < json.messages.length; i++) {
                        this.addMessage(json.messages[i]);
                        // console.log(json.messages[i])
                        // addMessage(json.data[i].author, json.data[i].text,
                        //     json.data[i].color, new Date(json.data[i].time));
                    }
                }
                content.scrollTo(0, content.scrollHeight);
            } else if (json.action === 'message') { // it's a single message
                // input.removeAttr('disabled'); // let the user write another message
                this.addMessage(json);
                // this.setState({messages: ["aaa"]});
                // addMessage(json.data.author, json.data.text,
                //     json.data.color, new Date(json.data.time));
                content.scrollTo(0, content.scrollHeight);
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
                    "author": "tivvit",
                    "text": msg,
                    // "sent": "" // todo time now
                }));
                // event.target.value = "";
                event.target.textContent = "";
                // disable the input field to make the user wait until server
                // sends back response
                // input.attr('disabled', 'disabled');

                // we know that the first message sent from a user their name
                // if (myName === false) {
                //     myName = msg;
                // }
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
        var timestamp = (new Date()).getTime();
        // update the state object
        this.state.messages['message-' + timestamp] = message;
        // set the state
        this.setState({messages: this.state.messages});
    },

    render: function () {
        return (
            <div className="component-wrapper">
                <Messages messages={this.state.messages}/>
            </div>
        );
    }
});

let Messages = React.createClass({
    render: function () {
        if (this.props.messages === null || this.props.messages === undefined) {
            return null
        }
        return (
            <div className="container messages">
                {
                    Object.keys(this.props.messages).map(function (key) {
                        return <Message key={key} id={key}
                                        value={this.props.messages[key]}/>
                    }.bind(this))
                }
            </div>
        );
    }
});

let Message = React.createClass({
    render: function () {
        return (
            <div className="message-wrap">
                <div className="message" key={this.props.id}>
                    {this.props.value.text}
                </div>
                <div className="nested">
                    {/* todo do not create nested is not nested*/}
                    <Messages  messages={this.props.value.children}/>
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
