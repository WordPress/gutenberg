<?php
/**
 * Admin navigation rail experiment.
 *
 * Collapses the admin menu into a rail of icons and shows the submenu of the
 * current section in a column next to it. The block editor and the extensible
 * site editor show the rail alone; in the site editor, its own navigation takes
 * the place of the column. The site editor moves out of Appearance into a
 * top-level menu item.
 *
 * Only loaded while both the `gutenberg-admin-navigation-rail` and the
 * `gutenberg-extensible-site-editor` experiments are enabled (see lib/load.php).
 *
 * @package gutenberg
 */

/**
 * Returns whether the current request renders the extensible site editor.
 *
 * @global string $pagenow The filename of the current screen.
 *
 * @return bool Whether the current request renders the extensible site editor.
 */
function gutenberg_admin_navigation_rail_is_site_editor() {
	global $pagenow;

	// phpcs:ignore WordPress.Security.NonceVerification.Recommended
	return 'admin.php' === $pagenow && isset( $_GET['page'] ) && 'site-editor-v2' === $_GET['page'];
}

/**
 * Returns whether the current screen is a block editor showing the rail.
 *
 * The original site editor lays out its own full-screen interface, and is left
 * as it is.
 *
 * @return bool Whether the current screen is a block editor showing the rail.
 */
function gutenberg_admin_navigation_rail_is_block_editor() {
	$screen = get_current_screen();

	return $screen && $screen->is_block_editor() && 'site-editor' !== $screen->base;
}

/**
 * Enqueues the stylesheet of the experiment.
 */
function gutenberg_admin_navigation_rail_enqueue_style() {
	wp_enqueue_style(
		'gutenberg-admin-navigation-rail',
		gutenberg_url( 'lib/experimental/admin-navigation-rail/style.css' ),
		array( 'admin-menu' ),
		defined( 'GUTENBERG_VERSION' ) && ! SCRIPT_DEBUG ? GUTENBERG_VERSION : (string) time()
	);
}
add_action( 'admin_enqueue_scripts', 'gutenberg_admin_navigation_rail_enqueue_style' );

/**
 * Prints the script that picks the layout of the admin menu.
 *
 * The layout depends on whether the current menu item has a submenu, which is
 * only settled while the menu is printed, so the script runs right after it,
 * before the rest of the page is parsed.
 */
function gutenberg_admin_navigation_rail_print_layout_script() {
	$screen = get_current_screen();
	if ( $screen && 'site-editor' === $screen->base ) {
		return;
	}

	$is_rail_only = gutenberg_admin_navigation_rail_is_site_editor() || gutenberg_admin_navigation_rail_is_block_editor();

	wp_print_inline_script_tag(
		sprintf(
			'( function ( body, isRailOnly ) {
				body.classList.add( "gutenberg-admin-nav-rail" );
				if ( isRailOnly ) {
					body.classList.add( "folded", "gutenberg-admin-nav-rail-only" );
					return;
				}
				body.classList.add( "gutenberg-admin-content-frame" );
				var column = document.querySelector( "#adminmenu > li.wp-has-current-submenu > .wp-submenu" );
				if ( column ) {
					body.classList.add( "folded", "gutenberg-has-submenu-column" );
					// The admin script makes submenu headings follow the link of their section.
					column.addEventListener( "click", function ( event ) {
						if ( event.target.closest( ".wp-submenu-head" ) ) {
							event.stopPropagation();
						}
					} );
				}
				document.addEventListener( "DOMContentLoaded", function () {
					var footer = document.getElementById( "wpfooter" );
					var frame = document.getElementById( "wpbody" );
					if ( footer && frame ) {
						frame.appendChild( footer );
					}
				} );
			} )( document.body, %s );',
			wp_json_encode( $is_rail_only )
		)
	);
}
add_action( 'adminmenu', 'gutenberg_admin_navigation_rail_print_layout_script' );

/**
 * Tells the editors that the rail replaces their way back to the admin.
 */
function gutenberg_admin_navigation_rail_print_editor_flag() {
	if ( ! gutenberg_admin_navigation_rail_is_site_editor() && ! gutenberg_admin_navigation_rail_is_block_editor() ) {
		return;
	}

	wp_print_inline_script_tag( 'window.__experimentalAdminNavigationRail = true;' );
}
add_action( 'admin_head', 'gutenberg_admin_navigation_rail_print_editor_flag' );

