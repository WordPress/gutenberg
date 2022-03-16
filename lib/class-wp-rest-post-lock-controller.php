<?php
/**
 * REST API: WP_REST_Post_Lock_Controller class
 *
 * @package    WordPress
 * @subpackage REST_API
 */

/**
 * Core class used to manage post locks.
 *
 * @see WP_REST_Controller
 */
class WP_REST_Post_Lock_Controller extends WP_REST_Controller {
	/**
	 * Post type.
	 *
	 * @var string
	 */
	private $post_type;

	/**
	 * Parent controller.
	 *
	 * @var WP_REST_Controller
	 */
	private $parent_controller;

	/**
	 * The base of the parent controller's route.
	 *
	 * @var string
	 */
	private $parent_base;

	/**
	 * Whether the controller supports batching.
	 *
	 * @var array
	 */
	protected $allow_batch = array( 'v1' => true );

	/**
	 * Constructor.
	 *
	 * @param string $post_type Post type.
	 */
	public function __construct( $post_type ) {
		$this->post_type         = $post_type;
		$this->rest_base         = 'lock';
		$post_type_object        = get_post_type_object( $post_type );
		$this->parent_base       = ! empty( $post_type_object->rest_base ) ? $post_type_object->rest_base : $post_type_object->name;
		$this->namespace         = ! empty( $post_type_object->rest_namespace ) ? $post_type_object->rest_namespace : 'wp/v2';
		$this->parent_controller = $post_type_object->get_rest_controller();

		if ( ! $this->parent_controller ) {
			$this->parent_controller = new WP_REST_Posts_Controller( $post_type );
		}
	}

	/**
	 * Registers the routes for post locking.
	 *
	 *
	 * @see register_rest_route()
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->parent_base . '/(?P<id>[\d]+)/' . $this->rest_base,
			array(
				'args'        => array(
					'id' => array(
						'description' => __( 'Unique identifier for the post.', 'gutenberg' ),
						'type'        => 'integer',
					),
				),
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
					'args'                => array(
						'context' => $this->get_context_param( array( 'default' => 'view' ) ),
					),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_item' ),
					'permission_callback' => array( $this, 'update_item_permissions_check' ),
					'args'                => $this->get_endpoint_args_for_item_schema( WP_REST_Server::EDITABLE ),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_item' ),
					'permission_callback' => array( $this, 'delete_item_permissions_check' ),
					'args'                => $this->get_endpoint_args_for_item_schema( WP_REST_Server::DELETABLE ),
				),
				'allow_batch' => $this->allow_batch,
				'schema'      => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * Retrieves a single lock.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_item( $request ) {
		$lock = $this->get_lock( $request['id'] );
		if ( is_wp_error( $lock ) ) {
			return $lock;
		}

		$data = $this->prepare_item_for_response( $lock, $request );

		return rest_ensure_response( $data );
	}

	/**
	 * Update post lock
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success.
	 */
	public function update_item( $request ) {
		if ( ! function_exists( 'wp_set_post_lock' ) ) {
			require_once ABSPATH . 'wp-admin/includes/post.php';
		}

		$post_id = $request['id'];

		wp_set_post_lock( $post_id );
		$lock = $this->get_lock( $post_id );
		if ( is_wp_error( $lock ) ) {
			return $lock;
		}

		return $this->prepare_item_for_response( $lock, $request );
	}

	/**
	 * Delete post lock.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return WP_REST_Response Response object on success.
	 */
	public function delete_item( $request ) {
		$post_id = $request['id'];

		$lock = $this->get_lock( $post_id );
		$data = array();
		if ( ! is_wp_error( $lock ) ) {
			$previous = $this->prepare_item_for_response( $lock, $request );
			$data     = $previous->get_data();
		}

		$result   = delete_post_meta( $post_id, '_edit_lock' );
		$response = new WP_REST_Response();
		$response->set_data(
			array(
				'deleted'  => $result,
				'previous' => $data,
			)
		);

		return $response;
	}

