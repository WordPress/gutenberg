# Collaboration transports

A **transport** moves opaque update payloads between clients and the server.
It owns connection shape, endpoints, authentication, and delivery timing — it
never interprets update data, which belongs to the room's `WP_Sync_Engine`.
Engines and transports are therefore independently swappable.

## Swapping transports

One config value selects the active transport site-wide,
`wp_get_collaboration_transport()`, resolved in this order:

1. the `WP_COLLABORATION_TRANSPORT` PHP constant,
2. the `WP_COLLABORATION_TRANSPORT` environment variable,
3. the `wp_collaboration_transport` filter,
4. default: `http-polling`.

The value is a transport slug. An unknown value falls back to the default.

```php
// wp-config.php
define( 'WP_COLLABORATION_TRANSPORT', 'http-long-polling' );
```

The server registers every transport's routes (all are reachable) and
announces the available slugs to the client with the active one **first**.
The client negotiates: it uses the first announced slug it has a registered
provider for, so an unusual config still degrades to a mutually supported
transport rather than failing.

## Built-in transports

| Slug                | Class                                | Shape                                                        |
| ------------------- | ------------------------------------ | ----------------------------------------------------------- |
| `http-polling`      | `WP_HTTP_Polling_Sync_Server`        | `POST /wp-sync/v1/updates` on an interval. The default.     |
| `http-long-polling` | `WP_HTTP_Long_Polling_Sync_Server`   | `POST /wp-sync/v1/long-poll`, held open until data is ready. |

Long-polling is short-polling with the request held open server-side until
there is something to deliver (or a bounded wait budget elapses), so remote
edits arrive promptly without tight client polling. Senders are never
delayed. It costs one held PHP worker per active collaborator, so size worker
pools accordingly (`wp_sync_long_poll_max_wait_ms` bounds the hold).

## Adding a transport

1. **Server**: add a class under this folder implementing `WP_Sync_Transport`
   (`get_slug`, `get_protocol_version`, `register_routes`). Drive rooms
   through the injected `WP_Sync_Engine_Registry` (`handle_updates` /
   `get_updates_since`) — never decode payloads. Register it in
   `WP_Sync_Transport_Registry` (or via the `wp_sync_transports` filter).
2. **Client**: add a sibling folder under `packages/sync/src/providers/`
   whose provider drives the engine only through `EngineSessionCodec`.
   Register it in `providers/index.ts` (or via the `sync.transports` filter)
   with a matching slug and protocol version.

Selection code on neither side changes — the registry and negotiation handle
it. The slug and protocol version must match across client and server.
