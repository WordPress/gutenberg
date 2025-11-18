<?php
/**
 * REST API: Gutenberg_REST_Block_Patterns_Controller_7_0 class
 *
 * @package gutenberg
 */

/**
 * Core class used to access block patterns via the REST API.
 *
 * @see WP_REST_Block_Patterns_Controller
 */
class Gutenberg_REST_Block_Patterns_Controller_7_0 extends WP_REST_Block_Patterns_Controller {
	public function __construct() {
		parent::__construct();
	}

	/**
	 * Note: no changes have been made to this class.
	 * This class extension exists only to override the core route,
	 * and to ensure the gutenberg_resolve_pattern_blocks function is used in the prepare_item_for_response method.
	 * See: https://github.com/WordPress/gutenberg/pull/72988
	 *
	 * @since 6.0.0
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			),
			true // Override the core route.
		);
	}

	/**
	 * Note: no changes have been made to this class.
	 * This class extension exists only to override the core route,
	 * and to ensure the gutenberg_resolve_pattern_blocks function is used in the prepare_item_for_response method.
	 * See: https://github.com/WordPress/gutenberg/pull/72988
	 *
	 * @since 6.0.0
	 * @since 6.3.0 Added `source` property.
	 *
	 * @param array           $item    Raw pattern as registered, before any changes.
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function prepare_item_for_response( $item, $request ) {
		$blocks          = parse_blocks( $item['content'] );
		$blocks          = gutenberg_resolve_pattern_blocks( $blocks );
		$item['content'] = serialize_blocks( $blocks );

		$fields = $this->get_fields_for_response( $request );
		$keys   = array(
			'name'          => 'name',
			'title'         => 'title',
			'content'       => 'content',
			'description'   => 'description',
			'viewportWidth' => 'viewport_width',
			'inserter'      => 'inserter',
			'categories'    => 'categories',
			'keywords'      => 'keywords',
			'blockTypes'    => 'block_types',
			'postTypes'     => 'post_types',
			'templateTypes' => 'template_types',
			'source'        => 'source',
		);
		$data   = array();
		foreach ( $keys as $item_key => $rest_key ) {
			if ( isset( $item[ $item_key ] ) && rest_is_field_included( $rest_key, $fields ) ) {
				$data[ $rest_key ] = $item[ $item_key ];
			}
		}

		$context = ! empty( $request['context'] ) ? $request['context'] : 'view';
		$data    = $this->add_additional_fields_to_object( $data, $request );
		$data    = $this->filter_response_by_context( $data, $context );
		return rest_ensure_response( $data );
	}
}
