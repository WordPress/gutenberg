<?php
/**
 * Schema interface for theme.json structures.
 *
 * @package gutenberg
 */

/**
 * Schema interface for theme.json structures.
 *
 * @package gutenberg
 */
interface WP_Theme_JSON_Schema {
	/**
	 * Parses an array that follows an old theme.json schema
	 * into the latest theme.json schema.
	 *
	 * @param array $theme_json Old data to convert.
	 *
	 * @return array The data in the latest theme.json schema.
	 */
	public static function parse( $theme_json );
}
