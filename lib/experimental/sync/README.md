# Signaling Server Documentation

The signaling server allows multiple clients to exchange messages with each other through various communication topics. Clients can subscribe and unsubscribe to these topics.
To retrieve messages, clients can send GET requests. They can also perform actions such as subscribing to topics, unsubscribing from topics, publishing messages in specific topics, or pinging the server by sending POST requests.
Every client must have a unique identifier (which can be randomly generated). This identifier should be included as a parameter named "subscriber_id" in every GET or POST request.

## Sending messages to the server

To send a message to the server, the client needs to send a POST request with its `subscriber_id` and the `message` to be sent.
The message should be a JSON string that includes its type, topics (or topic, depending on the type), and the data to be transmitted for messages of type publish. The type can be one of the following options: `subscribe`, `unsubscribe`, `publish`, `ping`, depending on the desired action the client wants to execute.
The details of each action are documented below. If the action is executed successfully by the server, the server will respond with `{"result":"ok"}`.
  
### Subscribe to topics

To subscribe to a set of topics, a client must send a POST request with the following parameters:

- `subscriber_id`: Subscriber ID of the client.
- `message`: 
    - `type`: Should be set as `subscribe`.
    - `topics`: An array of topics that the client is no longer interested in reading messages from, e.g., ["WordPress"].
  

#### Sample request

```js

await (
	await fetch( 'http://localhost:7888/site-wp-dev/wp-admin/admin-ajax.php', {
		body: new URLSearchParams( {
			subscriber_id: '1',
			action: 'gutenberg_signaling_server',
			message: JSON.stringify( {
				type: 'subscribe',
				topics: [ 'WordPress', 'Drupal' ],
			} ),
		} ),
		method: 'POST',
	} )
 ).text();

```

### Publish a message

  

To publish a message in a specific topic, a client must send a POST request with the following parameters:

- `subscriber_id`: Subscriber ID of the client.
- `message`:
    - `type`: Should be set as `publish`.
    - `topic`: The topic where the message should be published, e.g., "WordPress".
    - `data`: The data to be published to every client that subscribed to that topic. The data can be any string and may be encrypted to prevent the server from reading the messages.

  
#### Sample request

```js

await (
	await fetch( 'http://localhost:7888/site-wp-dev/wp-admin/admin-ajax.php', {
		body: new URLSearchParams( {
			subscriber_id: '1',
			action: 'gutenberg_signaling_server',
			message: JSON.stringify( {
				type: 'publish',
				topic: 'WordPress',
				data: 'hello I am client 1!',
			} ),
		} ),
		method: 'POST',
	} )
 ).text();

```

  

### Unsubscribe to a set of topics

To unsubscribe from a set of topics, a client must send a POST request with the following parameters:

- `subscriber_id`: Subscriber ID of the client.
- `message`: 
    - `type`: Should be set as `unsubscribe`.
    - `topics`: An array of topics that the client is no longer interested in reading messages from, e.g., ["WordPress", "Drupal"].

  
  

#### Sample request

```js
await (
	await fetch( 'http://localhost:7888/site-wp-dev/wp-admin/admin-ajax.php', {
		body: new URLSearchParams( {
			subscriber_id: '1',
			action: 'gutenberg_signaling_server',
			message: JSON.stringify( {
				type: 'unsubscribe',
				topics: [ 'WordPress', 'Drupal' ],
			} ),
		} ),
		method: 'POST',
	} )
 ).text();
```

  

### Ping the server

 
To ensure that the server is listening and to indicate that a client is still alive, the client can periodically send a ping to the server. When the server receives a ping from a client, it will respond with a message containing `pong`. The client will receive this `pong` message when it asks the server for new messages.

To send a ping, the client should send a message with the following parameters:
- `subscriber_id`: Subscriber ID of the client.
- `message`:
  - `type`: Should be set as `ping`.
  

#### Sample request

```js
await (
	await fetch( 'http://localhost:7888/site-wp-dev/wp-admin/admin-ajax.php', {
		body: new URLSearchParams( {
			subscriber_id: '1',
			action: 'gutenberg_signaling_server',
			message: JSON.stringify( {
				type: 'ping',
			} ),
		} ),
		method: 'POST',
	} )
 ).text();

```

  

## Read messages

In order for a client to read its pending messages, the client simply needs to initiate a GET request with its subscriber_id. The server responds with a content type of `text/event-stream;charset=UTF-8`, along with a retry value indicating the number of milliseconds after which the client should check again for new messages (e.g., `retry: 3000`). 

If there are no pending messages, the server's response ends there. However, if there are pending messages, the server continues by providing additional information in its response. This includes an 'id', which serves as a unique identifier for this response, an 'event' which, at present, is always set to 'message', and a 'data' field. The 'data' field is a JSON encoded string containing an array of messages that the given client is supposed to receive. Each message is similar to the published message object but includes an additional property named 'clients'. This property specifies the number of clients for which the message was sent (note: it does not indicate whether they have already received/requested it).

  
### Sample request

```js
await (
	await fetch(
		window.wp.url.addQueryArgs( window.wp.ajax.settings.url, {
			subscriber_id: '1',
			action: 'gutenberg_signaling_server',
		} )
	)
 ).text();
```

  

Sample answer when no messages are present:
```
retry: 3000
```

Sample answer when there are messages:
```
retry: 3000
id: 1694809781
event: message
data: [{"type":"publish","topic":"WordPress","data":"hello I am client 1!","clients":2},{"type":"publish","topic":"WordPress","data":"Hi client 1 I am client 2","clients":2}]
``````