<?php
/**
 * Guidelines REST API Controller.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * REST API controller for guideline posts.
 */
class Gutenberg_Guidelines_REST_Controller extends WP_REST_Posts_Controller {

	/**
	 * Retrieves the item schema, allowing guideline type terms to be provided
	 * by ID or slug in create/update requests.
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		$schema = parent::get_item_schema();
		$base   = $this->get_guideline_type_rest_base();

		if ( isset( $schema['properties'][ $base ]['items']['type'] ) ) {
			$schema['properties'][ $base ]['description']   = __(
				'The term IDs or slugs assigned to the post in the wp_guideline_type taxonomy.',
				'gutenberg'
			);
			$schema['properties'][ $base ]['items']['type'] = array( 'integer', 'string' );
		}

		return $schema;
	}

	/**
	 * Retrieves the query params for the guidelines collection.
	 *
	 * @return array Collection parameters.
	 */
	public function get_collection_params() {
		$query_params = parent::get_collection_params();
		$base         = $this->get_guideline_type_rest_base();

		foreach ( array( $base, $base . '_exclude' ) as $param ) {
			if ( isset( $query_params[ $param ] ) ) {
				$query_params[ $param ] = $this->allow_guideline_type_slugs_in_taxonomy_limit_schema( $query_params[ $param ] );
			}
		}

		return $query_params;
	}

	/**
	 * Retrieves a collection of guidelines.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_items( $request ) {
		$this->normalize_guideline_type_query_terms( $request );

		return parent::get_items( $request );
	}

	/**
	 * Gate the guidelines collection on the post-type read capability.
	 *
	 * The default `WP_REST_Posts_Controller` allows unauthenticated reads of
	 * `publish` posts; guidelines store private data and require an
	 * authenticated user with read access.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function get_items_permissions_check( $request ) {
		$post_type = get_post_type_object( $this->post_type );
		if ( ! current_user_can( $post_type->cap->read ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'Sorry, you are not allowed to view guidelines.', 'gutenberg' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return parent::get_items_permissions_check( $request );
	}

	/**
	 * Scope collection queries to rows readable by the current user.
	 *
	 * The parent controller filters unreadable posts after the query runs, but
	 * collection totals and pagination headers are based on the unfiltered
	 * query. Setting `perm` lets WP_Query apply private-post visibility before
	 * totals are calculated.
	 *
	 * @param array                $prepared_args Prepared WP_Query arguments.
	 * @param WP_REST_Request|null $request       Full details about the request.
	 * @return array Updated WP_Query arguments.
	 */
	protected function prepare_items_query( $prepared_args = array(), $request = null ) {
		$query_args         = parent::prepare_items_query( $prepared_args, $request );
		$query_args['perm'] = 'readable';

		return $query_args;
	}

	/**
	 * Gate per-item reads on the user-specific read capability.
	 *
	 * The default treats every `publish` post as universally readable;
	 * guidelines reach the parent's checks only after `read_post` passes,
	 * which factors in ownership and status.
	 *
	 * @param WP_Post $post Post object.
	 * @return bool Whether the post can be read.
	 */
	public function check_read_permission( $post ) {
		if ( ! current_user_can( 'read_post', $post->ID ) ) {
			return false;
		}

		return parent::check_read_permission( $post );
	}

	/**
	 * Checks whether current user can assign the provided terms.
	 *
	 * Slugs need a custom pass because the parent implementation checks term
	 * permissions by ID and skips values it cannot resolve with get_term().
	 *
	 * @param WP_REST_Request $request The request object with post and terms data.
	 * @return bool Whether the current user can assign the provided terms.
	 */
	protected function check_assign_terms_permission( $request ) {
		$taxonomy = get_taxonomy( Gutenberg_Guidelines_Post_Type::TAXONOMY );
		if ( ! $taxonomy ) {
			return parent::check_assign_terms_permission( $request );
		}

		$base = $this->get_guideline_type_rest_base();
		if ( isset( $request[ $base ] ) ) {
			foreach ( (array) $request[ $base ] as $term ) {
				if ( ! is_string( $term ) || rest_is_integer( $term ) ) {
					continue;
				}

				$term_id = $this->get_guideline_type_term_id( $term );
				if ( is_wp_error( $term_id ) ) {
					$slug  = sanitize_title( $term );
					$types = wp_guideline_types();

					if (
						'' !== $slug &&
						isset( $types[ $slug ] ) &&
						(
							! current_user_can( $taxonomy->cap->edit_terms ) ||
							! current_user_can( $taxonomy->cap->assign_terms )
						)
					) {
						return false;
					}

					continue;
				}

				if ( ! current_user_can( 'assign_term', $term_id ) ) {
					return false;
				}
			}
		}

		return parent::check_assign_terms_permission( $request );
	}

	/**
	 * Restrict the status surface for callers without publish capability
	 * to `private`. Administrators retain the parent's full status surface.
	 *
	 * @param string       $post_status Requested post status.
	 * @param WP_Post_Type $post_type   Post type object.
	 * @return string|WP_Error Status, or WP_Error if not permitted.
	 */
	protected function handle_status_param( $post_status, $post_type ) {
		if ( ! current_user_can( $post_type->cap->publish_posts ) ) {
			if ( 'private' !== $post_status ) {
				return new WP_Error(
					'rest_cannot_publish',
					__( 'Sorry, you are only allowed to set status to private for guidelines.', 'gutenberg' ),
					array( 'status' => rest_authorization_required_code() )
				);
			}
			return $post_status;
		}

		return parent::handle_status_param( $post_status, $post_type );
	}

