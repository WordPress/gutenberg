<?php
/**
 * Knowledge public API.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Maximum length, in characters, of a guideline row's content.
 */
if ( ! defined( 'GUTENBERG_GUIDELINE_MAX_LENGTH' ) ) {
	define( 'GUTENBERG_GUIDELINE_MAX_LENGTH', 5000 );
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

if ( ! function_exists( 'wp_guideline_scopes' ) ) {
	/**
	 * Returns the registered guideline scopes keyed by slug.
	 *
	 * Scopes are the sections shown on the Settings → Guidelines page. Each
	 * scope is backed by at most one `guideline`-typed `wp_knowledge` row whose
	 * slug is `guideline-{scope}`. Plugins can register their own scopes via the
	 * `wp_guideline_scopes` filter and the Settings page grows a section
	 * automatically. The registry carries identity and presentation only; rows
	 * are created on first save.
	 *
	 * @return array {
	 *     Slug-keyed map of guideline scopes.
	 *
	 *     @type array ...$0 {
	 *         Data for a single scope.
	 *
	 *         @type string $title       Human-readable section title.
	 *         @type string $description Human-readable section description.
	 *         @type int    $order       Sort order on the Settings page.
	 *     }
	 * }
	 * @phpstan-return array<string, array{title: string, description: string, order: int}>
	 */
	function wp_guideline_scopes(): array {
		/**
		 * Filters the guideline scopes available on this site.
		 *
		 * @param array $scopes Slug-keyed map of guideline scopes.
		 */
		return apply_filters(
			'wp_guideline_scopes',
			array(
				'site'       => array(
					'title'       => __( 'Site', 'gutenberg' ),
					'description' => __( "Describe your site's purpose, goals, and primary audience.", 'gutenberg' ),
					'order'       => 10,
				),
				'copy'       => array(
					'title'       => __( 'Copy', 'gutenberg' ),
					'description' => __( 'Set your writing standards for tone, voice, style, and formatting.', 'gutenberg' ),
					'order'       => 20,
				),
				'images'     => array(
					'title'       => __( 'Images', 'gutenberg' ),
					'description' => __( 'Outline your style, dimensions, formats, mood and aesthetic preferences.', 'gutenberg' ),
					'order'       => 30,
				),
				'additional' => array(
					'title'       => __( 'Additional', 'gutenberg' ),
					'description' => __( 'Add additional guidelines.', 'gutenberg' ),
					'order'       => 50,
				),
			)
		);
	}
}

if ( ! function_exists( 'wp_knowledge_get_or_create_type_term' ) ) {
	/**
	 * Resolve a `wp_knowledge_type` term by slug, creating it lazily.
	 *
	 * Created term names are written once in the site locale (via
	 * `wp_knowledge_maybe_map_term_label`) so they don't vary with whoever
	 * triggered creation.
	 *
	 * @access private
	 *
	 * @param string $slug Term slug.
	 * @return int|null Term ID, or null on failure.
	 */
	function wp_knowledge_get_or_create_type_term( string $slug ): ?int {
		$term = term_exists( $slug, 'wp_knowledge_type' );
		if ( $term ) {
			return (int) $term['term_id'];
		}

		$switched = switch_to_locale( get_locale() );
		$term     = wp_insert_term( $slug, 'wp_knowledge_type' );
		if ( $switched ) {
			restore_previous_locale();
		}

		if ( is_wp_error( $term ) ) {
			return null;
		}

		return (int) $term['term_id'];
	}
}

if ( ! function_exists( 'wp_knowledge_ensure_default_type_term' ) ) {
	/**
	 * Hook callback for the `save_post_wp_knowledge` action that assigns the
	 * knowledge type term.
	 *
	 * Rows whose slug begins with `guideline-` are forced onto the `guideline`
	 * type (the reservation rule: the prefix is reserved for guideline-typed
	 * rows). Any other row without a type term falls back to `note`.
	 *
	 * @access private
	 *
	 * @param int $post_id Saved post ID.
	 */
	function wp_knowledge_ensure_default_type_term( int $post_id ): void {
		if ( wp_is_post_revision( $post_id ) ) {
			return;
		}

		$post = get_post( $post_id );
		if ( ! $post instanceof WP_Post ) {
			return;
		}

		if ( 0 === strpos( $post->post_name, 'guideline-' ) ) {
			$term_id = wp_knowledge_get_or_create_type_term( 'guideline' );
			if ( null !== $term_id ) {
				wp_set_object_terms( $post_id, $term_id, 'wp_knowledge_type' );
			}
			return;
		}

		$terms = get_the_terms( $post_id, 'wp_knowledge_type' );
		if ( is_wp_error( $terms ) || ! empty( $terms ) ) {
			return;
		}

		$term_id = wp_knowledge_get_or_create_type_term( 'note' );
		if ( null !== $term_id ) {
			wp_set_object_terms( $post_id, $term_id, 'wp_knowledge_type' );
		}
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

if ( ! function_exists( 'wp_guideline_scope_from_slug' ) ) {
	/**
	 * Resolve a registry scope key from a guideline row slug.
	 *
	 * Returns the scope key for `guideline-{scope}` slugs that match a
	 * registered scope, or null for block rows (`guideline-block-*`) and
	 * unknown scopes.
	 *
	 * @access private
	 *
	 * @param string $slug Post slug.
	 * @return string|null Scope key, or null if not a registry scope.
	 */
	function wp_guideline_scope_from_slug( string $slug ): ?string {
		if ( 0 !== strpos( $slug, 'guideline-' ) || 0 === strpos( $slug, 'guideline-block-' ) ) {
			return null;
		}

		$scope  = substr( $slug, strlen( 'guideline-' ) );
		$scopes = wp_guideline_scopes();

		return isset( $scopes[ $scope ] ) ? $scope : null;
	}
}

if ( ! function_exists( 'wp_knowledge_guard_guideline_row' ) ) {
	/**
	 * Hook callback for `rest_pre_insert_wp_knowledge` that sanitizes and
	 * normalizes guideline rows on the REST insert path.
	 *
	 * For rows whose slug begins with `guideline-`:
	 * - Sanitizes `post_content` to plain text capped at the guideline length.
	 * - Re-stamps the title of registry scopes from `wp_guideline_scopes()` in
	 *   the site locale. Block rows keep the client-provided canonical block name.
	 *
	 * Slug uniqueness is intentionally left to WordPress: the published row keeps
	 * its exact slug because the first save has no conflict and later saves reuse
	 * that row by ID, while any other row with the same desired slug is suffixed
	 * (`guideline-copy-2`) by `wp_unique_post_slug()`. The Settings page reads
	 * only the published row by its exact slug, so suffixed rows are ignored. The
	 * client save flow reclaims an existing same-slug row instead of creating a
	 * duplicate (see routes/guidelines/data.ts).
	 *
	 * @access private
	 *
	 * @param stdClass        $prepared_post Prepared post object.
	 * @param WP_REST_Request $request       Request object.
	 * @return stdClass Prepared post.
	 */
	function wp_knowledge_guard_guideline_row( $prepared_post, $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$slug = '';
		if ( ! empty( $prepared_post->post_name ) ) {
			$slug = $prepared_post->post_name;
		} elseif ( ! empty( $prepared_post->ID ) ) {
			$existing = get_post( $prepared_post->ID );
			if ( $existing instanceof WP_Post ) {
				$slug = $existing->post_name;
			}
		}

		if ( 0 !== strpos( (string) $slug, 'guideline-' ) ) {
			return $prepared_post;
		}

		// Sanitize content: plain text, capped at the guideline length.
		if ( isset( $prepared_post->post_content ) ) {
			$content = sanitize_textarea_field( $prepared_post->post_content );
			if ( mb_strlen( $content, 'UTF-8' ) > GUTENBERG_GUIDELINE_MAX_LENGTH ) {
				$content = mb_substr( $content, 0, GUTENBERG_GUIDELINE_MAX_LENGTH, 'UTF-8' );
			}
			$prepared_post->post_content = $content;
		}

		// Re-stamp registry scope titles in the site locale. Block rows keep the
		// client-provided canonical block name.
		$scope = wp_guideline_scope_from_slug( $slug );
		if ( null !== $scope ) {
			$switched = switch_to_locale( get_locale() );
			$scopes   = wp_guideline_scopes();
			if ( $switched ) {
				restore_previous_locale();
			}
			if ( isset( $scopes[ $scope ]['title'] ) ) {
				$prepared_post->post_title = $scopes[ $scope ]['title'];
			}
		}

		return $prepared_post;
	}
}