	/**
	 * Prepare a post lock it's output in an API response.
	 *
	 * @param array           $item Post lock array.
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function prepare_item_for_response( $item, $request ) {
		$fields = $this->get_fields_for_response( $request );

		$data = array();

		if ( rest_is_field_included( 'id', $fields ) ) {
			$data['id'] = (int) $item['post_id'];
		}

		if ( rest_is_field_included( 'date', $fields ) ) {
			$data['date'] = $this->prepare_date_response( $item['time'] );
		}

		if ( rest_is_field_included( 'author', $fields ) ) {
			$data['author'] = (int) $item['user'];
		}

		$context = ! empty( $request['context'] ) ? $request['context'] : 'view';
		$data    = $this->add_additional_fields_to_object( $data, $request );
		$data    = $this->filter_response_by_context( $data, $context );

		// Wrap the data in a response object.
		$response = rest_ensure_response( $data );

		$links = $this->prepare_links( $item );
		$response->add_links( $links );

		/**
		 * Filters a post lock before it is inserted via the REST API.
		 *
		 * The dynamic portion of the hook name, `$this->post_type`, refers to the post type slug.
		 *
		 * @param WP_REST_Response $response The response object.
		 * @param Array            $item     Lock object.
		 * @param WP_REST_Request  $request  Request object.
		 */
		return apply_filters( "rest_prepare_{$this->post_type}_lock", $response, $item, $request );
	}

	/**
	 * Permission check.
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool|WP_Error
	 */
	protected function permissions_check( $request ) {
		$post = $this->get_post( $request['id'] );
		if ( is_wp_error( $post ) ) {
			return $post;
		}

		return $this->parent_controller->update_item_permissions_check( $request );
	}

	/**
	 * Checks if a given request has access to read a lock.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return true|WP_Error True if the request has read access for the item, WP_Error object otherwise.
	 */
	public function get_item_permissions_check( $request ) {
		return $this->permissions_check( $request );
	}

	/**
	 * Checks if a given request has access to update a lock.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return true|WP_Error True if the request has access to update the item, WP_Error object otherwise.
	 */
	public function update_item_permissions_check( $request ) {
		return $this->permissions_check( $request );
	}

	/**
	 * Checks if a given request has access to delete a lock.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return true|WP_Error True if the request has access to delete the item, WP_Error object otherwise.
	 */
	public function delete_item_permissions_check( $request ) {
		$result = $this->permissions_check( $request );
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		$post_id = $request['id'];

		$lock = $this->get_lock( $post_id );

		if ( is_wp_error( $lock ) ) {
			return $lock;
		}

		if ( is_array( $lock ) && isset( $lock['user'] ) && get_current_user_id() !== (int) $lock['user'] ) {
			return new WP_Error(
				'rest_cannot_delete_others_lock',
				__( 'Sorry, you are not allowed delete others lock.', 'gutenberg' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Prepares links for the request.
	 *
	 * @param array $lock Lock object.
	 *
	 * @return array Links for the given post.
	 */
	protected function prepare_links( $lock ) {
		$self = sprintf( '%s/%s/%d/%s', $this->namespace, $this->parent_base, $lock['post_id'], $this->rest_base );

		// Entity meta.
		$links = array(
			'self'   => array(
				'href' => rest_url( $self ),
			),
			'author' => array(
				'href'       => rest_url( 'wp/v2/users/' . $lock['user'] ),
				'embeddable' => true,
			),
			'up'     => array(
				'href'       => rest_url( rest_get_route_for_post( $lock['post_id'] ) ),
				'embeddable' => true,
			),
		);

		return $links;
	}

	/**
	 * Get post lock.
	 *
	 * @param int $post_id Post id.
	 *
	 * @return array|WP_Error Post lock array or WP_Error.
	 */
	protected function get_lock( $post_id ) {
		$post = $this->get_post( $post_id );
		if ( is_wp_error( $post ) ) {
			return $post;
		}

		$lock = get_post_meta( $post->ID, '_edit_lock', true );
		if ( ! $lock ) {
			return new WP_Error(
				'rest_invalid_lock',
				__( 'Invalid lock.', 'gutenberg' ),
				array( 'status' => 404 )
			);
		}

		$lock = explode( ':', $lock );
		$user = isset( $lock[1] ) ? $lock[1] : get_post_meta( $post->ID, '_edit_last', true );

		if ( ! get_userdata( $user ) ) {
			return new WP_Error(
				'rest_invalid_user',
				__( 'Invalid user.', 'gutenberg' ),
				array( 'status' => 404 )
			);
		}

		$time = (int) $lock[0];

		/** This filter is documented in wp-admin/includes/ajax-actions.php */
		$time_window = apply_filters( 'wp_check_post_lock_window', 150 );

		if ( $time && $time > time() - $time_window ) {
			return compact( 'time', 'user', 'post_id' );
		}

		return new WP_Error(
			'rest_expired_lock',
			__( 'Expired lock', 'gutenberg' ),
			array( 'status' => 404 )
		);
	}

	/**
	 * Get the post, if the ID is valid.
	 *
	 * @param int $id Supplied ID.
	 *
	 * @return WP_Post|WP_Error Post object if ID is valid, WP_Error otherwise.
	 */
	protected function get_post( $id ) {
		$error = new WP_Error(
			'rest_post_invalid_id',
			__( 'Invalid post ID.', 'gutenberg' ),
			array( 'status' => 404 )
		);

		if ( (int) $id <= 0 ) {
			return $error;
		}

		$post = get_post( (int) $id );
		if ( empty( $post ) || empty( $post->ID ) || $this->post_type !== $post->post_type ) {
			return $error;
		}

		return $post;
	}

	/**
	 * Format date.
	 *
	 * @param string $time Time stamp.
	 *
	 * @return string
	 */
	protected function prepare_date_response( $time ) {
		return mysql_to_rfc3339( gmdate( 'Y-m-d H:i:s', $time ) ); // phpcs:ignore PHPCompatibility.Extensions.RemovedExtensions.mysql_DeprecatedRemoved
	}

	/**
	 * Retrieves the post's schema, conforming to JSON Schema.
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		if ( $this->schema ) {
			return $this->add_additional_fields_schema( $this->schema );
		}

		$schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'lock',
			'type'       => 'object',
			'properties' => array(
				'date'   => array(
					'description' => __( 'The date the lock expires', 'gutenberg' ),
					'type'        => 'string',
					'format'      => 'date-time',
					'context'     => array( 'view', 'edit', 'embed' ),
				),
				'id'     => array(
					'description' => __( 'Unique identifier for the post.', 'gutenberg' ),
					'type'        => 'integer',
					'context'     => array( 'view', 'edit', 'embed' ),
					'readonly'    => true,
				),
				'author' => array(
					'description' => __( 'The ID for the author of the lock.', 'gutenberg' ),
					'type'        => 'integer',
					'context'     => array( 'view', 'edit', 'embed' ),
				),
			),
		);

		$this->schema = $schema;

		return $this->add_additional_fields_schema( $this->schema );
	}
}
