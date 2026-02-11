<?php
/**
 * Content Guidelines Post Type registration.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

/**
 * Handles registration of the Content Guidelines custom post type.
 */
class Gutenberg_Content_Guidelines_Post_Type {

	/**
	 * The post type name.
	 *
	 * @var string
	 */
	const POST_TYPE = 'wp_guidelines';

	/**
	 * The standard guideline category meta keys.
	 *
	 * @var array
	 */
	const CATEGORY_META_KEYS = array(
		'copy',
		'images',
		'site',
		'other',
	);

	/**
	 * Prefix for block-specific guideline meta keys.
	 *
	 * @var string
	 */
	const BLOCK_META_PREFIX = '_content_guideline_block_';

	/**
	 * Register the custom post type.
	 */
	public static function register() {
		$args = array(
			'labels'                => array(
				'name'          => __( 'Content Guidelines', 'gutenberg' ),
				'singular_name' => __( 'Content Guidelines', 'gutenberg' ),
			),
			'public'                => false,
			'publicly_queryable'    => false,
			'show_ui'               => false,
			'show_in_menu'          => false,
			'show_in_rest'          => true,
			'rest_namespace'        => 'wp/v2',
			'rest_base'             => 'content-guidelines',
			'rest_controller_class' => 'Gutenberg_Content_Guidelines_REST_Controller',
			'capability_type'       => 'post',
			'capabilities'          => array(
				'read'                   => 'edit_posts',
				'create_posts'           => 'manage_options',
				'edit_posts'             => 'manage_options',
				'edit_published_posts'   => 'manage_options',
				'delete_posts'           => 'manage_options',
				'delete_published_posts' => 'manage_options',
				'edit_others_posts'      => 'manage_options',
				'delete_others_posts'    => 'manage_options',
				'publish_posts'          => 'manage_options',
			),
			'map_meta_cap'          => true,
			'supports'              => array( 'revisions' ),
			'hierarchical'          => false,
			'has_archive'           => false,
			'rewrite'               => false,
			'query_var'             => false,
			'can_export'            => true,
		);

		register_post_type( self::POST_TYPE, $args );
	}

	/**
	 * Register post meta fields with revision support.
	 *
	 * Standard categories are registered here. Block-specific meta keys
	 * are not registered individually - they're handled dynamically via
	 * the wp_post_revision_meta_keys filter.
	 */
	public static function register_post_meta() {
		// Register standard category meta.
		foreach ( self::CATEGORY_META_KEYS as $category ) {
			$meta_key = '_content_guideline_' . $category;

			register_post_meta(
				self::POST_TYPE,
				$meta_key,
				array(
					'show_in_rest'      => true,
					'single'            => true,
					'type'              => 'string',
					'revisions_enabled' => true,
					'auth_callback'     => function () {
						return current_user_can( 'manage_options' );
					},
					'sanitize_callback' => 'sanitize_textarea_field',
				)
			);
		}
	}

	/**
	 * Convert a block name to a meta key.
	 *
	 * @param string $block_name The block name (e.g., 'core/paragraph').
	 * @return string The meta key (e.g., '_content_guideline_block_core_paragraph').
	 */
	public static function block_name_to_meta_key( $block_name ) {
		// Replace '/' with '_' to create a valid meta key.
		$sanitized = str_replace( '/', '_', $block_name );
		return self::BLOCK_META_PREFIX . $sanitized;
	}

	/**
	 * Convert a meta key back to a block name.
	 *
	 * @param string $meta_key The meta key (e.g., '_content_guideline_block_core_paragraph').
	 * @return string The block name (e.g., 'core/paragraph').
	 */
	public static function meta_key_to_block_name( $meta_key ) {
		// Remove prefix and convert first '_' back to '/'.
		$without_prefix = str_replace( self::BLOCK_META_PREFIX, '', $meta_key );
		// Replace first underscore with '/' (namespace separator).
		return preg_replace( '/_/', '/', $without_prefix, 1 );
	}

	/**
	 * Check if a meta key is a block guideline meta key.
	 *
	 * @param string $meta_key The meta key to check.
	 * @return bool True if it's a block guideline meta key.
	 */
	public static function is_block_meta_key( $meta_key ) {
		return strpos( $meta_key, self::BLOCK_META_PREFIX ) === 0;
	}
}
