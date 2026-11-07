<?php
/**
 * Server-side rendering of the `core/audio` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/audio` block on the server to pause other Audio blocks when this one plays.
 *
 * The directives are added here rather than in the saved markup so existing
 * content does not need a deprecation.
 *
 * @since 7.3.0
 *
 * @param array  $attributes The block attributes.
 * @param string $content    The block content.
 * @return string The block content with the interactivity directives added.
 */
function render_block_core_audio( array $attributes, string $content ): string {
	$processor = new WP_HTML_Tag_Processor( $content );
	if ( ! $processor->next_tag( array( 'tag_name' => 'AUDIO' ) ) ) {
		return $content;
	}

	wp_enqueue_script_module( '@wordpress/block-library/audio/view' );

	$processor->set_attribute( 'data-wp-interactive', 'core/audio' );
	$processor->set_attribute( 'data-wp-on--play', 'actions.pauseOtherAudio' );

	return $processor->get_updated_html();
}

/**
 * Registers the `core/audio` block on server.
 *
 * @since 7.3.0
 */
function register_block_core_audio(): void {
	register_block_type_from_metadata(
		__DIR__ . '/audio',
		array(
			'render_callback' => 'render_block_core_audio',
		)
	);
}
add_action( 'init', 'register_block_core_audio' );
