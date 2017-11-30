# Gutenberg Collaborative Editing Plugin
## Based on WebRTC
---

### Starting App
Peer starting coediting has to generate a uuid using:
```
const coeditingId = Coediting.uuid(); // static function
```

After that pass that to Coediting module:

```
window.history.replaceState( '', '', '#' + coeditingId );
const coediting = new Coediting( coeditingId );
```

Peer not starting coediting has to join and get that coeditingId somehow possibly by sharing url.

___

## API

**Events**

* `peerFound` - checked via long polling to /get/coeditingId route to server.
```
coediting.on( 'peerFound', function( peer ) {
  // peer => peer signal used for connection establishment
} );
```

* `peerSignal` - received from other peer as offer.
```
coediting.on('peerSignal', function(signal){
  // signal => signal that is received from another peer.
});
```

* `peerConnected` - emitted after peerSignal and connection is established. 
```
coediting.on('peerConnected', function(){
  // peer is connected.
});
```

* `peerData - triggered when data is received. 
```
coediting.on('peerData', function(data){
  //data is always json stringified
});
```


## Data Format

Payload should always be JSON object which can be sent directly using coediting.send without stringify.


