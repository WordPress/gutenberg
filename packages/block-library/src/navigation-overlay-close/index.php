<?php


function render_block_core_navigation_overlay_close( $attributes ) {

    // This icon is duplicated in the Navigation Block itself.
    // See WP_Navigation_Block_Renderer::get_responsive_container_markup().
    // Changes to this icon should be reflected there as well.
	$close_icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path d="M13 11.8l6.1-6.3-1-1-6.1 6.2-6.1-6.2-1 1 6.1 6.3-6.5 6.7 1 1 6.5-6.6 6.5 6.6 1-1z"></path></svg>';

	$hasIcon = ! empty( $attributes['hasIcon'] );

	$wrapper_attributes = get_block_wrapper_attributes(
		array_filter( // Removes any empty attributes.
			// Attributes
			array(
				// This directive is duplicated in the Navigation Block itself.
				// See WP_Navigation_Block_Renderer::get_responsive_container_markup().
				// Changes to this directive should be reflected there as well.
				'data-wp-on--click' => 'actions.closeMenuOnClick',
				'aria-label'        => $hasIcon ? __( 'Close menu' ) : false,
			)
		)
	);

	$content = $hasIcon ? $close_icon : __( 'Close menu' );

	return sprintf(
		'<button %1$s>%2$s</button>',
		$wrapper_attributes,
		$content,
	);

}


/**
 * Registers the `core/navigation-overlay-close` block on server.
 */
function register_block_core_navigation_overlay_close() {
	register_block_type_from_metadata(
		__DIR__ . '/navigation-overlay-close',
		array(
			'render_callback' => 'render_block_core_navigation_overlay_close',
		)
	);
}
add_action( 'init', 'register_block_core_navigation_overlay_close' );
