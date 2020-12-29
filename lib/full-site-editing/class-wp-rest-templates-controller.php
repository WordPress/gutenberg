<?php
/**
 * REST API: WP_REST_Templates_Controller class
 *
 * @package    Gutenberg
 * @subpackage REST_API
 */

/**
 * Base Templates REST API Controller.
 */
class WP_REST_Templates_Controller extends WP_REST_Controller {
	/**
	 * Post type.
	 *
	 * @var string
	 */
	protected $post_type;

	/**
	 * Constructor.
	 *
	 * @param string $post_type Post type.
	 */
	public function __construct( $post_type ) {
		$this->post_type = $post_type;
		$this->namespace = 'wp/v2';
		$obj             = get_post_type_object( $post_type );
		$this->rest_base = ! empty( $obj->rest_base ) ? $obj->rest_base : $obj->name;
	}

	/**
	 * Registers the controllers routes.
	 *
	 * @return void
	 */
	public function register_routes() {
		// Lists all templates.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'permissions_check' ),
					'args'                => $this->get_collection_params(),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_item' ),
					'permission_callback' => array( $this, 'permissions_check' ),
					'args'                => $this->get_endpoint_args_for_item_schema( WP_REST_Server::CREATABLE ),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);

		// Lists/updates a single template based on the given id.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[|\w-]+)',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'permissions_check' ),
					'args'                => array(
						'id' => array(
							'description' => __( 'The id of a template', 'gutenberg' ),
							'type'        => 'string',
						),
					),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_item' ),
					'permission_callback' => array( $this, 'permissions_check' ),
					'args'                => $this->get_endpoint_args_for_item_schema( WP_REST_Server::EDITABLE ),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * Checks if the user has permissions to make the request.
	 *
	 * @return true|WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function permissions_check() {
		// Verify if the current user has edit_theme_options capability.
		// This capability is required to access the widgets screen.
		if ( ! current_user_can( 'edit_theme_options' ) ) {
			return new WP_Error(
				'rest_cannot_manage_templates',
				__( 'Sorry, you are not allowed to access the templates on this site.', 'gutenberg' ),
				array(
					'status' => rest_authorization_required_code(),
				)
			);
		}

		return true;
	}

	/**
	 * Returns a list of templates.
	 *
	 * @param WP_REST_Request $request The request instance.
	 *
	 * @return WP_REST_Response
	 */
	public function get_items( $request ) {
		$query = array();
		if ( isset( $request['theme'] ) ) {
			$query['theme'] = $request['theme'];
		}
		if ( isset( $request['wp_id'] ) ) {
			$query['wp_id'] = $request['wp_id'];
		}
		$templates = array();
		foreach ( gutenberg_get_block_templates( $query, $this->post_type ) as $template ) {
			$data        = $this->prepare_item_for_response( $template, $request );
			$templates[] = $this->prepare_response_for_collection( $data );
		}

		return rest_ensure_response( $templates );
	}

