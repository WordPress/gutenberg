<?php

/**
 * Preload necessary resources for the editors.
 *
 * @param array                   $paths   REST API paths to preload.
 * @param WP_Block_Editor_Context $context Current block editor context
 *
 * @return array Filtered preload paths.
 */
function gutenberg_block_editor_preload_paths_6_9( $paths, $context ) {
	if ( 'core/edit-site' === $context->name ) {
		$template_slugs = array();
		$front_page     = null;
		if ( ! empty( $context->post ) && 'page' === $context->post->post_type ) {
			$template_slugs[] = empty( $context->post->post_name ) ? 'page' : 'page-' . $context->post->post_name;
			$template_slugs[] = 'page';
		} else {
			$template_slugs[] = 'front-page';

			if ( 'page' === get_option( 'show_on_front' ) ) {
				$front_page = get_post( (int) get_option( 'page_on_front' ) );
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
		$walk_blocks       = static function ( $blocks ) use ( &$walk_blocks, &$template_part_ids, &$has_query ) {
			foreach ( $blocks as $block ) {
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

		if ( ! empty( $templates ) && ! empty( $templates[0]->content ) ) {
			$blocks = resolve_pattern_blocks( parse_blocks( $templates[0]->content ) );
			$walk_blocks( $blocks );
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

		$paths[] = '/wp/v2/taxonomies?context=view';

		// Only prefetch for the root. If we preload it for all pages and it's not used
		// it won't be possible to invalidate.
		// To do: perhaps purge all preloaded paths when client side navigating.
		if ( isset( $_GET['p'] ) && '/' !== $_GET['p'] ) {
			$paths = array_filter(
				$paths,
				static function ( $path ) {
					return '/wp/v2/templates/lookup?slug=front-page' !== $path && '/wp/v2/templates/lookup?slug=home' !== $path;
				}
			);
		}
	}

	return $paths;
}
add_filter( 'block_editor_rest_api_preload_paths', 'gutenberg_block_editor_preload_paths_6_9', 10, 2 );

/**
 * Filters the block editor preload paths to include media processing fields.
 *
 * The packages/core-data/src/entities.js file requests additional fields
 * (image_sizes, image_size_threshold) on the root endpoint that are not
 * included in WordPress Core's default preload paths. This filter ensures
 * the preloaded URL matches exactly what the JavaScript requests.
 *
 * @since 20.1.0
 *
 * @param array $paths REST API paths to preload.
 * @return array Filtered preload paths.
 */
function gutenberg_block_editor_preload_paths_root_fields( $paths ) {
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

	return $paths;
}
add_filter( 'block_editor_rest_api_preload_paths', 'gutenberg_block_editor_preload_paths_root_fields' );
