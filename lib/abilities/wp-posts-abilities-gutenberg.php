<?php
/**
 * Registers core post abilities.
 * This is a utility class to encapsulate the registration of post-related abilities.
 * And reuse shared logic and schemas between the abilities.
 * It is not intended to be instantiated or consumed directly by any other code or plugin.
 *
 * @internal This class is not part of the public API.
 * @access private
 */
class WP_Posts_Abilities_Gutenberg {

	/**
	 * Available public post types.
	 *
	 * @var array
	 */
	private static array $available_post_types;

	/**
	 * Description string of available post types.
	 *
	 * @var string
	 */
	private static string $available_post_types_desc;

	/**
	 * Shared output schema for basic post response.
	 *
	 * @var array
	 */
	private static array $post_output_schema;

	/**
	 * Shared input schema properties for post fields.
	 *
	 * @var array
	 */
	private static array $post_fields_schema;

	/**
	 * Initializes shared data.
	 *
	 * @return void
	 */
	private static function init(): void {
		self::$available_post_types      = array_values( (array) get_post_types( array( 'public' => true ), 'names' ) );
		self::$available_post_types_desc = empty( self::$available_post_types )
			? __( 'none', 'gutenberg' )
			: implode( ', ', self::$available_post_types );

		self::$post_output_schema = array(
			'type'       => 'object',
			'required'   => array( 'id' ),
			'properties' => array(
				'id'        => array( 'type' => 'integer' ),
				'post_type' => array( 'type' => 'string' ),
				'status'    => array( 'type' => 'string' ),
				'link'      => array( 'type' => 'string' ),
				'title'     => array( 'type' => 'string' ),
				'content'   => array( 'type' => 'string' ),
				'excerpt'   => array( 'type' => 'string' ),
			),
		);

		self::$post_fields_schema = array(
			'title'          => array(
				'type'        => 'string',
				'description' => __( 'Post title.', 'gutenberg' ),
			),
			'content'        => array(
				'type'        => 'string',
				'description' => __( 'Post content as HTML. Include WordPress block comments (<!-- wp:blockname {"attr":"value"} -->) for full block editor compatibility. Use wpmcp/list-block-types to get valid block names and attributes.', 'gutenberg' ),
			),
			'excerpt'        => array(
				'type'        => 'string',
				'description' => __( 'Post excerpt.', 'gutenberg' ),
			),
			'status'         => array(
				'type'        => 'string',
				'description' => __( 'Post status (draft, publish, etc).', 'gutenberg' ),
				'default'     => 'draft',
			),
			'author'         => array(
				'type'        => 'integer',
				'description' => __( 'Author user ID.', 'gutenberg' ),
			),
			'meta'           => array(
				'type'                 => 'object',
				'description'          => __( 'Meta fields to set on the post.', 'gutenberg' ),
				'additionalProperties' => true,
			),
			'tax_input'      => array(
				'type'                 => 'object',
				'description'          => __( 'Taxonomy terms mapping (taxonomy => term IDs or slugs).', 'gutenberg' ),
				'additionalProperties' => true,
			),
			'date'           => array(
				'type'        => 'string',
				'description' => __( 'Post date in YYYY-MM-DD HH:MM:SS format (site timezone).', 'gutenberg' ),
			),
			'date_gmt'       => array(
				'type'        => 'string',
				'description' => __( 'Post date in YYYY-MM-DD HH:MM:SS format (GMT).', 'gutenberg' ),
			),
			'comment_status' => array(
				'type'        => 'string',
				'description' => __( 'Whether comments are allowed.', 'gutenberg' ),
				'enum'        => array( 'open', 'closed' ),
			),
			'ping_status'    => array(
				'type'        => 'string',
				'description' => __( 'Whether pingbacks/trackbacks are allowed.', 'gutenberg' ),
				'enum'        => array( 'open', 'closed' ),
			),
			'password'       => array(
				'type'        => 'string',
				'description' => __( 'Password to protect the post.', 'gutenberg' ),
			),
			'parent'         => array(
				'type'        => 'integer',
				'description' => __( 'Parent post ID for hierarchical post types.', 'gutenberg' ),
			),
			'menu_order'     => array(
				'type'        => 'integer',
				'description' => __( 'Order value for sorting.', 'gutenberg' ),
			),
			'categories'     => array(
				'type'        => 'array',
				'description' => __( 'Category IDs or slugs to assign.', 'gutenberg' ),
				'items'       => array( 'type' => array( 'integer', 'string' ) ),
			),
			'tags'           => array(
				'type'        => 'array',
				'description' => __( 'Tag IDs or slugs to assign.', 'gutenberg' ),
				'items'       => array( 'type' => array( 'integer', 'string' ) ),
			),
			'template'       => array(
				'type'        => 'string',
				'description' => __( 'Page template file to use (e.g., "templates/full-width.php").', 'gutenberg' ),
			),
			'slug'           => array(
				'type'        => 'string',
				'description' => __( 'Alphanumeric identifier for the post.', 'gutenberg' ),
			),
		);
	}

	/**
	 * Registers all post abilities.
	 *
	 * @return void
	 */
	public static function register(): void {
		$post_abilities = array(
			'core/create-post',
			'core/get-post',
			'core/find-posts',
			'core/update-post',
		);
		foreach ( $post_abilities as $ability ) {
			if ( wp_has_ability( $ability ) ) {
				wp_unregister_ability( $ability );
			}
		}

		self::init();
		self::register_create_post();
		self::register_get_post();
		self::register_find_posts();
		self::register_update_post();
	}

