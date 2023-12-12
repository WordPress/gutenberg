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

/**
 * Registers additional fields for wp_template and wp_template_part rest api.
 *
 * @access private
 * @internal
 *
 * @param  array $template_object Template object.
 * @return string                 Original source of the template one of theme, plugin, site, or user.
 */
function _gutenberg_get_wp_templates_original_source_field( $template_object ) {
	if ( 'wp_template' === $template_object['type'] || 'wp_template_part' === $template_object['type'] ) {
		// Added by theme.
		// Template originally provided by a theme, but customized by a user.
		// Templates originally didn't have the 'origin' field so identify
		// older customized templates by checking for no origin and a 'theme'
		// or 'custom' source.
		if ( $template_object['has_theme_file'] &&
			( 'theme' === $template_object['origin'] || (
				empty( $template_object['origin'] ) && in_array(
					$template_object['source'],
					array(
						'theme',
						'custom',
					),
					true
				) )
			)
		) {
			return 'theme';
		}

		// Added by plugin.
		if ( $template_object['has_theme_file'] && 'plugin' === $template_object['origin'] ) {
			return 'plugin';
		}

		// Added by site.
		// Template was created from scratch, but has no author. Author support
		// was only added to templates in WordPress 5.9. Fallback to showing the
		// site logo and title.
		if ( empty( $template_object['has_theme_file'] ) && 'custom' === $template_object['source'] && empty( $template_object['author'] ) ) {
			return 'site';
		}
	}

	// Added by user.
	return 'user';
}

/**
 * Registers additional fields for wp_template and wp_template_part rest api.
 *
 * @access private
 * @internal
 *
 * @param  array $template_object Template object.
 * @return string                 Human readable text for the author.
 */
function _gutenberg_get_wp_templates_author_text_field( $template_object ) {
	$original_source = _gutenberg_get_wp_templates_original_source_field( $template_object );
	switch ( $original_source ) {
		case 'theme':
			$theme_name = wp_get_theme( $template_object['theme'] )->get( 'Name' );
			return empty( $theme_name ) ? $template_object['theme'] : $theme_name;
		case 'plugin':
			$plugins = get_plugins();
			$plugin  = $plugins[ plugin_basename( sanitize_text_field( $template_object['theme'] . '.php' ) ) ];
			return empty( $plugin['Name'] ) ? $template_object['theme'] : $plugin['Name'];
		case 'site':
			return get_bloginfo( 'name' );
		case 'user':
			$author = get_user_by( 'id', $template_object['author'] );
			if ( ! $author ) {
				return __( 'Unknown author', 'gutenberg' );
			}
			return $author->get( 'display_name' );
	}
}

/**
 * Registers additional fields for wp_template and wp_template_part rest api.
 *
 * @access private
 * @internal
 */
function _gutenberg_register_wp_templates_additional_fields() {
	register_rest_field(
		array( 'wp_template', 'wp_template_part' ),
		'author_text',
		array(
			'get_callback'    => '_gutenberg_get_wp_templates_author_text_field',
			'update_callback' => null,
			'schema'          => array(
				'type'        => 'string',
				'description' => __( 'Human readable text for the author.', 'gutenberg' ),
				'readonly'    => true,
				'context'     => array( 'view', 'edit', 'embed' ),
			),
		)
	);

	register_rest_field(
		array( 'wp_template', 'wp_template_part' ),
		'original_source',
		array(
			'get_callback'    => '_gutenberg_get_wp_templates_original_source_field',
			'update_callback' => null,
			'schema'          => array(
				'description' => __( 'Where the template originally comes from e.g. \'theme\'', 'gutenberg' ),
				'type'        => 'string',
				'readonly'    => true,
				'context'     => array( 'view', 'edit', 'embed' ),
				'enum'        => array(
					'theme',
					'plugin',
					'site',
					'user',
				),
			),
		)
	);
}

add_action( 'rest_api_init', '_gutenberg_register_wp_templates_additional_fields' );
