<?php
/**
 * Template for the `button` UI component.
 *
 * Matches the markup of the React `Button` with `focusableWhenDisabled` set to
 * false, so a disabled button is natively disabled and works without
 * JavaScript. The parity tests compare it with React's render of every
 * combination of variants.
 *
 * @package gutenberg
 */

/**
 * Renders a button.
 *
 * Internal: called by `gutenberg_get_ui_component()`, which validates the
 * props first. Use that instead.
 *
 * @access private
 *
 * @param array  $props   Validated props.
 * @param string $content Label, as plain text.
 * @return string HTML.
 */
function _gutenberg_ui_render_button( $props, $content ) {
	$styles  = gutenberg_ui_components_get_styles( 'button/style' );
	$defense = gutenberg_ui_components_get_styles( 'utils/css/global-css-defense' );
	$resets  = gutenberg_ui_components_get_styles( 'utils/css/resets' );
	$focus   = gutenberg_ui_components_get_styles( 'utils/css/focus' );

	// The same classes as React, in the same order.
	$classes = array_filter(
		array(
			$defense['button'],
			$resets['box-sizing'],
			$focus['outset-ring--focus-except-active'],
			'unstyled' !== $props['variant'] ? $styles['button'] : '',
			$styles[ 'is-' . $props['tone'] ],
			$styles[ 'is-' . $props['variant'] ],
			// There's no `is-default` class, as in React.
			$styles[ 'is-' . $props['size'] ] ?? '',
			$props['class'],
		)
	);

	return sprintf(
		'<button type="%1$s" tabindex="0" class="%2$s"%3$s>%4$s</button>',
		esc_attr( $props['type'] ),
		esc_attr( implode( ' ', $classes ) ),
		$props['disabled'] ? ' data-disabled="" disabled=""' : '',
		esc_html( $content )
	);
}
