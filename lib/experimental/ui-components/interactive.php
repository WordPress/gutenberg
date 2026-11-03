<?php
/**
 * Interactive components, which React brings to life in the browser.
 *
 * A component opts in with `"interactive": true` in its `component.json`. PHP
 * renders its template as usual and wraps it in `<wp-ui-interactive>`, with the
 * props React needs. In the browser, the interactive script mounts the real
 * React component over it. Until then, what PHP printed stays on screen: the
 * component's own markup when the template can print it, or a native field
 * with the same `name`, so the form works before and without JavaScript.
 *
 * The script only loads on screens that print an interactive component.
 *
 * @package gutenberg
 */

/**
 * Wraps a component's markup so React mounts over it in the browser.
 *
 * Internal: called by `gutenberg_get_ui_component()`. Use that instead.
 *
 * @access private
 *
 * @param array  $component Component from the manifest.
 * @param array  $props     Validated props.
 * @param string $html      What the component's template printed.
 * @return string HTML.
 */
function gutenberg_ui_components_wrap_interactive( $component, $props, $html ) {
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
					'component' => $component['interactive']['component'],
					'props'     => $react_props,
				)
			)
		),
		$html
	);
}

/**
 * Loads the script that mounts interactive components.
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
