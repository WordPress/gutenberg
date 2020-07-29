<?php
/**
 * Server-side rendering of the `core/file` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/file` block on server.
 *
 * @param array $attributes The block attributes.
 * @param array $content    The block content.
 *
 * @return string Returns the modified block content.
 */
function render_block_core_file( $attributes, $content ) {
	$script = '';
	if ( ! empty( $attributes['showInlineEmbed'] ) && ! empty( $attributes['embedId'] ) ) {
		$script =<<<HTML
			<script>
				var ua = window.navigator.userAgent;
				if (
					// Most mobile devices include "Mobi" in their UA.
					ua.indexOf( 'Mobi' ) > -1 ||
					// Android tablets are the noteable exception.
					ua.indexOf( 'Android' ) > -1 ||
					(
						// iPad pretends to be a Mac.
						ua.indexOf( 'Macintosh' ) > -1 &&
						navigator.maxTouchPoints &&
						navigator.maxTouchPoints > 2
					)
				) {
					document.getElementById( 'wp-block-file__embed-{$attributes['embedId']}' ).style.display = 'none';
				}
			</script>
HTML;
	}

	return $content . $script;
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
