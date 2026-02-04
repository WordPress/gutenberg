<?php
/**
 * Dialog Element Block
 *
 * @package WordPress
 */

/**
 * Add dialog ID query var
 *
 * @hook query_vars
 *
 * @param mixed $qvars Query vars.
 * @return mixed
 */
function block_core_dialog_add_query_var( $qvars ) {
	$qvars[] = 'dialogId';
	return $qvars;
}
add_filter( 'query_vars', 'block_core_dialog_add_query_var' );

/**
 * Render the 'core/dialog-element' block.
 *
 * Applies IAPI directives and dialog-specific attributes to the saved content.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content Block content.
 * @param WP_Block $block Block instance.
 *
 * @return string Rendered block HTML.
 */
function render_block_core_dialog_element( array $attributes, string $content, WP_Block $block ): string {
	if ( empty( $content ) ) {
		return '';
	}

	$context_id = isset( $block->context['core/dialog-id'] ) ? $block->context['core/dialog-id'] : null;
	if ( ! $context_id ) {
		return '';
	}

	$is_open                 = get_query_var( 'dialogId', false ) === $context_id;
	$auto_activate_on_render = array_key_exists( 'autoActivateOnRender', $attributes ) ? $attributes['autoActivateOnRender'] : false;
	$default_is_open         = $auto_activate_on_render;
	$auto_activation_timer   = array_key_exists( 'autoActivationTimer', $attributes ) ? $attributes['autoActivationTimer'] : -1;
	$auto_activation_timer   = $default_is_open ? 0 : $auto_activation_timer;
	$enable_deep_link        = array_key_exists( 'enableDeepLink', $attributes ) ? $attributes['enableDeepLink'] : false;

	// By using state any 3rd party can interact as easy as `store('core/dialog').state.dialogs.[blockId].isOpen = true;` which would open the dialog given the blockId.
	wp_interactivity_state(
		'core/dialog/private',
		array(
			'dialogs' => array(
				$context_id => array(
					'id'                      => $context_id,
					'activationTimerDuration' => (int) $auto_activation_timer,
					'isOpen'                  => $is_open,
					'enableDeepLink'          => $enable_deep_link,
					'showClosingAnimation'    => false,
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
		$dialog_label    = isset( $attributes['dialogLabel'] ) ? $attributes['dialogLabel'] : __( 'Dialog', 'default' );
		$hidden_id       = wp_unique_id( 'dialog-heading-' );
		$hidden_h2       = wp_sprintf( '<h2 id="%1$s" class="screen-reader-text">%2$s</h2>', esc_attr( $hidden_id ), esc_html( $dialog_label ) );
		$aria_labelledby = $hidden_id;
	}

	// Process the saved content to add IAPI directives.
	$tag_processor = new WP_HTML_Tag_Processor( $content );

	if ( $tag_processor->next_tag( 'dialog' ) ) {
		// Set dialog-specific attributes.
		$tag_processor->set_attribute( 'id', $context_id );
		$tag_processor->set_attribute( 'role', 'dialog' );
		$tag_processor->set_attribute( 'aria-modal', 'true' );
		$tag_processor->set_attribute( 'aria-labelledby', $aria_labelledby );

		// Add IAPI directives.
		$tag_processor->set_attribute( 'data-wp-interactive', 'core/dialog/private' );
		$tag_processor->set_attribute( 'data-wp-class--active', 'state.dialog.isOpen' );
		$tag_processor->set_attribute( 'data-wp-class--show-closing-animation', 'state.dialog.showClosingAnimation' );
		$tag_processor->set_attribute( 'data-wp-on--click', 'callbacks.onBackdropClick' );
		$tag_processor->set_attribute( 'data-wp-init--on-auto-activation', 'callbacks.onAutoActivation' );
		$tag_processor->set_attribute( 'data-wp-on-document--keydown', 'callbacks.onESCKey' );
		$tag_processor->set_attribute( 'data-wp-watch--on-dialog-open', 'callbacks.onOpen' );
		$tag_processor->set_attribute( 'data-wp-watch--on-dialog-close', 'callbacks.onClose' );
	}

	// Get updated HTML.
	$output = $tag_processor->get_updated_html();

	// Use the icon registry if available, otherwise fall back to inline SVG.
	if ( class_exists( 'WP_Icons_Registry' ) ) {
		$registry   = WP_Icons_Registry::get_instance();
		$icon_data  = $registry->get_registered_icon( 'core/cancel-circle-filled' );
		$close_icon = $icon_data['content'] ?? '';
	}

	if ( empty( $close_icon ) ) {
		$close_icon = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="24" height="24" aria-hidden="true" focusable="false"><path d="M12 4c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8Zm3.8 10.7-1.1 1.1-2.7-2.7-2.7 2.7-1.1-1.1 2.7-2.7-2.7-2.7 1.1-1.1 2.7 2.7 2.7-2.7 1.1 1.1-2.7 2.7 2.7 2.7Z" /></svg>';
	}

	// Allow themes/plugins to customize the close icon.
	$close_icon = apply_filters( 'block_core_dialog_close_icon', $close_icon );

	$close_button = wp_sprintf(
		'<button class="wp-block-dialog-element__close-button" data-wp-on--click="actions.onClickClose" type="button" aria-label="%1$s">%2$s</button>',
		esc_attr__( 'Close dialog', 'default' ),
		$close_icon
	);

	// Inject close button and hidden heading (if needed) before the inner div.
	$hidden_heading_html = isset( $hidden_h2 ) ? $hidden_h2 : '';
	$output              = str_replace(
		'<div class="wp-block-dialog-element__inner">',
		$close_button . $hidden_heading_html . '<div class="wp-block-dialog-element__inner">',
		$output
	);

	return $output;
}

/**
 * Registers the `core/dialog-element` block on server.
 *
 * @hook init
 * @return void
 */
function register_block_core_dialog_element() {
	register_block_type_from_metadata(
		__DIR__ . '/dialog-element',
		array(
			'render_callback' => 'render_block_core_dialog_element',
		)
	);
	register_block_bindings_source(
		'core/dialog-element-label',
		array(
			'label'              => __( 'Dialog Element Label', 'default' ),
			'get_value_callback' => function ( array $source_args, $block_instance ) {
				return $block_instance->context['core/dialog-label'];
			},
			'uses_context'       => array( 'core/dialog-label' ),
		)
	);
}
add_action( 'init', 'register_block_core_dialog_element' );