	/**
	 * Returns the given template
	 *
	 * @param WP_REST_Request $request The request instance.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_item( $request ) {
		$template = gutenberg_get_block_template( $request['id'], $this->post_type );

		if ( ! $template ) {
			return new WP_Error( 'rest_template_not_found', __( 'No templates exists with that id.', 'gutenberg' ), array( 'status' => 404 ) );
		}

		return $this->prepare_item_for_response( $template, $request );
	}

	/**
	 * Updates a single template.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function update_item( $request ) {
		$template = gutenberg_get_block_template( $request['id'], $this->post_type );
		if ( ! $template ) {
			return new WP_Error( 'rest_template_not_found', __( 'No templates exists with that id.', 'gutenberg' ), array( 'status' => 404 ) );
		}

		$changes = $this->prepare_item_for_database( $request );
		if ( $template->is_custom ) {
			$result = wp_update_post( wp_slash( $changes ), true );
		} else {
			$result = wp_insert_post( wp_slash( $changes ), true );
		}
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		$template      = gutenberg_get_block_template( $request['id'], $this->post_type );
		$fields_update = $this->update_additional_fields_for_object( $template, $request );
		if ( is_wp_error( $fields_update ) ) {
			return $fields_update;
		}

		return $this->prepare_item_for_response(
			gutenberg_get_block_template( $request['id'], $this->post_type ),
			$request
		);
	}

	/**
	 * Creates a single template.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function create_item( $request ) {
		$changes              = $this->prepare_item_for_database( $request );
		$changes['post_name'] = $request['slug'];
		$result               = wp_insert_post( wp_slash( $changes ), true );
		if ( is_wp_error( $result ) ) {
			return $result;
		}
		$id = $changes['theme'] . '|' . $changes['slug'];

		$template      = gutenberg_get_block_template( $id, $this->post_type );
		$fields_update = $this->update_additional_fields_for_object( $template, $request );
		if ( is_wp_error( $fields_update ) ) {
			return $fields_update;
		}

		return $this->prepare_item_for_response(
			gutenberg_get_block_template( $id, $this->post_type ),
			$request
		);
	}

	/**
	 * Prepares a single template for create or update.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return array Changes to pass to wp_update_post.
	 */
	protected function prepare_item_for_database( $request ) {
		$template = $request['id'] ? gutenberg_get_block_template( $request['id'], $this->post_type ) : null;
		$changes  = array( 'post_name' => $template->slug );
		if ( null === $template ) {
			$changes['post_type']   = $this->post_type;
			$changes['post_status'] = 'publish';
			$changes['tax_input']   = array(
				'wp_theme' => wp_get_theme()->get_stylesheet(),
			);
		} elseif ( ! $template->is_custom ) {
			$changes['post_type']   = $this->post_type;
			$changes['post_status'] = 'publish';
			$changes['tax_input']   = array(
				'wp_theme' => $template->theme,
			);
		} else {
			$changes['ID']          = $template->wp_id;
			$changes['post_status'] = 'publish';
		}
		if ( isset( $request['content'] ) ) {
			$changes['post_content'] = $request['content'];
		} elseif ( null !== $template && ! $template->is_custom ) {
			$changes['post_content'] = $template->content;
		}
		if ( isset( $request['title'] ) ) {
			$changes['post_title'] = $request['title'];
		} elseif ( null !== $template && ! $template->is_custom ) {
			$changes['post_title'] = $template->title;
		}
		if ( isset( $request['description'] ) ) {
			$changes['post_excerpt'] = $request['description'];
		} elseif ( null !== $template && ! $template->is_custom ) {
			$changes['post_excerpt'] = $template->description;
		}

		return $changes;
	}

	/**
	 * Prepare a single template output for response
	 *
	 * @param WP_Block_Template $template    Temlate instance.
	 * @param WP_REST_Request   $request Request object.
	 *
	 * @return WP_REST_Response $data
	 */
	public function prepare_item_for_response( $template, $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$result = array(
			'id'          => $template->id,
			'theme'       => $template->theme,
			'content'     => array( 'raw' => $template->content ),
			'slug'        => $template->slug,
			'is_custom'   => $template->is_custom,
			'type'        => $template->type,
			'description' => $template->description,
			'title'       => array(
				'raw'      => $template->title,
				'rendered' => $template->title,
			),
			'status'      => $template->status,
			'wp_id'       => $template->wp_id,
		);

		$response = rest_ensure_response( $result );
		$links    = $this->prepare_links( $template->id );
		$response->add_links( $links );
		if ( ! empty( $links['self']['href'] ) ) {
			$actions = $this->get_available_actions();
			$self    = $links['self']['href'];
			foreach ( $actions as $rel ) {
				$response->add_link( $rel, $self );
			}
		}

		return $response;
	}


