var App = React.createClass({
    getInitialState: function () {
        return (
            {
                fruits: {
                    // 'fruit-1': 'orange',
                    // 'fruit-2': 'apple'
                }
            }
        )
    },

    componentDidMount: function () {
        var content = document.getElementById("content");
        var input = document.getElementById('input');

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

        input.addEventListener('keydown', function(event) {
          if (event.keyCode === 13) {
                event.preventDefault();
                // var msg = event.target.value; // for input
                var msg = event.target.textContent;
                if (!msg) {
                    return;
                }
                // send the message as an ordinary text
                this.connection.send(msg);
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
        setInterval(function () {
            if (this.connection.readyState !== 1) {
                // status.text('Error');
                input.attr('disabled', 'disabled').val('Unable to comminucate '
                    + 'with the WebSocket server.');
            }
        }.bind(this), 3000);

        this.connection.onopen = function () {
            // first we want users to enter their names
            // input.removeAttr('disabled');
            // status.text('Choose name:');
        };

        this.connection.onerror = function (error) {
            // just in there were some problems with conenction...
            content.html($('<p>', {
                text: 'Sorry, but there\'s some problem with your '
                + 'connection or the server is down.'
            }));
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


            // NOTE: if you're not sure about the JSON structure
            // check the server source code above
            if (json.type === 'color') { // first response from the server with user's color
                // myColor = json.data;
                // status.innerHTML += myName + ': ';
                // .css('color', myColor);
                // input.removeAttr('disabled').focus();
                // from now user can start sending messages
            } else if (json.type === 'history') { // entire message history
                // insert every single message to the chat window
                for (var i = 0; i < json.data.length; i++) {
                    this.addFruit(json.data[i].text)
                    // addMessage(json.data[i].author, json.data[i].text,
                    //     json.data[i].color, new Date(json.data[i].time));
                }
                content.scrollTo(0, content.scrollHeight);
            } else if (json.type === 'message') { // it's a single message
                // input.removeAttr('disabled'); // let the user write another message
                this.addFruit(json.data.text);
                // this.setState({fruits: ["aaa"]});
                // addMessage(json.data.author, json.data.text,
                //     json.data.color, new Date(json.data.time));
                content.scrollTo(0, content.scrollHeight);
            } else {
                console.log('Hmm..., I\'ve never seen JSON like this: ', json);
            }
        };

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

    addFruit: function (fruit) {
        //create a unike key for each new fruit item
        var timestamp = (new Date()).getTime();
        // update the state object
        this.state.fruits['fruit-' + timestamp] = fruit;
        // set the state
        this.setState({fruits: this.state.fruits});
    },

    render: function () {
        return (
            <div className="component-wrapper">
                <FruitList fruits={this.state.fruits}/>
            </div>
        );
    }
});

var FruitList = React.createClass({
    render: function () {
        return (
            <div className="container messages">
                {
                    Object.keys(this.props.fruits).map(function (key) {
                        return <div
                            className="list-group-item list-group-item-info message"
                            key={key}>{this.props.fruits[key]}</div>
                    }.bind(this))
                }
            </div>
        );
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
//         this.props.addFruit(fruit);
//         //reset the form
//         // this.refs.fruitForm.reset();
//         // App.addFruit(msg);
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
