<?php
/**
 * Compatibility fixes for WP 5.9 and Site Editor.
 *
 * It can be removed after the minimum required WP version is 6.0
 *
 * @package WordPress
 */

/**
 * Return the correct template for the site's home page.
 *
 * @access private
 * @since 6.0.0
 *
 * @return array|null A template object, or null if none could be found
 */
function gutenberg_resolve_home_template() {
	$show_on_front = get_option( 'show_on_front' );
	$front_page_id = get_option( 'page_on_front' );

	if ( 'page' === $show_on_front && $front_page_id ) {
		return array(
			'postType' => 'page',
			'postId'   => $front_page_id,
		);
	}

	$hierarchy = array( 'front-page', 'home', 'index' );
	$template  = resolve_block_template( 'home', $hierarchy, '' );

	if ( ! $template ) {
		return null;
	}

	return array(
		'postType' => 'wp_template',
		'postId'   => $template->id,
	);
}

/**
 * Do a server-side redirection if missing `postType` and `postId`
 * query args when visiting site editor.
 *
 * Note: This is a backward compatibility redirect for WP 5.9.
 *
 * @return void
 */
function gutenberg_site_editor_maybe_redirect() {
	// Skip redirection for WP 6.0 and later.
	if ( function_exists( '_resolve_home_block_template' ) ) {
		return;
	}

	// Check theme support. The action runs before checks in the Site Editor.
	if ( ! wp_is_block_theme() ) {
		return;
	}

	if ( empty( $_GET['postType'] ) && empty( $_GET['postId'] ) ) {
		$template = gutenberg_resolve_home_template();
		if ( ! empty( $_GET['styles'] ) ) {
			$template['styles'] = sanitize_key( $_GET['styles'] );
		}

		$redirect_url = add_query_arg(
			$template,
			admin_url( 'site-editor.php' )
		);
		wp_safe_redirect( $redirect_url );
		exit;
	}
}
add_action( 'load-site-editor.php', 'gutenberg_site_editor_maybe_redirect' );

/**
 * Add home template settings for WP 5.9.
 *
 * @param array                   $settings Existing block editor settings.
 * @param WP_Block_Editor_Context $context The current block editor context.
 * @return array
 */
function gutenberg_site_editor_homepage_setting( $settings, $context ) {
	if ( isset( $context->post ) ) {
		return $settings;
	}

	if ( ! isset( $settings['__unstableHomeTemplate'] ) ) {
		$settings['__unstableHomeTemplate'] = gutenberg_resolve_home_template();
	}

	return $settings;
}
add_filter( 'block_editor_settings_all', 'gutenberg_site_editor_homepage_setting', 10, 2 );