/**
 * Enqueues the admin menu styles on the extensible site editor.
 *
 * The page dequeues everything enqueued before it renders, so the styles are
 * enqueued again once it initializes.
 *
 * The page renders before the other admin screens would opt out of combining
 * their stylesheets, so it opts out here. Combined, the admin stylesheets can
 * outrank the colour scheme, such as when the admin design tokens experiment
 * moves the scheme into a cascade layer.
 *
 * @global bool $concatenate_scripts
 */
function gutenberg_admin_navigation_rail_enqueue_site_editor_styles() {
	// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
	$GLOBALS['concatenate_scripts'] = false;

	wp_enqueue_style( 'colors' );
	wp_enqueue_style( 'dashicons' );
	gutenberg_admin_navigation_rail_enqueue_style();
}
add_action( 'site-editor-v2_init', 'gutenberg_admin_navigation_rail_enqueue_site_editor_styles' );

/**
 * Prints the admin menu on the extensible site editor.
 *
 * The page renders outside the admin template, so the menu is printed here, as
 * the template would, with the site editor as its current section.
 *
 * The page is registered without a parent, which the menu would otherwise
 * resolve from the plugin page while it is printed.
 *
 * @global string $parent_file  The parent file of the current admin screen.
 * @global string $submenu_file The submenu file of the current admin screen.
 * @global string $plugin_page  The slug of the current plugin page.
 */
function gutenberg_admin_navigation_rail_print_site_editor_menu() {
	global $parent_file, $submenu_file, $plugin_page;

	if ( ! gutenberg_admin_navigation_rail_is_site_editor() ) {
		return;
	}

	$current_plugin_page = $plugin_page;

	// phpcs:disable WordPress.WP.GlobalVariablesOverride.Prohibited
	$parent_file  = gutenberg_admin_navigation_rail_get_site_editor_menu_slug( '/' );
	$submenu_file = gutenberg_admin_navigation_rail_get_current_site_editor_menu_slug();
	$plugin_page  = null;

	require ABSPATH . 'wp-admin/menu-header.php';

	$plugin_page = $current_plugin_page;
	// phpcs:enable WordPress.WP.GlobalVariablesOverride.Prohibited

	/*
	 * The admin's own script for the flyout submenus needs jQuery and expects
	 * the rest of the admin page around it, so this is a minimal stand-in.
	 */
	wp_print_inline_script_tag(
		'( function () {
			var items = document.querySelectorAll( "#adminmenu li.wp-has-submenu" );
			items.forEach( function ( item ) {
				var timeout;
				function open() {
					items.forEach( function ( other ) {
						other.classList.remove( "opensub" );
					} );
					item.classList.add( "opensub" );
				}
				item.addEventListener( "mouseenter", function () {
					clearTimeout( timeout );
					timeout = setTimeout( open, 90 );
				} );
				item.addEventListener( "mouseleave", function () {
					clearTimeout( timeout );
					timeout = setTimeout( function () {
						item.classList.remove( "opensub" );
					}, 200 );
				} );
				item.addEventListener( "focusin", open );
				item.addEventListener( "focusout", function ( event ) {
					if ( ! item.contains( event.relatedTarget ) ) {
						item.classList.remove( "opensub" );
					}
				} );
			} );
		} )();'
	);
}
add_action( 'admin_footer', 'gutenberg_admin_navigation_rail_print_site_editor_menu' );

/**
 * Returns the admin menu slug that leads to a route of the extensible site
 * editor.
 *
 * The admin menu prints submenu slugs that are not plugin pages as they are,
 * so the slug is escaped.
 *
 * @param string $to The route path.
 * @return string The menu slug.
 */
function gutenberg_admin_navigation_rail_get_site_editor_menu_slug( $to ) {
	$slug = 'admin.php?page=site-editor-v2';

	return '/' === $to ? $slug : esc_url( add_query_arg( 'p', $to, $slug ) );
}

