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

		// wp_set_object_terms() expects term IDs for hierarchical taxonomies —
		// strings are interpreted as term names, not slugs. Resolve 'artifact'
		// to an ID up front (creating the term on first use) so we assign the
		// exact term we mean instead of relying on name-based lookup.
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
