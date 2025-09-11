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
 * Build inline CSS custom properties for backdrop color settings.
 *
 * @param array $attributes Block attributes.
 *
 * @return string Inline CSS string.
 */
function block_core_dialog_generate_color_styles( array $attributes ): string {
	$custom_backdrop_color = $attributes['customBackdropColor'] ?? '';

	$styles = array(
		'--wp--style--dialog-backdrop-color' => $custom_backdrop_color,
	);

	$style_string = array_map(
		static function ( string $key, string $value ): string {
			return ! empty( $value ) ? $key . ': ' . $value . ';' : '';
		},
		array_keys( $styles ),
		$styles
	);

	return implode( ' ', array_filter( $style_string ) );
}

/**
 * Build inline CSS custom properties for animation settings.
 *
 * @param array $attributes Block attributes.
 *
 * @return string Inline CSS string.
 */
function block_core_dialog_generate_animation_styles( array $attributes ): string {
	$animation_duration = $attributes['animationDuration'] ?? 500;
	$animation_styles   = "--wp--style--dialog-animation-duration: {$animation_duration}ms;";

	return $animation_styles;
}

/**
 * Build inline CSS custom properties for position settings.
 *
 * @param array $attributes Block attributes.
 *
 * @return string Inline CSS string.
 */
function block_core_dialog_generate_position_styles( array $attributes ): string {
	$dialog_position = $attributes['dialogPosition'] ?? 'center';

	$position_styles = '';

	switch ( $dialog_position ) {
		case 'top left':
			$position_styles = 'margin-top: 1em; margin-left: 1em;';
			break;
		case 'top center':
			$position_styles = 'margin-top: 1em;';
			break;
		case 'top right':
			$position_styles = 'margin-top: 1em; margin-right: 1em;';
			break;
		case 'center left':
			$position_styles = 'margin-left: 1em;';
			break;
		case 'center right':
			$position_styles = 'margin-right: 1em;';
			break;
		case 'bottom left':
			$position_styles = 'margin-bottom: 1em; margin-left: 1em;';
			break;
		case 'bottom center':
			$position_styles = 'margin-bottom: 1em;';
			break;
		case 'bottom right':
			$position_styles = 'margin-bottom: 1em; margin-right: 1em;';
			break;
	}

	return $position_styles;
}

/**
 * Render the 'core/dialog-element' block.
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

	$suffix = wp_scripts_get_suffix();
	if ( defined( 'IS_GUTENBERG_PLUGIN' ) && IS_GUTENBERG_PLUGIN ) {
		$module_url = gutenberg_url( '/build-module/block-library/dialog-element/view.min.js' );
	}

	wp_register_script_module(
		'@wordpress/block-library/dialog-element',
		isset( $module_url ) ? $module_url : includes_url( "blocks/dialog-element/view{$suffix}.js" ),
		array( '@wordpress/interactivity' ),
		defined( 'GUTENBERG_VERSION' ) ? GUTENBERG_VERSION : get_bloginfo( 'version' )
	);

	wp_enqueue_script_module( '@wordpress/block-library/dialog-element' );

	$context_id = isset( $block->context['core/dialog-id'] ) ? $block->context['core/dialog-id'] : null;
	if ( ! $context_id ) {
		return '';
	}
	$is_open                 = get_query_var( 'dialogId', false ) === $context_id;
	$dialog_size             = isset( $attributes['dialogSize'] ) ? $attributes['dialogSize'] : 'small';
	$animation               = isset( $attributes['animation'] ) ? $attributes['animation'] : 'fade';
	$auto_activate_on_render = array_key_exists( 'autoActivateOnRender', $attributes ) ? $attributes['autoActivateOnRender'] : false;
	$default_is_open         = $auto_activate_on_render;
	$auto_activation_timer   = array_key_exists( 'autoActivationTimer', $attributes ) ? $attributes['autoActivationTimer'] : -1;
	$auto_activation_timer   = $default_is_open ? 0 : $auto_activation_timer;
	$enable_deep_link        = array_key_exists( 'enableDeepLink', $attributes ) ? $attributes['enableDeepLink'] : false;

	// By using state any 3rd party can interact as easy as `store('core/dialog').state.dialogs.[blockId].isOpen = true;` which would open the dialog given the blockId.
	$dialog_state           = wp_interactivity_state(
		'core/dialog',
		array()
	);
	$dialogs                = $dialog_state['dialogs'] ?? array();
	$dialogs[ $context_id ] = array(
		'id'                      => $context_id,
		'activationTimerDuration' => (int) $auto_activation_timer,
		'isOpen'                  => $is_open,
		'enableDeepLink'          => $enable_deep_link,
		'isClosing'               => false,
	);
	wp_interactivity_state(
		'core/dialog',
		array(
			'dialogs' => $dialogs,
		)
	);

	$block_styles  = block_core_dialog_generate_animation_styles( $attributes );
	$block_styles .= ' ' . block_core_dialog_generate_color_styles( $attributes );
	$block_styles .= ' ' . block_core_dialog_generate_position_styles( $attributes );
	$block_styles  = trim( $block_styles );

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
		$content         = $hidden_h2 . $content;
		$aria_labelledby = $hidden_id;
	}

	$block_wrapper_attrs = get_block_wrapper_attributes(
		array(
			'id'                               => $context_id,
			'class'                            => 'is-size-' . $dialog_size . ' is-animation-' . $animation,
			'role'                             => 'dialog',
			'aria-modal'                       => 'true',
			'aria-labelledby'                  => $aria_labelledby,
			'data-wp-interactive'              => 'core/dialog',
			'data-wp-class--is-closing'        => 'state.isClosing',
			'data-wp-on--click'                => 'callbacks.onBackdropClick',
			'data-wp-init--on-auto-activation' => 'callbacks.onAutoActivation',
			'data-wp-on-document--keydown'     => 'callbacks.onESCKey',
			'data-wp-watch--on-dialog-open'    => 'callbacks.onOpen',
			'data-wp-watch--on-dialog-close'   => 'callbacks.onClose',
			'style'                            => $block_styles,
		)
	);

	// This will enable anyone to supply their own close icon asset.
	$close_icon = 'X';

	$close_button = wp_sprintf(
		'<button class="wp-block-dialog-element__close-button" data-wp-on--click="actions.onClickClose" type="button" aria-label="Close dialog">%1$s</button>',
		$close_icon,
	);

	return wp_sprintf(
		'<dialog %1$s>%2$s<div class="wp-block-dialog-element__inner">%3$s</div></dialog>',
		$block_wrapper_attrs, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		$close_button, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		$content // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	);
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
add_action('init', 'register_block_core_dialog_element');
