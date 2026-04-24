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
				'artifact'    => array(
					'title' => __( 'Artifact', 'gutenberg' ),
				),
				'instruction' => array(
					'title' => __( 'Instruction', 'gutenberg' ),
				),
				'memory'      => array(
					'title' => __( 'Memory', 'gutenberg' ),
				),
				'plan'        => array(
					'title' => __( 'Plan', 'gutenberg' ),
				),
				'skill'       => array(
					'title' => __( 'Skill', 'gutenberg' ),
				),
			)
		);
	}
}

if ( ! function_exists( 'wp_guidelines_ensure_default_type_term' ) ) {
	/**
	 * Assigns the `artifact` fallback term when a `wp_guideline` post is saved
	 * without a type term.
	 *
	 * Uses `get_the_terms()` so the check is served by the object term cache.
	 *
	 * @param int $post_id Saved post ID.
	 */
	function wp_guidelines_ensure_default_type_term( int $post_id ): void {
		if ( wp_is_post_revision( $post_id ) ) {
			return;
		}

		$terms = get_the_terms( $post_id, 'wp_guideline_type' );
		if ( is_wp_error( $terms ) || ! empty( $terms ) ) {
			return;
		}

		wp_set_object_terms( $post_id, 'artifact', 'wp_guideline_type' );
	}
}

if ( ! function_exists( 'wp_guidelines_maybe_map_term_label' ) ) {
	/**
	 * Maps a raw guideline-type slug to its human-readable label when
	 * `wp_insert_term()` is about to create the term.
	 *
	 * Lazily creates taxonomy terms on first use. When `wp_set_object_terms()`
	 * assigns a slug that doesn't exist yet, `wp_insert_term()` fires. This
	 * filter runs after WP has computed both `name` and `slug`, so a `name`
	 * equal to `slug` indicates a raw slug was passed (e.g. from
	 * `wp_set_object_terms()`) rather than a user-provided label.
	 *
	 * @param array  $data     Term data to be inserted (keyed by column name).
	 * @param string $taxonomy Taxonomy slug.
	 * @return array Possibly modified term data.
	 */
	function wp_guidelines_maybe_map_term_label( $data, $taxonomy ) {
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