	/**
	 * Default the status to `private` on create when none is supplied
	 * (the parent would fall back to `draft`). Updates pass through so a
	 * partial PATCH preserves the existing status.
	 *
	 * `wp_guideline_type` is optional on create. When omitted, the post
	 * falls back to the default guideline taxonomy term `artifact`.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return stdClass|WP_Error Prepared post object or error.
	 */
	protected function prepare_item_for_database( $request ) {
		if ( ! isset( $request['id'] ) && null === $request['status'] ) {
			$request->set_param( 'status', 'private' );
		}

		$terms_update = $this->normalize_guideline_type_terms( $request );
		if ( is_wp_error( $terms_update ) ) {
			return $terms_update;
		}

		return parent::prepare_item_for_database( $request );
	}

	/**
	 * Resolves guideline type slugs to term IDs before the parent controller
	 * assigns taxonomy terms.
	 *
	 * @param WP_REST_Request $request The request object with post and terms data.
	 * @return true|WP_Error True on success, WP_Error when a slug is invalid.
	 */
	private function normalize_guideline_type_terms( WP_REST_Request $request ) {
		$base = $this->get_guideline_type_rest_base();
		if ( ! isset( $request[ $base ] ) ) {
			return true;
		}

		$term_ids = array();
		foreach ( (array) $request[ $base ] as $term ) {
			if ( rest_is_integer( $term ) ) {
				$term_ids[] = (int) $term;
				continue;
			}

			$term_id = $this->get_guideline_type_term_id( $term, true );
			if ( is_wp_error( $term_id ) ) {
				return $term_id;
			}

			$term_ids[] = $term_id;
		}

		$request->set_param( $base, $term_ids );

		return true;
	}

	/**
	 * Resolves guideline type slugs in collection filters to term IDs.
	 *
	 * Unlike create/update requests, reads do not create missing registered
	 * terms. Unknown include slugs resolve to no matches, mirroring an unknown
	 * term ID.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 */
	private function normalize_guideline_type_query_terms( WP_REST_Request $request ): void {
		$base = $this->get_guideline_type_rest_base();

		foreach ( array( $base, $base . '_exclude' ) as $param ) {
			if ( ! isset( $request[ $param ] ) ) {
				continue;
			}

			$value = $request[ $param ];
			if ( rest_is_array( $value ) ) {
				$request->set_param( $param, $this->get_guideline_type_query_term_ids( (array) $value ) );
				continue;
			}

			if ( rest_is_object( $value ) && isset( $value['terms'] ) ) {
				$value['terms'] = $this->get_guideline_type_query_term_ids( (array) $value['terms'] );
				$request->set_param( $param, $value );
			}
		}
	}

	/**
	 * Resolves collection filter terms to IDs.
	 *
	 * @param array $terms Term IDs or slugs.
	 * @return array Term IDs.
	 */
	private function get_guideline_type_query_term_ids( array $terms ): array {
		$term_ids = array();
		foreach ( $terms as $term ) {
			if ( rest_is_integer( $term ) ) {
				$term_ids[] = (int) $term;
				continue;
			}

			$term_id    = is_string( $term ) ? $this->get_guideline_type_term_id( $term ) : null;
			$term_ids[] = is_wp_error( $term_id ) || null === $term_id ? 0 : $term_id;
		}

		return $term_ids;
	}

	/**
	 * Resolves a guideline type term by slug, optionally creating registered
	 * guideline types on first use.
	 *
	 * @param string $slug   Term slug.
	 * @param bool   $create Optional. Whether to create registered types when missing.
	 * @return int|WP_Error Term ID on success, WP_Error on failure.
	 */
	private function get_guideline_type_term_id( string $slug, bool $create = false ) {
		$slug = sanitize_title( $slug );
		if ( '' === $slug ) {
			return new WP_Error(
				'rest_invalid_guideline_type',
				__( 'Invalid guideline type slug.', 'gutenberg' ),
				array( 'status' => 400 )
			);
		}

		$term = get_term_by( 'slug', $slug, Gutenberg_Guidelines_Post_Type::TAXONOMY );
		if ( $term ) {
			return (int) $term->term_id;
		}

		$types = wp_guideline_types();
		if ( ! $create || ! isset( $types[ $slug ] ) ) {
			return new WP_Error(
				'rest_invalid_guideline_type',
				__( 'Invalid guideline type slug.', 'gutenberg' ),
				array( 'status' => 400 )
			);
		}

		$inserted = wp_insert_term(
			$types[ $slug ]['title'],
			Gutenberg_Guidelines_Post_Type::TAXONOMY,
			array( 'slug' => $slug )
		);

		if ( is_wp_error( $inserted ) ) {
			return $inserted;
		}

		return (int) $inserted['term_id'];
	}

	/**
	 * Allows guideline type collection filters to accept IDs or slugs.
	 *
	 * @param array $schema Taxonomy limit schema.
	 * @return array Updated schema.
	 */
	private function allow_guideline_type_slugs_in_taxonomy_limit_schema( array $schema ): array {
		if ( isset( $schema['oneOf'][0]['items']['type'] ) ) {
			$schema['oneOf'][0]['items']['type'] = array( 'integer', 'string' );
		}

		if ( isset( $schema['oneOf'][1]['properties']['terms']['items']['type'] ) ) {
			$schema['oneOf'][1]['properties']['terms']['items']['type'] = array( 'integer', 'string' );
		}

		return $schema;
	}

	/**
	 * Gets the REST field name for guideline type terms.
	 *
	 * @return string REST field name.
	 */
	private function get_guideline_type_rest_base(): string {
		$taxonomy = get_taxonomy( Gutenberg_Guidelines_Post_Type::TAXONOMY );
		if ( ! $taxonomy ) {
			return Gutenberg_Guidelines_Post_Type::TAXONOMY;
		}

		return ! empty( $taxonomy->rest_base ) ? $taxonomy->rest_base : $taxonomy->name;
	}
}
