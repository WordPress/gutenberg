<?php
/**
 * Knowledge public API.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! function_exists( 'wp_knowledge_types' ) ) {
	/**
	 * Returns the registered knowledge types keyed by slug.
	 *
	 * Plugins can register their own types via the `wp_knowledge_types` filter.
	 *
	 * @return array {
	 *     Slug-keyed map of knowledge types.
	 *
	 *     @type array ...$0 {
	 *         Data for a single knowledge type.
	 *
	 *         @type string $title The human-readable label for the type.
	 *     }
	 * }
	 * @phpstan-return array<string, array{title: string}>
	 */
	function wp_knowledge_types(): array {
		/**
		 * Filters the knowledge types available on this site.
		 *
		 * @param array $types {
		 *     Slug-keyed map of knowledge types.
		 *
		 *     @type array ...$0 {
		 *         Data for a single knowledge type.
		 *
		 *         @type string $title The human-readable label for the type.
		 *     }
		 * }
		 * @phpstan-param array<string, array{title: string}> $types
		 */
		return apply_filters(
			'wp_knowledge_types',
			array(
				'guideline' => array(
					'title' => _x( 'Guideline', 'knowledge type', 'gutenberg' ),
				),
				'memory'    => array(
					'title' => _x( 'Memory', 'knowledge type', 'gutenberg' ),
				),
				'note'      => array(
					'title' => _x( 'Note', 'knowledge type', 'gutenberg' ),
				),
			)
		);
	}
}

if ( ! function_exists( 'wp_knowledge_ensure_default_type_term' ) ) {
	/**
	 * Hook callback for the `save_post_wp_knowledge` action that assigns the
	 * `note` fallback term when a knowledge post is saved without a type
	 * term.
	 *
	 * Uses `get_the_terms()` so the check is served by the object term cache.
	 *
	 * @access private
	 *
	 * @param int $post_id Saved post ID.
	 */
	function wp_knowledge_ensure_default_type_term( int $post_id ): void {
		if ( wp_is_post_revision( $post_id ) ) {
			return;
		}

		$terms = get_the_terms( $post_id, 'wp_knowledge_type' );
		if ( is_wp_error( $terms ) || ! empty( $terms ) ) {
			return;
		}

		// Resolve to an ID up front (creating the term on first use):
		// wp_set_object_terms() interprets strings as names for hierarchical
		// taxonomies, not slugs.
		$term = term_exists( 'note', 'wp_knowledge_type' );
		if ( ! $term ) {
			$term = wp_insert_term( 'note', 'wp_knowledge_type' );
			if ( is_wp_error( $term ) ) {
				return;
			}
		}

		wp_set_object_terms( $post_id, (int) $term['term_id'], 'wp_knowledge_type' );
	}
}

