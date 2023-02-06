<?php
/**
 * Patches resources loaded by the block editor page.
 *
 * @package gutenberg
 */

/**
 * Adds the preload paths registered in Core (`edit-form-blocks.php`).
 *
 * @param array                   $preload_paths    Preload paths to be filtered.
 * @param WP_Block_Editor_Context $context The current block editor context.
 * @return array
 */
// @codingStandardsIgnoreStart - unused $context parameter.
function gutenberg_preload_paths_6_2( $preload_paths, $context ) {
	// Preload initial media requests that are needed to conditionally display the media tab in the inserter.
	foreach ( array( 'image', 'video', 'audio' ) as $media_type ) {
		$preload_paths[] = "wp/v2/media?context=edit&per_page=1&orderBy=date&media_type={$media_type}";
	}
	return $preload_paths;
}
add_filter( 'block_editor_rest_api_preload_paths', 'gutenberg_preload_paths_6_2', 10, 2 );