	/**
	 * Formats a post for output.
	 *
	 * @param WP_Post $post               The post object.
	 * @param bool    $include_taxonomies Whether to include taxonomy terms.
	 * @param bool    $include_meta       Whether to include meta fields.
	 * @return array Formatted post data.
	 */
	private static function format_post_output( WP_Post $post, bool $include_taxonomies = false, bool $include_meta = false ): array {
		$result = array(
			'id'        => $post->ID,
			'post_type' => $post->post_type,
			'status'    => $post->post_status,
			'link'      => (string) get_permalink( $post->ID ),
			'title'     => (string) $post->post_title,
			'content'   => (string) $post->post_content,
			'excerpt'   => (string) $post->post_excerpt,
		);

		if ( $include_taxonomies ) {
			$result['taxonomies'] = self::build_taxonomy_output( $post->ID, $post->post_type );
		}

		if ( $include_meta ) {
			$result['meta'] = get_post_meta( $post->ID );
		}

		return $result;
	}

	/**
	 * Resolves taxonomy terms from IDs or slugs.
	 *
	 * @param mixed  $terms_in Terms as IDs, slugs, or names.
	 * @param string $taxonomy The taxonomy name.
	 * @return array Array of resolved term IDs.
	 */
	private static function resolve_taxonomy_terms( $terms_in, string $taxonomy ): array {
		$term_ids = array();
		$terms_in = is_array( $terms_in ) ? $terms_in : array( $terms_in );

		foreach ( $terms_in as $t ) {
			if ( is_numeric( $t ) ) {
				$term_ids[] = (int) $t;
				continue;
			}
			if ( ! is_string( $t ) ) {
				continue;
			}
			$term = get_term_by( 'slug', $t, $taxonomy );
			if ( ! $term ) {
				$term = get_term_by( 'name', $t, $taxonomy );
			}
			if ( $term instanceof WP_Term ) {
				$term_ids[] = (int) $term->term_id;
			}
		}

		return $term_ids;
	}

	/**
	 * Builds taxonomy output for a post.
	 *
	 * @param int    $post_id   The post ID.
	 * @param string $post_type The post type.
	 * @return array Taxonomy terms organized by taxonomy.
	 */
	private static function build_taxonomy_output( int $post_id, string $post_type ): array {
		$taxonomies      = get_object_taxonomies( $post_type, 'names' );
		$taxonomy_output = array();

		foreach ( $taxonomies as $taxonomy ) {
			$terms = wp_get_post_terms( $post_id, $taxonomy, array( 'fields' => 'all' ) );
			if ( is_wp_error( $terms ) || empty( $terms ) ) {
				continue;
			}
			$taxonomy_output[ $taxonomy ] = array_map(
				static function ( $term ) {
					return array(
						'id'     => $term->term_id,
						'name'   => $term->name,
						'slug'   => $term->slug,
						'parent' => $term->parent,
					);
				},
				$terms
			);
		}

		return $taxonomy_output;
	}

	/**
	 * Generic recursive processor for nested query structures.
	 *
	 * @param array         $input             The query input (with queries/relation structure).
	 * @param callable      $process_leaf      Callback to process leaf clauses. Returns array or null.
	 * @param callable|null $process_top_level Optional callback for top-level fields (e.g., column).
	 * @return array WordPress-compatible query array.
	 */
	private static function process_query_recursive( array $input, callable $process_leaf, ?callable $process_top_level = null ): array {
		$result = array();

		if ( ! empty( $input['relation'] ) && in_array( $input['relation'], array( 'AND', 'OR' ), true ) ) {
			$result['relation'] = $input['relation'];
		}

		if ( $process_top_level ) {
			$process_top_level( $input, $result );
		}

		if ( ! empty( $input['queries'] ) && is_array( $input['queries'] ) ) {
			foreach ( $input['queries'] as $query ) {
				if ( ! is_array( $query ) ) {
					continue;
				}
				if ( isset( $query['queries'] ) ) {
					$nested = self::process_query_recursive( $query, $process_leaf, $process_top_level );
					if ( ! empty( $nested ) ) {
						$result[] = $nested;
					}
				} else {
					$clause = $process_leaf( $query );
					if ( $clause !== null ) {
						$result[] = $clause;
					}
				}
			}
		}

		return $result;
	}

	/**
	 * Process a meta_query leaf clause.
	 *
	 * @param array $query The clause data.
	 * @return array|null The processed clause or null if invalid.
	 */
	private static function process_meta_clause( array $query ): ?array {
		if ( empty( $query['key'] ) ) {
			return null;
		}
		$clause = array(
			'key'     => sanitize_key( (string) $query['key'] ),
			'compare' => isset( $query['compare'] ) ? sanitize_text_field( (string) $query['compare'] ) : '=',
		);
		if ( array_key_exists( 'value', $query ) ) {
			$clause['value'] = $query['value'];
		}
		if ( ! empty( $query['type'] ) ) {
			$clause['type'] = sanitize_text_field( (string) $query['type'] );
		}
		return $clause;
	}

	/**
	 * Process a tax_query leaf clause.
	 *
	 * @param array $query The clause data.
	 * @return array|null The processed clause or null if invalid.
	 */
	private static function process_tax_clause( array $query ): ?array {
		if ( empty( $query['taxonomy'] ) || ! isset( $query['terms'] ) ) {
			return null;
		}
		$taxonomy = sanitize_key( (string) $query['taxonomy'] );
		if ( ! taxonomy_exists( $taxonomy ) ) {
			return null;
		}
		$clause = array(
			'taxonomy' => $taxonomy,
			'terms'    => is_array( $query['terms'] ) ? $query['terms'] : array( $query['terms'] ),
			'field'    => isset( $query['field'] ) && in_array( $query['field'], array( 'term_id', 'slug', 'name', 'term_taxonomy_id' ), true )
				? $query['field'] : 'term_id',
			'operator' => isset( $query['operator'] ) && in_array( $query['operator'], array( 'IN', 'NOT IN', 'AND', 'EXISTS', 'NOT EXISTS' ), true )
				? $query['operator'] : 'IN',
		);
		if ( isset( $query['include_children'] ) ) {
			$clause['include_children'] = (bool) $query['include_children'];
		}
		return $clause;
	}