/**
 * Moves the extensible site editor out of Appearance into a top-level menu
 * item, right above it, whose submenu lists the sections of the site editor.
 *
 * Runs after the site editor link of Appearance is pointed to the extensible
 * site editor, see gutenberg_redirect_to_extensible_site_editor().
 *
 * @global array $menu    The admin menu, keyed by position.
 * @global array $submenu The admin submenus, keyed by the slug of their parent.
 */
function gutenberg_admin_navigation_rail_register_site_editor_menu() {
	global $menu, $submenu;

	if ( ! empty( $submenu['themes.php'] ) ) {
		foreach ( $submenu['themes.php'] as $index => $item ) {
			if ( 'admin.php?page=site-editor-v2' === $item[2] || str_starts_with( $item[2], 'site-editor.php' ) ) {
				unset( $submenu['themes.php'][ $index ] );
			}
		}
	}

	if ( ! current_user_can( 'edit_theme_options' ) ) {
		return;
	}

	$parent_slug = gutenberg_admin_navigation_rail_get_site_editor_menu_slug( '/' );

	// Appearance sits at position 60, and the menu is sorted naturally by key.
	$menu['59.5'] = array(
		__( 'Site editor', 'gutenberg' ),
		'edit_theme_options',
		$parent_slug,
		__( 'Site editor', 'gutenberg' ),
		'menu-top menu-icon-site-editor',
		'menu-site-editor',
		'dashicons-layout',
	);

	foreach ( gutenberg_site_editor_get_default_menu_items() as $item ) {
		$submenu[ $parent_slug ][] = array(
			$item['label'],
			'edit_theme_options',
			gutenberg_admin_navigation_rail_get_site_editor_menu_slug( $item['to'] ),
		);
	}
}
add_action( 'admin_menu', 'gutenberg_admin_navigation_rail_register_site_editor_menu', 101 );

/**
 * Moves Updates from the Dashboard submenu to Tools, after Site Health.
 *
 * A submenu left with only the Dashboard itself is dropped, so the Dashboard
 * shows no column.
 *
 * @global array $submenu The admin submenus, keyed by the slug of their parent.
 */
function gutenberg_admin_navigation_rail_move_updates_menu_item() {
	global $submenu;

	if ( empty( $submenu['index.php'] ) || empty( $submenu['tools.php'] ) ) {
		return;
	}

	foreach ( $submenu['index.php'] as $index => $item ) {
		if ( 'update-core.php' !== $item[2] ) {
			continue;
		}

		unset( $submenu['index.php'][ $index ] );

		$position = 22;
		while ( isset( $submenu['tools.php'][ $position ] ) ) {
			++$position;
		}
		$submenu['tools.php'][ $position ] = $item;
		ksort( $submenu['tools.php'] );
		break;
	}

	$remaining = array_column( $submenu['index.php'], 2 );
	if ( array( 'index.php' ) === $remaining ) {
		unset( $submenu['index.php'] );
	}
}
add_action( 'admin_menu', 'gutenberg_admin_navigation_rail_move_updates_menu_item', 101 );

/**
 * Makes Tools the current section of the Updates screen, which sets the
 * Dashboard as its parent.
 *
 * @global string $pagenow The filename of the current screen.
 *
 * @param string $parent_file The parent file of the current admin screen.
 * @return string The parent file.
 */
function gutenberg_admin_navigation_rail_filter_updates_parent_file( $parent_file ) {
	global $pagenow;

	return 'update-core.php' === $pagenow ? 'tools.php' : $parent_file;
}
add_filter( 'parent_file', 'gutenberg_admin_navigation_rail_filter_updates_parent_file' );

/**
 * Returns the admin menu slug of the site editor section the request opens.
 *
 * Route paths nest under the path of their section, so the section is the
 * longest path the route starts with.
 *
 * @return string The menu slug.
 */
function gutenberg_admin_navigation_rail_get_current_site_editor_menu_slug() {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$path    = isset( $_GET['p'] ) && is_string( $_GET['p'] ) ? wp_unslash( $_GET['p'] ) : '/';
	$current = '/';

	foreach ( gutenberg_site_editor_get_default_menu_items() as $item ) {
		$to = $item['to'];
		if ( strlen( $to ) > strlen( $current ) && ( $path === $to || str_starts_with( $path, $to . '/' ) ) ) {
			$current = $to;
		}
	}

	return gutenberg_admin_navigation_rail_get_site_editor_menu_slug( $current );
}
