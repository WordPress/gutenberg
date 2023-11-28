<?php
/**
 * Server-side rendering of the `core/file` block.
 *
 * @package WordPress
 */

/**
 * When the `core/file` block is rendering, check if we need to enqueue the `wp-block-file-view` script.
 *
 * @param array    $attributes The block attributes.
 * @param string   $content    The block content.
 * @param WP_Block $block      The parsed block.
 *
 * @return string Returns the block content.
 */
function render_block_core_file( $attributes, $content, $block ) {
	$should_load_view_script = ! empty( $attributes['displayPreview'] );
	if ( $should_load_view_script ) {
		gutenberg_enqueue_module( '@wordpress/block-library/file-block' );
	}

	// Update object's aria-label attribute if present in block HTML.

	// Match an aria-label attribute from an object tag.
	$pattern = '@<object.+(?<attribute>aria-label="(?<filename>[^"]+)?")@i';
	$content = preg_replace_callback(
		$pattern,
		static function ( $matches ) {
			$filename     = ! empty( $matches['filename'] ) ? $matches['filename'] : '';
			$has_filename = ! empty( $filename ) && 'PDF embed' !== $filename;
			$label        = $has_filename ?
				sprintf(
					/* translators: %s: filename. */
					__( 'Embed of %s.' ),
					$filename
				)
				: __( 'PDF embed' );

			return str_replace( $matches['attribute'], sprintf( 'aria-label="%s"', $label ), $matches[0] );
		},
		$content
	);

	// If it uses the Interactivity API, add the directives.
	if ( $should_load_view_script ) {
		$processor = new WP_HTML_Tag_Processor( $content );
		$processor->next_tag();
		$processor->set_attribute( 'data-wp-interactive', '' );
		$processor->next_tag( 'object' );
		$processor->set_attribute( 'data-wp-bind--hidden', '!selectors.core.file.hasPdfPreview' );
		$processor->set_attribute( 'hidden', true );
		return $processor->get_updated_html();
	}

	return $content;
}

/**
 * Ensure that the view script has the `wp-interactivity` dependency.
 *
 * @since 6.4.0
 *
 * @global WP_Scripts $wp_scripts
 */
function block_core_file_ensure_interactivity_dependency() {
	global $wp_scripts;
	if (
		isset( $wp_scripts->registered['wp-block-file-view'] ) &&
		! in_array( 'wp-interactivity', $wp_scripts->registered['wp-block-file-view']->deps, true )
	) {
		$wp_scripts->registered['wp-block-file-view']->deps[] = 'wp-interactivity';
	}
}

add_action( 'wp_print_scripts', 'block_core_file_ensure_interactivity_dependency' );

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

	gutenberg_register_module(
		'@wordpress/block-library/file-block',
		gutenberg_url( '/build/interactivity/file.min.js' ),
		array( '@wordpress/interactivity' ),
		defined( 'GUTENBERG_VERSION' ) ? GUTENBERG_VERSION : get_bloginfo( 'version' )
	);
}
add_action( 'init', 'register_block_core_file' );