	/**
	 * Process a date_query leaf clause.
	 *
	 * @param array $query The clause data.
	 * @return array|null The processed clause or null if empty.
	 */
	private static function process_date_clause( array $query ): ?array {
		$clause = array();
		$int_fields = array( 'year', 'month', 'week', 'day', 'hour', 'minute', 'second', 'dayofweek', 'dayofweek_iso', 'dayofyear' );
		foreach ( $int_fields as $field ) {
			if ( isset( $query[ $field ] ) ) {
				$clause[ $field ] = (int) $query[ $field ];
			}
		}
		if ( isset( $query['after'] ) ) {
			$clause['after'] = is_array( $query['after'] ) ? array_map( 'intval', $query['after'] ) : sanitize_text_field( (string) $query['after'] );
		}
		if ( isset( $query['before'] ) ) {
			$clause['before'] = is_array( $query['before'] ) ? array_map( 'intval', $query['before'] ) : sanitize_text_field( (string) $query['before'] );
		}
		if ( isset( $query['inclusive'] ) ) {
			$clause['inclusive'] = (bool) $query['inclusive'];
		}
		if ( ! empty( $query['compare'] ) && in_array( $query['compare'], array( '=', '!=', '>', '>=', '<', '<=', 'IN', 'NOT IN', 'BETWEEN', 'NOT BETWEEN' ), true ) ) {
			$clause['compare'] = $query['compare'];
		}
		if ( ! empty( $query['column'] ) && in_array( $query['column'], array( 'post_date', 'post_date_gmt', 'post_modified', 'post_modified_gmt' ), true ) ) {
			$clause['column'] = $query['column'];
		}
		return ! empty( $clause ) ? $clause : null;
	}

	/**
	 * Process date_query top-level fields.
	 *
	 * @param array $input  The input data.
	 * @param array $result The result array (passed by reference).
	 */
	private static function process_date_top_level( array $input, array &$result ): void {
		if ( ! empty( $input['column'] ) && in_array( $input['column'], array( 'post_date', 'post_date_gmt', 'post_modified', 'post_modified_gmt' ), true ) ) {
			$result['column'] = $input['column'];
		}
	}

