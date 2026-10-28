<?php
/**
 * Interactive components, which React brings to life in the browser.
 *
 * Hydrated components are printed with the markup React renders, and React
 * attaches to it. Mounted components, covered first below, get a native
 * fallback that React replaces.
 *
 * Some components can't be printed as React would print them, like a
 * searchable select, whose markup depends on its items and is only fully built
 * in the browser. For those, PHP prints a native field with the same `name`,
 * so the form works before and without JavaScript, and the interactive script renders the
 * real component in its place.
 *
 * @package gutenberg
 */

/**
 * Renders a native fallback that React replaces in the browser.
 *
 * Internal: called by `gutenberg_get_ui_component()`, which validates the
 * props first. Use that instead.
 *
 * @access private
 *
 * @param array $component Component from the manifest.
 * @param array $props     Validated props.
 * @return string HTML.
 */
function gutenberg_ui_components_render_mount( $component, $props ) {
	static $count = 0;
	++$count;

	gutenberg_ui_components_enqueue_interactive_script();

	$id      = 'wp-ui-field-' . $count;
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
		'<wp-ui-interactive style="display:contents" data-interactive="%1$s"><span class="wp-ui-fallback"><label for="%2$s">%3$s</label> <select id="%2$s" name="%4$s"%5$s>%6$s</select></span></wp-ui-interactive>',
		esc_attr(
			wp_json_encode(
				array(
					'how'       => 'mount',
					'component' => $component['interactive']['component'],
					'props'     => $props,
				)
			)
		),
		esc_attr( $id ),
		esc_html( $props['label'] ),
		esc_attr( $props['name'] ),
		'' !== $props['class'] ? ' class="' . esc_attr( $props['class'] ) . '"' : '',
		$options
	);
}

/**
 * Wraps a component's markup so React hydrates it in the browser.
 *
 * React's generated IDs, like the one linking a label to its field, have a
 * placeholder prefix in the build's render. Each instance gets its own prefix
 * here, and React gets the same one, so IDs stay unique on the page and match
 * when React hydrates.
 *
 * Internal: called by `gutenberg_get_ui_component()`. Use that instead.
 *
 * @access private
 *
 * @param array  $component Component from the manifest.
 * @param array  $props     Validated props.
 * @param string $html      The component's markup.
 * @return string HTML.
 */
function gutenberg_ui_components_wrap_hydrate( $component, $props, $html ) {
	static $count = 0;
	++$count;
	$id_prefix = 'wpui' . $count . '-';

	$react_props = $component['interactive']['props'];
	foreach ( $props as $prop => $value ) {
		$react_prop                 = 'class' === $prop ? 'className' : ( $component['interactive']['rename'][ $prop ] ?? $prop );
		$react_props[ $react_prop ] = $value;
	}

	gutenberg_ui_components_enqueue_interactive_script();

	return sprintf(
		'<wp-ui-interactive style="display:contents" data-interactive="%s">%s</wp-ui-interactive>',
		esc_attr(
			wp_json_encode(
				array(
					'how'       => 'hydrate',
					'component' => $component['interactive']['component'],
					'props'     => $react_props,
					'idPrefix'  => $id_prefix,
				)
			)
		),
		str_replace( '__wpuiid__', $id_prefix, $html )
	);
}

/**
 * Loads the script that mounts and hydrates interactive components.
 *
 * @access private
 */
function gutenberg_ui_components_enqueue_interactive_script() {
	$file = gutenberg_dir_path() . 'packages/ui/build-php/interactive.js';
	if ( ! wp_script_is( 'wp-ui-interactive', 'registered' ) && is_readable( $file ) ) {
		wp_register_script(
			'wp-ui-interactive',
			gutenberg_url( 'packages/ui/build-php/interactive.js' ),
			array( 'react', 'react-dom', 'react-jsx-runtime' ),
			(string) filemtime( $file ),
			array( 'in_footer' => true )
		);
	}
	wp_enqueue_script( 'wp-ui-interactive' );
}
