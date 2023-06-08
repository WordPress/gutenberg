<?php
/**
 * REST API: Gutenberg_REST_Templates_Controller_6_2 class
 *
 * @package    Gutenberg
 * @subpackage REST_API
 */

/**
 * Base Templates REST API Controller.
 */
class Gutenberg_REST_Templates_Controller_6_3 extends WP_REST_Templates_Controller {

	/**
	 * Registers the controllers routes.
	 *
	 * @return void
	 */
	public function register_routes() {

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/lookup',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_template_fallback' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
					'args'                => array(
						'slug'            => array(
							'description' => __( 'The slug of the template to get the fallback for', 'gutenberg' ),
							'type'        => 'string',
							'required'    => true,
						),
						'is_custom'       => array(
							'description' => __( 'Indicates if a template is custom or part of the template hierarchy', 'gutenberg' ),
							'type'        => 'boolean',
						),
						'template_prefix' => array(
							'description' => __( 'The template prefix for the created template. This is used to extract the main template type ex. in `taxonomy-books` we extract the `taxonomy`', 'gutenberg' ),
							'type'        => 'string',
						),
					),
				),
			)
		);
		parent::register_routes();
		// Get fallback template content.
	}

	/**
	 * Returns the fallback template for a given slug.
	 *
	 * @param WP_REST_Request $request The request instance.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_template_fallback( $request ) {
		$hierarchy         = get_template_hierarchy( $request['slug'], $request['is_custom'], $request['template_prefix'] );
		$fallback_template = null;
		do {
			$fallback_template = resolve_block_template( $request['slug'], $hierarchy, '' );
			array_shift( $hierarchy );
		} while ( ! empty( $hierarchy ) && empty( $fallback_template->content ) );
		$response = $this->prepare_item_for_response( $fallback_template, $request );
		return rest_ensure_response( $response );
	}

	/**
	 * Prepare a single template output for response
	 *
	 * @since 5.8.0
	 * @since 5.9.0 Renamed `$template` to `$item` to match parent class for PHP 8 named parameter support.
	 * @since 6.3.0 Added prepare_revision_links() method to get revision links, and added `modified` property to the response.
	 *
	 * @since 6.3.0 Added prepare_revision_links() method to get revision links.
	 *
	 * @param WP_Block_Template $item    Template instance.
	 * @param WP_REST_Request   $request Request object.
	 * @return WP_REST_Response Response object.
	 */
	public function prepare_item_for_response( $item, $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$template = $item;

		$fields = $this->get_fields_for_response( $request );

		$response = parent::prepare_item_for_response( $item, $request );

		/*
		 * The instanceof condition is required in Gutenberg to guard against instances of WP_Block_Template,
		 * which does not have the property. This is a temporary workaround until the WP_Block_Template
		 * class is updated in Core to include the property.
		 */
		if ( $template instanceof Gutenberg_Block_Template ) {
			if ( rest_is_field_included( 'modified', $fields ) ) {
				$response->data['modified'] = $template->modified;
			}
		}

		if ( rest_is_field_included( '_links', $fields ) || rest_is_field_included( '_embedded', $fields ) ) {
			$links = $this->prepare_revision_links( $template );
			$response->add_links( $links );
			if ( ! empty( $links['self']['href'] ) ) {
				$actions = $this->get_available_actions();
				$self    = $links['self']['href'];
				foreach ( $actions as $rel ) {
					$response->add_link( $rel, $self );
				}
			}
		}

		return $response;
	}

	/**
	 * Adds revisions to links.
	 *
	 * @since 6.3.0
	 *
	 * @param WP_Block_Template $template  Template instance.
	 * @return array Links for the given post.
	 */
	protected function prepare_revision_links( $template ) {
		$links = array();

		if ( post_type_supports( $this->post_type, 'revisions' ) && (int) $template->wp_id ) {
			$revisions       = wp_get_latest_revision_id_and_total_count( (int) $template->wp_id );
			$revisions_count = ! is_wp_error( $revisions ) ? $revisions['count'] : 0;
			$revisions_base  = sprintf( '/%s/%s/%s/revisions', $this->namespace, $this->rest_base, $template->id );

			$links['version-history'] = array(
				'href'  => rest_url( $revisions_base ),
				'count' => $revisions_count,
			);

			if ( $revisions_count > 0 ) {
				$links['predecessor-version'] = array(
					'href' => rest_url( $revisions_base . '/' . $revisions['latest_id'] ),
					'id'   => $revisions['latest_id'],
				);
			}
		}

		return $links;
	}

	/**
	 * Returns the given template
	 *
	 * @since 5.8.0
	 *
	 * @param WP_REST_Request $request The request instance.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_item( $request ) {
		if ( isset( $request['source'] ) && 'theme' === $request['source'] ) {
			$template = get_block_file_template( $request['id'], $this->post_type );
		} else {
			$template = gutenberg_get_block_template( $request['id'], $this->post_type );
		}

		if ( ! $template ) {
			return new WP_Error( 'rest_template_not_found', __( 'No templates exist with that id.' ), array( 'status' => 404 ) );
		}

		return $this->prepare_item_for_response( $template, $request );
	}

	/**
	 * Retrieves the block type' schema, conforming to JSON Schema.
	 *
	 * @since 5.8.0
	 * @since 5.9.0 Added `'area'`.
	 * @since 6.3.0 Added `'modified'`.
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
				'id'             => array(
					'description' => __( 'ID of template.' ),
					'type'        => 'string',
					'context'     => array( 'embed', 'view', 'edit' ),
					'readonly'    => true,
				),
				'slug'           => array(
					'description' => __( 'Unique slug identifying the template.' ),
					'type'        => 'string',
					'context'     => array( 'embed', 'view', 'edit' ),
					'required'    => true,
					'minLength'   => 1,
					'pattern'     => '[a-zA-Z0-9_\%-]+',
				),
				'theme'          => array(
					'description' => __( 'Theme identifier for the template.' ),
					'type'        => 'string',
					'context'     => array( 'embed', 'view', 'edit' ),
				),
				'type'           => array(
					'description' => __( 'Type of template.' ),
					'type'        => 'string',
					'context'     => array( 'embed', 'view', 'edit' ),
				),
				'source'         => array(
					'description' => __( 'Source of template' ),
					'type'        => 'string',
					'context'     => array( 'embed', 'view', 'edit' ),
					'readonly'    => true,
				),
				'origin'         => array(
					'description' => __( 'Source of a customized template' ),
					'type'        => 'string',
					'context'     => array( 'embed', 'view', 'edit' ),
					'readonly'    => true,
				),
				'content'        => array(
					'description' => __( 'Content of template.' ),
					'type'        => array( 'object', 'string' ),
					'default'     => '',
					'context'     => array( 'embed', 'view', 'edit' ),
					'properties'  => array(
						'raw'           => array(
							'description' => __( 'Content for the template, as it exists in the database.' ),
							'type'        => 'string',
							'context'     => array( 'view', 'edit' ),
						),
						'block_version' => array(
							'description' => __( 'Version of the content block format used by the template.' ),
							'type'        => 'integer',
							'context'     => array( 'edit' ),
							'readonly'    => true,
						),
					),
				),
				'title'          => array(
					'description' => __( 'Title of template.' ),
					'type'        => array( 'object', 'string' ),
					'default'     => '',
					'context'     => array( 'embed', 'view', 'edit' ),
					'properties'  => array(
						'raw'      => array(
							'description' => __( 'Title for the template, as it exists in the database.' ),
							'type'        => 'string',
							'context'     => array( 'view', 'edit', 'embed' ),
						),
						'rendered' => array(
							'description' => __( 'HTML title for the template, transformed for display.' ),
							'type'        => 'string',
							'context'     => array( 'view', 'edit', 'embed' ),
							'readonly'    => true,
						),
					),
				),
				'description'    => array(
					'description' => __( 'Description of template.' ),
					'type'        => 'string',
					'default'     => '',
					'context'     => array( 'embed', 'view', 'edit' ),
				),
				'status'         => array(
					'description' => __( 'Status of template.' ),
					'type'        => 'string',
					'enum'        => array_keys( get_post_stati( array( 'internal' => false ) ) ),
					'default'     => 'publish',
					'context'     => array( 'embed', 'view', 'edit' ),
				),
				'wp_id'          => array(
					'description' => __( 'Post ID.' ),
					'type'        => 'integer',
					'context'     => array( 'embed', 'view', 'edit' ),
					'readonly'    => true,
				),
				'has_theme_file' => array(
					'description' => __( 'Theme file exists.' ),
					'type'        => 'bool',
					'context'     => array( 'embed', 'view', 'edit' ),
					'readonly'    => true,
				),
				'author'         => array(
					'description' => __( 'The ID for the author of the template.' ),
					'type'        => 'integer',
					'context'     => array( 'view', 'edit', 'embed' ),
				),
				'modified'       => array(
					'description' => __( "The date the post was last modified, in the site's timezone." ),
					'type'        => 'string',
					'format'      => 'date-time',
					'context'     => array( 'view', 'edit' ),
					'readonly'    => true,
				),
			),
		);

		if ( 'wp_template' === $this->post_type ) {
			$schema['properties']['is_custom'] = array(
				'description' => __( 'Whether a template is a custom template.' ),
				'type'        => 'bool',
				'context'     => array( 'embed', 'view', 'edit' ),
				'readonly'    => true,
			);
		}

		if ( 'wp_template_part' === $this->post_type ) {
			$schema['properties']['area'] = array(
				'description' => __( 'Where the template part is intended for use (header, footer, etc.)' ),
				'type'        => 'string',
				'context'     => array( 'embed', 'view', 'edit' ),
			);
		}

		$this->schema = $schema;

		return $this->add_additional_fields_schema( $this->schema );
	}
}
