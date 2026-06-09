<?php
/**
 * Omnibar experiment.
 *
 * @package gutenberg
 */

/**
 * Enables the omnibar experiment.
 */
function gutenberg_enable_omnibar_experiment() {
	$screen = get_current_screen();
	if (
		! $screen ||
		! is_admin_bar_showing() ||
		! gutenberg_is_experiment_enabled( 'gutenberg-omnibar' )
	) {
		return;
	}

	$is_post_editor = 'post' === $screen->base && $screen->is_block_editor();
	$is_site_editor = 'site-editor' === $screen->id;
	if ( ! $is_post_editor && ! $is_site_editor ) {
		return;
	}

	wp_add_inline_script(
		'wp-block-editor',
		'window.__experimentalAdminBarInEditor = true',
		'before'
	);
}

add_action( 'admin_enqueue_scripts', 'gutenberg_enable_omnibar_experiment' );

/**
 * Adds a body class when the omnibar experiment is enabled.
 *
 * Applied on every admin page where the admin bar is shown, so that
 * pages that use wp-build (such as `font-library-wp-admin`)
 * will get the experiment treatment.
 *
 * @param string $classes Space-separated list of admin body classes.
 * @return string Filtered list of admin body classes.
 */
function gutenberg_omnibar_body_class( $classes ) {
	if (
		! is_admin_bar_showing() ||
		! gutenberg_is_experiment_enabled( 'gutenberg-omnibar' )
	) {
		return $classes;
	}

	return $classes . ' has-admin-bar-in-editor';
}

add_filter( 'admin_body_class', 'gutenberg_omnibar_body_class' );

/**
 * Enables the omnibar experiment on the site-editor-v2 page.
 */
function gutenberg_enable_omnibar_in_site_editor_v2() {
	if (
		! is_admin_bar_showing() ||
		! gutenberg_is_experiment_enabled( 'gutenberg-omnibar' )
	) {
		return;
	}

	add_action( 'admin_head', 'wp_admin_bar_header' );
	remove_action( 'admin_bar_menu', 'wp_admin_bar_sidebar_toggle', 0 );
	add_action( 'admin_footer-site-editor-v2', 'wp_admin_bar_render' );

	$admin_color = get_user_option( 'admin_color' );
	if ( empty( $admin_color ) ) {
		$admin_color = 'fresh';
	}
	$admin_color_class = 'admin-color-' . sanitize_html_class( $admin_color );

	add_action(
		'admin_head-site-editor-v2',
		static function () use ( $admin_color_class ) {
			echo '<script>'
				. 'window.__experimentalAdminBarInEditor = true;'
				. 'document.addEventListener("DOMContentLoaded", function () { document.body.classList.add("has-admin-bar-in-editor", ' . wp_json_encode( $admin_color_class ) . '); });'
				. '</script>';
		}
	);

	wp_enqueue_style( 'admin-bar' );
	wp_enqueue_style( 'colors' );
}

add_action( 'site-editor-v2_init', 'gutenberg_enable_omnibar_in_site_editor_v2' );

/**
 * Replaces the home/odometer dashicon in the admin bar site menu with the
 * actual site icon, if one is set.
 *
 * @param WP_Admin_Bar $wp_admin_bar The WP_Admin_Bar instance.
 */
function gutenberg_omnibar_site_icon( $wp_admin_bar ) {
	if (
		! is_admin_bar_showing() ||
		! gutenberg_is_experiment_enabled( 'gutenberg-omnibar' )
	) {
		return;
	}

	$node = $wp_admin_bar->get_node( 'site-name' );
	if ( ! $node ) {
		return;
	}

	$site_icon_url = get_site_icon_url( 64 );
	if ( ! $site_icon_url ) {
		return;
	}

	$meta          = (array) $node->meta;
	$meta['class'] = isset( $meta['class'] ) ? trim( $meta['class'] . ' has-site-icon' ) : 'has-site-icon';

	$wp_admin_bar->add_node(
		array(
			'id'    => 'site-name',
			'title' => '<img class="site-icon" src="' . esc_url( $site_icon_url ) . '" alt="" />' . $node->title,
			'meta'  => $meta,
		)
	);
}

add_action( 'admin_bar_menu', 'gutenberg_omnibar_site_icon', 31 );

/**
 * Adds the styles for the admin bar site icon.
 */
function gutenberg_omnibar_site_icon_styles() {
	if (
		! is_admin_bar_showing() ||
		! gutenberg_is_experiment_enabled( 'gutenberg-omnibar' )
	) {
		return;
	}

	$css = <<<CSS
#wpadminbar #wp-admin-bar-site-name.has-site-icon > .ab-item:before {
	content: none;
}

#wpadminbar #wp-admin-bar-site-name > .ab-item .site-icon {
	width: 20px;
	height: 20px;
	margin: 0;
	margin-inline-end: 6px;
	vertical-align: -5px;
	background: #f0f0f1;
	border-radius: 2px;
}

@media screen and (max-width: 782px) {
	#wpadminbar #wp-admin-bar-site-name > .ab-item .site-icon {
		position: absolute;
		top: 9px;
		inset-inline-start: 12px;
		width: 28px;
		height: 28px;
		margin: 0;
		border-radius: 4px;
	}
}
CSS;

	wp_add_inline_style( 'admin-bar', $css );
}

add_action( 'wp_enqueue_scripts', 'gutenberg_omnibar_site_icon_styles' );
add_action( 'admin_enqueue_scripts', 'gutenberg_omnibar_site_icon_styles' );
