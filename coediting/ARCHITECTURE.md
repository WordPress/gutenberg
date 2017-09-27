# Architecture

Coediting module contains 2 classes.

### Signal

**Methods**

* clearSignal : Used to clear the signal of a specific key by sending request to `/remove/{key}/base64({value})`

* getSignal : Get a signal or metadata of all peers at key by sending request to `/get/{key}`

* updateSignal : Update the signal or any meta data by sending request to `/set/{key}/base64({value})`

**Signal Structure**
```json
[
	{
		"initiator": true,
		"peer_id": "10302c30-6795-11e7-8104-0dba91a90a01",
		"signal": {
			"sdp": "SIGNAL",
			"type": "offer"
		},
		"type": "initial",
		"user_id": 123456789
	},
	{
		"initiator": false,
		"peer_id": "15615da0-6795-11e7-93b4-efefd373081b",
		"signal": {
			"sdp": "SIGNAL",
			"type": "answer"
		},
		"type": "initial",
		"user_id": 987654321
	}
]
```

### Coediting ( Main Class )

This is the main class which is initiated by a user directly and required three parameters. A unique identifier and server location on which to send and receive signal.


 **Methods**
 
* uuid : Returns a unique uuid which is used to create a unique document id and also used to create a shared secret key.

* isInitiator : Send the request to the server to ask if they is initiator or not.

* listenSignal : Start the timer with interval of 3 seconds to run function `listenSignalRoutine`.

* listenSignalRoutine : Send request to server to fetch new data for a key ( document unique id ).

* dataHandler : Looks for specific keys in data received before emitting event `peerData` to user and acts as middleware.

* peerHandler : Acts as an abstraction over simple peer library used for this module and handles initiator and events related to peer.

* init : Main entry point of Coediting module.

<br>
 
## Miscellaneous Problems

Problems with 2 or more than 2 peers. Notice that number of initiators are `n-1 (n is number of peers)`

To understand problems with XHR based signaling let's understand how it currently works with 2 peers.

1. Server currently has empty set for a key `X`.

2. New user comes and become `Peer1` and send request to server to see if they can become `Initiator` for key `X`.

3. Server sees ``` `X` -> empty Set {} ``` and returns true for `Initiator` to `Peer1`.

4. `Peer1` gets true and mark itself as `Initiator` and starts listening for other peers signal.

5. New user comes now and become `Peer2` and send request to server asking if they can become `Initiator`.

6. `Peer2` gets false and marks itself as non-initiator and starts listening for `Initiator` signals by polling at 3 seconds intervals.

7. Both `Peer1` and `Peer2` see each other signal and starts handshake defined in way in simple-peer library ( https://github.com/feross/simple-peer).


### Problems
    
1. What happens if any of peers refresh.
2. What happens if both refresh at the same time.
3. What happens for more than 2 peers.

### Solution

#### When any of peers refresh ( Already Implemented )
---

Let's assume two peers

 ``` `I` -> Initiator{} ``` 

 ``` `NI` -> Non Initiator{} ```

Case 1:

    `I` refreshes itself or disconnects then `NI` will get disconnected signal
    `NI` sends request asking to make itself an `Initiator` and becomes Initiator
     When new Peer comes and sees itself as `NI` as told by server and handshake happen.
    
Case 2:
    
    `NI` refreshed itself then `I` will get disconnected signal
    `I` sends request asking itself to become an `Initiator`
     Server sees `I` is already initiator and make it `Initiator` again
     New peer comes and sees itself as `NI` and handshake happen
     
When any peer receives disconnected signal, Making itself `Initiator` is done by the clearSignal function of Signal class. The server can only make someone `Initiator` when the Key set is empty and clearSignal does it and then `Peer1` starts init again.

**Assumption: If any peer is disconnected, another peer request shouldn't queue up before the first peer initiator request.**

<br>


### When both peers refresh ( Not implemented )
---

From the previous solution, the set must be empty for someone to become initiator but if both refresh at the same time no one gets the disconnected signal and won't be able to empty the key set server side.

The solution to this problem can be solved if the server doesn't have code execution based on request/response cycle rather its event based for eg WebSockets or server has cron which can see last ping time of peers and on the basis of that empty the key set.

An algorithm that can possibly make this work. 

**We would require something unique which describes a peer even after refresh. One thing is user id of WordPress account or using some UUID which can be stored in local storage.**

Steps:

1. Both peers send user id along with other meta data to the server and follow the steps for initial handshake.

2. The server has data about which peer was the initiator and which wasn't.

Case 1:

    Both peer returns after disconnection or refresh. The server knows which was the initiator and applies the same state to both the peers.

Case 2:
    
    Peer1 which was initiator before doesn't return but now its someone else Peer3 even then server 
    knows who was initiator and non-initiator then logic applies from first solution
    
**Limitation if user id is chosen for uniqueness**

A single user won't be able to collaborate even if they open the coediting url in a different browser when logged in using the same user account.

**Limitation if uuid is stored in local storage of browser**

If peer1 switches browser again they will be treated as new peer3 and can be handled in same way as described in case2 above.


### When more than 2 peers ( Not implemented )
---

The Same approach which was used in problem2 can be used here but the number of requests becomes huge to the server to decide on who to become the initiator and the full mesh topology applies here. There will be few api changes too in main Coediting module too.
