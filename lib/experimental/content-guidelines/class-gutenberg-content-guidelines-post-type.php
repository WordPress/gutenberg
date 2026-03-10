<?php
/**
 * Content Guidelines Post Type registration.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
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
	const POST_TYPE = 'wp_content_guideline';

	/**
	 * The standard guideline category meta keys.
	 *
	 * @var array
	 */
	const CATEGORY_META_KEYS = array(
		'copy',
		'images',
		'site',
		'additional',
	);

	/**
	 * All valid guideline category keys for filtering.
	 *
	 * Includes standard categories plus 'blocks'.
	 *
	 * @var array
	 */
	const VALID_CATEGORIES = array(
		'copy',
		'images',
		'site',
		'additional',
		'blocks',
	);

	/**
	 * Valid guideline statuses.
	 *
	 * @var array
	 */
	const VALID_STATUSES = array(
		'draft',
		'publish',
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
			'labels'                          => array(
				'name'          => __( 'Content Guidelines', 'gutenberg' ),
				'singular_name' => __( 'Content Guidelines', 'gutenberg' ),
			),
			'public'                          => false,
			'publicly_queryable'              => false,
			'show_ui'                         => false,
			'show_in_menu'                    => false,
			'show_in_rest'                    => true,
			'rest_base'                       => 'content-guidelines',
			'rest_controller_class'           => 'Gutenberg_Content_Guidelines_REST_Controller',
			'revisions_rest_controller_class' => 'Gutenberg_Content_Guidelines_Revisions_Controller',
			'capability_type'                 => 'post',
			'capabilities'                    => array(
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
			'map_meta_cap'                    => true,
			'supports'                        => array( 'revisions' ),
			'hierarchical'                    => false,
			'has_archive'                     => false,
			'rewrite'                         => false,
			'query_var'                       => false,
			'can_export'                      => true,
		);

		register_post_type( self::POST_TYPE, $args );
	}

	/**
	 * Register post meta fields with revision support.
	 */
	public static function register_post_meta() {
		$meta_args = array(
			'show_in_rest'      => true,
			'single'            => true,
			'type'              => 'string',
			'revisions_enabled' => true,
			'auth_callback'     => function () {
				return current_user_can( 'manage_options' );
			},
			'sanitize_callback' => 'sanitize_textarea_field',
		);

		// Register standard category meta.
		foreach ( self::CATEGORY_META_KEYS as $category ) {
			register_post_meta( self::POST_TYPE, '_content_guideline_' . $category, $meta_args );
		}

		// Register meta for content blocks.
		foreach ( self::get_content_blocks() as $block_name ) {
			register_post_meta( self::POST_TYPE, self::block_name_to_meta_key( $block_name ), $meta_args );
		}
	}

	/**
	 * Get block names that have content role attributes.
	 *
	 * @return array Block names with content role.
	 */
	public static function get_content_blocks() {
		$content_blocks = array();
		$registry       = WP_Block_Type_Registry::get_instance();

		foreach ( $registry->get_all_registered() as $block_type ) {
			if ( self::block_has_content_role( $block_type ) ) {
				$content_blocks[] = $block_type->name;
			}
		}

		return $content_blocks;
	}

	/**
	 * Check if a block type has any attribute with content role.
	 *
	 * @param WP_Block_Type $block_type The block type to check.
	 * @return bool True if block has content role attribute.
	 */
	private static function block_has_content_role( $block_type ) {
		if ( empty( $block_type->attributes ) ) {
			return false;
		}

		foreach ( $block_type->attributes as $attribute ) {
			if ( isset( $attribute['role'] ) && 'content' === $attribute['role'] ) {
				return true;
			}
		}

		return false;
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

	/**
	 * Gets guideline categories from post meta.
	 *
	 * Shared between the post controller and revisions controller.
	 *
	 * @param int $post_id Post ID (can be a post or revision ID).
	 * @return array Guideline categories.
	 */
	public static function get_guideline_categories_from_meta( $post_id ) {
		$category_labels = array(
			'copy'       => __( 'Copy Guidelines', 'gutenberg' ),
			'images'     => __( 'Image Guidelines', 'gutenberg' ),
			'site'       => __( 'Site Context', 'gutenberg' ),
			'additional' => __( 'Additional Guidelines', 'gutenberg' ),
		);

		$guideline_categories = array();

		// Get standard categories.
		foreach ( self::CATEGORY_META_KEYS as $category ) {
			$meta_key = '_content_guideline_' . $category;
			$value    = get_post_meta( $post_id, $meta_key, true );

			$guideline_categories[ $category ] = array(
				'label'      => $category_labels[ $category ],
				'guidelines' => $value,
			);
		}

		// Get block-specific guidelines from individual meta keys.
		$all_meta = get_post_meta( $post_id );

		$blocks = array();
		foreach ( $all_meta as $meta_key => $meta_values ) {
			if ( self::is_block_meta_key( $meta_key ) ) {
				$block_name = self::meta_key_to_block_name( $meta_key );
				$value      = isset( $meta_values[0] ) ? $meta_values[0] : '';

				if ( ! empty( $value ) ) {
					$blocks[ $block_name ] = array(
						'guidelines' => $value,
					);
				}
			}
		}

		if ( ! empty( $blocks ) ) {
			$guideline_categories['blocks'] = $blocks;
		}

		return $guideline_categories;
	}
}
