<?php
/**
 * Navigation menus: the "Auto add new pages" setting.
 *
 * While the setting is on, publishing a new page adds a link for it to the
 * menu, the way classic menus do with their "Automatically add new top-level
 * pages" option. A top-level page is added to the menu; a child page is
 * nested under its parent's link when the menu has one, which turns that link
 * into a submenu. Existing items are never reordered, renamed or removed.
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
			'description'       => __( 'Whether newly published pages are added to the menu.', 'gutenberg' ),
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
 * Checks whether a block is a Navigation Link or Submenu pointing at a page.
 *
 * @param array $block   Parsed block.
 * @param int   $page_id Page ID.
 * @return bool Whether the block links to the page.
 */
function gutenberg_navigation_block_links_to_page( $block, $page_id ) {
	if ( ! in_array( $block['blockName'], array( 'core/navigation-link', 'core/navigation-submenu' ), true ) ) {
		return false;
	}
	if ( ! isset( $block['attrs']['id'] ) || (int) $block['attrs']['id'] !== (int) $page_id ) {
		return false;
	}
	$kind = isset( $block['attrs']['kind'] ) ? $block['attrs']['kind'] : '';
	$type = isset( $block['attrs']['type'] ) ? $block['attrs']['type'] : '';
	return 'post-type' === $kind || 'page' === $type;
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
		if ( gutenberg_navigation_block_links_to_page( $block, $page_id ) ) {
			return true;
		}
		if ( ! empty( $block['innerBlocks'] ) && gutenberg_navigation_blocks_link_to_page( $block['innerBlocks'], $page_id ) ) {
			return true;
		}
	}

	return false;
}

/**
 * Checks whether any block in a tree is a Page List block.
 *
 * @param array[] $blocks Parsed blocks.
 * @return bool Whether the tree has a Page List block.
 */
function gutenberg_navigation_blocks_have_page_list( $blocks ) {
	foreach ( $blocks as $block ) {
		if ( 'core/page-list' === $block['blockName'] ) {
			return true;
		}
		if ( ! empty( $block['innerBlocks'] ) && gutenberg_navigation_blocks_have_page_list( $block['innerBlocks'] ) ) {
			return true;
		}
	}

	return false;
}

/**
 * Inserts a link to a page among its sibling blocks in page order.
 *
 * The link goes before the first link to a page that sorts after it by menu
 * order and then title, as the Page List block sorts pages. When no linked
 * page sorts after it, it goes after the last link to a page, or at the end
 * when there is none. Other blocks keep their places.
 *
 * @param array[] $blocks Parsed sibling blocks, modified in place.
 * @param WP_Post $page   The page the link points at.
 * @param array   $link   Parsed block linking to the page.
 */
function gutenberg_navigation_insert_page_link( &$blocks, $page, $link ) {
	$before = null;
	$after  = null;
	foreach ( $blocks as $index => $block ) {
		$sibling = isset( $block['attrs']['id'] ) && gutenberg_navigation_block_links_to_page( $block, $block['attrs']['id'] )
			? get_post( $block['attrs']['id'] )
			: null;
		if ( ! $sibling || 'page' !== $sibling->post_type ) {
			continue;
		}
		$order = $sibling->menu_order <=> $page->menu_order;
		if ( 0 === $order ) {
			$order = strcasecmp( $sibling->post_title, $page->post_title );
		}
		if ( $order > 0 ) {
			$before = $index;
			break;
		}
		$after = $index + 1;
	}

	array_splice( $blocks, $before ?? $after ?? count( $blocks ), 0, array( $link ) );
}

/**
 * Nests a link to a page under the first block in a tree that links to the
 * page's parent, in page order among the parent's other links.
 *
 * A Navigation Link for the page becomes a Navigation Submenu with the same
 * attributes, so the link keeps working as before and gains a submenu.
 *
 * @param array[] $blocks Parsed blocks, modified in place.
 * @param WP_Post $page   The child page.
 * @param array   $link   Parsed block linking to the page.
 * @return bool Whether a parent block was found.
 */
function gutenberg_navigation_nest_block_under_page( &$blocks, $page, $link ) {
	foreach ( $blocks as &$block ) {
		if ( gutenberg_navigation_block_links_to_page( $block, $page->post_parent ) ) {
			$block['blockName'] = 'core/navigation-submenu';
			gutenberg_navigation_insert_page_link( $block['innerBlocks'], $page, $link );
			$block['innerHTML']    = '';
			$block['innerContent'] = array_fill( 0, count( $block['innerBlocks'] ), null );
			return true;
		}
		if ( ! empty( $block['innerBlocks'] ) && gutenberg_navigation_nest_block_under_page( $block['innerBlocks'], $page, $link ) ) {
			return true;
		}
	}

	return false;
}

/**
 * Adds a link to a newly published page to every Navigation Menu that has
 * "Auto add new pages" switched on.
 *
 * A top-level page is added to the menu in page order. A child page is nested
 * under the link to its parent, which becomes a submenu; a menu with no link
 * to the parent is left alone, and so is a menu with a Page List block, which
 * already shows the page. Like `_wp_auto_add_pages_to_menu()` for classic
 * menus, only the transition into `publish` counts, and a page the menu
 * already links to is not added again.
 *
 * @param string  $new_status New post status.
 * @param string  $old_status Old post status.
 * @param WP_Post $post       The post being transitioned.
 */
function gutenberg_navigation_auto_add_page_on_publish( $new_status, $old_status, $post ) {
	if ( 'publish' !== $new_status || 'publish' === $old_status || 'page' !== $post->post_type ) {
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
		if ( gutenberg_navigation_blocks_have_page_list( $blocks ) || gutenberg_navigation_blocks_link_to_page( $blocks, $post->ID ) ) {
			continue;
		}

		$link = gutenberg_navigation_build_page_link_block( $post );
		if ( empty( $post->post_parent ) ) {
			gutenberg_navigation_insert_page_link( $blocks, $post, $link );
		} elseif ( ! gutenberg_navigation_nest_block_under_page( $blocks, $post, $link ) ) {
			continue;
		}

		wp_update_post(
			array(
				'ID'           => $menu->ID,
				'post_content' => wp_slash( serialize_blocks( $blocks ) ),
			)
		);
	}
}
add_action( 'transition_post_status', 'gutenberg_navigation_auto_add_page_on_publish', 10, 3 );
