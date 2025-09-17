<?php

class Gutenberg_REST_Static_Templates_Controller extends WP_REST_Templates_Controller {
	public function register_routes() {
		// Lists all templates.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
					'args'                => $this->get_collection_params(),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);

		// Lists/updates a single template based on the given id.
		register_rest_route(
			$this->namespace,
			// The route.
			sprintf(
				'/%s/(?P<id>%s%s)',
				$this->rest_base,
				/*
				 * Matches theme's directory: `/themes/<subdirectory>/<theme>/` or `/themes/<theme>/`.
				 * Excludes invalid directory name characters: `/:<>*?"|`.
				 */
				'([^\/:<>\*\?"\|]+(?:\/[^\/:<>\*\?"\|]+)?)',
				// Matches the template name.
				'[\/\w%-]+'
			),
			array(
				'args'   => array(
					'id' => array(
						'description'       => __( 'The id of a template' ),
						'type'              => 'string',
						'sanitize_callback' => array( $this, '_sanitize_template_id' ),
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
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	public function get_item_schema() {
		$schema                            = parent::get_item_schema();
		$schema['properties']['is_custom'] = array(
			'description' => __( 'Whether a template is a custom template.' ),
			'type'        => 'bool',
			'context'     => array( 'embed', 'view', 'edit' ),
			'readonly'    => true,
		);
		$schema['properties']['plugin']    = array(
			'type'        => 'string',
			'description' => __( 'Plugin that registered the template.' ),
			'readonly'    => true,
			'context'     => array( 'view', 'edit', 'embed' ),
		);
		return $schema;
	}

	public function get_items( $request ) {
		$query = array();
		if ( isset( $request['area'] ) ) {
			$query['area'] = $request['area'];
		}
		if ( isset( $request['post_type'] ) ) {
			$query['post_type'] = $request['post_type'];
		}
		$template_files = _get_block_templates_files( 'wp_template', $query );
		$query_result   = array();
		foreach ( $template_files as $template_file ) {
			$query_result[] = _build_block_template_result_from_file( $template_file, 'wp_template' );
		}

		// Add templates registered in the template registry. Filtering out the ones which have a theme file.
		$registered_templates          = WP_Block_Templates_Registry::get_instance()->get_by_query( $query );
		$matching_registered_templates = array_filter(
			$registered_templates,
			function ( $registered_template ) use ( $template_files ) {
				foreach ( $template_files as $template_file ) {
					if ( $template_file['slug'] === $registered_template->slug ) {
						return false;
					}
				}
				return true;
			}
		);

		$query_result = array_merge( $query_result, $matching_registered_templates );

		/**
		 * Filters the array of queried block templates array after they've been fetched.
		 *
		 * @since 5.9.0
		 *
		 * @param WP_Block_Template[] $query_result Array of found block templates.
		 * @param array               $query {
		 *     Arguments to retrieve templates. All arguments are optional.
		 *
		 *     @type string[] $slug__in  List of slugs to include.
		 *     @type int      $wp_id     Post ID of customized template.
		 *     @type string   $area      A 'wp_template_part_area' taxonomy value to filter by (for 'wp_template_part' template type only).
		 *     @type string   $post_type Post type to get the templates for.
		 * }
		 * @param string              $template_type wp_template or wp_template_part.
		 */
		$query_result = apply_filters( 'get_block_templates', $query_result, $query, 'wp_template' );

		$templates = array();
		foreach ( $query_result as $template ) {
			$item               = $this->prepare_item_for_response( $template, $request );
			$item->data['type'] = 'wp_registered_template';
			$templates[]        = $this->prepare_response_for_collection( $item );
		}

		return rest_ensure_response( $templates );
	}

	public function get_item( $request ) {
		$template = get_block_file_template( $request['id'], 'wp_template' );

		if ( ! $template ) {
			return new WP_Error( 'rest_template_not_found', __( 'No templates exist with that id.' ), array( 'status' => 404 ) );
		}

		$item = $this->prepare_item_for_response( $template, $request );
		// adjust the template type here instead
		$item->data['type'] = 'wp_registered_template';
		return rest_ensure_response( $item );
	}
}
