<?php
/**
 * PHP and WordPress configuration compatibility functions for the Gutenberg
 * editor plugin changes related to REST API.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

/**
 * Update the preload paths registered in Core (`site-editor.php` or `edit-form-blocks.php`).
 *
 * @param array                   $paths REST API paths to preload.
 * @param WP_Block_Editor_Context $context Current block editor context.
 * @return array Filtered preload paths.
 */
function gutenberg_block_editor_preload_paths_6_7( $paths, $context ) {
	if ( 'core/edit-site' === $context->name ) {
		// Fixes post type name. It should be `type/wp_template_part`.
		$parts_key = array_search( '/wp/v2/types/wp_template-part?context=edit', $paths, true );
		if ( false !== $parts_key ) {
			$paths[ $parts_key ] = '/wp/v2/types/wp_template_part?context=edit';
		}
	}

	return $paths;
}
add_filter( 'block_editor_rest_api_preload_paths', 'gutenberg_block_editor_preload_paths_6_7', 10, 2 );

if ( ! function_exists( 'wp_api_template_registry' ) ) {
	/**
	 * Hook in to the template and template part post types and modify the rest
	 * endpoint to include modifications to read templates from the
	 * BlockTemplatesRegistry.
	 *
	 * @param array  $args Current registered post type args.
	 * @param string $post_type Name of post type.
	 *
	 * @return array
	 */
	function wp_api_template_registry( $args, $post_type ) {
		if ( 'wp_template' === $post_type || 'wp_template_part' === $post_type ) {
			$args['rest_controller_class'] = 'Gutenberg_REST_Templates_Controller_6_7';
		}
		return $args;
	}
}
add_filter( 'register_post_type_args', 'wp_api_template_registry', 10, 2 );

/**
 * Registers additional fields for wp_template rest api.
 *
 * @access private
 * @internal
 *
 * @param  array $template_object Template object.
 * @return string                 Human readable text for the author.
 */
function _gutenberg_get_wp_templates_plugin_field( $template_object ) {
	if ( $template_object ) {
		$registered_template = WP_Templates_Registry::get_instance()->get_by_slug( $template_object['slug'] );
		if ( $registered_template ) {
			return $registered_template->plugin;
		}
	}

	return;
}

/**
 * Adds `plugin` fields to WP_REST_Templates_Controller class.
 */
function gutenberg_register_wp_rest_templates_controller_plugin_field() {

	register_rest_field(
		'wp_template',
		'plugin',
		array(
			'get_callback'    => '_gutenberg_get_wp_templates_plugin_field',
			'update_callback' => null,
			'schema'       => array(
				'type'        => 'string',
				'description' => __( 'Plugin that registered the template.', 'gutenberg' ),
				'readonly'    => true,
				'context'     => array( 'view', 'edit', 'embed' ),
			),
		)
	);
}
add_action( 'rest_api_init', 'gutenberg_register_wp_rest_templates_controller_plugin_field' );
