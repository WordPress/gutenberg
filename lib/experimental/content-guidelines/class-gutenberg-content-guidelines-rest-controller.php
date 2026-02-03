<?php
/**
 * Content Guidelines REST API Controller.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

/**
 * REST API controller for Content Guidelines.
 */
class Gutenberg_Content_Guidelines_REST_Controller extends WP_REST_Controller {

	/**
	 * Post type.
	 *
	 * @var string
	 */
	protected $post_type = 'wp_guidelines';

	/**
	 * JSON encoding flags for consistent and secure encoding.
	 *
	 * - JSON_UNESCAPED_SLASHES: Prevents escaping forward slashes (cleaner output)
	 * - JSON_HEX_TAG: Encodes < and > as \u003C and \u003E (XSS prevention)
	 * - JSON_HEX_AMP: Encodes & as \u0026 (XSS prevention)
	 *
	 * @var int
	 */
	protected $json_encode_flags = JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP;

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = 'wp/v2';
		$this->rest_base = 'content-guidelines';
	}

	/**
	 * Registers the routes for the objects of the controller.
	 */
	public function register_routes() {

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
					'args'                => array(
						'category' => array(
							'description'       => __( 'Limit response to a specific guideline category.', 'gutenberg' ),
							'type'              => 'string',
							'enum'              => array( 'copy', 'images', 'site', 'blocks', 'other' ),
							'sanitize_callback' => 'sanitize_text_field',
						),
						'status'   => array(
							'description'       => __( 'Limit response to guidelines with a specific status.', 'gutenberg' ),
							'type'              => 'string',
							'enum'              => array( 'draft', 'published' ),
							'sanitize_callback' => 'sanitize_text_field',
						),
					),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_item' ),
					'permission_callback' => array( $this, 'create_item_permissions_check' ),
					'args'                => $this->get_endpoint_args_for_item_schema( WP_REST_Server::CREATABLE ),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item_by_id' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
					'args'                => array(
						'id' => array(
							'description' => __( 'Unique identifier for the guidelines.', 'gutenberg' ),
							'type'        => 'integer',
						),
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
					'args'                => array(
						'id' => array(
							'description' => __( 'Unique identifier for the guidelines.', 'gutenberg' ),
							'type'        => 'integer',
						),
					),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);

		// Revisions route.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)/revisions',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_revisions' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
					'args'                => array(
						'id'       => array(
							'description' => __( 'Unique identifier for the guidelines.', 'gutenberg' ),
							'type'        => 'integer',
						),
						'page'     => array(
							'description' => __( 'Current page of the revisions collection.', 'gutenberg' ),
							'type'        => 'integer',
							'default'     => 1,
							'minimum'     => 1,
						),
						'per_page' => array(
							'description' => __( 'Maximum number of revisions to be returned per page.', 'gutenberg' ),
							'type'        => 'integer',
							'default'     => 5,
							'minimum'     => 1,
							'maximum'     => 100,
						),
					),
				),
			)
		);

		// Single revision route.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)/revisions/(?P<revision_id>[\d]+)',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_revision' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
					'args'                => array(
						'id'          => array(
							'description' => __( 'Unique identifier for the guidelines.', 'gutenberg' ),
							'type'        => 'integer',
						),
						'revision_id' => array(
							'description' => __( 'Unique identifier for the revision.', 'gutenberg' ),
							'type'        => 'integer',
						),
					),
				),
			)
		);

		// Restore revision route.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)/revisions/(?P<revision_id>[\d]+)/restore',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'restore_revision' ),
					'permission_callback' => array( $this, 'update_item_permissions_check' ),
					'args'                => array(
						'id'          => array(
							'description' => __( 'Unique identifier for the guidelines.', 'gutenberg' ),
							'type'        => 'integer',
						),
						'revision_id' => array(
							'description' => __( 'Unique identifier for the revision to restore.', 'gutenberg' ),
							'type'        => 'integer',
						),
					),
				),
			)
		);
	}

	/**
	 * Checks if a given request has access to read guidelines.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function get_item_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( ! current_user_can( 'edit_posts' ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'Sorry, you are not allowed to view content guidelines.', 'gutenberg' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Checks if a given request has access to create guidelines.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has create access, WP_Error object otherwise.
	 */
	public function create_item_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( ! current_user_can( 'manage_options' ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'Sorry, you are not allowed to create content guidelines.', 'gutenberg' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Checks if a given request has access to update guidelines.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has update access, WP_Error object otherwise.
	 */
	public function update_item_permissions_check( $request ) {
		return $this->create_item_permissions_check( $request );
	}

	/**
	 * Checks if a given request has access to delete guidelines.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has delete access, WP_Error object otherwise.
	 */
	public function delete_item_permissions_check( $request ) {
		return $this->create_item_permissions_check( $request );
	}

	/**
	 * Gets the content guidelines.
	 *
	 * Supports query parameters:
	 * - ?status=published|draft - Filter by status
	 * - ?category=copy|images|site|blocks|other - Return only specific category
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error on failure.
	 */
	public function get_item( $request ) {
		$status_filter = $request->get_param( 'status' );
		$post          = $this->get_guidelines_post( $status_filter );

		if ( ! $post ) {
			// If filtering by status and no match, return empty response.
			if ( $status_filter ) {
				return rest_ensure_response(
					array(
						'id'                   => 0,
						'status'               => $status_filter,
						'guideline_categories' => new stdClass(),
					)
				);
			}

			return rest_ensure_response(
				array(
					'id'                   => 0,
					'status'               => 'draft',
					'guideline_categories' => new stdClass(),
				)
			);
		}

		return $this->prepare_item_for_response( $post, $request );
	}

	/**
	 * Gets the content guidelines by ID.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error on failure.
	 */
	public function get_item_by_id( $request ) {
		$post = $this->get_validated_post( $request['id'] );

		if ( ! $post ) {
			return new WP_Error(
				'rest_post_not_found',
				__( 'Content guidelines not found.', 'gutenberg' ),
				array( 'status' => 404 )
			);
		}

		return $this->prepare_item_for_response( $post, $request );
	}

	/**
	 * Creates content guidelines.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error on failure.
	 */
	public function create_item( $request ) {
		// Check if guidelines already exist.
		$existing = $this->get_guidelines_post();
		if ( $existing ) {
			return new WP_Error(
				'rest_guidelines_exists',
				__( 'Content guidelines already exist. Use PATCH to update.', 'gutenberg' ),
				array( 'status' => 400 )
			);
		}

		$prepared = $this->prepare_item_for_database( $request );

		$post_id = wp_insert_post(
			array(
				'post_type'    => $this->post_type,
				'post_status'  => isset( $prepared['status'] ) && 'published' === $prepared['status'] ? 'publish' : 'draft',
				'post_title'   => __( 'Content Guidelines', 'gutenberg' ),
				'post_content' => $this->encode_json_for_storage( $prepared['content'] ),
			),
			true
		);

		if ( is_wp_error( $post_id ) ) {
			return $post_id;
		}

		$post = get_post( $post_id );
		return $this->prepare_item_for_response( $post, $request );
	}

	/**
	 * Updates content guidelines.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error on failure.
	 */
	public function update_item( $request ) {
		$post = $this->get_validated_post( $request['id'] );

		if ( ! $post ) {
			return new WP_Error(
				'rest_post_not_found',
				__( 'Content guidelines not found.', 'gutenberg' ),
				array( 'status' => 404 )
			);
		}

		$prepared = $this->prepare_item_for_database( $request );

		// Get existing content and merge with new content.
		$existing_content = $this->decode_json_from_storage( $post->post_content );
		$new_content      = array_merge( $existing_content, $prepared['content'] );

		$update_args = array(
			'ID'           => $post->ID,
			'post_content' => $this->encode_json_for_storage( $new_content ),
		);

		if ( isset( $prepared['status'] ) ) {
			$update_args['post_status'] = 'published' === $prepared['status'] ? 'publish' : 'draft';
		}

		$result = wp_update_post( $update_args, true );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		$post = get_post( $post->ID );
		return $this->prepare_item_for_response( $post, $request );
	}

	/**
	 * Deletes content guidelines.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error on failure.
	 */
	public function delete_item( $request ) {
		$post = $this->get_validated_post( $request['id'] );

		if ( ! $post ) {
			return new WP_Error(
				'rest_post_not_found',
				__( 'Content guidelines not found.', 'gutenberg' ),
				array( 'status' => 404 )
			);
		}

		$result = wp_delete_post( $post->ID, true );

		if ( ! $result ) {
			return new WP_Error(
				'rest_cannot_delete',
				__( 'The content guidelines cannot be deleted.', 'gutenberg' ),
				array( 'status' => 500 )
			);
		}

		return rest_ensure_response(
			array(
				'deleted' => true,
				'id'      => $post->ID,
			)
		);
	}

	/**
	 * Gets revisions for the content guidelines.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error on failure.
	 */
	public function get_revisions( $request ) {
		$post = $this->get_validated_post( $request['id'] );

		if ( ! $post ) {
			return new WP_Error(
				'rest_post_not_found',
				__( 'Content guidelines not found.', 'gutenberg' ),
				array( 'status' => 404 )
			);
		}

		$page     = $request->get_param( 'page' );
		$per_page = $request->get_param( 'per_page' );
		$offset   = ( $page - 1 ) * $per_page;

		// Get total count of revisions.
		$all_revision_ids = wp_get_post_revisions(
			$post->ID,
			array(
				'fields' => 'ids',
			)
		);
		$total_items      = count( $all_revision_ids );
		$total_pages      = (int) ceil( $total_items / $per_page );

		// Get paginated revisions.
		$revisions = wp_get_post_revisions(
			$post->ID,
			array(
				'posts_per_page' => $per_page,
				'offset'         => $offset,
				'orderby'        => 'date',
				'order'          => 'DESC',
				'no_found_rows'  => true,
			)
		);

		$data = array();
		foreach ( $revisions as $revision ) {
			$author = get_user_by( 'id', $revision->post_author );
			$data[] = array(
				'id'          => $revision->ID,
				'date'        => mysql_to_rfc3339( $revision->post_date ),
				'date_gmt'    => mysql_to_rfc3339( $revision->post_date_gmt ),
				'author'      => $revision->post_author,
				'author_name' => $author ? $author->display_name : __( 'Unknown', 'gutenberg' ),
			);
		}

		$response = rest_ensure_response( $data );
		$response->header( 'X-WP-Total', $total_items );
		$response->header( 'X-WP-TotalPages', $total_pages );

		return $response;
	}

	/**
	 * Gets a single revision for the content guidelines.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error on failure.
	 */
	public function get_revision( $request ) {
		$post = $this->get_validated_post( $request['id'] );

		if ( ! $post ) {
			return new WP_Error(
				'rest_post_not_found',
				__( 'Content guidelines not found.', 'gutenberg' ),
				array( 'status' => 404 )
			);
		}

		$revision = get_post( $request['revision_id'] );

		if ( ! $revision || 'revision' !== $revision->post_type || (int) $revision->post_parent !== (int) $post->ID ) {
			return new WP_Error(
				'rest_revision_not_found',
				__( 'Revision not found.', 'gutenberg' ),
				array( 'status' => 404 )
			);
		}

		$content = $this->decode_json_from_storage( $revision->post_content );

		$author = get_user_by( 'id', $revision->post_author );

		$data = array(
			'id'                   => $revision->ID,
			'parent'               => $revision->post_parent,
			'date'                 => mysql_to_rfc3339( $revision->post_date ),
			'date_gmt'             => mysql_to_rfc3339( $revision->post_date_gmt ),
			'author'               => $revision->post_author,
			'author_name'          => $author ? $author->display_name : __( 'Unknown', 'gutenberg' ),
			'guideline_categories' => ! empty( $content['guideline_categories'] ) ? $content['guideline_categories'] : new stdClass(),
		);

		return rest_ensure_response( $data );
	}

	/**
	 * Restores a revision to the main guidelines post.
	 *
	 * Uses WordPress's native wp_restore_post_revision() function which:
	 * - Restores all revision fields (not just post_content)
	 * - Sets _edit_last post meta to current user
	 * - Fires wp_restore_post_revision action for plugin compatibility
	 * - Creates a new revision for audit trail
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error on failure.
	 */
	public function restore_revision( $request ) {
		$post = $this->get_validated_post( $request['id'] );

		if ( ! $post ) {
			return new WP_Error(
				'rest_post_not_found',
				__( 'Content guidelines not found.', 'gutenberg' ),
				array( 'status' => 404 )
			);
		}

		$revision = get_post( $request['revision_id'] );

		if ( ! $revision || 'revision' !== $revision->post_type || (int) $revision->post_parent !== (int) $post->ID ) {
			return new WP_Error(
				'rest_revision_not_found',
				__( 'Revision not found.', 'gutenberg' ),
				array( 'status' => 404 )
			);
		}

		// Use WordPress's native revision restore function.
		// This restores all fields, sets _edit_last meta, and fires hooks.
		$result = wp_restore_post_revision( $revision->ID );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		if ( ! $result ) {
			return new WP_Error(
				'rest_cannot_restore',
				__( 'Could not restore revision.', 'gutenberg' ),
				array( 'status' => 500 )
			);
		}

		// Get the updated post and return the response.
		$post = get_post( $post->ID );
		return $this->prepare_item_for_response( $post, $request );
	}

	/**
	 * Prepares a single guidelines output for response.
	 *
	 * Supports ?category query parameter to return only a specific category.
	 *
	 * @param WP_Post         $post    Post object.
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response object.
	 */
	public function prepare_item_for_response( $post, $request ) {
		$content = $this->decode_json_from_storage( $post->post_content );

		$author = get_user_by( 'id', $post->post_author );

		$guideline_categories = ! empty( $content['guideline_categories'] ) ? $content['guideline_categories'] : array();

		// Handle ?category filter - return only the requested category.
		$category_filter = $request->get_param( 'category' );
		if ( $category_filter && ! empty( $guideline_categories ) ) {
			if ( isset( $guideline_categories[ $category_filter ] ) ) {
				$guideline_categories = array(
					$category_filter => $guideline_categories[ $category_filter ],
				);
			} else {
				$guideline_categories = new stdClass();
			}
		}

		if ( empty( $guideline_categories ) ) {
			$guideline_categories = new stdClass();
		}

		$data = array(
			'id'                   => $post->ID,
			'status'               => 'publish' === $post->post_status ? 'published' : 'draft',
			'guideline_categories' => $guideline_categories,
			'date'                 => mysql_to_rfc3339( $post->post_date ),
			'date_gmt'             => mysql_to_rfc3339( $post->post_date_gmt ),
			'modified'             => mysql_to_rfc3339( $post->post_modified ),
			'modified_gmt'         => mysql_to_rfc3339( $post->post_modified_gmt ),
			'author'               => $post->post_author,
			'author_name'          => $author ? $author->display_name : __( 'Unknown', 'gutenberg' ),
		);

		return rest_ensure_response( $data );
	}

	/**
	 * Prepares a single guidelines for database.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return array Prepared data.
	 */
	protected function prepare_item_for_database( $request ) {
		$prepared = array(
			'content' => array(),
		);

		if ( isset( $request['status'] ) ) {
			$prepared['status'] = $request['status'];
		}

		if ( isset( $request['guideline_categories'] ) ) {
			$prepared['content']['guideline_categories'] = $request['guideline_categories'];
		}

		return $prepared;
	}

	/**
	 * Gets a guidelines post by ID with type validation.
	 *
	 * @param int $id Post ID.
	 * @return WP_Post|null Post object or null if not found/invalid.
	 */
	protected function get_validated_post( $id ) {
		$post = get_post( $id );
		if ( ! $post || $this->post_type !== $post->post_type ) {
			return null;
		}
		return $post;
	}

	/**
	 * Encodes data as JSON for storage in post_content.
	 *
	 * Uses consistent encoding flags and wp_slash() for WordPress database compatibility.
	 * This ensures special characters (quotes, HTML entities) are properly escaped.
	 *
	 * @param array $data Data to encode.
	 * @return string Slashed JSON string ready for wp_insert_post/wp_update_post.
	 */
	protected function encode_json_for_storage( $data ) {
		return wp_slash( wp_json_encode( $data, $this->json_encode_flags ) );
	}

	/**
	 * Decodes JSON from post_content with error handling.
	 *
	 * @param string $json_string JSON string to decode.
	 * @return array Decoded array, or empty array if decoding fails.
	 */
	protected function decode_json_from_storage( $json_string ) {
		$decoded = json_decode( $json_string, true );

		if ( JSON_ERROR_NONE !== json_last_error() || ! is_array( $decoded ) ) {
			return array();
		}

		return $decoded;
	}

	/**
	 * Gets the single guidelines post.
	 *
	 * @param string|null $status_filter Optional. Filter by status ('published' or 'draft').
	 * @return WP_Post|null The guidelines post or null if not found.
	 */
	protected function get_guidelines_post( $status_filter = null ) {
		$post_status = array( 'publish', 'draft' );

		if ( $status_filter ) {
			$post_status = 'published' === $status_filter ? 'publish' : 'draft';
		}

		$posts = get_posts(
			array(
				'post_type'      => $this->post_type,
				'post_status'    => $post_status,
				'posts_per_page' => 1,
				'orderby'        => 'date',
				'order'          => 'DESC',
				'no_found_rows'  => true,
			)
		);

		return ! empty( $posts ) ? $posts[0] : null;
	}

	/**
	 * Retrieves the guidelines schema, conforming to JSON Schema.
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		if ( $this->schema ) {
			return $this->add_additional_fields_schema( $this->schema );
		}

		$this->schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'content-guidelines',
			'type'       => 'object',
			'properties' => array(
				'id'                   => array(
					'description' => __( 'Unique identifier for the guidelines.', 'gutenberg' ),
					'type'        => 'integer',
					'context'     => array( 'view', 'edit' ),
					'readonly'    => true,
				),
				'status'               => array(
					'description' => __( 'The status of the guidelines (draft or published).', 'gutenberg' ),
					'type'        => 'string',
					'enum'        => array( 'draft', 'published' ),
					'context'     => array( 'view', 'edit' ),
				),
				'guideline_categories' => array(
					'description' => __( 'The guideline categories and their content.', 'gutenberg' ),
					'type'        => 'object',
					'context'     => array( 'view', 'edit' ),
					'properties'  => array(
						'copy'   => array(
							'type'       => 'object',
							'properties' => array(
								'label'      => array( 'type' => 'string' ),
								'guidelines' => array( 'type' => 'string' ),
							),
						),
						'images' => array(
							'type'       => 'object',
							'properties' => array(
								'label'      => array( 'type' => 'string' ),
								'guidelines' => array( 'type' => 'string' ),
							),
						),
						'site'   => array(
							'type'       => 'object',
							'properties' => array(
								'label'      => array( 'type' => 'string' ),
								'guidelines' => array( 'type' => 'string' ),
							),
						),
						'blocks' => array(
							'type'                 => 'object',
							'additionalProperties' => array(
								'type'       => 'object',
								'properties' => array(
									'guidelines' => array( 'type' => 'string' ),
								),
							),
						),
						'other'  => array(
							'type'       => 'object',
							'properties' => array(
								'label'      => array( 'type' => 'string' ),
								'guidelines' => array( 'type' => 'string' ),
							),
						),
					),
				),
				'date'                 => array(
					'description' => __( 'The date the guidelines were created, in the site\'s timezone.', 'gutenberg' ),
					'type'        => 'string',
					'format'      => 'date-time',
					'context'     => array( 'view', 'edit' ),
					'readonly'    => true,
				),
				'date_gmt'             => array(
					'description' => __( 'The date the guidelines were created, as GMT.', 'gutenberg' ),
					'type'        => 'string',
					'format'      => 'date-time',
					'context'     => array( 'view', 'edit' ),
					'readonly'    => true,
				),
				'modified'             => array(
					'description' => __( 'The date the guidelines were last modified, in the site\'s timezone.', 'gutenberg' ),
					'type'        => 'string',
					'format'      => 'date-time',
					'context'     => array( 'view', 'edit' ),
					'readonly'    => true,
				),
				'modified_gmt'         => array(
					'description' => __( 'The date the guidelines were last modified, as GMT.', 'gutenberg' ),
					'type'        => 'string',
					'format'      => 'date-time',
					'context'     => array( 'view', 'edit' ),
					'readonly'    => true,
				),
				'author'               => array(
					'description' => __( 'The ID of the author of the guidelines.', 'gutenberg' ),
					'type'        => 'integer',
					'context'     => array( 'view', 'edit' ),
					'readonly'    => true,
				),
				'author_name'          => array(
					'description' => __( 'The display name of the author.', 'gutenberg' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit' ),
					'readonly'    => true,
				),
			),
		);

		return $this->add_additional_fields_schema( $this->schema );
	}
}
