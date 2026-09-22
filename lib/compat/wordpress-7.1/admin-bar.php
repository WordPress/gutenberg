<?php
/**
 * Admin bar compatibility.
 *
 * @package gutenberg
 */

/**
 * Replaces the home/odometer dashicon on the site-name node with the actual
 * site icon, when one is set.
 *
 * Ported from https://github.com/WordPress/wordpress-develop/pull/11781.
 *
 * @param WP_Admin_Bar $wp_admin_bar The WP_Admin_Bar instance.
 */
function gutenberg_admin_bar_site_icon( WP_Admin_Bar $wp_admin_bar ): void {
	if ( is_network_admin() || is_user_admin() ) {
		return;
	}

	$node = $wp_admin_bar->get_node( 'site-name' );
	if ( ! $node ) {
		return;
	}

	if ( isset( $node->meta['class'] ) && false !== strpos( $node->meta['class'], 'has-site-icon' ) ) {
		return;
	}

	/** This filter is documented in wp-includes/admin-bar.php */
	$show_site_icons = apply_filters( 'wp_admin_bar_show_site_icons', true );
	if ( true !== $show_site_icons || ! has_site_icon() ) {
		return;
	}

	$site_icon_url    = get_site_icon_url( 32 );
	$site_icon_url_2x = get_site_icon_url( 64 );
	$srcset           = ( $site_icon_url_2x && $site_icon_url !== $site_icon_url_2x ) ? sprintf( ' srcset="%s 2x"', esc_url( $site_icon_url_2x ) ) : '';
	$site_icon        = sprintf(
		'<img class="site-icon" src="%s"%s alt="" width="20" height="20" />',
		esc_url( $site_icon_url ),
		$srcset
	);

	$wp_admin_bar->add_node(
		array(
			'id'    => 'site-name',
			'title' => $site_icon . $node->title,
			'meta'  => array( 'class' => 'has-site-icon' ),
		)
	);
}
add_action( 'admin_bar_menu', 'gutenberg_admin_bar_site_icon', 31 );

/**
 * Enqueues the styles for the admin bar site icon.
 */
function gutenberg_admin_bar_site_icon_styles(): void {
	$css = <<<CSS
		#wpadminbar .quicklinks li img.blavatar {
			border-radius: 2px;
		}
		#wpadminbar #wp-admin-bar-site-name.has-site-icon > .ab-item {
			display: flex;
			align-items: center;
			gap: 6px;
		}
		#wpadminbar #wp-admin-bar-site-name.has-site-icon > .ab-item:before {
			content: none;
		}
		#wpadminbar #wp-admin-bar-site-name > .ab-item .site-icon {
			width: 20px;
			height: 20px;
			background: #f0f0f1;
			border-radius: 2px;
		}
		@media screen and (max-width: 782px) {
			#wpadminbar #wp-admin-bar-site-name > .ab-item .site-icon {
				position: absolute;
				top: 9px;
				left: 12px;
				width: 28px;
				height: 28px;
				margin: 0;
				border-radius: 4px;
			}
		}
CSS;
	wp_add_inline_style( 'admin-bar', $css );
}
add_action( 'admin_bar_init', 'gutenberg_admin_bar_site_icon_styles' );
