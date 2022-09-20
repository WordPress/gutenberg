<?php

/**
 * Resolves WP Dependency handles to HTML.
 *
 * @param array      $instance WP Dependency instance.
 * @param array|null $handles  Handles to resolve.
 *
 * @return string HTML.
 */
function gutenberg_resolve_dependencies( $instance, $handles ) {
	if ( ! $handles || count( $handles ) === 0 ) {
		return '';
	}

	ob_start();

	$done           = $instance->done;
	$instance->done = array();
	$instance->do_items( array_unique( $handles ) );
	$instance->done = $done;

	return ob_get_clean();
}

add_filter(
	'block_editor_settings_all',
	function( $settings ) {
		// In the future the above assets should be passed through here as well,
		// but some stylesheets cannot be prefixed without specificity issues,
		// so we need to make an exception.
		$settings['__unstableResolvedContentStyles'] = gutenberg_resolve_dependencies(
			wp_styles(),
			isset( $settings['__experimentalContentStyles'] ) ? $settings['__experimentalContentStyles'] : array()
		);
		return $settings;
	},
	100
);
