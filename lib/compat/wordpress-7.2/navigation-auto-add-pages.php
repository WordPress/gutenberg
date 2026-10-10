<?php
/**
 * Navigation menus: the "Auto add pages" setting.
 *
 * Replaces the Page List block as the default content of a Navigation Menu.
 * The fallback menu a site creates for itself starts as individual link
 * blocks, one per published page, with the setting switched on. While it is
 * on, publishing a new top-level page appends a link for it to the menu, the
 * way classic menus do with their "Automatically add new top-level pages"
 * option. Existing items are never reordered, renamed or removed.
 *
 * @package gutenberg
 */

/**
 * Registers the `wp_navigation_auto_add_pages` meta on Navigation Menus.
 *
 * The posts REST controller only exposes `meta` for post types that support
 * custom fields, so that support is added to `wp_navigation` as well.
 */
function gutenberg_register_navigation_auto_add_pages_meta() {
	if ( registered_meta_key_exists( 'post', 'wp_navigation_auto_add_pages', 'wp_navigation' ) ) {
		return;
	}

	add_post_type_support( 'wp_navigation', 'custom-fields' );

	register_post_meta(
		'wp_navigation',
		'wp_navigation_auto_add_pages',
		array(
			'type'              => 'boolean',
			'description'       => __( 'Whether newly published top-level pages are added to the menu.', 'gutenberg' ),
			'single'            => true,
			'default'           => false,
			'sanitize_callback' => 'rest_sanitize_boolean',
			'show_in_rest'      => true,
		)
	);
}
add_action( 'init', 'gutenberg_register_navigation_auto_add_pages_meta' );

/**
 * Builds a Navigation Link block (or a Navigation Submenu block, when it has
 * inner blocks) pointing at a page.
 *
 * Matches the blocks the Page List block creates when it is detached into
 * links, including the URL binding that keeps the link in step with the
 * page's permalink.
 *
 * @param WP_Post $page         The page to link to.
 * @param array[] $inner_blocks Optional. Parsed blocks nested under the link.
 * @return array A parsed block.
 */
function gutenberg_navigation_build_page_link_block( $page, $inner_blocks = array() ) {
	return array(
		'blockName'    => empty( $inner_blocks ) ? 'core/navigation-link' : 'core/navigation-submenu',
		'attrs'        => array(
			'label'    => '' !== $page->post_title ? $page->post_title : __( '(no title)', 'gutenberg' ),
			'type'     => 'page',
			'id'       => (int) $page->ID,
			'url'      => get_permalink( $page ),
			'kind'     => 'post-type',
			'metadata' => array(
				'bindings' => array(
					'url' => array(
						'source' => 'core/post-data',
						'args'   => array( 'field' => 'link' ),
					),
				),
			),
		),
		'innerBlocks'  => $inner_blocks,
		'innerHTML'    => '',
		'innerContent' => array_fill( 0, count( $inner_blocks ), null ),
	);
}

/**
 * Checks whether any block in a tree links to the given page.
 *
 * @param array[] $blocks  Parsed blocks.
 * @param int     $page_id Page ID.
 * @return bool Whether a Navigation Link or Submenu for the page exists.
 */
function gutenberg_navigation_blocks_link_to_page( $blocks, $page_id ) {
	foreach ( $blocks as $block ) {
		$is_link = in_array( $block['blockName'], array( 'core/navigation-link', 'core/navigation-submenu' ), true );
		if ( $is_link && isset( $block['attrs']['id'] ) && (int) $block['attrs']['id'] === (int) $page_id ) {
			$kind = isset( $block['attrs']['kind'] ) ? $block['attrs']['kind'] : '';
			$type = isset( $block['attrs']['type'] ) ? $block['attrs']['type'] : '';
			if ( 'post-type' === $kind || 'page' === $type ) {
				return true;
			}
		}
		if ( ! empty( $block['innerBlocks'] ) && gutenberg_navigation_blocks_link_to_page( $block['innerBlocks'], $page_id ) ) {
			return true;
		}
	}

	return false;
}

/**
 * Appends a link to a newly published top-level page to every Navigation Menu
 * that has "Auto add pages" switched on.
 *
 * Mirrors `_wp_auto_add_pages_to_menu()` for classic menus: only the
 * transition into `publish` counts, child pages are skipped, and a page the
 * menu already links to is not added again.
 *
 * @param string  $new_status New post status.
 * @param string  $old_status Old post status.
 * @param WP_Post $post       The post being transitioned.
 */
