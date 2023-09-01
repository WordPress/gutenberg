<?php
/**
 * REST API: Gutenberg_REST_Block_Patterns_Controller_6_2 class
 *
 * @package    Gutenberg
 * @subpackage REST_API
 */

/**
 * Core class used to access block patterns via the REST API.
 *
 * @since 6.0.0
 *
 * @see WP_REST_Controller
 */
class Gutenberg_REST_Block_Patterns_Controller_6_2 extends WP_REST_Block_Patterns_Controller {
	/**
	 * Defines whether remote patterns should be loaded.
	 *
	 * @since 6.0.0
	 * @var bool
	 */
	private $remote_patterns_loaded;

	/**
	 * An array that maps old categories names to new ones.
	 *
	 * @since 6.2.0
	 * @var array
	 */
	protected static $categories_migration = array(
		'buttons' => 'call-to-action',
		'columns' => 'text',
		'query'   => 'posts',
	);

	/**
	 * Prepare a raw block pattern before it gets output in a REST API response.
	 *
	 * @since 6.0.0
	 *
	 * @param array           $item    Raw pattern as registered, before any changes.
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function prepare_item_for_response( $item, $request ) {
		$fields = $this->get_fields_for_response( $request );
		$keys   = array(
			'name'          => 'name',
			'title'         => 'title',
			'description'   => 'description',
			'viewportWidth' => 'viewport_width',
			'blockTypes'    => 'block_types',
			'postTypes'     => 'post_types',
			'categories'    => 'categories',
			'keywords'      => 'keywords',
			'content'       => 'content',
			'inserter'      => 'inserter',
			'templateTypes' => 'template_types',
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

	/**
	 * Retrieves the block pattern schema, conforming to JSON Schema.
	 *
	 * @since 6.0.0
	 * @since 6.1.0 Added `post_types` property.
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		if ( $this->schema ) {
			return $this->add_additional_fields_schema( $this->schema );
		}

		$schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'block-pattern',
			'type'       => 'object',
			'properties' => array(
				'name'           => array(
					'description' => __( 'The pattern name.', 'gutenberg' ),
					'type'        => 'string',
					'readonly'    => true,
					'context'     => array( 'view', 'edit', 'embed' ),
				),
				'title'          => array(
					'description' => __( 'The pattern title, in human readable format.', 'gutenberg' ),
					'type'        => 'string',
					'readonly'    => true,
					'context'     => array( 'view', 'edit', 'embed' ),
				),
				'description'    => array(
					'description' => __( 'The pattern detailed description.', 'gutenberg' ),
					'type'        => 'string',
					'readonly'    => true,
					'context'     => array( 'view', 'edit', 'embed' ),
				),
				'viewport_width' => array(
					'description' => __( 'The pattern viewport width for inserter preview.', 'gutenberg' ),
					'type'        => 'number',
					'readonly'    => true,
					'context'     => array( 'view', 'edit', 'embed' ),
				),
				'block_types'    => array(
					'description' => __( 'Block types that the pattern is intended to be used with.', 'gutenberg' ),
					'type'        => 'array',
					'readonly'    => true,
					'context'     => array( 'view', 'edit', 'embed' ),
				),
				'post_types'     => array(
					'description' => __( 'An array of post types that the pattern is restricted to be used with.', 'gutenberg' ),
					'type'        => 'array',
					'readonly'    => true,
					'context'     => array( 'view', 'edit', 'embed' ),
				),
				'categories'     => array(
					'description' => __( 'The pattern category slugs.', 'gutenberg' ),
					'type'        => 'array',
					'readonly'    => true,
					'context'     => array( 'view', 'edit', 'embed' ),
				),
				'keywords'       => array(
					'description' => __( 'The pattern keywords.', 'gutenberg' ),
					'type'        => 'array',
					'readonly'    => true,
					'context'     => array( 'view', 'edit', 'embed' ),
				),
				'template_types' => array(
					'description' => __( 'An array of template types where the pattern fits.', 'gutenberg' ),
					'type'        => 'array',
					'readonly'    => true,
					'context'     => array( 'view', 'edit', 'embed' ),
				),
				'content'        => array(
					'description' => __( 'The pattern content.', 'gutenberg' ),
					'type'        => 'string',
					'readonly'    => true,
					'context'     => array( 'view', 'edit', 'embed' ),
				),
				'inserter'       => array(
					'description' => __( 'Determines whether the pattern is visible in inserter.', 'gutenberg' ),
					'type'        => 'boolean',
					'readonly'    => true,
					'context'     => array( 'view', 'edit', 'embed' ),
				),
			),
		);

		$this->schema = $schema;

		return $this->add_additional_fields_schema( $this->schema );
	}

	/**
	 * Registers the routes for the objects of the controller.
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
			true
		);
	}
	/**
	 * Retrieves all block patterns.
	 *
	 * @since 6.0.0
	 * @since 6.2.0 Added migration for old core pattern categories to the new ones.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_items( $request ) {
		if ( ! $this->remote_patterns_loaded ) {
			// Load block patterns from w.org.
			gutenberg_load_remote_block_patterns(); // Patterns with the `core` keyword.
			gutenberg_load_remote_featured_patterns(); // Patterns in the `featured` category.
			gutenberg_register_remote_theme_patterns(); // Patterns requested by current theme.

			$this->remote_patterns_loaded = true;
		}

		$response = array();
		$patterns = WP_Block_Patterns_Registry::get_instance()->get_all_registered();
		foreach ( $patterns as $pattern ) {
			$migrated_pattern = $this->migrate_pattern_categories( $pattern );
			$prepared_pattern = $this->prepare_item_for_response( $migrated_pattern, $request );
			$response[]       = $this->prepare_response_for_collection( $prepared_pattern );
		}
		return rest_ensure_response( $response );
	}

	/**
	 * Migrates old core pattern categories to new ones.
	 *
	 * Core pattern categories are being revamped and we need to handle the migration
	 * to the new ones and ensure backwards compatibility.
	 *
	 * @since 6.2.0
	 *
	 * @param array $pattern Raw pattern as registered, before applying any changes.
	 * @return array Migrated pattern.
	 */
	protected function migrate_pattern_categories( $pattern ) {
		if ( isset( $pattern['categories'] ) && is_array( $pattern['categories'] ) ) {
			foreach ( $pattern['categories'] as $i => $category ) {
				if ( array_key_exists( $category, static::$categories_migration ) ) {
					$pattern['categories'][ $i ] = static::$categories_migration[ $category ];
				}
			}
		}
		return $pattern;
	}
}
