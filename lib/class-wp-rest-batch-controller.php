<?php
/**
 * REST API: WP_REST_Batch_Controller class
 *
 * @package    Gutenberg
 * @subpackage REST_API
 */

/**
 * Core class used to perform abtch requests.
 *
 * @see WP_REST_Controller
 */
class WP_REST_Batch_Controller {

	/** @var WP_REST_Server */
	private $server;

	/**
	 * Constructor.
	 *
	 * @since 9.0.0
	 */
	public function __construct() {
		$this->server = rest_get_server();
	}

	/**
	 * Registers the REST API route.
	 *
	 * @since 9.0.0
	 */
	public function register_routes() {
		register_rest_route(
			'__experimental',
			'batch',
			array(
				'callback'            => array( $this, 'serve_batch_request' ),
				'permission_callback' => '__return_true',
				'methods'             => array( 'POST', 'PUT', 'PATCH', 'DELETE' ),
				'args'                => array(
					'validation' => array(
						'type'    => 'string',
						'enum'    => array( 'require-all-validate', 'normal' ),
						'default' => 'normal',
					),
					'requests'   => array(
						'required' => true,
						'type'     => 'array',
						'maxItems' => 25,
						'items'    => array(
							'type'       => 'object',
							'properties' => array(
								'path'    => array(
									'type'     => 'string',
									'required' => true,
								),
								'body'    => array(
									'type'                 => 'object',
									'properties'           => array(),
									'additionalProperties' => true,
								),
								'headers' => array(
									'type'                 => 'object',
									'properties'           => array(),
									'additionalProperties' => array(
										'type'  => array( 'string', 'array' ),
										'items' => array(
											'type' => 'string',
										),
									),
								),
							),
						),
					),
				),
			)
		);
	}

	/**
	 * Serves the batch request.
	 *
	 * @since 9.0.0
	 *
	 * @param WP_REST_Request $batch_request The batch request object.
	 * @return WP_REST_Response
	 */
	public function serve_batch_request( WP_REST_Request $batch_request ) {
		$requests = array();

		foreach ( $batch_request['requests'] as $args ) {
			$parsed_url = wp_parse_url( $args['path'] );

			if ( false === $parsed_url ) {
				$requests[] = new WP_Error( 'parse_path_failed', __( 'Could not parse the path.', 'gutenberg' ), array( 'status' => 400 ) );

				continue;
			}

			$single_request = new WP_REST_Request( $batch_request->get_method(), $parsed_url['path'] );

			if ( ! empty( $parsed_url['query'] ) ) {
				wp_parse_str( $parsed_url['query'], $query_args );
				$single_request->set_query_params( $query_args );
			}

			if ( ! empty( $args['body'] ) ) {
				$single_request->set_body_params( $args['body'] );
			}

			$requests[] = $single_request;
		}

		if ( ! method_exists( $this->server, 'match_request_to_handler' ) ) {
			return $this->polyfill_batching( $requests );
		}

		$matches    = array();
		$validation = array();
		$has_error  = false;

		foreach ( $requests as $single_request ) {
			$match     = $this->server->match_request_to_handler( $single_request );
			$matches[] = $match;
			$error     = null;

			if ( is_wp_error( $match ) ) {
				$error = $match;
			}

			if ( ! $error ) {
				list( $route, $handler ) = $match;

				if ( isset( $handler['allow_batch'] ) ) {
					$allow_batch = $handler['allow_batch'];
				} else {
					$allow_batch = ! empty( $this->server->get_route_options( $route )['allow_batch'] );
				}

				if ( ! $allow_batch ) {
					$error = new WP_Error(
						'rest_batch_not_allowed',
						__( 'The requested route does not support batch requests.', 'gutenberg' ),
						array( 'status' => 400 )
					);
				}
			}

			if ( ! $error ) {
				$check_required = $single_request->has_valid_params();
				if ( is_wp_error( $check_required ) ) {
					$error = $check_required;
				}
			}

			if ( ! $error ) {
				$check_sanitized = $single_request->sanitize_params();
				if ( is_wp_error( $check_sanitized ) ) {
					$error = $check_sanitized;
				}
			}

			if ( $error ) {
				$has_error    = true;
				$validation[] = $error;
			} else {
				$validation[] = true;
			}
		}

		$responses = array();

		if ( $has_error && 'require-all-validate' === $batch_request['validation'] ) {
			foreach ( $validation as $valid ) {
				if ( is_wp_error( $valid ) ) {
					$responses[] = $this->server->envelope_response( $this->error_to_response( $valid ), false )->get_data();
				} else {
					$responses[] = null;
				}
			}

			return new WP_REST_Response(
				array(
					'failed'    => 'validation',
					'responses' => $responses,
				),
				WP_Http::MULTI_STATUS
			);
		}

		foreach ( $requests as $i => $batch_request ) {
			$clean_request = clone $batch_request;
			$clean_request->set_url_params( array() );
			$clean_request->set_attributes( array() );
			$clean_request->set_default_params( array() );

			/** This filter is documented in wp-includes/rest-api/class-wp-rest-server.php */
			$result = apply_filters( 'rest_pre_dispatch', null, $this->server, $clean_request );

			if ( empty( $result ) ) {
				$match = $matches[ $i ];
				$error = null;

				if ( is_wp_error( $validation[ $i ] ) ) {
					$error = $validation[ $i ];
				}

				if ( is_wp_error( $match ) ) {
					$result = $this->error_to_response( $match );
				} else {
					list( $route, $handler ) = $match;

					if ( ! $error && ! is_callable( $handler['callback'] ) ) {
						$error = new WP_Error(
							'rest_invalid_handler',
							__( 'The handler for the route is invalid' ),
							array( 'status' => 500 )
						);
					}

					$result = $this->server->respond_to_request( $batch_request, $route, $handler, $error );
				}
			}

			/** This filter is documented in wp-includes/rest-api/class-wp-rest-server.php */
			$result = apply_filters( 'rest_post_dispatch', rest_ensure_response( $result ), $this->server, $batch_request );

			$responses[] = $this->server->envelope_response( $result, false )->get_data();
		}

		return new WP_REST_Response( array( 'responses' => $responses ), WP_Http::MULTI_STATUS );
	}

