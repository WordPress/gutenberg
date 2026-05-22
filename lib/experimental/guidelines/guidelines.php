<?php
/**
 * Guidelines public API.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! function_exists( 'wp_guideline_types' ) ) {
	/**
	 * Returns the registered guideline types keyed by slug.
	 *
	 * Plugins can register their own types via the `wp_guideline_types` filter.
	 *
	 * @return array {
	 *     Slug-keyed map of guideline types.
	 *
	 *     @type array ...$0 {
	 *         Data for a single guideline type.
	 *
	 *         @type string $title The human-readable label for the type.
	 *     }
	 * }
	 * @phpstan-return array<string, array{title: string}>
	 */
	function wp_guideline_types(): array {
		/**
		 * Filters the guideline types available on this site.
		 *
		 * @param array $types {
		 *     Slug-keyed map of guideline types.
		 *
		 *     @type array ...$0 {
		 *         Data for a single guideline type.
		 *
		 *         @type string $title The human-readable label for the type.
		 *     }
		 * }
		 * @phpstan-param array<string, array{title: string}> $types
		 */
		return apply_filters(
			'wp_guideline_types',
			array(
				'artifact' => array(
					'title' => __( 'Artifact', 'gutenberg' ),
				),
				'content'  => array(
					'title' => __( 'Content', 'gutenberg' ),
				),
				'memory'   => array(
					'title' => __( 'Memory', 'gutenberg' ),
				),
			)
		);
	}
}

if ( ! function_exists( '_wp_guidelines_ensure_default_type_term' ) ) {
	/**
	 * Hook callback for the `save_post_wp_guideline` action that assigns the
	 * `artifact` fallback term when a guideline is saved without a type term.
	 *
	 * Uses `get_the_terms()` so the check is served by the object term cache.
	 *
	 * @access private
	 *
	 * @param int $post_id Saved post ID.
	 */
	function _wp_guidelines_ensure_default_type_term( int $post_id ): void {
		if ( wp_is_post_revision( $post_id ) ) {
			return;
		}

		$terms = get_the_terms( $post_id, 'wp_guideline_type' );
		if ( is_wp_error( $terms ) || ! empty( $terms ) ) {
			return;
		}

		// Resolve to an ID up front (creating the term on first use):
		// wp_set_object_terms() interprets strings as names for hierarchical
		// taxonomies, not slugs.
		$term = term_exists( 'artifact', 'wp_guideline_type' );
		if ( ! $term ) {
			$term = wp_insert_term( 'artifact', 'wp_guideline_type' );
			if ( is_wp_error( $term ) ) {
				return;
			}
		}

		wp_set_object_terms( $post_id, (int) $term['term_id'], 'wp_guideline_type' );
	}
}

if ( ! function_exists( '_wp_guidelines_synthesize_caps' ) ) {
	/**
	 * Hook callback for the `user_has_cap` filter that grants guideline
	 * capabilities based on the user's role, post ownership, and post status.
	 *
	 * Administrators get every guideline capability. Contributors, Authors,
	 * and Editors can list and create guidelines, and fully manage their own
	 * private rows. Publishing guidelines and acting on other users' rows is
	 * reserved for Administrators.
	 *
	 * @access private
	 *
	 * @param array   $allcaps All capabilities of the user.
	 * @param array   $caps    Required primitive capabilities for the requested capability.
	 * @param array   $args    Arguments that accompany the requested capability check.
	 * @param WP_User $user    The user object.
	 * @return array Possibly augmented capabilities.
	 */
	function _wp_guidelines_synthesize_caps( array $allcaps, array $caps, array $args, WP_User $user ): array {
		if ( ! empty( $allcaps['manage_options'] ) ) {
			$allcaps['read_guidelines']             = true;
			$allcaps['edit_guidelines']             = true;
			$allcaps['edit_others_guidelines']      = true;
			$allcaps['edit_published_guidelines']   = true;
			$allcaps['edit_private_guidelines']     = true;
			$allcaps['publish_guidelines']          = true;
			$allcaps['delete_guidelines']           = true;
			$allcaps['delete_others_guidelines']    = true;
			$allcaps['delete_published_guidelines'] = true;
			$allcaps['delete_private_guidelines']   = true;
			$allcaps['read_private_guidelines']     = true;
			return $allcaps;
		}

		if ( empty( $allcaps['edit_posts'] ) ) {
			return $allcaps;
		}

		// Ambient floor for Contributor+: `read_guidelines` clears the
		// post-type read check; `edit_guidelines` clears the create and
		// ownership checks that don't pass a post ID. Per-post primitives
		// are granted only in the per-post branch below.
		$allcaps['read_guidelines'] = true;
		$allcaps['edit_guidelines'] = true;

		if ( ! isset( $args[0], $args[2] ) ) {
			return $allcaps;
		}

		if ( ! in_array( $args[0], array( 'edit_post', 'delete_post', 'read_post' ), true ) ) {
			return $allcaps;
		}

		$post = get_post( $args[2] );
		if (
			! $post instanceof WP_Post ||
			'wp_guideline' !== $post->post_type ||
			(int) $post->post_author !== (int) $user->ID ||
			'private' !== $post->post_status
		) {
			return $allcaps;
		}

		$allcaps['edit_private_guidelines']   = true;
		$allcaps['delete_guidelines']         = true;
		$allcaps['delete_private_guidelines'] = true;
		$allcaps['read_private_guidelines']   = true;

		return $allcaps;
	}
}

if ( ! function_exists( '_wp_guidelines_maybe_map_term_label' ) ) {
	/**
	 * Hook callback for the `wp_insert_term_data` filter that swaps a
	 * raw guideline-type slug for its human-readable label when WordPress
	 * is about to lazily create the term.
	 *
	 * When `wp_set_object_terms()` is called with a slug that doesn't yet
	 * exist, `wp_insert_term()` fires and the filter runs after WP has
	 * computed both `name` and `slug`. A `name` equal to `slug` indicates
	 * the term was created from a raw slug (e.g. by `wp_set_object_terms()`)
	 * rather than from a user-provided label, so the label is replaced with
	 * the title from `wp_guideline_types()`.
	 *
	 * @access private
	 *
	 * @param array  $data     Term data to be inserted (keyed by column name).
	 * @param string $taxonomy Taxonomy slug.
	 * @return array Possibly modified term data.
	 */
	function _wp_guidelines_maybe_map_term_label( array $data, string $taxonomy ): array {
		if ( 'wp_guideline_type' !== $taxonomy ) {
			return $data;
		}

		if ( $data['name'] !== $data['slug'] ) {
			return $data;
		}

		$types = wp_guideline_types();
		if ( isset( $types[ $data['slug'] ] ) ) {
			$data['name'] = $types[ $data['slug'] ]['title'];
		}

		return $data;
	}
}
