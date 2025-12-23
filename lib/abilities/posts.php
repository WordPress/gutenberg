<?php

function _gutenberg_register_core_posts_abilities() {
	// If the ability already exists, unregister it first, so we can override it.
	if ( wp_has_ability( 'core/create-post' ) ) {
		wp_unregister_ability( 'core/create-post' );
	}

	$available_post_types      = array_values( (array) get_post_types( array( 'public' => true ), 'names' ) );
	$available_post_types_desc = empty( $available_post_types ) ? __( 'none', 'gutenberg' ) : implode( ', ', $available_post_types );

	wp_register_ability(
		'core/create-post',
		array(
			'label'               => __( 'Create Post', 'gutenberg' ),
			'description'         => sprintf(
				/* translators: %s: comma-separated list of available post types */
				__( 'Create a WordPress post for any post type using HTML content. Supports WordPress block comments for full editor compatibility. Use list-block-types first to get available blocks and their attributes. Available post types: %s.', 'gutenberg' ),
				$available_post_types_desc
			),
			'input_schema'        => array(
				'type'       => 'object',
				'required'   => array( 'post_type' ),
				'properties' => array(
					'post_type' => array(
						'type'        => 'string',
						'description' => __( 'The post type to create.', 'gutenberg' ),
						'enum'        => $available_post_types,
					),

					'title'     => array(
						'type'        => 'string',
						'description' => __( 'Post title.', 'gutenberg' ),
					),
					'content'   => array(
						'type'        => 'string',
						'description' => __( 'Post content as HTML. Include WordPress block comments (<!-- wp:blockname {"attr":"value"} -->) for full block editor compatibility. Use wpmcp/list-block-types to get valid block names and attributes.', 'gutenberg' ),
					),
					'excerpt'   => array(
						'type'        => 'string',
						'description' => __( 'Post excerpt.', 'gutenberg' ),
					),
					'status'    => array(
						'type'        => 'string',
						'description' => __( 'Post status (draft, publish, etc).', 'gutenberg' ),
						'default'     => 'draft',
					),
					'author'    => array(
						'type'        => 'integer',
						'description' => __( 'Author user ID.', 'gutenberg' ),
					),
					'meta'      => array(
						'type'                 => 'object',
						'description'          => __( 'Meta fields to set on the post.', 'gutenberg' ),
						'additionalProperties' => true,
					),
					'tax_input' => array(
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
				),
			),
			'output_schema'       => array(
				'type'       => 'object',
				'required'   => array( 'id' ),
				'properties' => array(
					'id'        => array( 'type' => 'integer' ),
					'post_type' => array( 'type' => 'string' ),
					'status'    => array( 'type' => 'string' ),
					'link'      => array( 'type' => 'string' ),
					'title'     => array( 'type' => 'string' ),
				),
			),
			'permission_callback' => static function ( $input = array() ): bool {
				$post_type = isset( $input['post_type'] ) ? \sanitize_key( (string) $input['post_type'] ) : '';
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

				// Check publish_posts capability for publish/private/future statuses.
				if ( isset( $input['status'] ) ) {
					$status = sanitize_key( (string) $input['status'] );
					if ( in_array( $status, array( 'publish', 'private', 'future' ), true ) ) {
						if ( ! current_user_can( $pto->cap->publish_posts ) ) {
							return false;
						}
					}
				}

				// Check edit_others_posts capability when setting different author.
				if ( ! empty( $input['author'] ) && (int) $input['author'] !== get_current_user_id() ) {
					if ( ! current_user_can( $pto->cap->edit_others_posts ) ) {
						return false;
					}
				}

				// Merge categories and tags into tax_input for unified processing.
				$tax_input = isset( $input['tax_input'] ) && is_array( $input['tax_input'] ) ? $input['tax_input'] : array();
				if ( ! empty( $input['categories'] ) && is_array( $input['categories'] ) ) {
					$tax_input['category'] = $input['categories'];
				}
				if ( ! empty( $input['tags'] ) && is_array( $input['tags'] ) ) {
					$tax_input['post_tag'] = $input['tags'];
				}

				// Check assign_terms capability for each taxonomy.
				if ( ! empty( $tax_input ) ) {
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
				}

				return true;
			},
			'execute_callback'    => static function ( $input = array() ) {
				// wp_insert_post handles its own santization but admins can use unfiltered_html.
				// Given that abilities will be consumed by external agents, we need to sanitize input here.
				// To try to avoid prompt injections, and other attack vectors.
				$post_type = sanitize_key( (string) $input['post_type'] );
				if ( ! post_type_exists( $post_type ) ) {
					return new WP_Error(
						'ability_core-create-post_invalid_post_type',
						/* translators: %s: post type name. */
						sprintf( __( 'Post type "%s" does not exist.', 'gutenberg' ), esc_html( $post_type ) )
					);
				}

				$status = isset( $input['status'] ) ? sanitize_key( (string) $input['status'] ) : 'draft';
				if ( ! get_post_status_object( $status ) ) {
					$status = 'draft';
				}
				$postarr = array(
					'post_type'   => $post_type,
					'post_status' => $status,
				);
				if ( ! empty( $input['content'] ) ) {
					$postarr['post_content'] = wp_kses_post( (string) $input['content'] );
				}
				if ( ! empty( $input['title'] ) ) {
					$postarr['post_title'] = sanitize_text_field( (string) $input['title'] );
				}
				if ( ! empty( $input['excerpt'] ) ) {
					$postarr['post_excerpt'] = wp_kses_post( (string) $input['excerpt'] );
				}
				if ( ! empty( $input['author'] ) ) {
					$author_id = (int) $input['author'];
					if ( $author_id !== get_current_user_id() && ! get_userdata( $author_id ) ) {
						return new WP_Error(
							'ability_core-create-post_invalid_author',
							__( 'Invalid author ID.', 'gutenberg' )
						);
					}
					$postarr['post_author'] = $author_id;
				}
				if ( ! empty( $input['meta'] ) && is_array( $input['meta'] ) ) {
					$postarr['meta_input'] = $input['meta'];
				}
				if ( ! empty( $input['date'] ) ) {
					$postarr['post_date'] = sanitize_text_field( (string) $input['date'] );
				}
				if ( ! empty( $input['date_gmt'] ) ) {
					$postarr['post_date_gmt'] = sanitize_text_field( (string) $input['date_gmt'] );
				}
				if ( isset( $input['comment_status'] ) ) {
					$postarr['comment_status'] = in_array( $input['comment_status'], array( 'open', 'closed' ), true )
						? $input['comment_status']
						: 'closed';
				}
				if ( isset( $input['ping_status'] ) ) {
					$postarr['ping_status'] = in_array( $input['ping_status'], array( 'open', 'closed' ), true )
						? $input['ping_status']
						: 'closed';
				}
				if ( isset( $input['password'] ) ) {
					$postarr['post_password'] = sanitize_text_field( (string) $input['password'] );
				}
				if ( ! empty( $input['parent'] ) ) {
					$parent_id = (int) $input['parent'];
					if ( $parent_id && ! get_post( $parent_id ) ) {
						return new WP_Error(
							'ability_core-create-post_invalid_parent',
							__( 'Invalid parent post ID.', 'gutenberg' )
						);
					}
					$postarr['post_parent'] = $parent_id;
				}
				if ( isset( $input['menu_order'] ) ) {
					$postarr['menu_order'] = (int) $input['menu_order'];
				}
				if ( ! empty( $input['template'] ) ) {
					$template = sanitize_text_field( (string) $input['template'] );
					$valid_templates = array_keys( wp_get_theme()->get_page_templates( null, $post_type ) );
					$valid_templates[] = ''; // Allow empty template.
					if ( ! in_array( $template, $valid_templates, true ) ) {
						return new WP_Error(
							'ability_core-create-post_invalid_template',
							__( 'Invalid template.', 'gutenberg' )
						);
					}
					$postarr['page_template'] = $template;
				}
				if ( ! empty( $input['slug'] ) ) {
					$postarr['post_name'] = sanitize_title( (string) $input['slug'] );
				}

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

				if ( ! empty( $input['tax_input'] ) && is_array( $input['tax_input'] ) ) {
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

						if ( ! empty( $term_ids ) ) {
							$resolved_tax_input[ $taxonomy ] = $term_ids;
						}
					}

					if ( ! empty( $resolved_tax_input ) ) {
						$postarr['tax_input'] = $resolved_tax_input;
					}
				}

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

				return array(
					'id'        => $post_id,
					'post_type' => $post->post_type,
					'status'    => $post->post_status,
					'link'      => (string) \get_permalink( $post_id ),
					'title'     => (string) $post->post_title,
				);
			},
			'category' => 'post',
			'meta'                => array(
				'annotations' => array(
					'readOnlyHint'    => false,
					'destructiveHint' => false,
					'idempotentHint'  => false,
				),
				'show_in_rest' => true,
			),
		)
	);
}
