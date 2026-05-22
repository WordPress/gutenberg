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

		// `getEntitiesConfig('postType')` chains into a taxonomies fetch
		// when collaboration is enabled. Post-editor preloads this; site
		// editor doesn't. Adding it here lets the site-editor boot
		// kickoff fully consume from cache.
		$paths[] = '/wp/v2/taxonomies?context=view';

		// Site editor's page-edit context (`?p=/page/{id}`). Mount-time
		// consumers of these URLs:
		//
		// - `post-actions/actions.js` calls
		//   `getDefaultTemplateId({ slug: 'front-page' })` to gate
		//   homepage-specific actions for any page.
		// - `post-template/hooks.js` calls
		//   `getDefaultTemplateId({ slug: 'page' })` when the page has no
		//   slug. (For named pages it fires `page-{slug}`, already added
		//   by core's `site-editor.php`.)
		// - `getPostType('page')` fires from publish panel / preview
		//   button / others; core preloads `/wp/v2/types?context=view`
		//   but not the per-type record.
		if (
			isset( $context->post ) &&
			'page' === $context->post->post_type
		) {
			$paths[] = '/wp/v2/templates/lookup?slug=front-page';
			$paths[] = '/wp/v2/templates/lookup?slug=page';
			$paths[] = '/wp/v2/types/page?context=edit';
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
