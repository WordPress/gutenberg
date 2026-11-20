<?php
/**
 * Shared helper function for checking if navigation items are active.
 *
 * @package WordPress
 */

/**
 * Determines whether a navigation item should be marked as the active/current item
 * based on the current WordPress query context.
 *
 * Mirrors the active-state checks of the classic menu system
 * (`_wp_menu_item_classes_by_context()` in wp-includes/nav-menu-template.php):
 *
 * - Entity ID match: the item's stored entity ID matches the current queried object ID,
 *   with an object-type guard to prevent false positives from post/term ID collisions.
 * - Post type archive match: the item is a post type archive link and the current page
 *   is that post type's archive. This does not depend on the stored URL.
 * - Post type archive URL match: a fallback that compares the item's URL with the current
 *   archive permalink, for links such as custom links that point at an archive without
 *   being stored as archive links.
 *
 * @since 7.3.0
 *
 * @param array $attributes The block attributes.
 * @return bool Whether the item represents the current page/archive.
 */
function block_core_shared_navigation_item_is_active( $attributes ) {
	/*
	 * Determine the effective "kind" of this item.
	 *
	 * Block-system specific: the block stores `kind` ("post-type" / "taxonomy" / "custom")
	 * and `type` (e.g. "page", "post", "category", "tag") as separate attributes.
	 *
	 * Backwards compatibility - why `kind` may be absent:
	 * The JS editor only writes `kind` to the block attributes when it is a non-empty string
	 * (`...( kind && { kind } )` in update-attributes.js). For built-in types such as
	 * "category" or "tag", older editor versions left `kind` unset. In those cases we fall
	 * back to inspecting `type` via `taxonomy_exists()` to distinguish taxonomy links from
	 * post-type links without relying on a stored `kind`.
	 *
	 * Backwards compatibility - why `kind` may be "custom" for an entity link:
	 * The JS editor stores `kind: "custom"` when a link arrives without a kind and its type
	 * is not built in (e.g. a custom post type or custom taxonomy), while still storing the
	 * entity `id`. "custom" says nothing about whether that id is a post or a term, so it is
	 * inferred from `type` in the same way as an absent kind. Without this, a custom taxonomy
	 * link would be compared against `WP_Post` and could match a post with the same ID.
	 *
	 * Backwards compatibility - the "tag" alias:
	 * The JS editor normalises the WordPress taxonomy slug "post_tag" to "tag" before
	 * storing it in the `type` attribute (see update-attributes.js). Map it back so that
	 * `taxonomy_exists()` can find the registered taxonomy correctly.
	 */
	$stored_kind    = $attributes['kind'] ?? '';
	$stored_type    = $attributes['type'] ?? '';
	$resolved_type  = 'tag' === $stored_type ? 'post_tag' : $stored_type;
	$kind_from_type = taxonomy_exists( $resolved_type ) ? 'taxonomy' : 'post-type';
	$item_kind      = empty( $stored_kind ) || 'custom' === $stored_kind ? $kind_from_type : $stored_kind;

	/*
	 * Backwards compatibility - the "post-type_archive" kind:
	 * Classic menus converted to blocks by older editor versions replaced only the first
	 * underscore of the menu item type "post_type_archive", storing "post-type_archive".
	 */
	$is_archive_link = in_array( $item_kind, array( 'post-type-archive', 'post-type_archive' ), true );

	/*
	 * Entity ID match.
	 *
	 * Backwards compatibility - numeric id guard:
	 * Historically, the `id` attribute could be set to a URL string rather than an integer
	 * in some editor versions. `absint()` converts non-numeric values (including strings
	 * and null) to 0, ensuring those values never produce a match.
	 *
	 * Post/term ID collision guard - mirrors classic menu's _menu_item_type + query-state check:
	 * `instanceof` confirms the queried object is the correct PHP type before accepting the
	 * ID match, preventing a taxonomy link from activating on a post page with the same
	 * integer ID (and vice versa).
	 */
	$queried_object      = get_queried_object();
	$link_id             = absint( $attributes['id'] ?? 0 );
	$is_taxonomy_link    = 'taxonomy' === $item_kind;
	$queried_id          = get_queried_object_id();
	$ids_match           = $link_id > 0 && $queried_id === $link_id;
	$object_type_matches = $is_taxonomy_link
		? $queried_object instanceof WP_Term
		: $queried_object instanceof WP_Post;

	// Archive links are matched on post type below, never by entity ID.
	if ( ! $is_archive_link && $ids_match && $object_type_matches ) {
		return true;
	}

	if ( ! is_post_type_archive() ) {
		return false;
	}

	/*
	 * Post type archive match - mirrors the classic menu's is_post_type_archive() check.
	 * Matching on the stored post type rather than the URL means the link stays active
	 * after a change of permalink structure, scheme or domain, all of which change the
	 * archive URL without updating the URL saved in the block.
	 */
	if ( $is_archive_link && '' !== $stored_type && is_post_type_archive( $stored_type ) ) {
		return true;
	}

	/*
	 * Post type archive URL match.
	 * Covers links that point at an archive without being stored as archive links, such
	 * as custom links, and archive links without a usable type.
	 */
	if ( ! empty( $attributes['url'] ) ) {
		$queried_archive_link = get_post_type_archive_link( get_queried_object()->name );
		if ( $attributes['url'] === $queried_archive_link ) {
			return true;
		}
	}

	return false;
}
