<?php
/**
 * Template for the `switch-control` UI component.
 *
 * Matches the markup of the React `SwitchControl`: a `role="switch"` element
 * for the switch itself, and a hidden checkbox that holds its value for the
 * form. React mounts over it in the browser, so before then the switch can't
 * be toggled, but its label still toggles the checkbox, and React starts from
 * the checkbox's state. The parity tests compare it with React's render.
 *
 * @package gutenberg
 */

/**
 * Renders a switch.
 *
 * Internal: called by `gutenberg_get_ui_component()`, which validates the
 * props first. Use that instead.
 *
 * @access private
 *
 * @param array    $props   Validated props.
 * @param string[] $classes Class names from the component's recipe.
 * @param string   $content Unused.
 * @param array    $parts   Class names of the other elements, by part.
 * @return string HTML.
 */
function gutenberg_ui_render_switch_control( $props, $classes, $content, $parts ) {
	static $count = 0;
	++$count;
	$id = 'wp-ui-switch-control-' . $count;

	if ( '' !== $props['class'] ) {
		$classes[] = $props['class'];
	}

	$state = ( $props['disabled'] ? 'data-disabled="" ' : '' ) . ( $props['checked'] ? 'data-checked=""' : 'data-unchecked=""' );

	return sprintf(
		'<div class="%1$s" style="gap:var(--wpds-dimension-gap-sm, 8px);align-items:start">' .
			'<div class="%2$s">' .
				'<span %3$s role="switch" tabindex="%4$s"%5$s id="%6$s" aria-checked="%7$s" class="%8$s"><span %3$s class="%9$s"></span></span>' .
				'<input%10$s id="%6$s-field" style="clip-path:inset(50%%);overflow:hidden;white-space:nowrap;border:0;padding:0;width:1px;height:1px;margin:-1px;position:absolute" tabindex="-1" type="checkbox" aria-hidden="true" name="%11$s"%12$s>' .
			'</div>' .
			'<label id="%6$s-label" for="%6$s-field" class="%13$s">%14$s</label>' .
		'</div>',
		esc_attr( implode( ' ', $classes ) ),
		esc_attr( implode( ' ', $parts['wrapper'] ) ),
		$state,
		$props['disabled'] ? '-1' : '0',
		$props['disabled'] ? ' aria-disabled="true"' : '',
		esc_attr( $id ),
		$props['checked'] ? 'true' : 'false',
		esc_attr( implode( ' ', $parts['switch'] ) ),
		esc_attr( implode( ' ', $parts['thumb'] ) ),
		$props['disabled'] ? ' disabled=""' : '',
		esc_attr( $props['name'] ),
		$props['checked'] ? ' checked=""' : '',
		esc_attr( implode( ' ', $parts['label'] ) ),
		esc_html( $props['label'] )
	);
}