	/**
	 * Checks taxonomy assignment permissions.
	 *
	 * @param array  $input     The input data.
	 * @param string $post_type The post type.
	 * @return bool True if user has permission, false otherwise.
	 */
	private static function check_taxonomy_permissions( array $input, string $post_type ): bool {
		// Merge categories and tags into tax_input for unified processing.
		$tax_input = isset( $input['tax_input'] ) && is_array( $input['tax_input'] ) ? $input['tax_input'] : array();
		if ( ! empty( $input['categories'] ) && is_array( $input['categories'] ) ) {
			$tax_input['category'] = $input['categories'];
		}
		if ( ! empty( $input['tags'] ) && is_array( $input['tags'] ) ) {
			$tax_input['post_tag'] = $input['tags'];
		}

		if ( empty( $tax_input ) ) {
			return true;
		}

		$supported_taxonomies = get_object_taxonomies( $post_type, 'names' );
		foreach ( $tax_input as $taxonomy => $terms ) {
			$taxonomy = sanitize_key( (string) $taxonomy );
			if ( ! taxonomy_exists( $taxonomy ) ) {
				continue;
			}
			if ( ! in_array( $taxonomy, $supported_taxonomies, true ) ) {
				continue;
			}
			$taxonomy_obj = get_taxonomy( $taxonomy );
			if ( $taxonomy_obj && ! current_user_can( $taxonomy_obj->cap->assign_terms ) ) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Checks status change permissions.
	 *
	 * @param array  $input The input data.
	 * @param object $pto   The post type object.
	 * @return bool True if user has permission, false otherwise.
	 */
	private static function check_status_permissions( array $input, object $pto ): bool {
		if ( ! isset( $input['status'] ) ) {
			return true;
		}
		$status = sanitize_key( (string) $input['status'] );
		if ( in_array( $status, array( 'publish', 'private', 'future' ), true ) ) {
			if ( ! current_user_can( $pto->cap->publish_posts ) ) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Checks author change permissions.
	 *
	 * @param array    $input          The input data.
	 * @param object   $pto            The post type object.
	 * @param int|null $current_author The current author ID (for updates), or null (for creates).
	 * @return bool True if user has permission, false otherwise.
	 */
	private static function check_author_permissions( array $input, object $pto, ?int $current_author = null ): bool {
		if ( empty( $input['author'] ) ) {
			return true;
		}
		$new_author = (int) $input['author'];
		$compare_to = $current_author ?? get_current_user_id();
		if ( $new_author !== $compare_to ) {
			if ( ! current_user_can( $pto->cap->edit_others_posts ) ) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Processes and resolves tax_input.
	 *
	 * @param array  $input     The input data.
	 * @param string $post_type The post type.
	 * @return array Resolved taxonomy input.
	 */
	private static function process_tax_input( array $input, string $post_type ): array {
		// Merge categories and tags into tax_input for unified processing.
		if ( ! isset( $input['tax_input'] ) ) {
			$input['tax_input'] = array();
		}
		if ( ! empty( $input['categories'] ) && is_array( $input['categories'] ) ) {
			$input['tax_input']['category'] = $input['categories'];
		}
		if ( ! empty( $input['tags'] ) && is_array( $input['tags'] ) ) {
			$input['tax_input']['post_tag'] = $input['tags'];
		}

		if ( empty( $input['tax_input'] ) || ! is_array( $input['tax_input'] ) ) {
			return array();
		}

		$supported_taxonomies = get_object_taxonomies( $post_type, 'names' );
		$resolved_tax_input   = array();

		foreach ( $input['tax_input'] as $taxonomy => $terms_in ) {
			$taxonomy = sanitize_key( (string) $taxonomy );
			if ( ! taxonomy_exists( $taxonomy ) ) {
				continue;
			}
			if ( ! in_array( $taxonomy, $supported_taxonomies, true ) ) {
				continue;
			}

			$term_ids = self::resolve_taxonomy_terms( $terms_in, $taxonomy );

			if ( ! empty( $term_ids ) ) {
				$resolved_tax_input[ $taxonomy ] = $term_ids;
			}
		}

		return $resolved_tax_input;
	}

	/**
	 * Builds post array from input with sanitization.
	 *
	 * @param array  $input     The input data.
	 * @param string $post_type The post type.
	 * @param bool   $is_update Whether this is an update (uses array_key_exists) or create (uses ! empty).
	 * @return array|WP_Error The sanitized post array, or WP_Error on validation failure.
	 */
	private static function build_postarr( array $input, string $post_type, bool $is_update = false ): array|WP_Error {
		$postarr = array();

		// Helper to check if field should be processed.
		$has_field = $is_update
			? fn( $key ) => array_key_exists( $key, $input )
			: fn( $key ) => ! empty( $input[ $key ] );

		if ( $has_field( 'title' ) ) {
			$postarr['post_title'] = sanitize_text_field( (string) $input['title'] );
		}
		if ( $has_field( 'content' ) ) {
			$postarr['post_content'] = wp_kses_post( (string) $input['content'] );
		}
		if ( $has_field( 'excerpt' ) ) {
			$postarr['post_excerpt'] = wp_kses_post( (string) $input['excerpt'] );
		}
		if ( $has_field( 'status' ) ) {
			$status = sanitize_key( (string) $input['status'] );
			if ( get_post_status_object( $status ) ) {
				$postarr['post_status'] = $status;
			} elseif ( ! $is_update ) {
				$postarr['post_status'] = 'draft';
			}
		} elseif ( ! $is_update ) {
			$postarr['post_status'] = 'draft';
		}
		if ( $has_field( 'author' ) ) {
			$author_id = (int) $input['author'];
			if ( $author_id && ! get_userdata( $author_id ) ) {
				return new WP_Error(
					'ability_invalid_author',
					__( 'Invalid author ID.', 'gutenberg' )
				);
			}
			if ( $author_id ) {
				$postarr['post_author'] = $author_id;
			}
		}
		if ( $has_field( 'meta' ) && is_array( $input['meta'] ) ) {
			$postarr['meta_input'] = $input['meta'];
		}
		if ( $has_field( 'date' ) ) {
			$postarr['post_date'] = sanitize_text_field( (string) $input['date'] );
		}
		if ( $has_field( 'date_gmt' ) ) {
			$postarr['post_date_gmt'] = sanitize_text_field( (string) $input['date_gmt'] );
		}
		if ( $has_field( 'comment_status' ) ) {
			$postarr['comment_status'] = in_array( $input['comment_status'], array( 'open', 'closed' ), true )
				? $input['comment_status']
				: 'closed';
		}
		if ( $has_field( 'ping_status' ) ) {
			$postarr['ping_status'] = in_array( $input['ping_status'], array( 'open', 'closed' ), true )
				? $input['ping_status']
				: 'closed';
		}
		if ( $has_field( 'password' ) ) {
			$postarr['post_password'] = sanitize_text_field( (string) $input['password'] );
		}
		if ( $has_field( 'parent' ) ) {
			$parent_id = (int) $input['parent'];
			if ( $parent_id && ! get_post( $parent_id ) ) {
				return new WP_Error(
					'ability_invalid_parent',
					__( 'Invalid parent post ID.', 'gutenberg' )
				);
			}
			$postarr['post_parent'] = $parent_id;
		}
		if ( $has_field( 'menu_order' ) ) {
			$postarr['menu_order'] = (int) $input['menu_order'];
		}
		if ( $has_field( 'template' ) ) {
			$template        = sanitize_text_field( (string) $input['template'] );
			$valid_templates = array_keys( wp_get_theme()->get_page_templates( null, $post_type ) );
			$valid_templates[] = ''; // Allow empty template.
			if ( ! in_array( $template, $valid_templates, true ) ) {
				return new WP_Error(
					'ability_invalid_template',
					__( 'Invalid template.', 'gutenberg' )
				);
			}
			$postarr['page_template'] = $template;
		}
		if ( $has_field( 'slug' ) ) {
			$postarr['post_name'] = sanitize_title( (string) $input['slug'] );
		}

		// Process taxonomy terms.
		$has_taxonomy_input = array_key_exists( 'tax_input', $input )
			|| array_key_exists( 'categories', $input )
			|| array_key_exists( 'tags', $input );

		if ( $has_taxonomy_input || ! $is_update ) {
			$resolved_tax_input = self::process_tax_input( $input, $post_type );
			if ( ! empty( $resolved_tax_input ) ) {
				$postarr['tax_input'] = $resolved_tax_input;
			}
		}

		return $postarr;
	}

	/**
	 * Registers the core/create-post ability.
	 *
	 * @return void
	 */
	private static function register_create_post(): void {
		wp_register_ability(
			'core/create-post',
			array(
				'label'               => __( 'Create Post', 'gutenberg' ),
				'description'         => sprintf(
					/* translators: %s: comma-separated list of available post types */
					__( 'Create a WordPress post for any post type using HTML content. Supports WordPress block comments for full editor compatibility. Use list-block-types first to get available blocks and their attributes. Available post types: %s.', 'gutenberg' ),
					self::$available_post_types_desc
				),
				'input_schema'        => array(
					'type'       => 'object',
					'required'   => array( 'post_type' ),
					'properties' => array_merge(
						array(
							'post_type' => array(
								'type'        => 'string',
								'description' => __( 'The post type to create.', 'gutenberg' ),
								'enum'        => self::$available_post_types,
							),
						),
						self::$post_fields_schema
					),
				),
				'output_schema'       => self::$post_output_schema,
				'permission_callback' => function ( $input = array() ): bool {
					$post_type = isset( $input['post_type'] ) ? sanitize_key( (string) $input['post_type'] ) : '';
					if ( ! $post_type || ! post_type_exists( $post_type ) ) {
						return false;
					}
					$pto = get_post_type_object( $post_type );
					if ( ! $pto ) {
						return false;
					}
					$cap = $pto->cap->create_posts ?? $pto->cap->edit_posts;
					if ( ! current_user_can( $cap ) ) {
						return false;
					}
					if ( ! self::check_status_permissions( $input, $pto ) ) {
						return false;
					}
					if ( ! self::check_author_permissions( $input, $pto ) ) {
						return false;
					}
					if ( ! self::check_taxonomy_permissions( $input, $post_type ) ) {
						return false;
					}
					return true;
				},
				'execute_callback'    => function ( $input = array() ) {
					$post_type = sanitize_key( (string) $input['post_type'] );
					if ( ! post_type_exists( $post_type ) ) {
						return new WP_Error(
							'ability_core-create-post_invalid_post_type',
							/* translators: %s: post type name. */
							sprintf( __( 'Post type "%s" does not exist.', 'gutenberg' ), esc_html( $post_type ) )
						);
					}

					$postarr = self::build_postarr( $input, $post_type, false );
					if ( is_wp_error( $postarr ) ) {
						return $postarr;
					}
					$postarr['post_type'] = $post_type;

					$post_id = wp_insert_post( $postarr, true );
					if ( is_wp_error( $post_id ) ) {
						return $post_id;
					}

					$post = get_post( $post_id );
					if ( ! $post ) {
						return new WP_Error(
							'ability_core-create-post_creation_failed',
							__( 'Post created but could not be loaded.', 'gutenberg' )
						);
					}

					return self::format_post_output( $post );
				},
				'category'            => 'post',
				'meta'                => array(
					'annotations'  => array(
						'readOnlyHint'    => false,
						'destructiveHint' => false,
						'idempotentHint'  => false,
					),
					'show_in_rest' => true,
				),
			)
		);
	}

	/**
	 * Registers the core/get-post ability.
	 *
	 * @return void
	 */
	private static function register_get_post(): void {
		wp_register_ability(
			'core/get-post',
			array(
				'label'               => __( 'Get Post', 'gutenberg' ),
				'description'         => __( 'Retrieve a single WordPress post by ID. Returns post data including title, content, excerpt, status, and optionally taxonomies and meta fields.', 'gutenberg' ),
				'input_schema'        => array(
					'type'       => 'object',
					'required'   => array( 'id' ),
					'properties' => array(
						'id'                 => array(
							'type'        => 'integer',
							'description' => __( 'The post ID to retrieve.', 'gutenberg' ),
						),
						'include_taxonomies' => array(
							'type'        => 'boolean',
							'description' => __( 'Include taxonomy terms attached to the post.', 'gutenberg' ),
							'default'     => false,
						),
						'include_meta'       => array(
							'type'        => 'boolean',
							'description' => __( 'Include post meta fields.', 'gutenberg' ),
							'default'     => false,
						),
					),
				),
				'output_schema'       => array_merge(
					self::$post_output_schema,
					array(
						'properties' => array_merge(
							self::$post_output_schema['properties'],
							array(
								'taxonomies' => array( 'type' => 'object' ),
								'meta'       => array( 'type' => 'object' ),
							)
						),
					)
				),
				'permission_callback' => function ( $input = array() ): bool {
					$post_id = isset( $input['id'] ) ? (int) $input['id'] : 0;
					if ( $post_id <= 0 ) {
						return false;
					}
					return current_user_can( 'read_post', $post_id );
				},
				'execute_callback'    => function ( $input = array() ) {
					$post_id = (int) $input['id'];
					$post    = get_post( $post_id );

					if ( ! $post ) {
						return new WP_Error(
							'ability_core-get-post_not_found',
							__( 'Post not found.', 'gutenberg' )
						);
					}

					return self::format_post_output(
						$post,
						! empty( $input['include_taxonomies'] ),
						! empty( $input['include_meta'] )
					);
				},
				'category'            => 'post',
				'meta'                => array(
					'annotations'  => array(
						'readOnlyHint'    => true,
						'destructiveHint' => false,
						'idempotentHint'  => true,
					),
					'show_in_rest' => true,
				),
			)
		);
	}

	/**
	 * Registers the core/find-posts ability.
	 *
	 * @return void
	 */
	private static function register_find_posts(): void {
		wp_register_ability(
			'core/find-posts',
			array(
				'label'               => __( 'Find Posts', 'gutenberg' ),
				'description'         => sprintf(
					/* translators: %s: comma-separated list of available post types */
					__( 'Search and filter WordPress posts. Supports filtering by post type, status, author, taxonomy terms, meta fields, and date ranges. Available post types: %s.', 'gutenberg' ),
					self::$available_post_types_desc
				),
				'input_schema'        => array(
					'type'       => 'object',
					'properties' => array(
						'post_type'           => array(
							'type'        => 'string',
							'description' => __( 'Post type to search. Defaults to "post".', 'gutenberg' ),
							'default'     => 'post',
						),
						'post_status'         => array(
							'type'        => 'array',
							'description' => __( 'Post statuses to include.', 'gutenberg' ),
							'items'       => array( 'type' => 'string' ),
							'default'     => array( 'publish' ),
						),
						'search'              => array(
							'type'        => 'string',
							'description' => __( 'Search query to filter posts by title and content.', 'gutenberg' ),
						),
						'author'              => array(
							'type'        => 'integer',
							'description' => __( 'Filter by author user ID.', 'gutenberg' ),
						),
						'limit'               => array(
							'type'        => 'integer',
							'description' => __( 'Maximum number of posts to return (max 100).', 'gutenberg' ),
							'default'     => 10,
							'minimum'     => 1,
							'maximum'     => 100,
						),
						'orderby'             => array(
							'type'        => 'string',
							'description' => __( 'Field to order results by.', 'gutenberg' ),
							'enum'        => array( 'date', 'title', 'menu_order', 'ID', 'author', 'name', 'modified', 'comment_count' ),
							'default'     => 'date',
						),
						'order'               => array(
							'type'        => 'string',
							'description' => __( 'Sort order.', 'gutenberg' ),
							'enum'        => array( 'ASC', 'DESC' ),
							'default'     => 'DESC',
						),
						'tax_query'           => array(
							'type'        => 'object',
							'description' => __( 'Taxonomy query with nested queries and relations.', 'gutenberg' ),
							'properties'  => array(
								'relation' => array(
									'type'        => 'string',
									'description' => __( 'Logical relation between queries.', 'gutenberg' ),
									'enum'        => array( 'AND', 'OR' ),
								),
								'queries'  => array(
									'type'        => 'array',
									'description' => __( 'Array of taxonomy clauses or nested groups.', 'gutenberg' ),
									'items'       => array(
										'oneOf' => array(
											array(
												'type'                 => 'object',
												'required'             => array( 'taxonomy', 'terms' ),
												'additionalProperties' => false,
												'properties'           => array(
													'taxonomy' => array(
														'type'        => 'string',
														'description' => __( 'Taxonomy name to query.', 'gutenberg' ),
													),
													'terms'    => array(
														'type'        => 'array',
														'description' => __( 'Term IDs, slugs, or names to match.', 'gutenberg' ),
														'items'       => array( 'type' => array( 'integer', 'string' ) ),
													),
													'field'    => array(
														'type'        => 'string',
														'description' => __( 'Field to match terms against. Defaults to "term_id".', 'gutenberg' ),
														'enum'        => array( 'term_id', 'slug', 'name', 'term_taxonomy_id' ),
													),
													'operator' => array(
														'type'        => 'string',
														'description' => __( 'Operator for comparison. Defaults to "IN".', 'gutenberg' ),
														'enum'        => array( 'IN', 'NOT IN', 'AND', 'EXISTS', 'NOT EXISTS' ),
													),
													'include_children' => array(
														'type'        => 'boolean',
														'description' => __( 'Include child terms. Defaults to true.', 'gutenberg' ),
													),
												),
											),
											array(
												'type'                 => 'object',
												'required'             => array( 'queries' ),
												'additionalProperties' => false,
												'properties'           => array(
													'relation' => array(
														'type'        => 'string',
														'description' => __( 'Relation for nested group. Defaults to "AND".', 'gutenberg' ),
														'enum'        => array( 'AND', 'OR' ),
													),
													'queries'  => array(
														'type'        => 'array',
														'description' => __( 'Nested taxonomy clauses.', 'gutenberg' ),
													),
												),
											),
										),
									),
								),
							),
						),
						'meta_query'          => array(
							'type'        => 'object',
							'description' => __( 'Meta query with nested queries and relations.', 'gutenberg' ),
							'properties'  => array(
								'relation' => array(
									'type'        => 'string',
									'description' => __( 'Logical relation between queries.', 'gutenberg' ),
									'enum'        => array( 'AND', 'OR' ),
									'default'     => 'AND',
								),
								'queries'  => array(
									'type'        => 'array',
									'description' => __( 'Array of query clauses or nested groups.', 'gutenberg' ),
									'items'       => array(
										'oneOf' => array(
											array(
												'type'                 => 'object',
												'required'             => array( 'key' ),
												'additionalProperties' => false,
												'properties'           => array(
													'key'     => array(
														'type'        => 'string',
														'description' => __( 'Meta key to query.', 'gutenberg' ),
													),
													'value'   => array(
														'type'        => array( 'string', 'integer', 'array' ),
														'description' => __( 'Meta value. Not required for EXISTS/NOT EXISTS.', 'gutenberg' ),
													),
													'compare' => array(
														'type'        => 'string',
														'description' => __( 'Comparison operator. Defaults to "=".', 'gutenberg' ),
														'enum'        => array( '=', '!=', '>', '>=', '<', '<=', 'LIKE', 'NOT LIKE', 'IN', 'NOT IN', 'BETWEEN', 'NOT BETWEEN', 'EXISTS', 'NOT EXISTS', 'REGEXP', 'NOT REGEXP', 'RLIKE' ),
													),
													'type'    => array(
														'type'        => 'string',
														'description' => __( 'Value type for casting.', 'gutenberg' ),
														'enum'        => array( 'NUMERIC', 'CHAR', 'DATE', 'DATETIME', 'TIME', 'BINARY', 'SIGNED', 'UNSIGNED', 'DECIMAL' ),
													),
												),
											),
											array(
												'type'                 => 'object',
												'required'             => array( 'queries' ),
												'additionalProperties' => false,
												'properties'           => array(
													'relation' => array(
														'type'        => 'string',
														'description' => __( 'Relation for nested group. Defaults to "AND".', 'gutenberg' ),
														'enum'        => array( 'AND', 'OR' ),
													),
													'queries'  => array(
														'type'        => 'array',
														'description' => __( 'Nested query clauses.', 'gutenberg' ),
													),
												),
											),
										),
									),
								),
							),
						),
						'date_query'          => array(
							'type'        => 'object',
							'description' => __( 'Date query with nested queries and relations.', 'gutenberg' ),
							'properties'  => array(
								'relation' => array(
									'type'        => 'string',
									'description' => __( 'Logical relation between queries.', 'gutenberg' ),
									'enum'        => array( 'AND', 'OR' ),
								),
								'column'   => array(
									'type'        => 'string',
									'description' => __( 'Column to query against. Defaults to "post_date".', 'gutenberg' ),
									'enum'        => array( 'post_date', 'post_date_gmt', 'post_modified', 'post_modified_gmt' ),
								),
								'queries'  => array(
									'type'        => 'array',
									'description' => __( 'Array of date clauses or nested groups.', 'gutenberg' ),
									'items'       => array(
										'oneOf' => array(
											array(
												'type'                 => 'object',
												'additionalProperties' => false,
												'properties'           => array(
													'year'          => array(
														'type'        => 'integer',
														'description' => __( '4-digit year (e.g., 2023).', 'gutenberg' ),
													),
													'month'         => array(
														'type'        => 'integer',
														'description' => __( 'Month number (1-12).', 'gutenberg' ),
													),
													'week'          => array(
														'type'        => 'integer',
														'description' => __( 'Week of year (0-53).', 'gutenberg' ),
													),
													'day'           => array(
														'type'        => 'integer',
														'description' => __( 'Day of month (1-31).', 'gutenberg' ),
													),
													'hour'          => array(
														'type'        => 'integer',
														'description' => __( 'Hour (0-23).', 'gutenberg' ),
													),
													'minute'        => array(
														'type'        => 'integer',
														'description' => __( 'Minute (0-59).', 'gutenberg' ),
													),
													'second'        => array(
														'type'        => 'integer',
														'description' => __( 'Second (0-59).', 'gutenberg' ),
													),
													'dayofweek'     => array(
														'type'        => 'integer',
														'description' => __( 'Day of week (1-7, Sunday=1).', 'gutenberg' ),
													),
													'dayofweek_iso' => array(
														'type'        => 'integer',
														'description' => __( 'ISO day of week (1-7, Monday=1).', 'gutenberg' ),
													),
													'dayofyear'     => array(
														'type'        => 'integer',
														'description' => __( 'Day of year (1-366).', 'gutenberg' ),
													),
													'after'         => array(
														'oneOf'       => array(
															array( 'type' => 'string' ),
															array(
																'type'       => 'object',
																'properties' => array(
																	'year'  => array( 'type' => 'integer' ),
																	'month' => array( 'type' => 'integer' ),
																	'day'   => array( 'type' => 'integer' ),
																),
															),
														),
														'description' => __( 'Date to retrieve posts after. String or object with year/month/day.', 'gutenberg' ),
													),
													'before'        => array(
														'oneOf'       => array(
															array( 'type' => 'string' ),
															array(
																'type'       => 'object',
																'properties' => array(
																	'year'  => array( 'type' => 'integer' ),
																	'month' => array( 'type' => 'integer' ),
																	'day'   => array( 'type' => 'integer' ),
																),
															),
														),
														'description' => __( 'Date to retrieve posts before. String or object with year/month/day.', 'gutenberg' ),
													),
													'inclusive'     => array(
														'type'        => 'boolean',
														'description' => __( 'Include posts from the boundary date.', 'gutenberg' ),
													),
													'compare'       => array(
														'type'        => 'string',
														'description' => __( 'Comparison operator.', 'gutenberg' ),
														'enum'        => array( '=', '!=', '>', '>=', '<', '<=', 'IN', 'NOT IN', 'BETWEEN', 'NOT BETWEEN' ),
													),
													'column'        => array(
														'type'        => 'string',
														'description' => __( 'Column to query against for this clause.', 'gutenberg' ),
														'enum'        => array( 'post_date', 'post_date_gmt', 'post_modified', 'post_modified_gmt' ),
													),
												),
											),
											array(
												'type'                 => 'object',
												'required'             => array( 'queries' ),
												'additionalProperties' => false,
												'properties'           => array(
													'relation' => array(
														'type'        => 'string',
														'description' => __( 'Relation for nested group. Defaults to "AND".', 'gutenberg' ),
														'enum'        => array( 'AND', 'OR' ),
													),
													'queries'  => array(
														'type'        => 'array',
														'description' => __( 'Nested date clauses.', 'gutenberg' ),
													),
												),
											),
										),
									),
								),
							),
						),
						'include_taxonomies'  => array(
							'type'        => 'boolean',
							'description' => __( 'Include taxonomy terms for each post.', 'gutenberg' ),
							'default'     => false,
						),
						'include_meta'        => array(
							'type'        => 'boolean',
							'description' => __( 'Include meta fields for each post.', 'gutenberg' ),
							'default'     => false,
						),
					),
				),
				'output_schema'       => array(
					'type'       => 'object',
					'required'   => array( 'posts', 'total', 'found_posts' ),
					'properties' => array(
						'posts'       => array(
							'type'  => 'array',
							'items' => array_merge(
								self::$post_output_schema,
								array(
									'properties' => array_merge(
										self::$post_output_schema['properties'],
										array(
											'taxonomies' => array( 'type' => 'object' ),
											'meta'       => array( 'type' => 'object' ),
										)
									),
								)
							),
						),
						'total'       => array( 'type' => 'integer' ),
						'found_posts' => array( 'type' => 'integer' ),
					),
				),
				'permission_callback' => function ( $input = array() ): bool {
					$post_type = isset( $input['post_type'] ) ? sanitize_key( (string) $input['post_type'] ) : 'post';
					if ( ! post_type_exists( $post_type ) ) {
						return false;
					}
					$pto = get_post_type_object( $post_type );
					if ( ! $pto ) {
						return false;
					}
					$cap = $pto->cap->read ?? 'read';
					if ( ! current_user_can( $cap ) ) {
						return false;
					}

					// Check read_private_posts if private status is requested.
					$post_statuses = isset( $input['post_status'] ) && is_array( $input['post_status'] )
						? $input['post_status']
						: array( 'publish' );

					if ( in_array( 'private', $post_statuses, true ) ) {
						if ( ! current_user_can( $pto->cap->read_private_posts ) ) {
							return false;
						}
					}

					return true;
				},
				'execute_callback'    => function ( $input = array() ) {
					$post_type = isset( $input['post_type'] ) ? sanitize_key( (string) $input['post_type'] ) : 'post';

					// Build query args.
					$args = array(
						'post_type'      => $post_type,
						'post_status'    => isset( $input['post_status'] ) && is_array( $input['post_status'] )
							? array_map( 'sanitize_key', $input['post_status'] )
							: array( 'publish' ),
						'posts_per_page' => min( 100, max( 1, isset( $input['limit'] ) ? (int) $input['limit'] : 10 ) ),
						'orderby'        => isset( $input['orderby'] ) ? sanitize_key( (string) $input['orderby'] ) : 'date',
						'order'          => isset( $input['order'] ) && in_array( $input['order'], array( 'ASC', 'DESC' ), true )
							? $input['order']
							: 'DESC',
					);

					if ( ! empty( $input['search'] ) ) {
						$args['s'] = sanitize_text_field( (string) $input['search'] );
					}

					if ( ! empty( $input['author'] ) ) {
						$args['author'] = (int) $input['author'];
					}

					// Process tax_query.
					if ( ! empty( $input['tax_query'] ) && is_array( $input['tax_query'] ) ) {
						$tax_query = self::process_query_recursive( $input['tax_query'], array( __CLASS__, 'process_tax_clause' ) );
						if ( ! empty( $tax_query ) ) {
							$args['tax_query'] = $tax_query;
						}
					}

					// Process meta_query.
					if ( ! empty( $input['meta_query'] ) && is_array( $input['meta_query'] ) ) {
						$meta_query = self::process_query_recursive( $input['meta_query'], array( __CLASS__, 'process_meta_clause' ) );
						if ( ! empty( $meta_query ) ) {
							$args['meta_query'] = $meta_query;
						}
					}

					// Process date_query.
					if ( ! empty( $input['date_query'] ) && is_array( $input['date_query'] ) ) {
						$date_query = self::process_query_recursive( $input['date_query'], array( __CLASS__, 'process_date_clause' ), array( __CLASS__, 'process_date_top_level' ) );
						if ( ! empty( $date_query ) ) {
							$args['date_query'] = $date_query;
						}
					}

					$query = new WP_Query( $args );
					$posts = array();

					$include_taxonomies = ! empty( $input['include_taxonomies'] );
					$include_meta       = ! empty( $input['include_meta'] );

					foreach ( $query->posts as $post ) {
						// Verify read permission for each post.
						if ( ! current_user_can( 'read_post', $post->ID ) ) {
							continue;
						}
						$posts[] = self::format_post_output( $post, $include_taxonomies, $include_meta );
					}

					return array(
						'posts'       => $posts,
						'total'       => count( $posts ),
						'found_posts' => (int) $query->found_posts,
					);
				},
				'category'            => 'post',
				'meta'                => array(
					'annotations'  => array(
						'readOnlyHint'    => true,
						'destructiveHint' => false,
						'idempotentHint'  => true,
					),
					'show_in_rest' => true,
				),
			)
		);
	}

	/**
	 * Registers the core/update-post ability.
	 *
	 * @return void
	 */
	private static function register_update_post(): void {
		wp_register_ability(
			'core/update-post',
			array(
				'label'               => __( 'Update Post', 'gutenberg' ),
				'description'         => sprintf(
					/* translators: %s: comma-separated list of available post types */
					__( 'Update an existing WordPress post. Supports partial updates - only provided fields will be modified. Available post types: %s.', 'gutenberg' ),
					self::$available_post_types_desc
				),
				'input_schema'        => array(
					'type'       => 'object',
					'required'   => array( 'id' ),
					'properties' => array_merge(
						array(
							'id' => array(
								'type'        => 'integer',
								'description' => __( 'The post ID to update.', 'gutenberg' ),
							),
						),
						self::$post_fields_schema
					),
				),
				'output_schema'       => self::$post_output_schema,
				'permission_callback' => function ( $input = array() ): bool {
					$post_id = isset( $input['id'] ) ? (int) $input['id'] : 0;
					if ( $post_id <= 0 ) {
						return false;
					}
					$post = get_post( $post_id );
					if ( ! $post ) {
						return false;
					}
					if ( ! current_user_can( 'edit_post', $post_id ) ) {
						return false;
					}
					$pto = get_post_type_object( $post->post_type );
					if ( ! $pto ) {
						return false;
					}
					if ( ! self::check_status_permissions( $input, $pto ) ) {
						return false;
					}
					if ( ! self::check_author_permissions( $input, $pto, (int) $post->post_author ) ) {
						return false;
					}
					if ( ! self::check_taxonomy_permissions( $input, $post->post_type ) ) {
						return false;
					}
					return true;
				},
				'execute_callback'    => function ( $input = array() ) {
					$post_id = (int) $input['id'];
					$post    = get_post( $post_id );

					if ( ! $post ) {
						return new WP_Error(
							'ability_core-update-post_not_found',
							__( 'Post not found.', 'gutenberg' )
						);
					}

					$postarr = self::build_postarr( $input, $post->post_type, true );
					if ( is_wp_error( $postarr ) ) {
						return $postarr;
					}
					$postarr['ID'] = $post_id;

					$result = wp_update_post( $postarr, true );
					if ( is_wp_error( $result ) ) {
						return $result;
					}

					$updated_post = get_post( $post_id );
					if ( ! $updated_post ) {
						return new WP_Error(
							'ability_core-update-post_update_failed',
							__( 'Post updated but could not be loaded.', 'gutenberg' )
						);
					}

					return self::format_post_output( $updated_post );
				},
				'category'            => 'post',
				'meta'                => array(
					'annotations'  => array(
						'readOnlyHint'    => false,
						'destructiveHint' => false,
						'idempotentHint'  => true,
					),
					'show_in_rest' => true,
				),
			)
		);
	}
}