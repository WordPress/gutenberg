<?php
/**
 * WP_WebSocket_Sync_Server class
 *
 * @package gutenberg
 */

if ( ! class_exists( 'WP_WebSocket_Connection' ) ) {
	require_once __DIR__ . '/class-wp-websocket-connection.php';
}
if ( ! class_exists( 'WP_WebSocket_Token_Controller' ) ) {
	require_once __DIR__ . '/class-wp-websocket-token-controller.php';
}

if ( ! class_exists( 'WP_WebSocket_Sync_Server' ) ) {

	/**
	 * Experimental dependency-free PHP WebSocket server for collaborative
	 * editing.
	 *
	 * Runs a stream_select() event loop over non-blocking sockets. The wire
	 * protocol is JSON text frames sharing the HTTP polling semantics: the
	 * client sends `{type: 'sync', rooms: [...]}` room requests and the
	 * server replies with the same room-response shape as the REST endpoint.
	 * Updates are persisted through WP_Sync_Storage so late joiners and
	 * reconnecting clients catch up via their cursor, and new updates are
	 * pushed immediately to other connected sockets subscribed to the room.
	 *
	 * Auth: the handshake requires a valid WordPress logged_in cookie, an
	 * allowed Origin, and a one-time short-lived token minted via the
	 * `wp-sync/v1/ws-token` REST endpoint whose user must match the cookie
	 * user. Per-room permission checks identical to the REST server run when
	 * a socket first references a room.
	 *
	 * @since 7.4.0
	 * @access private
	 */
	class WP_WebSocket_Sync_Server {
		/**
		 * Maximum number of rooms allowed per sync message.
		 *
		 * @since 7.4.0
		 * @var int
		 */
		const MAX_ROOMS_PER_MESSAGE = 50;

		/**
		 * Maximum length of a single update data string.
		 *
		 * @since 7.4.0
		 * @var int
		 */
		const MAX_UPDATE_DATA_SIZE = MB_IN_BYTES;

		/**
		 * Interval (in seconds) between keepalive pings.
		 *
		 * @since 7.4.0
		 * @var int
		 */
		const PING_INTERVAL_S = 15;

		/**
		 * Idle timeout (in seconds) after which an unresponsive socket is closed.
		 *
		 * @since 7.4.0
		 * @var int
		 */
		const IDLE_TIMEOUT_S = 45;

		/**
		 * Interval (in seconds) between awareness expiry sweeps.
		 *
		 * @since 7.4.0
		 * @var int
		 */
		const AWARENESS_SWEEP_INTERVAL_S = 10;

		/**
		 * Default maximum number of concurrent connections. Filterable via
		 * 'wp_sync_websocket_max_connections'.
		 *
		 * @since 7.4.0
		 * @var int
		 */
		const DEFAULT_MAX_CONNECTIONS = 512;

		/**
		 * Default maximum number of concurrent connections per client IP.
		 * Filterable via 'wp_sync_websocket_max_connections_per_ip'.
		 *
		 * @since 7.4.0
		 * @var int
		 */
		const DEFAULT_MAX_CONNECTIONS_PER_IP = 20;

		/**
		 * Deadline (in seconds) for a socket to complete the WebSocket
		 * handshake. Enforced independently of read activity so a dribbling
		 * pre-upgrade connection cannot hold a socket open indefinitely.
		 *
		 * @since 7.4.0
		 * @var int
		 */
		const HANDSHAKE_TIMEOUT_S = 10;

		/**
		 * Maximum number of sync messages allowed per socket within the
		 * rolling MESSAGE_RATE_WINDOW_S window. Sockets exceeding the budget
		 * are closed with policy-violation code 1008.
		 *
		 * The client coalesces sends behind a 50 ms debounce, so its worst
		 * sustained rate is ~20 messages/second (100 per 5 s window); this
		 * budget leaves 2x headroom above that.
		 *
		 * @since 7.4.0
		 * @var int
		 */
		const MESSAGE_RATE_LIMIT = 200;

		/**
		 * Rolling window (in seconds) for the per-socket message rate budget.
		 *
		 * @since 7.4.0
		 * @var int
		 */
		const MESSAGE_RATE_WINDOW_S = 5;

		/**
		 * Transport-agnostic sync server core.
		 *
		 * @since 7.4.0
		 */
		private WP_HTTP_Polling_Sync_Server $sync;

		/**
		 * Host to bind.
		 *
		 * @since 7.4.0
		 * @var string
		 */
		private string $host;

		/**
		 * Port to bind.
		 *
		 * @since 7.4.0
		 * @var int
		 */
		private int $port;

		/**
		 * Listening socket.
		 *
		 * @since 7.4.0
		 * @var resource|null
		 */
		private $listener = null;

		/**
		 * Connected clients keyed by stream id.
		 *
		 * Each entry:
		 * - conn:          WP_WebSocket_Connection
		 * - user_id:       int WordPress user authenticated during the handshake.
		 * - cookie:        string Raw logged_in cookie value captured at the
		 *                  handshake, re-validated during the periodic sweep.
		 * - ip:            string Peer IP address, used for per-IP caps.
		 * - rooms:         array<string, array{client_id: int, cursor: int}>
		 * - connected_at:  float Time the socket was accepted (handshake deadline).
		 * - last_seen:     float Last time bytes arrived from the peer.
		 * - message_times: float[] Recent sync-message timestamps (rate budget).
		 * - closing:       bool Whether to close once the write buffer drains.
		 *
		 * @since 7.4.0
		 * @var array<int, array<string, mixed>>
		 */
		private array $clients = array();

		/**
		 * Whether the event loop should keep running.
		 *
		 * @since 7.4.0
		 * @var bool
		 */
		private bool $running = false;

		/**
		 * Last time keepalive pings were sent.
		 *
		 * @since 7.4.0
		 * @var float
		 */
		private float $last_ping_at = 0;

		/**
		 * Last time the awareness expiry sweep ran.
		 *
		 * @since 7.4.0
		 * @var float
		 */
		private float $last_sweep_at = 0;

		/**
		 * Constructor.
		 *
		 * @since 7.4.0
		 *
		 * @param WP_HTTP_Polling_Sync_Server $sync Transport seam driving rooms
		 *                                          through the engine registry.
		 * @param string                      $host Host to bind.
		 * @param int                         $port Port to bind.
		 */
		public function __construct( WP_HTTP_Polling_Sync_Server $sync, string $host = '127.0.0.1', int $port = 8787 ) {
			$this->sync = $sync;
			$this->host = $host;
			$this->port = $port;
		}

		/**
		 * Starts the event loop. Blocks until stop() is called or the
		 * process is terminated.
		 *
		 * @since 7.4.0
		 *
		 * @return true|WP_Error True when the loop exits cleanly, WP_Error if
		 *                       the listening socket could not be created.
		 */
		public function run() {
			$errno  = 0;
			$errstr = '';

			$this->listener = stream_socket_server(
				sprintf( 'tcp://%s:%d', $this->host, $this->port ),
				$errno,
				$errstr
			);

			if ( ! $this->listener ) {
				return new WP_Error(
					'websocket_listen_failed',
					sprintf( 'Could not listen on %s:%d: [%d] %s', $this->host, $this->port, $errno, $errstr )
				);
			}

			stream_set_blocking( $this->listener, false );

			$this->log( sprintf( 'Listening on ws://%s:%d', $this->host, $this->port ) );

			$this->running       = true;
			$this->last_ping_at  = microtime( true );
			$this->last_sweep_at = microtime( true );

			while ( $this->running ) {
				$read  = array( $this->listener );
				$write = array();

				foreach ( $this->clients as $client ) {
					$stream = $client['conn']->get_stream();
					$read[] = $stream;

					if ( $client['conn']->has_pending_writes() ) {
						$write[] = $stream;
					}
				}

				$except = null;

				// Intentional silencing: stream_select() raises a warning when
				// interrupted by a signal; a false return is handled below.
				// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
				$changed = @stream_select( $read, $write, $except, 1 );

				if ( false !== $changed ) {
					foreach ( $read as $stream ) {
						if ( $stream === $this->listener ) {
							$this->accept_connection();
							continue;
						}

						$this->handle_readable( (int) $stream );
					}

					foreach ( $write as $stream ) {
						$key = (int) $stream;
						if ( isset( $this->clients[ $key ] ) ) {
							$this->clients[ $key ]['conn']->flush_writes();
						}
					}
				}

				$this->tick();
			}

			foreach ( array_keys( $this->clients ) as $key ) {
				$this->disconnect( $key );
			}

			fclose( $this->listener );
			$this->listener = null;

			return true;
		}

		/**
		 * Stops the event loop after the current iteration.
		 *
		 * @since 7.4.0
		 */
		public function stop(): void {
			$this->running = false;
		}

		/**
		 * Accepts a pending connection on the listening socket, enforcing
		 * total and per-IP connection caps.
		 *
		 * @since 7.4.0
		 */
		private function accept_connection(): void {
			// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
			$stream = @stream_socket_accept( $this->listener, 0 );

			if ( ! $stream ) {
				return;
			}

			/**
			 * Filters the maximum number of concurrent WebSocket connections.
			 *
			 * @since 7.4.0
			 *
			 * @param int $max_connections Maximum concurrent connections.
			 */
			$max_connections = (int) apply_filters( 'wp_sync_websocket_max_connections', self::DEFAULT_MAX_CONNECTIONS );

			if ( count( $this->clients ) >= $max_connections ) {
				$this->log( 'Connection refused: total connection cap reached' );
				// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
				@fclose( $stream );
				return;
			}

			$ip = $this->get_peer_ip( $stream );

			/**
			 * Filters the maximum number of concurrent WebSocket connections
			 * per client IP address.
			 *
			 * @since 7.4.0
			 *
			 * @param int $max_connections_per_ip Maximum concurrent connections per IP.
			 */
			$max_connections_per_ip = (int) apply_filters( 'wp_sync_websocket_max_connections_per_ip', self::DEFAULT_MAX_CONNECTIONS_PER_IP );

			if ( '' !== $ip ) {
				$ip_connections = 0;
				foreach ( $this->clients as $client ) {
					if ( $client['ip'] === $ip ) {
						++$ip_connections;
					}
				}

				if ( $ip_connections >= $max_connections_per_ip ) {
					$this->log( 'Connection refused: per-IP connection cap reached for ' . $ip );
					// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
					@fclose( $stream );
					return;
				}
			}

			$this->clients[ (int) $stream ] = array(
				'closing'       => false,
				'conn'          => new WP_WebSocket_Connection( $stream ),
				'connected_at'  => microtime( true ),
				'cookie'        => '',
				'ip'            => $ip,
				'last_seen'     => microtime( true ),
				'message_times' => array(),
				'rooms'         => array(),
				'user_id'       => 0,
			);
		}

		/**
		 * Gets the peer IP address for a stream.
		 *
		 * @since 7.4.0
		 *
		 * @param resource $stream Client stream.
		 * @return string IP address, or empty string if unavailable.
		 */
		private function get_peer_ip( $stream ): string {
			// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
			$name = @stream_socket_get_name( $stream, true );

			if ( ! is_string( $name ) || '' === $name ) {
				return '';
			}

			// The peer name is "ip:port"; IPv6 addresses contain colons, so
			// strip only the final ":port" segment.
			$colon = strrpos( $name, ':' );

			return false === $colon ? $name : substr( $name, 0, $colon );
		}

		/**
		 * Handles readable bytes on a client socket.
		 *
		 * @since 7.4.0
		 *
		 * @param int $key Client key.
		 */
		private function handle_readable( int $key ): void {
			if ( ! isset( $this->clients[ $key ] ) ) {
				return;
			}

			$conn = $this->clients[ $key ]['conn'];

			if ( ! $conn->read_from_socket() ) {
				$this->disconnect( $key );
				return;
			}

			$this->clients[ $key ]['last_seen'] = microtime( true );

			if ( ! $conn->is_open() ) {
				$this->handle_handshake( $key );

				if ( ! isset( $this->clients[ $key ] ) || ! $conn->is_open() ) {
					return;
				}
			}

			$frames = $conn->read_frames();

			if ( is_wp_error( $frames ) ) {
				$this->log( 'Protocol error: ' . $frames->get_error_message() );
				$conn->send_close( 1002, 'Protocol error' );
				$this->disconnect( $key );
				return;
			}

			foreach ( $frames as $frame ) {
				switch ( $frame['opcode'] ) {
					case WP_WebSocket_Connection::OPCODE_TEXT:
						$this->handle_message( $key, $frame['payload'] );
						break;

					case WP_WebSocket_Connection::OPCODE_PING:
						$conn->send_pong( $frame['payload'] );
						break;

					case WP_WebSocket_Connection::OPCODE_PONG:
						// last_seen was already refreshed above.
						break;

					case WP_WebSocket_Connection::OPCODE_CLOSE:
						$conn->send_close();
						$this->disconnect( $key );
						return;

					default:
						$conn->send_close( 1003, 'Unsupported frame type' );
						$this->disconnect( $key );
						return;
				}

				if ( ! isset( $this->clients[ $key ] ) ) {
					return;
				}
			}
		}

		/**
		 * Attempts to complete the handshake for a connection.
		 *
		 * @since 7.4.0
		 *
		 * @param int $key Client key.
		 */
		private function handle_handshake( int $key ): void {
			$conn    = $this->clients[ $key ]['conn'];
			$request = $conn->parse_handshake_request();

			if ( null === $request ) {
				// Incomplete request; wait for more bytes.
				return;
			}

			if ( is_wp_error( $request ) ) {
				$conn->send_http_response( 400, 'Bad Request' );
				$this->disconnect( $key );
				return;
			}

			$headers    = $request['headers'];
			$is_upgrade = isset( $headers['sec-websocket-key'] )
				&& isset( $headers['upgrade'] )
				&& 'websocket' === strtolower( $headers['upgrade'] );

			// Plain HTTP health check used by test harnesses and monitoring.
			if ( ! $is_upgrade && '/health' === $request['path'] && 'GET' === $request['method'] ) {
				$conn->send_http_response( 200, 'OK', 'OK' );
				$this->finish_or_mark_closing( $key );
				return;
			}

			if ( ! $is_upgrade ) {
				$conn->send_http_response( 400, 'Bad Request', 'WebSocket upgrade required.' );
				$this->finish_or_mark_closing( $key );
				return;
			}

			/*
			 * This is a long-running process with an in-memory object cache.
			 * Sessions, users, and permissions change in other processes
			 * (web requests) without invalidating this process's cache, so
			 * flush before authenticating to validate against fresh data.
			 */
			wp_cache_flush();

			$auth = $this->authenticate_handshake( $request );

			if ( is_wp_error( $auth ) ) {
				$this->log( 'Handshake rejected: ' . $auth->get_error_message() );
				$conn->send_http_response( 403, 'Forbidden', 'Forbidden' );
				$this->finish_or_mark_closing( $key );
				return;
			}

			$this->clients[ $key ]['user_id'] = $auth['user_id'];
			$this->clients[ $key ]['cookie']  = $auth['cookie'];
			$conn->accept_handshake( $headers['sec-websocket-key'] );
		}

		/**
		 * Authenticates a WebSocket handshake request.
		 *
		 * Requires all of:
		 * 1. A valid logged_in auth cookie.
		 * 2. An allowed Origin header.
		 * 3. A valid one-time token whose user matches the cookie user.
		 *
		 * @since 7.4.0
		 *
		 * @param array{headers: array<string, string>, query: array<string, mixed>} $request Parsed handshake request.
		 * @return array{user_id: int, cookie: string}|WP_Error Authenticated user
		 *         ID and the raw logged_in cookie value (retained for periodic
		 *         re-validation), or WP_Error on failure.
		 */
		private function authenticate_handshake( array $request ) {
			$headers = $request['headers'];

			// 1. Origin allowlist.
			$origin          = $headers['origin'] ?? '';
			$default_origins = array_values(
				array_unique(
					array_filter(
						array(
							$this->get_url_origin( home_url() ),
							$this->get_url_origin( admin_url() ),
						)
					)
				)
			);

			/**
			 * Filters the origins allowed to open collaboration WebSocket
			 * connections.
			 *
			 * @since 7.4.0
			 *
			 * @param string[] $origins Allowed origins (scheme://host[:port]).
			 */
			$allowed_origins = apply_filters( 'wp_sync_websocket_allowed_origins', $default_origins );

			if ( '' === $origin || ! is_array( $allowed_origins ) || ! in_array( $origin, $allowed_origins, true ) ) {
				return new WP_Error( 'websocket_bad_origin', 'Origin not allowed: ' . $origin );
			}

			// 2. WordPress logged_in auth cookie.
			$cookie_header = $headers['cookie'] ?? '';
			$cookie_value  = $this->get_cookie_value( $cookie_header, LOGGED_IN_COOKIE );

			if ( '' === $cookie_value ) {
				return new WP_Error(
					'websocket_invalid_cookie',
					'' === $cookie_header
						? 'Missing Cookie header.'
						: 'Auth cookie not present in Cookie header.'
				);
			}

			$cookie_user = wp_validate_auth_cookie( $cookie_value, 'logged_in' );

			if ( ! $cookie_user ) {
				return new WP_Error( 'websocket_invalid_cookie', 'Invalid auth cookie.' );
			}

			// 3. One-time token minted via the ws-token REST endpoint.
			$token      = isset( $request['query']['token'] ) && is_string( $request['query']['token'] )
				? $request['query']['token']
				: '';
			$token_user = WP_WebSocket_Token_Controller::consume_token( $token );

			if ( null === $token_user || $token_user !== (int) $cookie_user ) {
				return new WP_Error( 'websocket_invalid_token', 'Missing, expired, or mismatched token.' );
			}

			return array(
				'cookie'  => $cookie_value,
				'user_id' => (int) $cookie_user,
			);
		}

		/**
		 * Handles a decoded text message from an open connection.
		 *
		 * @since 7.4.0
		 *
		 * @param int    $key     Client key.
		 * @param string $payload JSON message payload.
		 */
		private function handle_message( int $key, string $payload ): void {
			// Per-socket rolling rate budget. A well-behaved client
			// coalesces sends behind a debounce and stays far below this.
			$now          = microtime( true );
			$window_start = $now - self::MESSAGE_RATE_WINDOW_S;
			$recent_times = array();

			foreach ( $this->clients[ $key ]['message_times'] as $time ) {
				if ( $time > $window_start ) {
					$recent_times[] = $time;
				}
			}

			$recent_times[]                         = $now;
			$this->clients[ $key ]['message_times'] = $recent_times;

			if ( count( $recent_times ) > self::MESSAGE_RATE_LIMIT ) {
				$this->log( 'Closing connection: message rate budget exceeded' );
				$this->clients[ $key ]['conn']->send_close( 1008, 'Message rate exceeded' );
				$this->disconnect( $key );
				return;
			}

			$message = json_decode( $payload, true );

			if ( ! is_array( $message ) || 'sync' !== ( $message['type'] ?? '' ) || ! isset( $message['rooms'] ) || ! is_array( $message['rooms'] ) ) {
				$this->send_error( $key, new WP_Error( 'websocket_invalid_message', 'Expected a sync message with rooms.' ) );
				return;
			}

			$rooms = array_slice( array_values( $message['rooms'] ), 0, self::MAX_ROOMS_PER_MESSAGE );

			// Establish the current user before any capability checks.
			wp_set_current_user( (int) $this->clients[ $key ]['user_id'] );

			$responses     = array();
			$touched_rooms = array();

			foreach ( $rooms as $room_request ) {
				$validated = $this->validate_room_request( $room_request );

				if ( is_wp_error( $validated ) ) {
					$this->send_error( $key, $validated );
					continue;
				}

				$room = $validated['room'];

				// Per-room permission checks when the socket first references
				// the room, mirroring the REST permission callback.
				if ( ! isset( $this->clients[ $key ]['rooms'][ $room ] ) ) {
					if ( ! current_user_can( 'edit_posts' ) ) {
						$this->send_error(
							$key,
							new WP_Error(
								'rest_cannot_edit',
								'You do not have permission to perform this action',
								array( 'rooms' => array( $room ) )
							)
						);
						continue;
					}

					if ( ! $this->sync->can_user_sync_room( $room ) ) {
						$this->send_error(
							$key,
							new WP_Error(
								'rest_cannot_edit',
								'You do not have permission to sync this room.',
								array( 'rooms' => array( $room ) )
							)
						);
						continue;
					}

					$this->clients[ $key ]['rooms'][ $room ] = array(
						'client_id' => $validated['client_id'],
						'cursor'    => 0,
					);
				} elseif ( $this->clients[ $key ]['rooms'][ $room ]['client_id'] !== $validated['client_id'] ) {
					/*
					 * The client_id is bound to this (socket, room) pair at
					 * first subscribe. A different client_id afterwards is a
					 * protocol/policy violation: it could hijack or evict
					 * another user's awareness entry. Close the socket.
					 */
					$this->log( 'Closing connection: client_id changed for a subscribed room' );
					$this->clients[ $key ]['conn']->send_close( 1008, 'client_id mismatch' );
					$this->disconnect( $key );
					return;
				}

				$room_response = $this->sync->process_room_request( $validated );

				if ( is_wp_error( $room_response ) ) {
					$this->send_error( $key, $room_response );
					continue;
				}

				$this->clients[ $key ]['rooms'][ $room ]['cursor'] = $room_response['end_cursor'];

				// A null awareness state is a disconnect signal for the room.
				if ( null === $validated['awareness'] ) {
					unset( $this->clients[ $key ]['rooms'][ $room ] );
				}

				$responses[]     = $room_response;
				$touched_rooms[] = $room;
			}

			if ( ! empty( $responses ) ) {
				$this->clients[ $key ]['conn']->send_text(
					wp_json_encode(
						array(
							'rooms' => $responses,
							'type'  => 'sync',
						)
					)
				);
			}

			// Push new updates and awareness to the other sockets in the room.
			foreach ( array_unique( $touched_rooms ) as $room ) {
				$this->broadcast_room( $room, $key );
			}
		}

		/**
		 * Validates a room request against the same constraints as the REST
		 * route schema.
		 *
		 * @since 7.4.0
		 *
		 * @param mixed $room_request Raw room request from the message.
		 * @return array|WP_Error Normalized room request, or WP_Error if invalid.
		 */
		private function validate_room_request( $room_request ) {
			if ( ! is_array( $room_request ) ) {
				return new WP_Error( 'websocket_invalid_room', 'Room request must be an object.' );
			}

			$room = $room_request['room'] ?? null;
			if ( ! is_string( $room ) || ! preg_match( '#^[^/]+/[^/:]+(?::\S+)?$#', $room ) ) {
				return new WP_Error( 'websocket_invalid_room', 'Invalid room identifier.' );
			}

			$client_id = $room_request['client_id'] ?? null;
			if ( ! is_int( $client_id ) || $client_id < 1 ) {
				return new WP_Error( 'websocket_invalid_room', 'Invalid client_id.', array( 'rooms' => array( $room ) ) );
			}

			$after = $room_request['after'] ?? null;
			if ( ! is_int( $after ) || $after < 0 ) {
				return new WP_Error( 'websocket_invalid_room', 'Invalid after cursor.', array( 'rooms' => array( $room ) ) );
			}

			$awareness = $room_request['awareness'] ?? null;
			if ( null !== $awareness && ! is_array( $awareness ) ) {
				return new WP_Error( 'websocket_invalid_room', 'Invalid awareness state.', array( 'rooms' => array( $room ) ) );
			}

			$updates = $room_request['updates'] ?? null;
			if ( ! is_array( $updates ) ) {
				return new WP_Error( 'websocket_invalid_room', 'Invalid updates list.', array( 'rooms' => array( $room ) ) );
			}

			$valid_types = $this->sync->get_engine_registry()->get_all_update_types();

			$validated_updates = array();
			foreach ( $updates as $update ) {
				if ( ! is_array( $update )
					|| ! isset( $update['data'], $update['type'] )
					|| ! is_string( $update['data'] )
					|| strlen( $update['data'] ) > self::MAX_UPDATE_DATA_SIZE
					|| ! in_array( $update['type'], $valid_types, true )
				) {
					return new WP_Error( 'websocket_invalid_room', 'Invalid update.', array( 'rooms' => array( $room ) ) );
				}

				$validated_updates[] = array(
					'data' => $update['data'],
					'type' => $update['type'],
				);
			}

			return array(
				'after'     => $after,
				'awareness' => $awareness,
				'client_id' => $client_id,
				'room'      => $room,
				'updates'   => $validated_updates,
			);
		}

		/**
		 * Pushes new updates and current awareness for a room to its
		 * subscribed sockets.
		 *
		 * @since 7.4.0
		 *
		 * @param string   $room        Room identifier.
		 * @param int|null $exclude_key Client key to skip (the sender), or null.
		 */
		private function broadcast_room( string $room, ?int $exclude_key = null ): void {
			$awareness_map = $this->sync->get_storage()->get_awareness_state( $room );

			foreach ( $this->clients as $other_key => $other ) {
				if ( $other_key === $exclude_key || ! isset( $other['rooms'][ $room ] ) || ! $other['conn']->is_open() ) {
					continue;
				}

				$client_id = $other['rooms'][ $room ]['client_id'];
				$cursor    = $other['rooms'][ $room ]['cursor'];

				$room_response              = $this->sync->get_engine_registry()->get_engine_for_room( $room )->get_updates_since( $room, $client_id, $cursor, array() );
				$room_response['awareness'] = $awareness_map;

				$this->clients[ $other_key ]['rooms'][ $room ]['cursor'] = $room_response['end_cursor'];

				$other['conn']->send_text(
					wp_json_encode(
						array(
							'rooms' => array( $room_response ),
							'type'  => 'sync',
						)
					)
				);
			}
		}

		/**
		 * Sends an error message to a client.
		 *
		 * @since 7.4.0
		 *
		 * @param int      $key   Client key.
		 * @param WP_Error $error Error to send.
		 */
		private function send_error( int $key, WP_Error $error ): void {
			if ( ! isset( $this->clients[ $key ] ) ) {
				return;
			}

			$data = $error->get_error_data();

			$this->clients[ $key ]['conn']->send_text(
				wp_json_encode(
					array(
						'code'    => $error->get_error_code(),
						'message' => $error->get_error_message(),
						'rooms'   => is_array( $data ) && isset( $data['rooms'] ) ? $data['rooms'] : array(),
						'type'    => 'error',
					)
				)
			);
		}

		/**
		 * Runs periodic tasks: keepalive pings, idle timeouts, awareness
		 * expiry sweeps, and deferred closes.
		 *
		 * @since 7.4.0
		 */
		private function tick(): void {
			global $wpdb;

			$now = microtime( true );

			// Close connections whose write buffer has drained after a
			// deferred close (e.g. health checks and rejected handshakes).
			foreach ( $this->clients as $key => $client ) {
				if ( $client['closing'] && ! $client['conn']->has_pending_writes() ) {
					$this->disconnect( $key );
				}
			}

			/*
			 * Drop sockets that never completed the WebSocket handshake
			 * within the deadline. This is independent of last_seen, which a
			 * slow-dripping pre-upgrade connection could keep refreshing.
			 */
			foreach ( $this->clients as $key => $client ) {
				if (
					! $client['conn']->is_open()
					&& ! $client['closing']
					&& $now - $client['connected_at'] > self::HANDSHAKE_TIMEOUT_S
				) {
					$this->log( 'Closing connection: handshake deadline exceeded' );
					$this->disconnect( $key );
				}
			}

			// Keepalive pings and idle timeouts.
			if ( $now - $this->last_ping_at >= self::PING_INTERVAL_S ) {
				$this->last_ping_at = $now;

				foreach ( $this->clients as $key => $client ) {
					if ( $now - $client['last_seen'] > self::IDLE_TIMEOUT_S ) {
						$this->log( 'Closing idle connection' );
						$this->disconnect( $key );
						continue;
					}

					if ( $client['conn']->is_open() ) {
						$client['conn']->send_ping();
					}
				}
			}

			// Awareness expiry sweep.
			if ( $now - $this->last_sweep_at >= self::AWARENESS_SWEEP_INTERVAL_S ) {
				$this->last_sweep_at = $now;

				// Keep the database connection alive across idle periods.
				if ( isset( $wpdb ) && method_exists( $wpdb, 'check_connection' ) ) {
					$wpdb->check_connection( false );
				}

				// Bound staleness of this process's in-memory object cache
				// against changes made by web requests (users, posts, terms).
				wp_cache_flush();

				$this->revalidate_clients();
				$this->sweep_awareness();
			}
		}

		/**
		 * Re-validates authentication for every open socket.
		 *
		 * The handshake authenticates once, but sessions can be revoked and
		 * capabilities can change while a socket stays open. The surrounding
		 * sweep has already flushed the object cache, so these checks run
		 * against fresh data. Sockets that fail are closed with policy
		 * violation code 1008.
		 *
		 * @since 7.4.0
		 */
		private function revalidate_clients(): void {
			foreach ( $this->clients as $key => $client ) {
				if ( ! $client['conn']->is_open() || $client['user_id'] <= 0 ) {
					continue;
				}

				$cookie_user = '' !== $client['cookie']
					? wp_validate_auth_cookie( $client['cookie'], 'logged_in' )
					: false;

				if ( ! $cookie_user || (int) $cookie_user !== (int) $client['user_id'] ) {
					$this->log( 'Closing connection: session no longer valid' );
					$client['conn']->send_close( 1008, 'Session expired' );
					$this->disconnect( $key );
					continue;
				}

				wp_set_current_user( (int) $client['user_id'] );

				if ( ! current_user_can( 'edit_posts' ) ) {
					$this->log( 'Closing connection: user lost required capability' );
					$client['conn']->send_close( 1008, 'Insufficient permissions' );
					$this->disconnect( $key );
				}
			}
		}

		/**
		 * Refreshes awareness for connected clients and expires stale peers.
		 *
		 * Connected WebSocket clients only send awareness on change (unlike
		 * HTTP polling clients that refresh on every poll), so the server
		 * refreshes their timestamps while a socket remains open. Entries
		 * belonging to disconnected clients expire via the shared timeout and
		 * the removal is broadcast to the room.
		 *
		 * @since 7.4.0
		 */
		private function sweep_awareness(): void {
			$connected_clients_by_room = array();

			foreach ( $this->clients as $client ) {
				if ( ! $client['conn']->is_open() ) {
					continue;
				}

				foreach ( $client['rooms'] as $room => $room_state ) {
					$connected_clients_by_room[ $room ][ $room_state['client_id'] ] = true;
				}
			}

			foreach ( $connected_clients_by_room as $room => $connected_client_ids ) {
				$entries      = $this->sync->get_storage()->get_awareness_state( $room );
				$current_time = time();
				$kept         = array();
				$changed      = false;
				$removed_any  = false;

				foreach ( $entries as $entry ) {
					$is_connected = isset( $connected_client_ids[ $entry['client_id'] ] );
					$is_expired   = $current_time - $entry['updated_at'] >= WP_HTTP_Polling_Sync_Server::AWARENESS_TIMEOUT;

					if ( $is_connected ) {
						// Refresh the timestamp so a quiet-but-connected
						// client is not expired.
						$entry['updated_at'] = $current_time;
						$changed             = true;
						$kept[]              = $entry;
						continue;
					}

					if ( $is_expired ) {
						$changed     = true;
						$removed_any = true;
						continue;
					}

					$kept[] = $entry;
				}

				if ( $changed ) {
					$this->sync->get_storage()->set_awareness_state( $room, $kept );
				}

				if ( $removed_any ) {
					$this->broadcast_room( $room );
				}
			}
		}

		/**
		 * Disconnects a client, removing its awareness entries and notifying
		 * room peers.
		 *
		 * @since 7.4.0
		 *
		 * @param int $key Client key.
		 */
		private function disconnect( int $key ): void {
			if ( ! isset( $this->clients[ $key ] ) ) {
				return;
			}

			$client = $this->clients[ $key ];
			$rooms  = array_keys( $client['rooms'] );

			$client['conn']->close();
			unset( $this->clients[ $key ] );

			foreach ( $rooms as $room ) {
				// Removing the client's awareness entry immediately mirrors
				// the REST disconnect signal (awareness: null).
				if ( $client['user_id'] > 0 ) {
					wp_set_current_user( (int) $client['user_id'] );
				}
				$this->sync->update_awareness( $room, $client['rooms'][ $room ]['client_id'], null );
				$this->broadcast_room( $room );
			}
		}

		/**
		 * Disconnects immediately if the write buffer has drained, otherwise
		 * marks the connection for closing once it does.
		 *
		 * @since 7.4.0
		 *
		 * @param int $key Client key.
		 */
		private function finish_or_mark_closing( int $key ): void {
			if ( ! isset( $this->clients[ $key ] ) ) {
				return;
			}

			if ( ! $this->clients[ $key ]['conn']->has_pending_writes() ) {
				$this->disconnect( $key );
				return;
			}

			$this->clients[ $key ]['closing'] = true;
		}

		/**
		 * Extracts scheme://host[:port] from a URL.
		 *
		 * @since 7.4.0
		 *
		 * @param string $url URL to parse.
		 * @return string Origin, or empty string if the URL is unparsable.
		 */
		private function get_url_origin( string $url ): string {
			$parts = wp_parse_url( $url );

			if ( empty( $parts['scheme'] ) || empty( $parts['host'] ) ) {
				return '';
			}

			$origin = $parts['scheme'] . '://' . $parts['host'];

			if ( ! empty( $parts['port'] ) ) {
				$origin .= ':' . $parts['port'];
			}

			return $origin;
		}

		/**
		 * Reads a cookie value from a raw Cookie header.
		 *
		 * @since 7.4.0
		 *
		 * @param string $cookie_header Raw Cookie header value.
		 * @param string $name          Cookie name to find.
		 * @return string Cookie value (URL-decoded), or empty string.
		 */
		private function get_cookie_value( string $cookie_header, string $name ): string {
			foreach ( explode( ';', $cookie_header ) as $pair ) {
				$parts = explode( '=', trim( $pair ), 2 );

				if ( 2 === count( $parts ) && $parts[0] === $name ) {
					return rawurldecode( $parts[1] );
				}
			}

			return '';
		}

		/**
		 * Logs a message to WP-CLI when available, or the PHP error log.
		 *
		 * @since 7.4.0
		 *
		 * @param string $message Message to log.
		 */
		private function log( string $message ): void {
			if ( defined( 'WP_CLI' ) && WP_CLI && class_exists( 'WP_CLI' ) ) {
				WP_CLI::log( '[wp-sync-ws] ' . $message );
				return;
			}

			// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			error_log( '[wp-sync-ws] ' . $message );
		}
	}
}
