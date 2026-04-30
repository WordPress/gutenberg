# HTTP Polling Yjs Provider

A Yjs provider for Gutenberg that enables real-time synchronization via HTTP polling. Since PHP has no native Yjs library, this implementation uses a relay approach where the server stores and forwards messages while clients handle all CRDT operations.

## Architecture

```
┌─────────────────┐                              ┌─────────────────┐
│    Client A     │                              │    Client B     │
│  ┌───────────┐  │                              │  ┌───────────┐  │
│  │  Y.Doc    │  │                              │  │  Y.Doc    │  │
│  │ Awareness │  │                              │  │ Awareness │  │
│  └─────┬─────┘  │                              │  └─────┬─────┘  │
│        │        │                              │        │        │
│  ┌─────┴─────┐  │                              │  ┌─────┴─────┐  │
│  │  Polling  │  │                              │  │  Polling  │  │
│  │  Manager  │  │                              │  │  Manager  │  │
│  └─────┬─────┘  │                              │  └─────┬─────┘  │
└────────┼────────┘                              └────────┼────────┘
         │                                                │
         │         POST /wp-sync/v1/updates               │
         └────────────────────┬───────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │   WordPress REST  │
                    │   Sync Server     │
                    │  (message relay)  │
                    │                   │
                    │   Post Meta       │
                    │   Storage         │
                    └───────────────────┘
```

### Key Components

#### PHP Backend

- **`class-gutenberg-http-polling-sync-server.php`**: REST API endpoint for sync and awareness
- **`interface-gutenberg-sync-storage.php`**: Storage interface
- **`class-gutenberg-sync-post-meta-storage.php`**: Storage implementation using WordPress post meta

#### TypeScript Client

- **`http-polling-provider.ts`**: Yjs provider wrapper that manages connection lifecycle
- **`polling-manager.ts`**: Singleton that manages polling loop, room state, and awareness
- **`types.ts`**: Type definitions for sync protocol
- **`utils.ts`**: Queue management and API utilities

## Update Types

Updates are tagged with a type to enable different server-side handling:

| Type         | Description                  | Server Behavior                      |
| ------------ | ---------------------------- | ------------------------------------ |
| `sync_step1` | State vector announcement    | Stored, delivered to other clients   |
| `sync_step2` | Missing updates response     | Stored, delivered to other clients   |
| `update`     | Regular document change      | Stored until compacted               |
| `compaction` | Full document state via Y.encodeStateAsUpdate | Clears older updates, then stored |

## Data Flow

### 1. Client Connection

When a client opens an editor:

1. **Initialize Yjs document** with entity type and ID
2. **Create HTTP polling provider** with room name and awareness
3. **Register with polling manager** which starts the polling loop
4. **Queue is paused** until another collaborator is detected
5. **Send Sync Step 1** announcing the client's state vector

```typescript
const provider = new HttpPollingProvider( {
	room: 'postType/post:123',
	doc: ydoc,
	awareness: awareness,
} );
```

### 2. Polling Loop

The polling manager runs continuously:

- **Solo editing**: 1000ms interval, queue paused (no updates sent)
- **With collaborators**: 250ms interval, queue active

Each poll cycle:

1. **Collect updates** from all registered rooms' queues
2. **Include awareness state** for presence tracking
3. **POST to server** with updates and cursor positions
4. **Receive response** with updates and awareness from other clients
5. **Process updates** and generate any required responses (e.g., sync_step2)
6. **Apply to Y.Doc** using the appropriate Yjs method
7. **Handle compaction request** if server nominates this client

### 3. Sync Protocol

The Yjs sync protocol ensures clients converge to the same state:

1. **Client A joins**: Sends `sync_step1` (its state vector)
2. **Client B receives**: Generates `sync_step2` with updates A is missing
3. **Client A applies**: Now has all of B's changes
4. **Ongoing edits**: Both send `update` messages for new changes

### 4. Compaction

To prevent unbounded message growth, the server coordinates compaction:

1. **Threshold reached**: Server detects >50 stored updates for a room
2. **Client selection**: Server nominates the lowest active client ID
3. **Compaction request**: Server sends `should_compact: true` to the nominated client
4. **Client encodes**: Uses `Y.encodeStateAsUpdate()` to capture the full document state
5. **Client sends compaction**: The encoded state replaces older updates on the server

### 5. Awareness

Awareness state (presence, cursors) is synchronized alongside document updates:

- **Integrated endpoint**: Awareness travels with each sync request
- **Automatic expiration**: Clients that haven't polled in 30 seconds are removed
- **Collaborator detection**: When awareness shows multiple clients, polling speeds up

## REST API

### POST `/wp-sync/v1/updates`

Single endpoint for bidirectional sync including awareness. Clients send their updates and receive updates from others in one request.

**Request Body:**

```json
{
  "rooms": [
    {
      "room": "postType/post:123",
      "client_id": 12345,
      "after": 1704123456000,
      "awareness": { "cursor": { "x": 10, "y": 20 } },
      "updates": [
        { "type": "update", "data": "base64-encoded-yjs-update" }
      ]
    }
  ]
}
```

**Response:**

```json
{
  "rooms": [
    {
      "room": "postType/post:123",
      "end_cursor": 1704123457000,
      "awareness": {
        "12345": { "cursor": { "x": 10, "y": 20 } },
        "67890": { "cursor": { "x": 50, "y": 60 } }
      },
      "updates": [
        { "type": "update", "data": "base64-encoded-yjs-update" }
      ],
      "should_compact": false
    }
  ]
}
```

**Fields:**

- `room`: Entity identifier in format `{entity_kind}/{entity_name}:{object_id}`
- `client_id`: Unique client identifier (from `Y.Doc.clientID`)
- `after`: Cursor timestamp; only receive updates newer than this
- `awareness`: Client's awareness state (or null to disconnect)
- `end_cursor`: New cursor to use in next request
- `should_compact`: Boolean indicating whether this client should compact
- `updates`: Array of typed updates with base64-encoded Yjs data

## Permissions

Room names encode the entity being edited: `{entity_kind}/{entity_name}:{object_id}`

Example: `postType/post:123`

The server validates permissions before processing:

```php
if ( 'postType' === $entity_kind ) {
    return current_user_can( 'edit_post', $object_id );
}
```

## Storage

Updates are stored in WordPress post meta with the following structure:

```php
array(
    'client_id' => 12345,
    'type'      => 'update',
    'data'      => 'base64-encoded-data',
    'timestamp' => 1704123456000,
)
```

The timestamp (milliseconds since epoch) serves as the cursor for filtering.

Awareness state is stored separately per room:

```php
array(
    array(
        'client_id'  => 12345,
        'state'      => array( 'cursor' => array( 'x' => 10, 'y' => 20 ) ),
        'updated_at' => 1704123456,
    ),
)
```

## Error Handling

### Client-Side

- **Exponential backoff**: On HTTP errors, retry interval doubles (max 30s)
- **Queue restoration**: Failed updates are restored to the front of the queue
- **Compaction filtering**: Compaction updates are not restored (avoid duplicate compaction)
- **Automatic recovery**: Polling resumes at normal interval after success

### Server-Side

- **Permission errors**: Return 401 with error message
- **Invalid room format**: Return 400 with error message
- **Stale compaction**: If a newer compaction exists, the incoming one is discarded
- **Storage failures**: Handled by WordPress error system

## Limitations

### PHP Cannot Parse Yjs Data

The server treats Yjs updates as opaque base64 strings. It cannot:

- Validate update contents
- Merge CRDT operations
- Resolve conflicts server-side

All CRDT operations happen in the browser via Yjs.

### Polling Latency

Updates are not instant; there's inherent latency from the polling interval (250ms with collaborators). This is acceptable for document editing but may not suit real-time cursor tracking at high fidelity.

### Single Compactor

Only one client performs compaction at a time (the one with the lowest client ID). If that client disconnects before completing compaction, the server will nominate the next-lowest client ID on subsequent polls.
