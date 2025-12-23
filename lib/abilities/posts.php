<?php

function _gutenberg_register_core_posts_abilities() {
	// If the ability already exists, unregister it first, so we can override it.
	if ( wp_has_ability( 'core/create-post' ) ) {
		wp_unregister_ability( 'core/create-post' );
	}

	$available_post_types      = array_values( (array) get_post_types( array( 'public' => true ), 'names' ) );
	$available_post_types_desc = empty( $available_post_types ) ? 'none' : implode( ', ', $available_post_types );

	wp_register_ability(
		'core/create-post',
		array(
			'label'               => 'Create Post',
			'description'         => 'Create a WordPress post for any post type using HTML content. Supports WordPress block comments for full editor compatibility. Use list-block-types first to get available blocks and their attributes. Available post types: ' . $available_post_types_desc . '.',
			'input_schema'        => array(
				'type'       => 'object',
				'required'   => array( 'post_type' ),
				'properties' => array(
					'post_type' => array(
						'type'        => 'string',
						'description' => 'The post type to create.',
						'enum'        => $available_post_types,
					),

					'title'     => array(
						'type'        => 'string',
						'description' => 'Post title.',
					),
					'content'   => array(
						'type'        => 'string',
						'description' => 'Post content as HTML. Include WordPress block comments (<!-- wp:blockname {"attr":"value"} -->) for full block editor compatibility. Use wpmcp/list-block-types to get valid block names and attributes.',
					),
					'excerpt'   => array(
						'type'        => 'string',
						'description' => 'Post excerpt.',
					),
					'status'    => array(
						'type'        => 'string',
						'description' => 'Post status (draft, publish, etc).',
						'default'     => 'draft',
					),
					'author'    => array(
						'type'        => 'integer',
						'description' => 'Author user ID.',
					),
					'meta'      => array(
						'type'                 => 'object',
						'description'          => 'Meta fields to set on the post.',
						'additionalProperties' => true,
					),
					'tax_input' => array(
						'type'                 => 'object',
						'description'          => 'Taxonomy terms mapping (taxonomy => term IDs or slugs).',
						'additionalProperties' => true,
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

				// Check assign_terms capability for each taxonomy in tax_input.
				if ( ! empty( $input['tax_input'] ) && is_array( $input['tax_input'] ) ) {
					$supported_taxonomies = get_object_taxonomies( $post_type, 'names' );
					foreach ( $input['tax_input'] as $taxonomy => $terms ) {
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
						/* translators: %s ability name. */
						sprintf( __( 'Post type "%s" does not exist.' ), esc_html( $post_type ) )
					);
				}

				$status  = isset( $input['status'] ) ? sanitize_key( (string) $input['status'] ) : 'draft';
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
					$postarr['post_author'] = (int) $input['author'];
				}
				if ( ! empty( $input['meta'] ) && is_array( $input['meta'] ) ) {
					$postarr['meta_input'] = $input['meta'];
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
						/* translators: %s ability name. */
						sprintf( __( 'Post created but could not be loaded.' ), esc_html( $post_type ) )
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
