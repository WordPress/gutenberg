<?php
/**
 * Server-side rendering of the `core/file` block.
 *
 * @package WordPress
 */

/**
 * When the `core/file` block is rendering, check if we need to enqueue the `'wp-block-file-view` script.
 *
 * @param array  $attributes The block attributes.
 * @param string $content    The block content.
 *
 * @return string Returns the block content.
 */
function render_block_core_file( $attributes, $content ) {
	$should_load_view_script = ! empty( $attributes['displayPreview'] ) && ! wp_script_is( 'wp-block-file-view' );
	if ( $should_load_view_script ) {
		wp_enqueue_script( 'wp-block-file-view' );
	}

	// translate object's aria-label attribute.
	$default_label            = 'PDF embed';
	$default_label_translated = __( 'PDF embed' );

	$has_filename_label = 'Embed of %s.';
	/* translators: %s: filename. */
	$has_filename_label_translated = __( 'Embed of %s.' );

	$search  = $default_label;
	$replace = $default_label_translated;

	$pattern     = sprintf(
		'@aria-label="%s"@i',
		sprintf(
			preg_quote( $has_filename_label, '@' ),
			'(?<filename>.+)'
		)
	);
	$has_matches = preg_match( $pattern, $content, $matches );
	if ( $has_matches ) {
		$filename = $matches['filename'];
		$search   = sprintf( $has_filename_label, $filename );
		$replace  = sprintf( $has_filename_label_translated, $filename );
	}

	$content = str_replace(
		$search,
		$replace,
		$content
	);

	return $content;
}

/**
 * Registers the `core/file` block on server.
 */
function register_block_core_file() {
	register_block_type_from_metadata(
		__DIR__ . '/file',
		array(
			'render_callback' => 'render_block_core_file',
		)
	);
}
add_action( 'init', 'register_block_core_file' );
