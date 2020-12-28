<?php
/**
 * REST API: WP_REST_Templates_Controller class
 *
 * @package    Gutenberg
 * @subpackage REST_API
 */

/**
 * Templates REST API Controller.
 */
class WP_REST_Templates_Controller extends WP_REST_Controller {

	/**
	 * Templates controller constructor.
	 *
	 * @since 5.5.0
	 */
	public function __construct() {
		$this->namespace = 'wp/v2';
		$this->rest_base = 'templates';
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
					'args'                => array(
						'context' => $this->get_context_param( array( 'default' => 'view' ) ),
					),
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
	 * @since  5.6.0
	 * @access public
	 */
	public function permissions_check() {
		// Verify if the current user has edit_theme_options capability.
		// This capability is required to access the widgets screen.
		if ( ! current_user_can( 'edit_theme_options' ) ) {
			return new WP_Error(
				'templates_cannot_access',
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
		$templates = array();
		foreach ( gutenberg_get_block_templates( $query ) as $template ) {
			$data        = $this->prepare_item_for_response( $template, $request );
			$templates[] = $data;
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
		$template = gutenberg_get_block_template( $request['id'] );

		if ( ! $template ) {
			return new WP_Error( 'rest_template_not_found', __( 'No templates exists with that id.', 'gutenberg' ), array( 'status' => 404 ) );
		}

		$response = $this->prepare_item_for_response( $template, $request );
		return rest_ensure_response( $response );
	}

	/**
	 * Updates a single template.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function update_item( $request ) {
		$template = gutenberg_get_block_template( $request['id'] );
		if ( ! $template ) {
			return new WP_Error( 'rest_template_not_found', __( 'No templates exists with that id.', 'gutenberg' ), array( 'status' => 404 ) );
		}

		$changes = $this->prepare_item_for_database( $request );
		if ( $template->is_custom ) {
			$result = wp_update_post( $changes, true );
		} else {
			$result = wp_insert_post( $changes, true );
		}

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		$response = $this->prepare_item_for_response( gutenberg_get_block_template( $request['id'] ), $request );

		return rest_ensure_response( $response );
	}

	/**
	 * Prepares a single template for create or update.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return array Changes to pass to wp_update_post.
	 */
	protected function prepare_item_for_database( $request ) {
		$template = gutenberg_get_block_template( $request['id'] );
		$changes  = array( 'post_name' => $template->slug );
		if ( ! $template->is_custom ) {
			$changes['post_type']   = 'wp_template';
			$changes['post_status'] = 'publish';
			$changes['tax_input']   = array(
				'wp_theme' => array( $template->theme ),
			);
		} else {
			$changes['ID'] = $template->wp_id;
		}
		if ( isset( $request['content'] ) ) {
			$changes['post_content'] = $request['content'];
		} elseif ( ! $template->is_custom ) {
			$changes['post_content'] = $template->content;
		}
		if ( isset( $request['title'] ) ) {
			$changes['post_title'] = $request['title'];
		} elseif ( ! $template->is_custom ) {
			$changes['post_title'] = $template->title;
		}
		if ( isset( $request['description'] ) ) {
			$changes['post_excerpt'] = $request['description'];
		} elseif ( ! $template->is_custom ) {
			$changes['post_excerpt'] = $template->description;
		}

		return $changes;
	}

	/**
	 * Prepare a single template output for response
	 *
	 * @param stdClass        $template    Temlate instance.
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response $data
	 */
	public function prepare_item_for_response( $template, $request ) {
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
		);

		return $result;
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
			'title'      => 'template',
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
					'readonly'    => true,
				),
				'theme'       => array(
					'description' => __( 'Theme identifier for the template.', 'gutenberg' ),
					'type'        => 'string',
					'context'     => array( 'embed', 'view', 'edit' ),
					'readonly'    => true,
				),
				'is_custom'   => array(
					'description' => __( 'Whether the template is customized.', 'gutenberg' ),
					'type'        => 'bool',
					'context'     => array( 'embed', 'view', 'edit' ),
					'readonly'    => true,
				),
				'cntent'      => array(
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
			),
		);

		$this->schema = $schema;

		return $this->add_additional_fields_schema( $this->schema );
	}
}
