<?php
/**
 * Server-side rendering of the `core/embed` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/embed` block on the server, applying loading="lazy" to
 * the iframe when the lazyLoad attribute is enabled.
 *
 * @since 6.9.0
 *
 * @param array  $attributes The block attributes.
 * @param string $content    The block content.
 * @return string The block content, with loading="lazy" on the iframe if enabled.
 */
function render_block_core_embed( array $attributes, string $content ): string {
	if ( empty( $attributes['lazyLoad'] ) ) {
		return $content;
	}

	if ( ! str_contains( $content, '<iframe' ) ) {
		return $content;
	}

	$p = new WP_HTML_Tag_Processor( $content );
	while ( $p->next_tag( array( 'tag_name' => 'IFRAME' ) ) ) {
		$p->set_attribute( 'loading', 'lazy' );
	}

	return $p->get_updated_html();
}

/**
 * Registers the `core/embed` block on the server.
 *
 * @since 6.9.0
 */
function register_block_core_embed(): void {
	register_block_type_from_metadata(
		__DIR__ . '/embed',
		array(
			'render_callback' => 'render_block_core_embed',
		)
	);
}
add_action( 'init', 'register_block_core_embed' );
