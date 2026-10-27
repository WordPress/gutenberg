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
 * @param array    $props   Validated props.
 * @param string[] $classes Class names from the component's recipe.
 * @param string   $content Label, as plain text.
 * @return string HTML.
 */
function gutenberg_ui_render_button( $props, $classes, $content ) {
	if ( '' !== $props['class'] ) {
		$classes[] = $props['class'];
	}

	return sprintf(
		'<button type="%1$s" tabindex="0" class="%2$s"%3$s>%4$s</button>',
		esc_attr( $props['type'] ),
		esc_attr( implode( ' ', $classes ) ),
		$props['disabled'] ? ' data-disabled="" disabled=""' : '',
		esc_html( $content )
	);
}
