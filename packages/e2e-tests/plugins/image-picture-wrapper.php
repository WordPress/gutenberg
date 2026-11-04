<?php
/**
 * Plugin Name: Gutenberg Test Image Picture Wrapper
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-image-picture-wrapper
 */

/**
 * Wraps the `img` of an Image block in a `picture` element, the way the Modern
 * Image Formats plugin does when its picture element setting is enabled.
 *
 * @param string $block_content Rendered block content.
 * @param array  $block         Parsed block.
 * @return string Filtered block content.
 */
function gutenberg_test_wrap_image_in_picture( $block_content, $block ) {
	if ( 'core/image' !== $block['blockName'] || ! str_contains( $block_content, '<img' ) ) {
		return $block_content;
	}

	return preg_replace(
		'/<img[^>]+>/',
		'<picture style="display: contents;">$0</picture>',
		$block_content,
		1
	);
}
add_filter( 'render_block', 'gutenberg_test_wrap_image_in_picture', 10, 2 );