	/**
	 * Polyfills a simple form of batching for compatibility for non-trunk installs.
	 *
	 * @since 9.0.0
	 *
	 * @param WP_REST_Request[] $requests The list of requests to perform.
	 * @return WP_REST_Response The response object.
	 */
	protected function polyfill_batching( $requests ) {
		$responses = array();

		foreach ( $requests as $request ) {
			if ( 0 !== strpos( $request->get_route(), '/__experimental' ) ) {
				$error       = new WP_Error(
					'rest_batch_not_allowed',
					__( 'The requested route does not support batch requests.', 'gutenberg' ),
					array( 'status' => 400 )
				);
				$responses[] = $this->server->envelope_response( $this->error_to_response( $error ), false )->get_data();
				continue;
			}

			$result = $this->server->dispatch( $request );
			/** This filter is documented in wp-includes/rest-api/class-wp-rest-server.php */
			$result = apply_filters( 'rest_post_dispatch', rest_ensure_response( $result ), $this->server, $request );

			$responses[] = $this->server->envelope_response( $result, false )->get_data();
		}

		return new WP_REST_Response( array( 'responses' => $responses ), WP_Http::MULTI_STATUS );
	}

	/**
	 * Converts an error to a response object.
	 *
	 * @see   WP_REST_Server::error_to_response() This is a temporary copy of that method due to visibility.
	 *
	 * @since 9.0.0
	 *
	 * @param WP_Error $error WP_Error instance.
	 * @return WP_REST_Response List of associative arrays with code and message keys.
	 */
	protected function error_to_response( $error ) {
		$error_data = $error->get_error_data();

		if ( is_array( $error_data ) && isset( $error_data['status'] ) ) {
			$status = $error_data['status'];
		} else {
			$status = 500;
		}

		$errors = array();

		foreach ( (array) $error->errors as $code => $messages ) {
			foreach ( (array) $messages as $message ) {
				$errors[] = array(
					'code'    => $code,
					'message' => $message,
					'data'    => $error->get_error_data( $code ),
				);
			}
		}

		$data = $errors[0];
		if ( count( $errors ) > 1 ) {
			// Remove the primary error.
			array_shift( $errors );
			$data['additional_errors'] = $errors;
		}

		$response = new WP_REST_Response( $data, $status );

		return $response;
	}
}
