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
 * Registers the Global Styles Revisions REST API routes.
 */
function gutenberg_register_global_styles_revisions_endpoints() {
	$global_styles_revisions_controller = new Gutenberg_REST_Global_Styles_Revisions_Controller_6_5();
	$global_styles_revisions_controller->register_routes();
}

add_action( 'rest_api_init', 'gutenberg_register_global_styles_revisions_endpoints' );

function gutenberg_get_wp_templates_author_text_field( $template_object ) {
	if ( 'wp_template' === $template_object['type'] || 'wp_template_part' === $template_object['type'] ) {
		// Added by theme.
		// Template originally provided by a theme, but customized by a user.
		// Templates originally didn't have the 'origin' field so identify
		// older customized templates by checking for no origin and a 'theme'
		// or 'custom' source.
		if ( $template_object['has_theme_file'] &&
			( 'theme' === $template_object['origin'] || (
				empty( $template_object['origin'] ) && in_array( $template_object['source'], array(
					'theme',
					'custom',
				), true ) )
			)
		) {
			$theme_name = wp_get_theme( $template_object['theme'] )->get( 'Name' );
			return empty( $theme_name ) ? $template_object['theme'] : $theme_name;
		}

		// Added by plugin.
		if ( $template_object['has_theme_file'] && $template_object['origin'] === 'plugin' ) {
			$plugins = get_plugins();
			$plugin = $plugins[ plugin_basename( sanitize_text_field( $template_object['theme'] . '.php' ) ) ];
			return empty( $plugin['Name'] ) ? $template_object['theme'] : $plugin['Name'];
		}

		// Added by site.
		// Template was created from scratch, but has no author. Author support
		// was only added to templates in WordPress 5.9. Fallback to showing the
		// site logo and title.
		if ( empty( $template_object['has_theme_file'] ) && $template_object['source'] === 'custom' && empty( $template_object['author'] ) ) {
			return get_bloginfo( 'name' );
		}
	}

	// Added by user.
	return get_user_by( 'id', $template_object['author'] );
}

/**
 * Registers the Global Styles Revisions REST API routes.
 */
function gutenberg_register_wp_templates_author_text_field() {
	register_rest_field(
		'wp_template',
		'author_text',
		array(
			'get_callback'    => 'gutenberg_get_wp_templates_author_text_field',
			'update_callback' => null,
			'schema'          => null,
		)
	);
}

add_action( 'rest_api_init', 'gutenberg_register_wp_templates_author_text_field' );
