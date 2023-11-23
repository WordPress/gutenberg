<?php
/**
 * Updates the script-loader.php file
 *
 * @package gutenberg
 */

/**
 * Updates the registered inline script `wp-date` required for moment.js localization.
 * Changes to the inline script output should be synced with Core in the file
 * src/wp-includes/script-loader.php in `wp_default_packages_inline_scripts()`.
 *
 * @since 6.4.0
 *
 * @global WP_Locale $wp_locale WordPress date and time locale object.
 *
 * @param WP_Scripts $scripts WP_Scripts object.
 */
function gutenberg_update_wp_date_settings( $scripts ) {
	if ( $scripts->query( 'wp-date', 'registered' ) ) {
		global $wp_locale;
		// Calculate the timezone abbr (EDT, PST) if possible.
		$timezone_string = get_option( 'timezone_string', 'UTC' );
		$timezone_abbr   = '';

		if ( ! empty( $timezone_string ) ) {
			$timezone_date = new DateTime( 'now', new DateTimeZone( $timezone_string ) );
			$timezone_abbr = $timezone_date->format( 'T' );
		}
		$scripts->registered['wp-date']->extra['after'] = array(
			false,
			sprintf(
				'wp.date.setSettings( %s );',
				wp_json_encode(
					array(
						'l10n'     => array(
							'locale'        => get_user_locale(),
							'months'        => array_values( $wp_locale->month ),
							'monthsShort'   => array_values( $wp_locale->month_abbrev ),
							'weekdays'      => array_values( $wp_locale->weekday ),
							'weekdaysShort' => array_values( $wp_locale->weekday_abbrev ),
							'meridiem'      => (object) $wp_locale->meridiem,
							'relative'      => array(
								/* translators: %s: Duration. */
								'future' => __( '%s from now', 'gutenberg' ),
								/* translators: %s: Duration. */
								'past'   => __( '%s ago', 'gutenberg' ),
								/* translators: One second from or to a particular datetime, e.g., "a second ago" or "a second from now". */
								's'      => __( 'a second', 'gutenberg' ),
								/* translators: %s: Duration in seconds from or to a particular datetime, e.g., "4 seconds ago" or "4 seconds from now". */
								'ss'     => __( '%d seconds', 'gutenberg' ),
								/* translators: One minute from or to a particular datetime, e.g., "a minute ago" or "a minute from now". */
								'm'      => __( 'a minute', 'gutenberg' ),
								/* translators: %s: Duration in minutes from or to a particular datetime, e.g., "4 minutes ago" or "4 minutes from now". */
								'mm'     => __( '%d minutes', 'gutenberg' ),
								/* translators: %s: One hour from or to a particular datetime, e.g., "an hour ago" or "an hour from now". */
								'h'      => __( 'an hour', 'gutenberg' ),
								/* translators: %s: Duration in hours from or to a particular datetime, e.g., "4 hours ago" or "4 hours from now". */
								'hh'     => __( '%d hours', 'gutenberg' ),
								/* translators: %s: One day from or to a particular datetime, e.g., "a day ago" or "a day from now". */
								'd'      => __( 'a day', 'gutenberg' ),
								/* translators: %s: Duration in days from or to a particular datetime, e.g., "4 days ago" or "4 days from now". */
								'dd'     => __( '%d days', 'gutenberg' ),
								/* translators: %s: One month from or to a particular datetime, e.g., "a month ago" or "a month from now". */
								'M'      => __( 'a month', 'gutenberg' ),
								/* translators: %s: Duration in months from or to a particular datetime, e.g., "4 months ago" or "4 months from now". */
								'MM'     => __( '%d months', 'gutenberg' ),
								/* translators: %s: One year from or to a particular datetime, e.g., "a year ago" or "a year from now". */
								'y'      => __( 'a year', 'gutenberg' ),
								/* translators: %s: Duration in years from or to a particular datetime, e.g., "4 years ago" or "4 years from now". */
								'yy'     => __( '%d years', 'gutenberg' ),
							),
							'startOfWeek'   => (int) get_option( 'start_of_week', 0 ),
						),
						'formats'  => array(
							/* translators: Time format, see https://www.php.net/manual/datetime.format.php */
							'time'                => get_option( 'time_format', __( 'g:i a', 'default' ) ),
							/* translators: Date format, see https://www.php.net/manual/datetime.format.php */
							'date'                => get_option( 'date_format', __( 'F j, Y', 'default' ) ),
							/* translators: Date/Time format, see https://www.php.net/manual/datetime.format.php */
							'datetime'            => __( 'F j, Y g:i a', 'default' ),
							/* translators: Abbreviated date/time format, see https://www.php.net/manual/datetime.format.php */
							'datetimeAbbreviated' => __( 'M j, Y g:i a', 'default' ),
						),
						'timezone' => array(
							'offset' => (float) get_option( 'gmt_offset', 0 ),
							'string' => $timezone_string,
							'abbr'   => $timezone_abbr,
						),
					)
				)
			),
		);
	}
}

