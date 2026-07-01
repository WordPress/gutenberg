<?php
/**
 * Omnibar experiment.
 *
 * @package gutenberg
 */

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
