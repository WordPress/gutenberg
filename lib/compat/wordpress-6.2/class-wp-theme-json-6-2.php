<?php
/**
 * WP_Theme_JSON_6_2 class
 *
 * @package gutenberg
 */

/**
 * Class that encapsulates the processing of structures that adhere to the theme.json spec.
 *
 * This class is for internal core usage and is not supposed to be used by extenders (plugins and/or themes).
 * This is a low-level API that may need to do breaking changes. Please,
 * use get_global_settings, get_global_styles, and get_global_stylesheet instead.
 *
 * @access private
 */
class WP_Theme_JSON_6_2 extends WP_Theme_JSON_6_1 {
	/**
	 * The top-level keys a theme.json can have.
	 *
	 * @since 5.8.0 As `ALLOWED_TOP_LEVEL_KEYS`.
	 * @since 5.9.0 Renamed from `ALLOWED_TOP_LEVEL_KEYS` to `VALID_TOP_LEVEL_KEYS`,
	 *              added the `customTemplates` and `templateParts` values.
	 * @since 6.2.0 Added description key.
	 * @var string[]
	 */
	const VALID_TOP_LEVEL_KEYS = array(
		'customTemplates',
		'patterns',
		'settings',
		'styles',
		'templateParts',
		'version',
		'title',
		'description',
	);
}