if ( ! function_exists( 'wp_maybe_grant_knowledge_caps' ) ) {
	/**
	 * Filters the user capabilities to grant the `wp_knowledge` post type capabilities as necessary.
	 *
	 * The `wp_knowledge` post type uses a `knowledge`-prefixed capability set that
	 * is granted dynamically rather than stored on roles. Administrators (users
	 * with `manage_options`) receive every knowledge capability. Contributors,
	 * authors, and editors (users with `edit_posts`) may list and create knowledge
	 * rows and fully manage their own private rows. Publishing knowledge and acting
	 * on other users' rows is reserved for administrators. Subscribers receive
	 * nothing and are stopped at the post-type door by the `read_knowledge_items` mapping.
	 *
	 * @param bool[]   $allcaps An array of all the user's capabilities.
	 * @param string[] $caps    Required primitive capabilities for the requested capability.
	 * @param array    $args    Arguments that accompany the requested capability check.
	 * @param WP_User  $user    The user object.
	 * @return bool[] Filtered array of the user's capabilities.
	 */
	function wp_maybe_grant_knowledge_caps( $allcaps, $caps, $args, $user ) {
		if ( ! empty( $allcaps['manage_options'] ) ) {
			$allcaps['read_knowledge_items']             = true;
			$allcaps['edit_knowledge_items']             = true;
			$allcaps['edit_others_knowledge_items']      = true;
			$allcaps['edit_published_knowledge_items']   = true;
			$allcaps['edit_private_knowledge_items']     = true;
			$allcaps['publish_knowledge_items']          = true;
			$allcaps['delete_knowledge_items']           = true;
			$allcaps['delete_others_knowledge_items']    = true;
			$allcaps['delete_published_knowledge_items'] = true;
			$allcaps['delete_private_knowledge_items']   = true;
			$allcaps['read_private_knowledge_items']     = true;
			return $allcaps;
		}

		if ( empty( $allcaps['edit_posts'] ) ) {
			return $allcaps;
		}

		// Ambient floor for Contributor+: `read_knowledge_items` clears the
		// post-type read check; `edit_knowledge_items` clears the create and
		// ownership checks that don't pass a post ID. Per-post primitives
		// are granted only in the per-post branch below.
		$allcaps['read_knowledge_items'] = true;
		$allcaps['edit_knowledge_items'] = true;

		if ( ! isset( $args[0], $args[2] ) ) {
			return $allcaps;
		}

		if ( ! in_array( $args[0], array( 'edit_post', 'delete_post', 'read_post' ), true ) ) {
			return $allcaps;
		}

		$post = get_post( $args[2] );
		if (
			! $post instanceof WP_Post ||
			'wp_knowledge' !== $post->post_type ||
			(int) $post->post_author !== (int) $user->ID
		) {
			return $allcaps;
		}

		/*
		 * A trashed row keeps its pre-trash status in `_wp_trash_meta_status`.
		 * Resolve that effective status so the author keeps the ability to
		 * restore or permanently delete their own row once it is in the trash. A
		 * row trashed from a non-private status (only reachable for
		 * administrators) still falls outside the grant.
		 */
		$status = $post->post_status;
		if ( 'trash' === $status ) {
			$status = get_post_meta( $post->ID, '_wp_trash_meta_status', true );
		}

		if ( 'private' !== $status ) {
			return $allcaps;
		}

		$allcaps['edit_private_knowledge_items']   = true;
		$allcaps['delete_knowledge_items']         = true;
		$allcaps['delete_private_knowledge_items'] = true;
		$allcaps['read_private_knowledge_items']   = true;

		return $allcaps;
	}
}

if ( ! function_exists( 'wp_knowledge_maybe_map_term_label' ) ) {
	/**
	 * Hook callback for the `wp_insert_term_data` filter that swaps a
	 * raw knowledge-type slug for its human-readable label when WordPress
	 * is about to lazily create the term.
	 *
	 * When `wp_set_object_terms()` is called with a slug that doesn't yet
	 * exist, `wp_insert_term()` fires and the filter runs after WP has
	 * computed both `name` and `slug`. A `name` equal to `slug` indicates
	 * the term was created from a raw slug (e.g. by `wp_set_object_terms()`)
	 * rather than from a user-provided label, so the label is replaced with
	 * the title from `wp_knowledge_types()`.
	 *
	 * @access private
	 *
	 * @param array  $data     Term data to be inserted (keyed by column name).
	 * @param string $taxonomy Taxonomy slug.
	 * @return array Possibly modified term data.
	 */
	function wp_knowledge_maybe_map_term_label( array $data, string $taxonomy ): array {
		if ( 'wp_knowledge_type' !== $taxonomy ) {
			return $data;
		}

		if ( $data['name'] !== $data['slug'] ) {
			return $data;
		}

		$types = wp_knowledge_types();
		if ( isset( $types[ $data['slug'] ] ) ) {
			$data['name'] = $types[ $data['slug'] ]['title'];
		}

		return $data;
	}
}
