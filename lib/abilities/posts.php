<?php

function _gutenberg_register_core_posts_abilities() {
	// If the ability already exists, unregister it first, so we can override it.
    if ( wp_has_ability( 'core/create-post' ) ) {
        wp_unregister_ability( 'core/create-post' );
    }

	$available_post_types      = array_values( (array) get_post_types( array( 'public' => true ), 'names' ) );
    wp_register_ability(
			'core/create-post',
			array(
				'label'               => 'Create Post',
				'description'         => 'Create a WordPress post for any post type using HTML content. Supports WordPress block comments for full editor compatibility. Use list-block-types first to get available blocks and their attributes. Available post types: ' . $available_post_types_desc . '.',
				'input_schema'        => array(
					'type'       => 'object',
					'required'   => array( 'post_type' ),
					'properties' => array(
						'post_type'               => array(
							'type'        => 'string',
							'description' => 'The post type to create.',
							'enum'        => $available_post_types,
						),

						'title'                   => array(
							'type'        => 'string',
							'description' => 'Post title.',
						),
						'content'                 => array(
							'type'        => 'string',
							'description' => 'Post content as HTML. Include WordPress block comments (<!-- wp:blockname {"attr":"value"} -->) for full block editor compatibility. Use wpmcp/list-block-types to get valid block names and attributes.',
						),
						'excerpt'                 => array(
							'type'        => 'string',
							'description' => 'Post excerpt.',
						),
						'status'                  => array(
							'type'        => 'string',
							'description' => 'Post status (draft, publish, etc).',
							'default'     => 'draft',
						),
						'author'                  => array(
							'type'        => 'integer',
							'description' => 'Author user ID.',
						),
						'meta'                    => array(
							'type'                 => 'object',
							'description'          => 'Meta fields to set on the post.',
							'additionalProperties' => true,
						),
						'tax_input'               => array(
							'type'                 => 'object',
							'description'          => 'Taxonomy terms mapping (taxonomy => term IDs or slugs).',
							'additionalProperties' => true,
						)
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
					// Todo: check also for current_user_can( $taxonomy_obj->cap->assign_terms ) on each tax_input.
                    $post_type = isset( $input['post_type'] ) ? \sanitize_key( (string) $input['post_type'] ) : '';
		            if ( ! $post_type || ! post_type_exists( $post_type ) ) {
		            	return false;
		            }
		            $pto = get_post_type_object( $post_type );
		            if ( ! $pto ) {
		            	return false;
		            }
		            $cap = $pto->cap->create_posts ?? $pto->cap->edit_posts;
		            return current_user_can( $cap );
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
	                	if ( ! empty( $input['meta'] ) && \is_array( $input['meta'] ) ) {
	                		$postarr['meta_input'] = $input['meta'];
	                	}
                    
	                	$post_id = wp_insert_post( $postarr, true );
	                	if ( is_wp_error( $post_id ) ) {
	                		return $post_id;
	                	}
                    
	                	// Handle taxonomy assignments with validation after creation.
	                	if ( ! empty( $input['tax_input'] ) && \is_array( $input['tax_input'] ) ) {
	                		$append               = ! empty( $input['append_terms'] );
	                		$create_if_missing    = ! empty( $input['create_terms_if_missing'] );
	                		$supported_taxonomies = \get_object_taxonomies( $post_type, 'names' );
	                		foreach ( $input['tax_input'] as $taxonomy => $terms_in ) {
	                			$taxonomy = \sanitize_key( (string) $taxonomy );
	                			if ( ! \taxonomy_exists( $taxonomy ) ) {
	                				continue;
	                			}
	                			if ( ! \in_array( $taxonomy, $supported_taxonomies, true ) ) {
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
                                
	                				$term = \get_term_by( 'slug', $t, $taxonomy );
	                				if ( ! $term ) {
	                					$term = \get_term_by( 'name', $t, $taxonomy );
	                				}
	                				if ( $term instanceof \WP_Term ) {
	                					$term_ids[] = (int) $term->term_id;
	                				} elseif ( $create_if_missing && \current_user_can( 'manage_terms' ) ) {
	                					$created = \wp_insert_term( $t, $taxonomy );
	                					if ( ! \is_wp_error( $created ) && isset( $created['term_id'] ) ) {
	                						$term_ids[] = (int) $created['term_id'];
	                					}
	                				}
	                			}
	                			if ( empty( $term_ids ) ) {
	                				continue;
	                			}
                            
	                			\wp_set_post_terms( $post_id, array_map( 'intval', $term_ids ), $taxonomy, $append );
	                		}
	                	}
                    
	                	$post = get_post( $post_id );
	                	if ( ! $post ) {
	                		return array(
	                			'error' => array(
	                				'code'    => 'creation_failed',
	                				'message' => 'Post created but could not be loaded.',
	                			),
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
				'meta'                => array(
					'categories' => array( 'content', 'posts' ),
					'annotations' => array(
						'readOnlyHint'    => false,
						'destructiveHint' => false,
						'idempotentHint'  => false,
					),
				),
			)
		);
}