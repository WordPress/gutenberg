<?php
/**
 * Preload paths for client-side media processing.
 *
 * @package gutenberg
 */

/**
 * Filters the block editor preload paths.
 *
 * @since 20.1.0
 *
 * @param array                   $paths   REST API paths to preload.
 * @param WP_Block_Editor_Context $context Block editor context.
 * @return array Filtered preload paths.
 */
function gutenberg_block_editor_preload_paths_7_1( $paths, $context ) {
	// Complete list of fields expected by packages/core-data/src/entities.js.
	// This must match exactly for preloading to work (same fields, same order).
	// @see packages/core-data/src/entities.js rootEntitiesConfig.__unstableBase
	$root_fields = 'description,gmt_offset,home,image_sizes,image_size_threshold,name,site_icon,site_icon_url,site_logo,timezone_string,url,page_for_posts,page_on_front,show_on_front';

	foreach ( $paths as $key => $path ) {
		if ( is_string( $path ) && str_starts_with( $path, '/?_fields=' ) ) {
			// Replace with the complete fields list to ensure exact match.
			$paths[ $key ] = '/?_fields=' . $root_fields;
			break;
		}
	}

	if ( 'core/edit-post' === $context->name && isset( $context->post ) ) {
		$paths[] = '/wp/v2/templates/lookup?slug=front-page';
		$paths[] = '/wp/v2/taxonomies?context=edit';
		$paths[] = array( rest_get_route_for_post_type_items( $context->post->post_type ), 'OPTIONS' );

		$author_id = (int) get_post_field( 'post_author', $context->post->ID );
		if ( post_type_supports( $context->post->post_type, 'author' ) && $author_id > 0 ) {
			$paths[] = sprintf(
				'/wp/v2/users/%d?context=view&_fields=id,name',
				$author_id
			);
		}
	}

	if ( 'core/edit-site' === $context->name && wp_is_block_theme() ) {
		$template_slugs = array();
		$front_page     = null;
		if ( ! empty( $context->post ) && 'page' === $context->post->post_type ) {
			$template_slugs[] = empty( $context->post->post_name ) ? 'page' : 'page-' . $context->post->post_name;
			$template_slugs[] = 'page';
		} else {
			$template_slugs[] = 'front-page';

			$page_on_front = (int) get_option( 'page_on_front' );
			if ( 'page' === get_option( 'show_on_front' ) && $page_on_front > 0 ) {
				$front_page = get_post( $page_on_front );
				if ( $front_page instanceof WP_Post ) {
					$template_slugs[] = empty( $front_page->post_name ) ? 'page' : 'page-' . $front_page->post_name;
					$template_slugs[] = 'page';
				}
			} else {
				$template_slugs[] = 'home';
			}

			$template_slugs[] = 'index';
		}

		$template_slugs = array_values( array_unique( $template_slugs ) );
		$templates      = get_block_templates(
			array(
				'slug__in' => $template_slugs,
			),
			'wp_template'
		);
		$priorities     = array_flip( $template_slugs );

		usort(
			$templates,
			static function ( $template_a, $template_b ) use ( $priorities ) {
				return ( $priorities[ $template_a->slug ] ?? 999 ) - ( $priorities[ $template_b->slug ] ?? 999 );
			}
		);

		$template_part_ids = array();
		$has_query         = false;

		if ( ! empty( $templates ) && ! empty( $templates[0]->content ) ) {
			$blocks = gutenberg_resolve_pattern_blocks( parse_blocks( $templates[0]->content ) );
			if ( class_exists( 'WP_Block_Processor' ) ) {
				$processor = new WP_Block_Processor( serialize_blocks( $blocks ) );
				while ( $processor->next_block() ) {
					if ( $processor->is_block_type( 'core/query' ) ) {
						$has_query = true;
					}

					if ( ! $processor->is_block_type( 'core/template-part' ) ) {
						continue;
					}

					$attrs = $processor->allocate_and_return_parsed_attributes();
					if ( ! is_array( $attrs ) || empty( $attrs['slug'] ) ) {
						continue;
					}

					$theme               = ! empty( $attrs['theme'] ) ? $attrs['theme'] : get_stylesheet();
					$template_part_ids[] = $theme . '//' . $attrs['slug'];
				}
			} else {
				$walk_blocks = static function ( array $blocks_to_walk ) use ( &$walk_blocks, &$template_part_ids, &$has_query ) {
					foreach ( $blocks_to_walk as $block ) {
						if ( 'core/template-part' === ( $block['blockName'] ?? '' ) && ! empty( $block['attrs']['slug'] ) ) {
							$theme               = ! empty( $block['attrs']['theme'] ) ? $block['attrs']['theme'] : get_stylesheet();
							$template_part_ids[] = $theme . '//' . $block['attrs']['slug'];
						}

						if ( 'core/query' === ( $block['blockName'] ?? '' ) ) {
							$has_query = true;
						}

						if ( ! empty( $block['innerBlocks'] ) ) {
							$walk_blocks( $block['innerBlocks'] );
						}
					}
				};
				$walk_blocks( $blocks );
			}
		}

		foreach ( array_unique( $template_part_ids ) as $template_part_id ) {
			$paths[] = '/wp/v2/template-parts/' . $template_part_id . '?context=edit';
		}

		if ( $front_page instanceof WP_Post ) {
			$route_for_front_page = rest_get_route_for_post( $front_page );
			if ( $route_for_front_page ) {
				$paths[] = add_query_arg( 'context', 'edit', $route_for_front_page );
			}
			$paths[] = add_query_arg(
				'slug',
				empty( $front_page->post_name ) ? 'page' : 'page-' . $front_page->post_name,
				'/wp/v2/templates/lookup'
			);
			$paths[] = '/wp/v2/types/page?context=edit';
		}

		if ( $has_query ) {
			$post_rest_route = rest_get_route_for_post_type_items( 'post' );
			$paths[]         = '/wp/v2/types/post?context=edit';
			foreach ( array( 10, 3 ) as $per_page ) {
				$paths[] = add_query_arg(
					array(
						'context'       => 'edit',
						'offset'        => 0,
						'order'         => 'desc',
						'orderby'       => 'date',
						'per_page'      => $per_page,
						'ignore_sticky' => 'false',
					),
					$post_rest_route
				);
			}
		}

		$paths[] = add_query_arg(
			array(
				'context'  => 'edit',
				'per_page' => 100,
				'_fields'  => 'id,link,menu_order,parent,title,type',
				'orderby'  => 'menu_order',
				'order'    => 'asc',
			),
			rest_get_route_for_post_type_items( 'page' )
		);

		$paths[] = '/wp/v2/taxonomies?context=view';
	}

	return $paths;
}
add_filter( 'block_editor_rest_api_preload_paths', 'gutenberg_block_editor_preload_paths_7_1', 10, 2 );
