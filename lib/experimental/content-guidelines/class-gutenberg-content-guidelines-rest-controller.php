<?php
/**
 * Content Guidelines REST API Controller.
 *
 * Extends WP_REST_Posts_Controller to inherit standard WordPress CRUD behavior,
 * permission checks, and response formatting. Follows the pattern used by
 * WP_REST_Global_Styles_Controller.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * REST API controller for Content Guidelines.
 */
class Gutenberg_Content_Guidelines_REST_Controller extends WP_REST_Posts_Controller {

	/**
	 * Maximum length for guideline text strings.
	 *
	 * @var int
	 */
	const MAX_GUIDELINE_LENGTH = 5000;

	/**
	 * Maximum length for category label strings.
	 *
	 * @var int
	 */
	const MAX_LABEL_LENGTH = 200;

	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct( Gutenberg_Content_Guidelines_Post_Type::POST_TYPE );
	}

	/**
	 * Registers the routes for content guidelines.
	 *
	 * Calls parent to register standard /{id} CRUD routes, then overrides the
	 * collection route with a singleton GET endpoint.
	 */
	public function register_routes() {
		parent::register_routes();

		// Override collection route with singleton GET + create.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_guidelines' ),
					'permission_callback' => array( $this, 'get_guidelines_permissions_check' ),
					'args'                => array(
						'category' => array(
							'description'       => __( 'Limit response to a specific guideline category.', 'gutenberg' ),
							'type'              => 'string',
							'enum'              => Gutenberg_Content_Guidelines_Post_Type::VALID_CATEGORIES,
							'sanitize_callback' => 'sanitize_text_field',
						),
						'block'    => array(
							'description'       => __( 'Limit response to guidelines for a specific block type.', 'gutenberg' ),
							'type'              => 'string',
							'sanitize_callback' => 'sanitize_text_field',
						),
						'status'   => array(
							'description'       => __( 'Limit response to guidelines with a specific status.', 'gutenberg' ),
							'type'              => 'string',
							'enum'              => Gutenberg_Content_Guidelines_Post_Type::VALID_STATUSES,
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
			),
			true
		);
	}

	/**
	 * Retrieves the query params for the collection.
	 *
	 * Overridden to return empty since we use a singleton pattern, not a collection.
	 *
	 * @return array Empty collection parameters.
	 */
	public function get_collection_params() {
		return array();
	}

	/**
	 * Checks if a given request has access to read the singleton guidelines.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function get_guidelines_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$post_type = get_post_type_object( $this->post_type );
		if ( ! current_user_can( $post_type->cap->read ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'Sorry, you are not allowed to view content guidelines.', 'gutenberg' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Gets the singleton content guidelines.
	 *
	 * Supports query parameters:
	 * - ?status=publish|draft - Filter by status
	 * - ?category=copy|images|site|blocks|additional - Return only specific category
	 * - ?block=core/paragraph - Return only specific block's guidelines
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response Response object.
	 */
	public function get_guidelines( $request ) {
		$status_filter = $request->get_param( 'status' );
		$post          = $this->get_guidelines_post( $status_filter );

		if ( ! $post ) {
			$empty_status = $status_filter ? $status_filter : 'draft';
			return rest_ensure_response(
				array(
					'id'                   => 0,
					'status'               => $empty_status,
					'guideline_categories' => new stdClass(),
				)
			);
		}

		return $this->prepare_item_for_response( $post, $request );
	}

	/**
	 * Creates content guidelines.
	 *
	 * Enforces singleton pattern — only one guidelines post per site.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error on failure.
	 */
	public function create_item( $request ) {
		$existing = $this->get_guidelines_post();
		if ( $existing ) {
			return new WP_Error(
				'rest_guidelines_exists',
				__( 'Content guidelines already exist. Use PATCH to update.', 'gutenberg' ),
				array( 'status' => 400 )
			);
		}

		$prepared             = $this->prepare_item_for_database( $request );
		$prepared->post_type  = $this->post_type;
		$prepared->post_title = __( 'Content Guidelines', 'gutenberg' );

		if ( ! isset( $prepared->post_status ) ) {
			$prepared->post_status = 'draft';
		}

		$post_id = wp_insert_post( wp_slash( (array) $prepared ), true );

		if ( is_wp_error( $post_id ) ) {
			return $post_id;
		}

		if ( isset( $request['guideline_categories'] ) ) {
			$categories = $this->sanitize_guideline_categories( $request['guideline_categories'] );
			$this->save_guideline_categories_to_meta( $post_id, $categories );
		}

		$post = get_post( $post_id );

		$request->set_param( 'context', 'edit' );
		$response = $this->prepare_item_for_response( $post, $request );
		$response = rest_ensure_response( $response );
		$response->set_status( 201 );
		$response->header( 'Location', rest_url( sprintf( '%s/%s/%d', $this->namespace, $this->rest_base, $post_id ) ) );

		return $response;
	}

	/**
	 * Updates content guidelines.
	 *
	 * Saves guideline categories to meta before updating the post so that
	 * the revision captures the updated meta values.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error on failure.
	 */
	public function update_item( $request ) {
		$post = $this->get_post( $request['id'] );
		if ( is_wp_error( $post ) ) {
			return $post;
		}

		// Save guideline categories to meta first (so revision captures them).
		if ( isset( $request['guideline_categories'] ) ) {
			$categories = $this->sanitize_guideline_categories( $request['guideline_categories'] );
			$this->save_guideline_categories_to_meta( $post->ID, $categories );
		}

		$prepared     = $this->prepare_item_for_database( $request );
		$prepared->ID = $post->ID;

		// Trigger a post update to create a revision with the meta changes.
		$result = wp_update_post( wp_slash( (array) $prepared ), true );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		$post = get_post( $post->ID );

		$request->set_param( 'context', 'edit' );

		return $this->prepare_item_for_response( $post, $request );
	}

	/**
	 * Prepares a single guidelines post for database.
	 *
	 * Returns a stdClass with standard post fields. Guideline categories
	 * are handled separately via save_guideline_categories_to_meta().
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return stdClass Prepared post data.
	 */
	protected function prepare_item_for_database( $request ) {
		$prepared = new stdClass();

		if ( isset( $request['id'] ) ) {
			$prepared->ID = $request['id'];
		}

		if ( isset( $request['status'] ) ) {
			$prepared->post_status = $request['status'];
		}

		return $prepared;
	}

	/**
	 * Prepares a single guidelines output for response.
	 *
	 * Builds the guideline_categories structured response from post meta
	 * and includes standard _links.
	 *
	 * @param WP_Post         $post    Post object.
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response object.
	 */
	public function prepare_item_for_response( $post, $request ) {
		$fields = $this->get_fields_for_response( $request );
		$data   = array();

		if ( rest_is_field_included( 'id', $fields ) ) {
			$data['id'] = $post->ID;
		}

		if ( rest_is_field_included( 'status', $fields ) ) {
			$data['status'] = $post->post_status;
		}

		if ( rest_is_field_included( 'guideline_categories', $fields ) ) {
			$guideline_categories = Gutenberg_Content_Guidelines_Post_Type::get_guideline_categories_from_meta( $post->ID );

			// Handle ?block filter.
			$block_filter = $request->get_param( 'block' );
			if ( $block_filter && ! empty( $guideline_categories ) ) {
				if ( isset( $guideline_categories['blocks'][ $block_filter ] ) ) {
					$guideline_categories = array(
						'blocks' => array(
							$block_filter => $guideline_categories['blocks'][ $block_filter ],
						),
					);
				} else {
					$guideline_categories = new stdClass();
				}
			} elseif ( $request->get_param( 'category' ) ) {
				// Handle ?category filter.
				$category_filter = $request->get_param( 'category' );
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

			$data['guideline_categories'] = $guideline_categories;
		}

		if ( rest_is_field_included( 'date', $fields ) ) {
			$data['date'] = $this->prepare_date_response( $post->post_date_gmt, $post->post_date );
		}

		if ( rest_is_field_included( 'date_gmt', $fields ) ) {
			$data['date_gmt'] = $this->prepare_date_response( $post->post_date_gmt );
		}

		if ( rest_is_field_included( 'modified', $fields ) ) {
			$data['modified'] = $this->prepare_date_response( $post->post_modified_gmt, $post->post_modified );
		}

		if ( rest_is_field_included( 'modified_gmt', $fields ) ) {
			$data['modified_gmt'] = $this->prepare_date_response( $post->post_modified_gmt );
		}

		if ( rest_is_field_included( 'author', $fields ) ) {
			$data['author'] = (int) $post->post_author;
		}

		$context = ! empty( $request['context'] ) ? $request['context'] : 'view';
		$data    = $this->add_additional_fields_to_object( $data, $request );
		$data    = $this->filter_response_by_context( $data, $context );

		$response = rest_ensure_response( $data );

		if ( rest_is_field_included( '_links', $fields ) || rest_is_field_included( '_embedded', $fields ) ) {
			$response->add_links( $this->prepare_links( $post->ID ) );
		}

		return $response;
	}

	/**
	 * Prepares links for the request.
	 *
	 * Includes self, about, and version-history links.
	 *
	 * @param int $id Post ID.
	 * @return array Links for the given post.
	 */
	protected function prepare_links( $id ) {
		$base = sprintf( '%s/%s', $this->namespace, $this->rest_base );

		$links = array(
			'self'  => array(
				'href' => rest_url( trailingslashit( $base ) . $id ),
			),
			'about' => array(
				'href' => rest_url( 'wp/v2/types/' . $this->post_type ),
			),
		);

		if ( post_type_supports( $this->post_type, 'revisions' ) ) {
			$revisions       = wp_get_latest_revision_id_and_total_count( $id );
			$revisions_count = ! is_wp_error( $revisions ) ? $revisions['count'] : 0;
			$revisions_base  = sprintf( '/%s/%d/revisions', $base, $id );

			$links['version-history'] = array(
				'href'  => rest_url( $revisions_base ),
				'count' => $revisions_count,
			);
		}

		return $links;
	}

	/**
	 * Saves guideline categories to post meta.
	 *
	 * @param int   $post_id    Post ID.
	 * @param array $categories Sanitized guideline categories.
	 */
	protected function save_guideline_categories_to_meta( $post_id, $categories ) {
		// Save standard categories.
		foreach ( Gutenberg_Content_Guidelines_Post_Type::CATEGORY_META_KEYS as $category ) {
			if ( isset( $categories[ $category ] ) ) {
				$meta_key = '_content_guideline_' . $category;
				$value    = isset( $categories[ $category ]['guidelines'] )
					? $categories[ $category ]['guidelines']
					: '';
				update_post_meta( $post_id, $meta_key, $value );
			}
		}

		// Handle block-specific guidelines as individual meta keys.
		if ( isset( $categories['blocks'] ) && is_array( $categories['blocks'] ) ) {
			foreach ( $categories['blocks'] as $block_name => $block_data ) {
				$meta_key = Gutenberg_Content_Guidelines_Post_Type::block_name_to_meta_key( $block_name );
				$value    = isset( $block_data['guidelines'] ) ? $block_data['guidelines'] : '';

				if ( ! empty( $value ) ) {
					update_post_meta( $post_id, $meta_key, $value );
				} else {
					delete_post_meta( $post_id, $meta_key );
				}
			}
		}
	}

	/**
	 * Sanitizes guideline categories data.
	 *
	 * @param mixed $categories Raw guideline categories from the request.
	 * @return array Sanitized guideline categories.
	 */
	protected function sanitize_guideline_categories( $categories ) {
		if ( ! is_array( $categories ) ) {
			return array();
		}

		$valid_categories = Gutenberg_Content_Guidelines_Post_Type::VALID_CATEGORIES;
		$sanitized        = array_intersect_key( $categories, array_flip( $valid_categories ) );

		foreach ( $sanitized as $key => &$category ) {
			if ( ! is_array( $category ) ) {
				unset( $sanitized[ $key ] );
				continue;
			}

			if ( 'blocks' === $key ) {
				$category = $this->sanitize_blocks_category( $category );
			} else {
				$category = $this->sanitize_standard_category( $category );
			}
		}
		unset( $category );

		return $sanitized;
	}

	/**
	 * Sanitizes a standard (non-blocks) guideline category.
	 *
	 * @param array $category Raw category data.
	 * @return array Sanitized category data.
	 */
	private function sanitize_standard_category( $category ) {
		$sanitized = array_intersect_key( $category, array_flip( array( 'label', 'guidelines' ) ) );

		foreach ( $sanitized as $key => &$value ) {
			$value = is_string( $value ) ? sanitize_textarea_field( $value ) : '';
			$max   = 'label' === $key ? self::MAX_LABEL_LENGTH : self::MAX_GUIDELINE_LENGTH;
			if ( mb_strlen( $value, 'UTF-8' ) > $max ) {
				$value = mb_substr( $value, 0, $max, 'UTF-8' );
			}
		}
		unset( $value );

		return $sanitized;
	}

	/**
	 * Sanitizes the blocks guideline category.
	 *
	 * @param array $blocks Raw blocks category data.
	 * @return array Sanitized blocks category data.
	 */
	private function sanitize_blocks_category( $blocks ) {
		$sanitized = array();

		foreach ( $blocks as $block_name => $block_data ) {
			// Matches the block name validation in WP_Block_Type_Registry::register().
			if ( ! is_string( $block_name ) || ! preg_match( '/^[a-z0-9-]+\/[a-z0-9-]+$/', $block_name ) ) {
				continue;
			}

			if ( ! is_array( $block_data ) ) {
				continue;
			}

			$sanitized_block = array_intersect_key( $block_data, array_flip( array( 'guidelines' ) ) );

			if ( isset( $sanitized_block['guidelines'] ) ) {
				$sanitized_block['guidelines'] = is_string( $sanitized_block['guidelines'] )
					? sanitize_textarea_field( $sanitized_block['guidelines'] )
					: '';
				if ( mb_strlen( $sanitized_block['guidelines'], 'UTF-8' ) > self::MAX_GUIDELINE_LENGTH ) {
					$sanitized_block['guidelines'] = mb_substr( $sanitized_block['guidelines'], 0, self::MAX_GUIDELINE_LENGTH, 'UTF-8' );
				}
			}

			$sanitized[ $block_name ] = $sanitized_block;
		}

		return $sanitized;
	}

	/**
	 * Gets the single guidelines post.
	 *
	 * @param string|null $status_filter Optional. Filter by status ('publish' or 'draft').
	 * @return WP_Post|null The guidelines post or null if not found.
	 */
	protected function get_guidelines_post( $status_filter = null ) {
		$post_status = array( 'publish', 'draft' );

		if ( $status_filter ) {
			$post_status = $status_filter;
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
					'description' => __( 'The status of the guidelines (draft or publish).', 'gutenberg' ),
					'type'        => 'string',
					'enum'        => Gutenberg_Content_Guidelines_Post_Type::VALID_STATUSES,
					'context'     => array( 'view', 'edit' ),
				),
				'guideline_categories' => array(
					'description' => __( 'The guideline categories and their content.', 'gutenberg' ),
					'type'        => 'object',
					'context'     => array( 'view', 'edit' ),
					'arg_options' => array(
						'validate_callback' => static function ( $value ) {
							if ( ! is_array( $value ) && ! is_object( $value ) ) {
								return new WP_Error(
									'rest_invalid_param',
									__( 'guideline_categories must be a JSON object.', 'gutenberg' ),
									array( 'status' => 400 )
								);
							}
							return true;
						},
						'sanitize_callback' => static function ( $value ) {
							return (array) $value;
						},
					),
					'properties'  => array(
						'copy'       => array(
							'type'       => 'object',
							'properties' => array(
								'label'      => array(
									'type'      => 'string',
									'maxLength' => self::MAX_LABEL_LENGTH,
								),
								'guidelines' => array(
									'type'      => 'string',
									'maxLength' => self::MAX_GUIDELINE_LENGTH,
								),
							),
						),
						'images'     => array(
							'type'       => 'object',
							'properties' => array(
								'label'      => array(
									'type'      => 'string',
									'maxLength' => self::MAX_LABEL_LENGTH,
								),
								'guidelines' => array(
									'type'      => 'string',
									'maxLength' => self::MAX_GUIDELINE_LENGTH,
								),
							),
						),
						'site'       => array(
							'type'       => 'object',
							'properties' => array(
								'label'      => array(
									'type'      => 'string',
									'maxLength' => self::MAX_LABEL_LENGTH,
								),
								'guidelines' => array(
									'type'      => 'string',
									'maxLength' => self::MAX_GUIDELINE_LENGTH,
								),
							),
						),
						'blocks'     => array(
							'type'                 => 'object',
							'additionalProperties' => array(
								'type'       => 'object',
								'properties' => array(
									'guidelines' => array(
										'type'      => 'string',
										'maxLength' => self::MAX_GUIDELINE_LENGTH,
									),
								),
							),
						),
						'additional' => array(
							'type'       => 'object',
							'properties' => array(
								'label'      => array(
									'type'      => 'string',
									'maxLength' => self::MAX_LABEL_LENGTH,
								),
								'guidelines' => array(
									'type'      => 'string',
									'maxLength' => self::MAX_GUIDELINE_LENGTH,
								),
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
			),
		);

		return $this->add_additional_fields_schema( $this->schema );
	}
}
