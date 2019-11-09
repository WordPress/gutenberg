<?php
/**
 * Includes revisions to the block parser not yet proposed for core adoption.
 *
 * @package gutenberg
 */

/**
 * Filters to override default block parser with Gutenberg's custom
 * implementation.
 *
 * @since 6.9.0
 */
function gutenberg_replace_block_parser_class() {
	return 'WP_Sourced_Attributes_Block_Parser';
}
add_filter( 'block_parser_class', 'gutenberg_replace_block_parser_class' );

/**
 * Given a registered block type settings array, assigns default attributes.
 * This must be called manually, as there is currently no way to hook to block
 * registration.
 *
 * @since 6.9.0
 *
 * @param array $block_settings Block settings.
 * @return array                Block settings with default attributes.
 */
function gutenberg_add_default_attributes( $block_settings ) {
	$supports   = isset( $block_settings['supports'] ) ? $block_settings['supports'] : array();
	$attributes = isset( $block_settings['attributes'] ) ? $block_settings['attributes'] : array();

	if ( ! empty( $supports['align'] ) ) {
		if ( ! isset( $attributes['align'] ) ) {
			$attributes['align'] = array();
		}

		$attributes['align']['type'] = 'string';
	}

	if ( ! empty( $supports['anchor'] ) ) {
		if ( ! isset( $attributes['anchor'] ) ) {
			$attributes['anchor'] = array();
		}

		$attributes['anchor']['type']      = 'string';
		$attributes['anchor']['source']    = 'attribute';
		$attributes['anchor']['attribute'] = 'id';
		$attributes['anchor']['selector']  = '*';
	}

	if ( ! isset( $supports['customClassName'] ) || false !== $supports['customClassName'] ) {
		if ( ! isset( $attributes['className'] ) ) {
			$attributes['className'] = array();
		}

		$attributes['className']['type'] = 'string';
	}

	return $block_settings;
}

/**
 * Given a CSS selector string, returns an equivalent XPath selector.
 *
 * @access private
 * @since 6.9.0
 *
 * @param string $selector CSS selector.
 * @return string          Equivalent XPath selector.
 */
function _wp_css_selector_to_xpath( $selector ) {
	/*
	 * Modified from PHP Selector, released under the MIT License.
	 * https://github.com/tj/php-selector
	 * Copyright © 2008 - 2009 TJ Holowaychuk <tj@vision-media.ca>
	 */

	// Remove spaces around operators.
	$selector  = preg_replace( '/\s*>\s*/', '>', $selector );
	$selector  = preg_replace( '/\s*~\s*/', '~', $selector );
	$selector  = preg_replace( '/\s*\+\s*/', '+', $selector );
	$selector  = preg_replace( '/\s*,\s*/', ',', $selector );
	$selectors = preg_split( '/\s+(?![^\[]+\])/', $selector );

	foreach ( $selectors as &$selector ) {
		/* , */
		$selector = preg_replace( '/,/', '|descendant-or-self::', $selector );
		/* input:checked, :disabled, etc. */
		$selector = preg_replace( '/(.+)?:(checked|disabled|required|autofocus)/', '\1[@\2="\2"]', $selector );
		/* input:autocomplete, :autocomplete */
		$selector = preg_replace( '/(.+)?:(autocomplete)/', '\1[@\2="on"]', $selector );
		/* input:button, input:submit, etc. */
		$selector = preg_replace( '/:(text|password|checkbox|radio|button|submit|reset|file|hidden|image|datetime|datetime-local|date|month|time|week|number|range|email|url|search|tel|color)/', 'input[@type="\1"]', $selector );
		/* foo[id] */
		$selector = preg_replace( '/(\w+)\[([_\w-]+[_\w\d-]*)\]/', '\1[@\2]', $selector );
		/* [id] */
		$selector = preg_replace( '/\[([_\w-]+[_\w\d-]*)\]/', '*[@\1]', $selector );
		/* foo[id=foo] */
		$selector = preg_replace( '/\[([_\w-]+[_\w\d-]*)=[\'"]?(.*?)[\'"]?\]/', '[@\1="\2"]', $selector );
		/* [id=foo] */
		$selector = preg_replace( '/^\[/', '*[', $selector );
		/* div#foo */
		$selector = preg_replace( '/([_\w-]+[_\w\d-]*)\#([_\w-]+[_\w\d-]*)/', '\1[@id="\2"]', $selector );
		/* #foo */
		$selector = preg_replace( '/\#([_\w-]+[_\w\d-]*)/', '*[@id="\1"]', $selector );
		/* div.foo */
		$selector = preg_replace( '/([_\w-]+[_\w\d-]*)\.([_\w-]+[_\w\d-]*)/', '\1[contains(concat(" ",@class," ")," \2 ")]', $selector );
		/* .foo */
		$selector = preg_replace( '/\.([_\w-]+[_\w\d-]*)/', '*[contains(concat(" ",@class," ")," \1 ")]', $selector );
		/* div:first-child */
		$selector = preg_replace( '/([_\w-]+[_\w\d-]*):first-child/', '*/\1[position()=1]', $selector );
		/* div:last-child */
		$selector = preg_replace( '/([_\w-]+[_\w\d-]*):last-child/', '*/\1[position()=last()]', $selector );
		/* :first-child */
		$selector = str_replace( ':first-child', '*/*[position()=1]', $selector );
		/* :last-child */
		$selector = str_replace( ':last-child', '*/*[position()=last()]', $selector );
		/* :nth-last-child */
		$selector = preg_replace( '/:nth-last-child\((\d+)\)/', '[position()=(last() - (\1 - 1))]', $selector );
		/* div:nth-child */
		$selector = preg_replace( '/([_\w-]+[_\w\d-]*):nth-child\((\d+)\)/', '*/*[position()=\2 and self::\1]', $selector );
		/* :nth-child */
		$selector = preg_replace( '/:nth-child\((\d+)\)/', '*/*[position()=\1]', $selector );
		/* :contains(Foo) */
		$selector = preg_replace( '/([_\w-]+[_\w\d-]*):contains\((.*?)\)/', '\1[contains(string(.),"\2")]', $selector );
		/* > */
		$selector = preg_replace( '/>/', '/', $selector );
		/* ~ */
		$selector = preg_replace( '/~/', '/following-sibling::', $selector );
		/* + */
		$selector = preg_replace( '/\+([_\w-]+[_\w\d-]*)/', '/following-sibling::\1[position()=1]', $selector );
		$selector = str_replace( ']*', ']', $selector );
		$selector = str_replace( ']/*', ']', $selector );
	}

	// ' '
	$selector = implode( '/descendant::', $selectors );
	$selector = 'descendant-or-self::' . $selector;
	// :scope
	$selector = preg_replace( '/(((\|)?descendant-or-self::):scope)/', '.\3', $selector );
	// $element
	$sub_selectors = explode( ',', $selector );

	foreach ( $sub_selectors as $key => $sub_selector ) {
		$parts        = explode( '$', $sub_selector );
		$sub_selector = array_shift( $parts );

		if ( count( $parts ) && preg_match_all( '/((?:[^\/]*\/?\/?)|$)/', $parts[0], $matches ) ) {
			$results       = $matches[0];
			$results[]     = str_repeat( '/..', count( $results ) - 2 );
			$sub_selector .= implode( '', $results );
		}

		$sub_selectors[ $key ] = $sub_selector;
	}

	$selector = implode( ',', $sub_selectors );

	return $selector;
}
