<?php
/**
 * WP_HTTP_Long_Polling_Sync_Server class
 *
 * @package gutenberg
 */

if ( ! class_exists( 'WP_HTTP_Polling_Sync_Server' ) ) {
	require_once __DIR__ . '/class-wp-http-polling-sync-server.php';
}

if ( ! class_exists( 'WP_HTTP_Long_Polling_Sync_Server' ) ) {

	/**
	 * HTTP long-polling variant of the collaborative editing sync server.
	 *
	 * Shares the request/response shape, permission checks, and update
	 * processing of the polling server, but holds the request open (up to a
	 * bounded wait budget) when there is nothing to deliver, so clients
	 * receive remote updates with low latency without tight polling.
	 *
	 * Requests that carry updates are never delayed: they are processed and
	 * answered immediately so outgoing latency stays low.
	 *
	 * Capacity note: each held request occupies a PHP worker (e.g. a PHP-FPM
	 * child) for up to the wait budget. Deployments enabling this transport
	 * must size their worker pools for roughly one held request per active
	 * collaborator on top of regular traffic; otherwise held requests can
	 * starve the pool.
	 *
	 * Abort note: connection_aborted() only detects a closed connection when
	 * PHP attempts to write output, and this loop never writes until it
	 * finishes. In practice abandoned requests (closed tabs, client aborts)
	 * run out their full wait budget before the worker is released.
	 *
	 * @since 7.4.0
	 * @access private
	 */
	class WP_HTTP_Long_Polling_Sync_Server extends WP_HTTP_Polling_Sync_Server {
		/**
		 * Default maximum time (in milliseconds) a long-poll request is held
		 * open waiting for updates.
		 *
		 * @since 7.4.0
		 * @var int
		 */
		const DEFAULT_MAX_WAIT_MS = 20000;

		/**
		 * Interval (in milliseconds) between storage re-checks while waiting.
		 *
		 * @since 7.4.0
		 * @var int
		 */
		const WAIT_POLL_INTERVAL_MS = 500;

		/**
		 * Headroom (in seconds) reserved from max_execution_time so the
		 * response can be produced after the wait loop ends.
		 *
		 * @since 7.4.0
		 * @var int
		 */
		const EXECUTION_TIME_HEADROOM_S = 5;

		/**
		 * Registers REST API routes.
		 *
		 * Registers only the long-poll route. The regular polling route is
		 * registered by the parent server instance in the collaboration
		 * bootstrap; clients choose which transport to use.
		 *
		 * @since 7.4.0
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
		 * Handles a long-poll request.
		 *
		 * Incoming updates are processed exactly like the polling endpoint and
		 * answered immediately. When the request carries no updates and the
		 * client is fully caught up, the request is held open until new
		 * updates arrive for any requested room, the client disconnects, or
		 * the wait budget is exhausted.
		 *
		 * @since 7.4.0
		 *
		 * @param WP_REST_Request $request The REST request.
		 * @return WP_REST_Response|WP_Error Response object or error.
		 */
		public function handle_request( WP_REST_Request $request ) {
			$rooms = $request['rooms'];

			$has_incoming_updates = false;
			foreach ( $rooms as $room_request ) {
				if ( ! empty( $room_request['updates'] ) ) {
					$has_incoming_updates = true;
					break;
				}
			}

			// Process incoming updates and awareness exactly as the parent does.
			$response = parent::handle_request( $request );

			/*
			 * Senders must never be delayed: if the request carried updates,
			 * or anything is already waiting for this client, respond now.
			 */
			if ( is_wp_error( $response ) || $has_incoming_updates || $this->response_has_updates( $response ) ) {
				return $response;
			}

			// Snapshot the awareness maps returned above so peer joins,
			// leaves, and cursor moves also end the wait.
			$initial_awareness = array();
			$response_data     = $response->get_data();
			foreach ( $response_data['rooms'] as $room_response ) {
				$initial_awareness[ $room_response['room'] ] = $room_response['awareness'];
			}

			$max_wait_ms = $this->get_max_wait_ms();
			$deadline    = microtime( true ) + ( $max_wait_ms / 1000 );

			while ( microtime( true ) < $deadline ) {
				usleep( self::WAIT_POLL_INTERVAL_MS * 1000 );

				/*
				 * Best-effort: connection_aborted() generally only reports
				 * an abort after PHP tries to write output, which never
				 * happens inside this loop, so abandoned requests usually
				 * wait out the full budget (see the class docblock).
				 */
				if ( connection_aborted() ) {
					break;
				}

				$has_new_data = false;
				foreach ( $rooms as $room_request ) {
					$room = $room_request['room'];

					if ( $this->core->has_updates_for_client( $room, $room_request['client_id'], $room_request['after'] ) ) {
						$has_new_data = true;
						break;
					}

					// phpcs:ignore Universal.Operators.StrictComparisons.LooseNotEqual -- Order-insensitive array comparison is intended.
					if ( $this->core->get_current_awareness_map( $room ) != ( $initial_awareness[ $room ] ?? array() ) ) {
						$has_new_data = true;
						break;
					}
				}

				if ( $has_new_data ) {
					break;
				}
			}

			/*
			 * Re-run the parent handler so awareness is re-merged (refreshing
			 * this client's timestamp and expiring stale peers) and the
			 * response reflects any updates that arrived during the wait. The
			 * request carries no updates in this branch, so re-processing is
			 * side-effect-safe.
			 */
			return parent::handle_request( $request );
		}

		/**
		 * Checks whether a sync response contains updates for any room.
		 *
		 * @since 7.4.0
		 *
		 * @param WP_REST_Response $response Sync response.
		 * @return bool True if any room in the response has updates.
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
		 * Gets the maximum wait budget in milliseconds.
		 *
		 * The default budget is filterable via `wp_sync_long_poll_max_wait_ms`
		 * and additionally capped against PHP's max_execution_time (with
		 * headroom) so the request never dies mid-wait. When possible, the
		 * execution time limit is raised to cover the wait budget.
		 *
		 * @since 7.4.0
		 *
		 * @return int Maximum wait time in milliseconds.
		 */
		protected function get_max_wait_ms(): int {
			/**
			 * Filters the maximum time (in milliseconds) a long-poll sync
			 * request is held open waiting for updates.
			 *
			 * @since 7.4.0
			 *
			 * @param int $max_wait_ms Maximum wait time in milliseconds.
			 */
			$max_wait_ms = (int) apply_filters( 'wp_sync_long_poll_max_wait_ms', self::DEFAULT_MAX_WAIT_MS );
			$max_wait_ms = max( 0, $max_wait_ms );

			$max_execution_time = (int) ini_get( 'max_execution_time' );
			if ( $max_execution_time > 0 && function_exists( 'set_time_limit' ) ) {
				/*
				 * Try to raise the limit so the wait plus response fits with
				 * headroom. set_time_limit() also restarts the timer, so time
				 * spent before this point no longer counts against the budget.
				 */
				$target_execution_time = (int) ceil( $max_wait_ms / 1000 ) + self::EXECUTION_TIME_HEADROOM_S;
				set_time_limit( max( $target_execution_time, $max_execution_time ) );
				$max_execution_time = (int) ini_get( 'max_execution_time' );
			}

			if ( $max_execution_time > 0 ) {
				$headroom_ms = ( $max_execution_time - self::EXECUTION_TIME_HEADROOM_S ) * 1000;
				$max_wait_ms = max( 0, min( $max_wait_ms, $headroom_ms ) );
			}

			return $max_wait_ms;
		}
	}
}
