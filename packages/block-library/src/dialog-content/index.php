<?php
/**
 * Dialog Element Block
 *
 * @package WordPress
 */


/**
 * Render the 'core/dialog-content' block.
 *
 * Applies Interactivity API directives and dialog-specific attributes to the saved content.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content Block content.
 * @param WP_Block $block Block instance.
 *
 * @return string Rendered block HTML.
 */
function render_block_core_dialog_content( array $attributes, string $content, WP_Block $block ): string {
	if ( empty( $content ) ) {
		return '';
	}

	$context_id = isset( $block->context['core/dialog-id'] ) ? $block->context['core/dialog-id'] : null;
	if ( ! $context_id ) {
		return '';
	}

	// Animation duration in milliseconds. Used as a CSS custom property for styling.
	// The JS uses animationend events instead of timing, so this is only for CSS.
	// Developers can override this value using WP_HTML_Tag_Processor to modify the inline style.
	$animation_duration = array_key_exists( 'animationDuration', $attributes ) ? $attributes['animationDuration'] : 400;

	// By using state any 3rd party can interact as easy as `store('core/dialog').state.dialogs.[blockId].isOpen = true;` which would open the dialog given the blockId.
	wp_interactivity_state(
		'core/dialog/private',
		array(
			'dialogs' => array(
				$context_id => array(
					'id'                   => $context_id,
					'isOpen'               => false,
					'showClosingAnimation' => false,
				),
			),
		)
	);

	// Determine aria-labelledby value by finding or creating a heading.
	$aria_labelledby = '';
	// Check if $content contains any <h*> tags, and if so, add the id of the first one to aria-labelledby.
	if ( preg_match( '/<h[1-6][^>]*>(.*?)<\/h[1-6]>/', $content, $matches ) ) {
		// Generate a unique ID for the heading if it doesn't have one.
		$heading_id = wp_unique_id( 'dialog-heading-' );
		// Replace the first heading with one that has the unique ID.
		$heading_with_id = preg_replace( '/<h([1-6])([^>]*)>/', '<h$1 id="' . esc_attr( $heading_id ) . '"$2>', $matches[0], 1 );
		$content         = str_replace( $matches[0], $heading_with_id, $content );
		$aria_labelledby = $heading_id;
	} else {
		// Fallback, to create a hidden H2 with the dialog label if no heading is found in the content.
		$dialog_label    = isset( $block->context['core/dialog-label'] ) && '' !== $block->context['core/dialog-label'] ? $block->context['core/dialog-label'] : __( 'Dialog', 'default' );
		$hidden_id       = wp_unique_id( 'dialog-heading-' );
		$hidden_h2       = wp_sprintf( '<h2 id="%1$s" class="screen-reader-text">%2$s</h2>', esc_attr( $hidden_id ), esc_html( $dialog_label ) );
		$aria_labelledby = $hidden_id;
	}

	// Process the saved content to add Interactivity API directives.
	$tag_processor = new WP_HTML_Tag_Processor( $content );

	if ( $tag_processor->next_tag( 'dialog' ) ) {
		// Set dialog-specific attributes.
		$tag_processor->set_attribute( 'id', $context_id );
		$tag_processor->set_attribute( 'role', 'dialog' );
		$tag_processor->set_attribute( 'aria-modal', 'true' );
		$tag_processor->set_attribute( 'aria-labelledby', $aria_labelledby );

		// Add Interactivity API directives.
		$tag_processor->set_attribute( 'data-wp-interactive', 'core/dialog/private' );

		// Set the animation duration as a CSS custom property to keep CSS animations in sync with JS.
		// Merge with any existing inline styles from block supports.
		$existing_style         = $tag_processor->get_attribute( 'style' ) ?? '';
		$animation_duration_css = sprintf( '--wp--style--dialog-animation-duration: %dms;', $animation_duration );
		$merged_style           = $existing_style ? $existing_style . ' ' . $animation_duration_css : $animation_duration_css;
		$tag_processor->set_attribute( 'style', $merged_style );
		// Set the additional directives.
		$tag_processor->set_attribute( 'data-wp-class--active', 'state.dialog.isOpen' );
		$tag_processor->set_attribute( 'data-wp-class--show-closing-animation', 'state.dialog.showClosingAnimation' );
		$tag_processor->set_attribute( 'data-wp-on--click', 'callbacks.onBackdropClick' );
		$tag_processor->set_attribute( 'data-wp-on-document--keydown', 'callbacks.onESCKey' );
		$tag_processor->set_attribute( 'data-wp-watch--on-dialog-open', 'callbacks.onOpen' );
		$tag_processor->set_attribute( 'data-wp-watch--on-dialog-close', 'callbacks.onClose' );
	}

	// Get updated HTML.
	$output = $tag_processor->get_updated_html();

	// Use the icon registry if available, otherwise fall back to inline SVG.
	if ( class_exists( 'WP_Icons_Registry' ) ) {
		$registry   = WP_Icons_Registry::get_instance();
		$icon_data  = $registry->get_registered_icon( 'core/close' );
		$close_icon = $icon_data['content'] ?? '';
	}

	// Fallback to a copy of the core/close icon if the icon registry is not available. (it is experimental currently)
	if ( empty( $close_icon ) ) {
		$close_icon = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="24" height="24" aria-hidden="true" focusable="false"><path d="m13.06 12 6.47-6.47-1.06-1.06L12 10.94 5.53 4.47 4.47 5.53 10.94 12l-6.47 6.47 1.06 1.06L12 13.06l6.47 6.47 1.06-1.06L13.06 12Z" /></svg>';
	}

	// Allow themes/plugins to customize the close icon.
	$close_icon = apply_filters( 'block_core_dialog_close_icon', $close_icon );

	$close_button = wp_sprintf(
		'<button class="wp-block-dialog-content__close-button" data-wp-on--click="actions.onClickClose" type="button" aria-label="%1$s">%2$s</button>',
		esc_attr__( 'Close dialog', 'default' ),
		$close_icon
	);

	// Inject close button and hidden heading (if needed) before the inner div.
	$hidden_heading_html = isset( $hidden_h2 ) ? $hidden_h2 : '';
	$output              = str_replace(
		'<div class="wp-block-dialog-content__inner">',
		$close_button . $hidden_heading_html . '<div class="wp-block-dialog-content__inner">',
		$output
	);

	return $output;
}

/**
 * Registers the `core/dialog-content` block on server.
 *
 * @hook init
 * @return void
 */
function register_block_core_dialog_content() {
	register_block_type_from_metadata(
		__DIR__ . '/dialog-content',
		array(
			'render_callback' => 'render_block_core_dialog_content',
		)
	);
}
add_action( 'init', 'register_block_core_dialog_content' );
