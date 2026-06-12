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

/**
 * Replaces the 26px avatar in the admin bar my-account item with a 28px one.
 *
 * Backports https://github.com/WordPress/wordpress-develop/pull/11799.
 *
 * @param WP_Admin_Bar $wp_admin_bar The WP_Admin_Bar instance.
 */
function gutenberg_omnibar_user_avatar( $wp_admin_bar ) {
	if (
		! is_admin_bar_showing() ||
		! gutenberg_is_experiment_enabled( 'gutenberg-omnibar' )
	) {
		return;
	}

	$node    = $wp_admin_bar->get_node( 'my-account' );
	$user_id = get_current_user_id();
	if ( ! $node || ! $user_id ) {
		return;
	}

	$old_avatar = get_avatar( $user_id, 26 );
	$new_avatar = get_avatar( $user_id, 28 );
	if ( ! $old_avatar || ! $new_avatar ) {
		return;
	}

	$wp_admin_bar->add_node(
		array(
			'id'    => 'my-account',
			'title' => str_replace( $old_avatar, $new_avatar, $node->title ),
		)
	);
}

add_action( 'admin_bar_menu', 'gutenberg_omnibar_user_avatar', 9992 );

/**
 * Adds the styles that make the admin bar user avatar circular.
 *
 * Backports https://github.com/WordPress/wordpress-develop/pull/11799.
 */
function gutenberg_omnibar_user_avatar_styles() {
	if (
		! is_admin_bar_showing() ||
		! gutenberg_is_experiment_enabled( 'gutenberg-omnibar' )
	) {
		return;
	}

	$css = <<<CSS
#wpadminbar #wp-admin-bar-user-info .avatar {
	border-radius: 50%;
}

#wpadminbar #wp-admin-bar-my-account.with-avatar > .ab-empty-item img,
#wpadminbar #wp-admin-bar-my-account.with-avatar > a img {
	height: 20px;
	border-radius: 50%;
}

@media screen and (max-width: 782px) {
	#wpadminbar .quicklinks li#wp-admin-bar-my-account.with-avatar > a img {
		top: 12px;
		width: 28px;
		height: 28px;
		border-radius: 50%;
	}
}
CSS;

	wp_add_inline_style( 'admin-bar', $css );
}

add_action( 'wp_enqueue_scripts', 'gutenberg_omnibar_user_avatar_styles' );
add_action( 'admin_enqueue_scripts', 'gutenberg_omnibar_user_avatar_styles' );

/**
 * Removes the "Howdy," prefix from the admin bar my-account item, keeping the
 * display name visible next to the avatar.
 *
 * @param WP_Admin_Bar $wp_admin_bar The WP_Admin_Bar instance.
 */
function gutenberg_omnibar_remove_howdy( $wp_admin_bar ) {
	if (
		! is_admin_bar_showing() ||
		! gutenberg_is_experiment_enabled( 'gutenberg-omnibar' )
	) {
		return;
	}

	$node = $wp_admin_bar->get_node( 'my-account' );
	if ( ! $node ) {
		return;
	}

	$display_name = wp_get_current_user()->display_name;
	$display_span = '<span class="display-name">' . $display_name . '</span>';
	/* translators: %s: Current user's display name. */
	$howdy = sprintf( __( 'Howdy, %s', 'default' ), $display_span );
	if ( ! str_contains( $node->title, $howdy ) ) {
		return;
	}

	$wp_admin_bar->add_node(
		array(
			'id'    => 'my-account',
			'title' => str_replace( $howdy, $display_span, $node->title ),
		)
	);
}

add_action( 'admin_bar_menu', 'gutenberg_omnibar_remove_howdy', 9992 );
