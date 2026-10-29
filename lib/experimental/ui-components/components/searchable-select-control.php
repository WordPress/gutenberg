<?php
/**
 * Template for the `searchable-select-control` UI component.
 *
 * The React `SearchableSelectControl` builds its markup from its items in the
 * browser, so this prints a native `<select>` with the same `name` instead,
 * styled to match the component's closed state. The form works with it before
 * and without JavaScript, and React mounts the real component over it, starting
 * from the option selected at that point.
 *
 * @package gutenberg
 */

/**
 * Renders a native select that React replaces in the browser.
 *
 * Internal: called by `gutenberg_get_ui_component()`, which validates the
 * props first. Use that instead.
 *
 * @access private
 *
 * @param array $props Validated props.
 * @return string HTML.
 */
function gutenberg_ui_render_searchable_select_control( $props ) {
	static $count = 0;
	++$count;
	$id = 'wp-ui-searchable-select-control-' . $count;

	$options = '';
	foreach ( $props['items'] as $item ) {
		$options .= sprintf(
			'<option value="%s"%s%s>%s</option>',
			esc_attr( $item['value'] ),
			selected( $props['value'], $item['value'], false ),
			disabled( ! empty( $item['disabled'] ), true, false ),
			esc_html( $item['label'] )
		);
	}

	return sprintf(
		'<span class="wp-ui-fallback"><label for="%1$s">%2$s</label><select id="%1$s" name="%3$s"%4$s>%5$s</select></span>',
		esc_attr( $id ),
		esc_html( $props['label'] ),
		esc_attr( $props['name'] ),
		'' !== $props['class'] ? ' class="' . esc_attr( $props['class'] ) . '"' : '',
		$options
	);
}
