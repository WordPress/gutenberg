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
	 * Migrates an array that follows an old theme.json schema
	 * to a different version.
	 *
	 * @param array $theme_json Old data to convert.
	 *
	 * @return array The new converted data.
	 */
	public static function migrate( $theme_json );
}
