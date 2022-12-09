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
class Gutenberg_REST_Block_Patterns_Controller_6_2 extends Gutenberg_REST_Block_Patterns_Controller_6_1 {
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
			_load_remote_block_patterns(); // Patterns with the `core` keyword.
			_load_remote_featured_patterns(); // Patterns in the `featured` category.
			_register_remote_theme_patterns(); // Patterns requested by current theme.

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
