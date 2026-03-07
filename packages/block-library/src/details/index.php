<?php
/**
 * Server-side rendering of the `core/details` block.
 *
 * @package WordPress
 */

/**
 * Register the details block.
 *
 * @since 7.0.0
 *
 * @uses render_block_core_details()
 */
function register_block_core_details() {
	register_block_type_from_metadata(
		__DIR__ . '/details',
		array(
			'render_callback' => 'render_block_core_details',
		)
	);
}

add_action( 'init', 'register_block_core_details' );

/**
 * Sets fetchpriority="low" on all IMG tags within the collapsed Details block.
 *
 * Images in a collapsed Details block are hidden until the block is expanded, so they should
 * not compete with any resources in the critical rendering path, such as the LCP element image.
 *
 * @since 7.0.0
 *
 * @param array  $attributes The block attributes.
 * @param string $content    The saved content.
 * @return string Modified HTML with fetchpriority="low" on all IMG tags when the showContent attribute is false.
 */
function render_block_core_details( array $attributes, string $content ): string {
	// If the Details block is open by default, short-circuit to let core add fetchpriority=high if appropriate,
	if ( $attributes['showContent'] ?? false ) {
		return $content;
	}

	$tags = new WP_HTML_Tag_Processor( $content );
	while ( $tags->next_tag( 'IMG' ) ) {
		$tags->set_attribute( 'fetchpriority', 'low' );
	}
	return $tags->get_updated_html();
}