add_action( 'wp_default_scripts', 'gutenberg_update_wp_date_settings' );

/**
 * Collect the block editor assets that need to be loaded into the editor's iframe.
 *
 * @since 6.0.0
 * @access private
 *
 * @return array {
 *     The block editor assets.
 *
 *     @type string|false $styles  String containing the HTML for styles.
 *     @type string|false $scripts String containing the HTML for scripts.
 * }
 */
function _gutenberg_get_iframed_editor_assets_6_4() {
	global $wp_styles, $wp_scripts;

	// Keep track of the styles and scripts instance to restore later.
	$current_wp_styles  = $wp_styles;
	$current_wp_scripts = $wp_scripts;

	// Create new instances to collect the assets.
	$wp_styles  = new WP_Styles();
	$wp_scripts = new WP_Scripts();

	// Register all currently registered styles and scripts. The actions that
	// follow enqueue assets, but don't necessarily register them.
	$wp_styles->registered  = $current_wp_styles->registered;
	$wp_scripts->registered = $current_wp_scripts->registered;

	// We generally do not need reset styles for the iframed editor.
	// However, if it's a classic theme, margins will be added to every block,
	// which is reset specifically for list items, so classic themes rely on
	// these reset styles.
	$wp_styles->done =
		wp_theme_has_theme_json() ? array( 'wp-reset-editor-styles' ) : array();

	wp_enqueue_script( 'wp-polyfill' );
	// Enqueue the `editorStyle` handles for all core block, and dependencies.
	wp_enqueue_style( 'wp-edit-blocks' );

	if ( current_theme_supports( 'wp-block-styles' ) ) {
		wp_enqueue_style( 'wp-block-library-theme' );
	}

	// We don't want to load EDITOR scripts in the iframe, only enqueue
	// front-end assets for the content.
	add_filter( 'should_load_block_editor_scripts_and_styles', '__return_false' );
	do_action( 'enqueue_block_assets' );
	remove_filter( 'should_load_block_editor_scripts_and_styles', '__return_false' );

	$block_registry = WP_Block_Type_Registry::get_instance();

	// Additionally, do enqueue `editorStyle` assets for all blocks, which
	// contains editor-only styling for blocks (editor content).
	foreach ( $block_registry->get_all_registered() as $block_type ) {
		if ( isset( $block_type->editor_style_handles ) && is_array( $block_type->editor_style_handles ) ) {
			foreach ( $block_type->editor_style_handles as $style_handle ) {
				wp_enqueue_style( $style_handle );
			}
		}
	}

	/**
	 * Remove the deprecated `print_emoji_styles` handler.
	 * It avoids breaking style generation with a deprecation message.
	 */
	$has_emoji_styles = has_action( 'wp_print_styles', 'print_emoji_styles' );
	if ( $has_emoji_styles ) {
		remove_action( 'wp_print_styles', 'print_emoji_styles' );
	}

	ob_start();
	wp_print_styles();
	$styles = ob_get_clean();

	if ( $has_emoji_styles ) {
		add_action( 'wp_print_styles', 'print_emoji_styles' );
	}

	ob_start();
	wp_print_head_scripts();
	wp_print_footer_scripts();
	$scripts = ob_get_clean();

	// Restore the original instances.
	$wp_styles  = $current_wp_styles;
	$wp_scripts = $current_wp_scripts;

	return array(
		'styles'  => $styles,
		'scripts' => $scripts,
	);
}

add_filter(
	'block_editor_settings_all',
	static function ( $settings ) {
		// We must override what core is passing now.
		$settings['__unstableResolvedAssets'] = _gutenberg_get_iframed_editor_assets_6_4();
		return $settings;
	}
);
