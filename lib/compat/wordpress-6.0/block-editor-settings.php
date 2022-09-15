<?php
/**
 * Adds settings to the block editor.
 *
 * @package gutenberg
 */

/**
 * Returns true if the style is coming from global styles.
 *
 * @param array $style Array containing a '__unstableType' key and a 'css' key with the actual CSS.
 * @return boolean
 */
function gutenberg_is_global_styles_in_5_9( $style ) {
	/*
	 * In WordPress 5.9 we don't have a mechanism to distinguish block styles generated via theme.json
	 * from styles that come from the stylesheet of a theme.
	 *
	 * We do know that the block styles generated via theme.json have some rules for alignment.
	 * Hence, by detecting the presence of these rules, we can tell with high certainty
	 * whether or not the incoming $style has been generated from theme.json.
	 */
	$root_styles  = '.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }';
	$root_styles .= '.wp-site-blocks > .alignright { float: right; margin-left: 2em; }';
	$root_styles .= '.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }';

	if (
		( isset( $style['__unstableType'] ) && ( 'presets' === $style['__unstableType'] ) ) ||
		( isset( $style['__unstableType'] ) && ( 'theme' === $style['__unstableType'] ) && str_contains( $style['css'], $root_styles ) )
	) {
		return true;
	}

	return false;
}