function gutenberg_navigation_auto_add_page_on_publish( $new_status, $old_status, $post ) {
	if ( 'publish' !== $new_status || 'publish' === $old_status || 'page' !== $post->post_type ) {
		return;
	}
	if ( ! empty( $post->post_parent ) ) {
		return;
	}

	$menus = get_posts(
		array(
			'post_type'              => 'wp_navigation',
			'post_status'            => 'any',
			'posts_per_page'         => -1,
			'meta_key'               => 'wp_navigation_auto_add_pages',
			'meta_value'             => '1',
			'no_found_rows'          => true,
			'update_post_term_cache' => false,
		)
	);

	foreach ( $menus as $menu ) {
		$blocks = parse_blocks( $menu->post_content );
		if ( gutenberg_navigation_blocks_link_to_page( $blocks, $post->ID ) ) {
			continue;
		}
		$blocks[] = gutenberg_navigation_build_page_link_block( $post );

		wp_update_post(
			array(
				'ID'           => $menu->ID,
				'post_content' => wp_slash( serialize_blocks( $blocks ) ),
			)
		);
	}
}
add_action( 'transition_post_status', 'gutenberg_navigation_auto_add_page_on_publish', 10, 3 );

/**
 * Builds link blocks for the published pages under a parent, recursively.
 *
 * @param int       $parent_id Parent page ID, 0 for top-level pages.
 * @param WP_Post[] $children  Published pages grouped by `post_parent`.
 * @return array[] Parsed blocks.
 */
function gutenberg_navigation_build_page_tree_blocks( $parent_id, $children ) {
	$blocks = array();
	if ( empty( $children[ $parent_id ] ) ) {
		return $blocks;
	}
	foreach ( $children[ $parent_id ] as $page ) {
		$inner_blocks = gutenberg_navigation_build_page_tree_blocks( $page->ID, $children );
		$blocks[]     = gutenberg_navigation_build_page_link_block( $page, $inner_blocks );
	}
	return $blocks;
}

/**
 * Gets the link blocks for the site's published pages, nested like the Page
 * List block renders them and in the same order.
 *
 * @return array[] Parsed blocks.
 */
function gutenberg_navigation_get_page_link_blocks() {
	$pages = get_pages(
		array(
			'sort_column' => 'menu_order,post_title',
			'order'       => 'asc',
		)
	);
	if ( empty( $pages ) ) {
		return array();
	}

	$children = array();
	foreach ( $pages as $page ) {
		$children[ $page->post_parent ][] = $page;
	}

	return gutenberg_navigation_build_page_tree_blocks( 0, $children );
}

/**
 * Creates the default fallback Navigation Menu from page links instead of a
 * Page List block.
 *
 * `WP_Navigation_Fallback::get_fallback()` applies this filter before it
 * looks for an existing menu, converts a classic menu, or creates its Page
 * List default. When no menu exists and there is no classic menu to convert,
 * the menu is created here with "Auto add pages" switched on, and `false` is
 * returned so core does not create a second one: core then finds this menu as
 * the most recently published one and returns it.
 *
 * In WordPress Core this would be a change to
 * `WP_Navigation_Fallback::create_default_fallback()` instead.
 *
 * @param bool $should_create Whether core should create a fallback menu.
 * @return bool Whether core should still create a fallback menu.
 */
function gutenberg_navigation_create_fallback_with_pages( $should_create ) {
	if ( ! $should_create ) {
		return $should_create;
	}

	$existing = get_posts(
		array(
			'post_type'      => 'wp_navigation',
			'post_status'    => 'publish',
			'posts_per_page' => 1,
			'fields'         => 'ids',
			'no_found_rows'  => true,
		)
	);
	if ( ! empty( $existing ) ) {
		return $should_create;
	}

	// Core converts a classic menu before falling back to its default; leave that path to core.
	$classic_menus = wp_get_nav_menus();
	if ( ! empty( $classic_menus ) && ! is_wp_error( $classic_menus ) ) {
		return $should_create;
	}

	$menu_id = wp_insert_post(
		array(
			'post_content' => wp_slash( serialize_blocks( gutenberg_navigation_get_page_link_blocks() ) ),
			'post_title'   => _x( 'Navigation', 'Title of a Navigation menu', 'gutenberg' ),
			'post_name'    => 'navigation',
			'post_status'  => 'publish',
			'post_type'    => 'wp_navigation',
		),
		true
	);
	if ( is_wp_error( $menu_id ) || empty( $menu_id ) ) {
		return $should_create;
	}

	update_post_meta( $menu_id, 'wp_navigation_auto_add_pages', true );

	return false;
}
add_filter( 'wp_navigation_should_create_fallback', 'gutenberg_navigation_create_fallback_with_pages' );