	/**
	 * Prepares links for the request.
	 *
	 * @since 4.7.0
	 *
	 * @param integer $id ID.
	 * @return array Links for the given post.
	 */
	protected function prepare_links( $id ) {
		$base = sprintf( '%s/%s', $this->namespace, $this->rest_base );

		$links = array(
			'self'       => array(
				'href' => rest_url( trailingslashit( $base ) . $id ),
			),
			'collection' => array(
				'href' => rest_url( $base ),
			),
			'about'      => array(
				'href' => rest_url( 'wp/v2/types/' . $this->post_type ),
			),
		);

		return $links;
	}

	/**
	 * Get the link relations available for the post and current user.
	 *
	 * @return array List of link relations.
	 */
	protected function get_available_actions() {
		$rels = array();

		$post_type = get_post_type_object( $this->post_type );

		if ( current_user_can( $post_type->cap->publish_posts ) ) {
			$rels[] = 'https://api.w.org/action-publish';
		}

		if ( current_user_can( 'unfiltered_html' ) ) {
			$rels[] = 'https://api.w.org/action-unfiltered-html';
		}

		return $rels;
	}

	/**
	 * Retrieves the query params for the posts collection.
	 *
	 * @return array Collection parameters.
	 */
	public function get_collection_params() {
		$query_params = parent::get_collection_params();

		$query_params['theme'] = array(
			'description' => __( 'Limit to the current theme templates.', 'gutenberg' ),
			'type'        => 'string',
		);
		$query_params['wp_id'] = array(
			'description' => __( 'Limit to the specified post id.', 'gutenberg' ),
			'type'        => 'integer',
		);

		return $query_params;
	}

	/**
	 * Retrieves the block type' schema, conforming to JSON Schema.
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		if ( $this->schema ) {
			return $this->add_additional_fields_schema( $this->schema );
		}

		$schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => $this->post_type,
			'type'       => 'object',
			'properties' => array(
				'id'          => array(
					'description' => __( 'ID of template.', 'gutenberg' ),
					'type'        => 'string',
					'context'     => array( 'embed', 'view', 'edit' ),
					'readonly'    => true,
				),
				'slug'        => array(
					'description' => __( 'Unique slug identifying the template.', 'gutenberg' ),
					'type'        => 'string',
					'context'     => array( 'embed', 'view', 'edit' ),
					'required'    => true,
					'minLength'   => 1,
					'pattern'     => '[a-zA-Z_\-]+',
				),
				'theme'       => array(
					'description' => __( 'Theme identifier for the template.', 'gutenberg' ),
					'type'        => 'string',
					'context'     => array( 'embed', 'view', 'edit' ),
				),
				'is_custom'   => array(
					'description' => __( 'Whether the template is customized.', 'gutenberg' ),
					'type'        => 'bool',
					'context'     => array( 'embed', 'view', 'edit' ),
					'readonly'    => true,
				),
				'content'     => array(
					'description' => __( 'Content of template.', 'gutenberg' ),
					'type'        => 'string',
					'default'     => '',
					'context'     => array( 'embed', 'view', 'edit' ),
				),
				'title'       => array(
					'description' => __( 'Title of template.', 'gutenberg' ),
					'type'        => 'string',
					'default'     => '',
					'context'     => array( 'embed', 'view', 'edit' ),
				),
				'description' => array(
					'description' => __( 'Description of template.', 'gutenberg' ),
					'type'        => 'string',
					'default'     => '',
					'context'     => array( 'embed', 'view', 'edit' ),
				),
				'status'      => array(
					'description' => __( 'Status of template.', 'gutenberg' ),
					'type'        => 'string',
					'default'     => 'publish',
					'context'     => array( 'embed', 'view', 'edit' ),
				),
				'wp_id'       => array(
					'description' => __( 'Post ID.', 'gutenberg' ),
					'type'        => 'integer',
					'context'     => array( 'embed', 'view', 'edit' ),
					'readonly'    => true,
				),
			),
		);

		$this->schema = $schema;

		return $this->add_additional_fields_schema( $this->schema );
	}
}
