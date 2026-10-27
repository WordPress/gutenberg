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
 * @param array    $props   Validated props.
 * @param string[] $classes Class names from the component's recipe.
 * @return string HTML.
 */
function gutenberg_ui_render_button( $props, $classes ) {
	if ( '' !== $props['class'] ) {
		$classes[] = $props['class'];
	}

	return sprintf(
		'<button type="%1$s" tabindex="0" class="%2$s"%3$s>%4$s</button>',
		esc_attr( $props['type'] ),
		esc_attr( implode( ' ', $classes ) ),
		$props['disabled'] ? ' data-disabled="" disabled=""' : '',
		esc_html( $props['label'] )
	);
}
