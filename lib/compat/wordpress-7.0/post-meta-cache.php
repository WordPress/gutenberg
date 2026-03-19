<?php
/**
 * Post meta cache invalidation control.
 *
 * Backports the `invalidates_query_cache` parameter from WordPress Core.
 * Allows specific post meta keys to be marked as non-cache-invalidating,
 * preventing unnecessary `last_changed` bumps in the posts cache group.
 *
 * @package gutenberg
 * @since 20.3.0
 *
 * @see https://core.trac.wordpress.org/ticket/64696
 * @see https://github.com/WordPress/wordpress-develop/pull/11290
 */

if ( ! function_exists( 'wp_post_meta_invalidates_query_cache' ) ) {

	/**
	 * Manages the registry of non-cache-invalidating post meta keys.
	 *
	 * When called with a meta key, registers it as non-cacheable.
	 * Always returns the full list of registered keys.
	 *
	 * @since 20.3.0
	 * @access private
	 *
	 * @param string|null $meta_key Optional. Meta key to register. Default null.
	 * @return string[] Array of non-cacheable meta keys.
	 */
	function gutenberg_non_cacheable_post_meta_keys( $meta_key = null ) {
		static $keys = array();

		if ( null !== $meta_key && ! in_array( $meta_key, $keys, true ) ) {
			$keys[] = $meta_key;
		}

		return $keys;
	}

	/**
	 * Registers a post meta key as non-cache-invalidating.
	 *
	 * Meta keys registered this way will not bump the `last_changed`
	 * timestamp in the `posts` cache group when added, updated, or deleted.
	 *
	 * @since 20.3.0
	 *
	 * @param string $meta_key Meta key to register as non-cacheable.
	 */
	function gutenberg_register_non_cacheable_post_meta( $meta_key ) {
		gutenberg_non_cacheable_post_meta_keys( $meta_key );
	}

	/**
	 * Checks whether a post meta key invalidates query caches when updated.
	 *
	 * Unregistered meta keys are assumed to invalidate query caches.
	 *
	 * @since 20.3.0
	 *
	 * @param string $meta_key  Metadata key.
	 * @param string $post_type Post type to check. Not used in the backport
	 *                          but included for API compatibility with Core.
	 * @return bool True if the meta key invalidates query caches, false otherwise.
	 */
	function wp_post_meta_invalidates_query_cache( $meta_key, $post_type = '' ) {
		$non_cacheable = gutenberg_non_cacheable_post_meta_keys();
		return ! in_array( $meta_key, $non_cacheable, true );
	}

	/**
	 * Conditionally sets the last changed time for the 'posts' cache group.
	 *
	 * Skips cache invalidation for meta keys registered as non-cacheable
	 * via `gutenberg_register_non_cacheable_post_meta()`.
	 *
	 * @since 20.3.0
	 *
	 * @param int    $meta_id   Meta ID.
	 * @param int    $object_id Object ID.
	 * @param string $meta_key  Meta key.
	 */
	function gutenberg_cache_set_posts_last_changed( $meta_id, $object_id, $meta_key ) {
		if ( $meta_key && ! wp_post_meta_invalidates_query_cache( $meta_key ) ) {
			return;
		}

		wp_cache_set_posts_last_changed();
	}

	// Replace Core's unconditional cache invalidation hooks with the
	// conditional version that checks the meta key registry.
	remove_action( 'added_post_meta', 'wp_cache_set_posts_last_changed' );
	remove_action( 'updated_post_meta', 'wp_cache_set_posts_last_changed' );
	remove_action( 'deleted_post_meta', 'wp_cache_set_posts_last_changed' );

	add_action( 'added_post_meta', 'gutenberg_cache_set_posts_last_changed', 10, 3 );
	add_action( 'updated_post_meta', 'gutenberg_cache_set_posts_last_changed', 10, 3 );
	add_action( 'deleted_post_meta', 'gutenberg_cache_set_posts_last_changed', 10, 3 );
}
