<?php
/**
 * WP_HTTP_Long_Polling_Sync_Server class
 *
 * @package gutenberg
 */

if ( ! class_exists( 'WP_HTTP_Long_Polling_Sync_Server' ) ) {

	/**
	 * HTTP long-polling transport: the short-polling server, but the request
	 * is HELD OPEN (up to a bounded budget) when there is nothing to deliver,
	 * so a caught-up client receives remote updates promptly without tight
	 * polling. Requests that CARRY updates are answered immediately, so
	 * outgoing latency stays low.
	 *
	 * It shares the parent's routes' request/response shape, permissions, and
	 * — crucially — drives rooms through the SAME WP_Sync_Engine seam. The
	 * "is anything waiting for this client?" peek goes through the engine's
	 * `get_updates_since`, so the transport stays engine-agnostic (intent-log
	 * and yjs-relay both work unchanged).
	 *
	 * Capacity note: each held request occupies a PHP worker for up to the
	 * wait budget. Deployments enabling this transport must size worker pools
	 * for roughly one held request per active collaborator on top of regular
	 * traffic, or held requests can starve the pool. `connection_aborted()`
	 * only reports an abort once PHP writes output, which never happens in the
	 * wait loop, so abandoned requests generally run out their full budget.
	 *
	 * @since 7.2.0
	 * @access private
	 */
	class WP_HTTP_Long_Polling_Sync_Server extends WP_HTTP_Polling_Sync_Server {
		/**
		 * Transport slug.
		 *
		 * @since 7.2.0
		 * @var string
		 */
		const TRANSPORT_SLUG = 'http-long-polling';

		/**
		 * Default maximum time (ms) a long-poll request is held open.
		 *
		 * @since 7.2.0
		 * @var int
		 */
		const DEFAULT_MAX_WAIT_MS = 20000;

		/**
		 * Interval (ms) between storage re-checks while waiting.
		 *
		 * @since 7.2.0
		 * @var int
		 */
		const WAIT_POLL_INTERVAL_MS = 500;

		/**
		 * Headroom (s) reserved from max_execution_time so the response can be
		 * produced after the wait loop ends.
		 *
		 * @since 7.2.0
		 * @var int
		 */
		const EXECUTION_TIME_HEADROOM_S = 5;

		/**
		 * The transport slug.
		 *
		 * @since 7.2.0
		 *
		 * @return string Slug.
		 */
		public function get_slug(): string {
			return self::TRANSPORT_SLUG;
		}

		/**
		 * Registers only the long-poll route. The regular polling route is
		 * registered by its own transport; clients choose which to use.
		 *
		 * @since 7.2.0
		 *
		 * @return void
		 */
		public function register_routes(): void {
			register_rest_route(
				self::REST_NAMESPACE,
				'/long-poll',
				array(
					'methods'             => array( WP_REST_Server::CREATABLE ),
					'callback'            => array( $this, 'handle_request' ),
					'permission_callback' => array( $this, 'check_permissions' ),
					'validate_callback'   => array( $this, 'validate_request' ),
					'args'                => $this->get_route_args(),
				)
			);
		}

		/**
		 * Handles a long-poll request: incoming updates are processed and
		 * answered exactly like the polling endpoint; an empty, caught-up
		 * request is held open until updates arrive for any requested room,
		 * the client disconnects, or the wait budget is exhausted.
		 *
		 * @since 7.2.0
		 *
		 * @param WP_REST_Request $request The REST request.
		 * @return WP_REST_Response|WP_Error Response object or error.
		 */
		public function handle_request( WP_REST_Request $request ) {
			$rooms = $request['rooms'];

			$has_incoming_updates = false;
			foreach ( (array) $rooms as $room_request ) {
				if ( ! empty( $room_request['updates'] ) ) {
					$has_incoming_updates = true;
					break;
				}
			}

			// Process incoming updates and awareness exactly as the parent
			// does (ingest + first read).
			$response = parent::handle_request( $request );

			/*
			 * Senders are never delayed: if the request carried updates, or
			 * this client already has data waiting, respond now.
			 */
			if ( is_wp_error( $response ) || $has_incoming_updates || $this->response_has_updates( $response ) ) {
				return $response;
			}

			// Snapshot the awareness maps so peer joins/leaves/cursor moves
			// also end the wait.
			$initial_awareness = array();
			foreach ( (array) $response->get_data()['rooms'] as $room_response ) {
				$initial_awareness[ $room_response['room'] ] = $room_response['awareness'];
			}

			$deadline = microtime( true ) + ( $this->get_max_wait_ms() / 1000 );
			while ( true ) {
				$remaining_ms = ( $deadline - microtime( true ) ) * 1000;
				if ( $remaining_ms <= 0 ) {
					break;
				}
				// Never oversleep the deadline (keeps a short wait budget
				// honest, e.g. under test).
				usleep( (int) ( min( self::WAIT_POLL_INTERVAL_MS, $remaining_ms ) * 1000 ) );

				// Best-effort abort detection (see the class docblock).
				if ( connection_aborted() ) {
					break;
				}

				if ( $this->rooms_have_new_data( $rooms, $initial_awareness ) ) {
					break;
				}
			}

			/*
			 * Re-run the parent handler so awareness is re-merged (refreshing
			 * this client's timestamp, expiring stale peers) and the response
			 * reflects updates that arrived during the wait. This branch
			 * carried no updates, so re-processing is side-effect-safe.
			 */
			return parent::handle_request( $request );
		}

		/**
		 * Whether any requested room has new updates for the client or a
		 * changed awareness map since the wait began. The update check goes
		 * through the room's ENGINE so the peek matches what a read would
		 * actually deliver (engine-agnostic).
		 *
		 * @since 7.2.0
		 *
		 * @param array $rooms             Room requests.
		 * @param array $initial_awareness Awareness maps at wait start, keyed by room.
		 * @return bool True when something new is waiting.
		 */
		protected function rooms_have_new_data( array $rooms, array $initial_awareness ): bool {
			foreach ( $rooms as $room_request ) {
				$room      = $room_request['room'];
				$client_id = (int) $room_request['client_id'];
				$cursor    = (int) $room_request['after'];
				$engine    = $this->engines->get_engine_for_room( $room );

				$result = $engine->get_updates_since( $room, $client_id, $cursor, array() );
				if ( ! empty( $result['updates'] ) ) {
					return true;
				}

				// phpcs:ignore Universal.Operators.StrictComparisons.LooseNotEqual -- Order-insensitive comparison intended.
				if ( $this->storage->get_awareness_state( $room ) != ( $initial_awareness[ $room ] ?? array() ) ) {
					return true;
				}
			}
			return false;
		}

		/**
		 * Whether a sync response contains updates for any room.
		 *
		 * @since 7.2.0
		 *
		 * @param WP_REST_Response $response Sync response.
		 * @return bool True if any room has updates.
		 */
		protected function response_has_updates( WP_REST_Response $response ): bool {
			$data = $response->get_data();
			if ( ! isset( $data['rooms'] ) || ! is_array( $data['rooms'] ) ) {
				return false;
			}
			foreach ( $data['rooms'] as $room_response ) {
				if ( ! empty( $room_response['updates'] ) ) {
					return true;
				}
			}
			return false;
		}

		/**
		 * The wait budget (ms), filterable via `wp_sync_long_poll_max_wait_ms`
		 * and capped against PHP's max_execution_time (with headroom) so the
		 * request never dies mid-wait. Raises the execution limit when it can.
		 *
		 * @since 7.2.0
		 *
		 * @return int Maximum wait time in milliseconds.
		 */
		protected function get_max_wait_ms(): int {
			/**
			 * Filters the maximum time (ms) a long-poll request is held open.
			 *
			 * @since 7.2.0
			 *
			 * @param int $max_wait_ms Maximum wait time in milliseconds.
			 */
			$max_wait_ms = max( 0, (int) apply_filters( 'wp_sync_long_poll_max_wait_ms', self::DEFAULT_MAX_WAIT_MS ) );

			$max_execution_time = (int) ini_get( 'max_execution_time' );
			if ( $max_execution_time > 0 && function_exists( 'set_time_limit' ) ) {
				$needed_s = (int) ceil( $max_wait_ms / 1000 ) + self::EXECUTION_TIME_HEADROOM_S;
				if ( $needed_s > $max_execution_time && @set_time_limit( $needed_s ) ) { // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
					$max_execution_time = $needed_s;
				}
				$budget_ms = ( $max_execution_time - self::EXECUTION_TIME_HEADROOM_S ) * 1000;
				if ( $budget_ms > 0 ) {
					$max_wait_ms = min( $max_wait_ms, $budget_ms );
				}
			}

			return $max_wait_ms;
		}
	}
}
