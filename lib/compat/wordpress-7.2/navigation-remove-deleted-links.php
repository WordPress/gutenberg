<?php
/**
 * Navigation menus: remove links to deleted posts and terms.
 *
 * When a post or term is permanently deleted, every Navigation Link block
 * bound to it is removed from every Navigation Menu, the way
 * `_wp_delete_post_menu_item()` and `_wp_delete_tax_menu_item()` remove
 * classic menu items. A link is bound when its URL follows the post or term
 * through a `core/post-data` or `core/term-data` block binding, which is what
 * the link UI sets up for a link picked from the site's content. A link whose
 * URL was typed in is left alone, even when it carries the ID. A Navigation
 * Submenu bound to the deleted object keeps its label and inner blocks and
 * loses only its link, so the structure of the menu stays in place. Trashing
 * or unpublishing changes nothing here: the blocks already skip a link to an
 * unpublished post when they render.
 *
 * @package gutenberg
 */

/**
 * Checks whether a block is a Navigation Link or Submenu bound to a post or
 * term.
 *
 * @param array  $block Parsed block.
 * @param string $kind  Either 'post-type' or 'taxonomy'.
 * @param int    $id    Post or term ID.
 * @return bool Whether the block's URL is bound to the object.
 */
function gutenberg_navigation_block_links_to_object( $block, $kind, $id ) {
	if ( ! in_array( $block['blockName'], array( 'core/navigation-link', 'core/navigation-submenu' ), true ) ) {
		return false;
	}
	if ( ! isset( $block['attrs']['id'] ) || (int) $block['attrs']['id'] !== (int) $id ) {
		return false;
	}
	$source = 'taxonomy' === $kind ? 'core/term-data' : 'core/post-data';
	return isset( $block['attrs']['metadata']['bindings']['url']['source'] )
		&& $source === $block['attrs']['metadata']['bindings']['url']['source'];
}

/**
 * Removes the links bound to a post or term from a tree of blocks.
 *
 * A Navigation Link bound to the object is removed. A Navigation Submenu
 * bound to it keeps its label and inner blocks and loses its link attributes.
 *
 * @param array[] $blocks Parsed blocks, modified in place.
 * @param string  $kind   Either 'post-type' or 'taxonomy'.
 * @param int     $id     Post or term ID.
 * @return bool Whether any block changed.
 */
function gutenberg_navigation_remove_links_to_object( &$blocks, $kind, $id ) {
	$changed = false;
	foreach ( $blocks as $index => &$block ) {
		if ( gutenberg_navigation_block_links_to_object( $block, $kind, $id ) ) {
			$changed = true;
			if ( 'core/navigation-link' === $block['blockName'] ) {
				unset( $blocks[ $index ] );
				continue;
			}
			unset( $block['attrs']['id'], $block['attrs']['url'], $block['attrs']['kind'], $block['attrs']['type'] );
			unset( $block['attrs']['metadata']['bindings']['url'] );
			if ( empty( $block['attrs']['metadata']['bindings'] ) ) {
				unset( $block['attrs']['metadata']['bindings'] );
			}
			if ( empty( $block['attrs']['metadata'] ) ) {
				unset( $block['attrs']['metadata'] );
			}
		}
		if ( ! empty( $block['innerBlocks'] ) && gutenberg_navigation_remove_links_to_object( $block['innerBlocks'], $kind, $id ) ) {
			$changed               = true;
			$block['innerHTML']    = '';
			$block['innerContent'] = array_fill( 0, count( $block['innerBlocks'] ), null );
		}
	}
	unset( $block );

	if ( $changed ) {
		$blocks = array_values( $blocks );
	}
	return $changed;
}

/**
 * Removes the links bound to a deleted post or term from every Navigation
 * Menu.
 *
 * @param string $kind Either 'post-type' or 'taxonomy'.
 * @param int    $id   Post or term ID.
 */
function gutenberg_navigation_remove_links_to_deleted_object( $kind, $id ) {
	$menus = get_posts(
		array(
			'post_type'              => 'wp_navigation',
			'post_status'            => 'any',
			'posts_per_page'         => -1,
			'no_found_rows'          => true,
			'update_post_term_cache' => false,
			'update_post_meta_cache' => false,
		)
	);

	foreach ( $menus as $menu ) {
		// A link block carries the ID as `"id":<id>`; skip the parse when it cannot be there.
		if ( false === strpos( $menu->post_content, '"id":' . (int) $id ) ) {
			continue;
		}
		$blocks = parse_blocks( $menu->post_content );
		if ( ! gutenberg_navigation_remove_links_to_object( $blocks, $kind, $id ) ) {
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

/**
 * Removes the links bound to a post from every Navigation Menu when the post
 * is permanently deleted.
 *
 * Runs for the post types a link can point at. Revisions, menu items and
 * Navigation Menus themselves are deleted far more often and never linked.
 *
 * @param int     $post_id Post ID.
 * @param WP_Post $post    The post being deleted.
 */
function gutenberg_navigation_remove_links_to_deleted_post( $post_id, $post ) {
	if ( ! $post instanceof WP_Post || ! is_post_type_viewable( $post->post_type ) ) {
		return;
	}
	gutenberg_navigation_remove_links_to_deleted_object( 'post-type', $post_id );
}
add_action( 'delete_post', 'gutenberg_navigation_remove_links_to_deleted_post', 10, 2 );

/**
 * Removes the links bound to a term from every Navigation Menu when the term
 * is deleted.
 *
 * @param int    $term_id  Term ID.
 * @param int    $tt_id    Term taxonomy ID. Unused.
 * @param string $taxonomy Taxonomy slug.
 */
function gutenberg_navigation_remove_links_to_deleted_term( $term_id, $tt_id, $taxonomy ) {
	if ( ! is_taxonomy_viewable( $taxonomy ) ) {
		return;
	}
	gutenberg_navigation_remove_links_to_deleted_object( 'taxonomy', $term_id );
}
add_action( 'delete_term', 'gutenberg_navigation_remove_links_to_deleted_term', 10, 3 );
