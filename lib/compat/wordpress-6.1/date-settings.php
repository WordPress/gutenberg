<?php
/**
 * Updates to the settings given to @wordpress/date.
 *
 * @package gutenberg
 */

/**
 * Removes the call to wp.date.setSettings() added by Core and adds our own call
 * to wp.date.setSettings().
 *
 * This lets us add a new l10n.dayOfWeek setting.
 *
 * To merge this into Core, simply update the wp.date.setSettings() call in
 * wp_default_packages_inline_scripts.
 *
 * @param WP_Scripts $scripts WP_Scripts object.
 */
function gutenberg_update_date_settings( $scripts ) {
	global $wp_locale;

	$inline_scripts = $scripts->get_data( 'wp-date', 'after' );
	if ( $inline_scripts ) {
		foreach ( $inline_scripts as $index => $inline_script ) {
			if ( str_starts_with( $inline_script, 'wp.date.setSettings' ) ) {
				unset( $scripts->registered['wp-date']->extra['after'][ $index ] );
			}
		}
	}

	// Calculate the timezone abbr (EDT, PST) if possible.
	$timezone_string = get_option( 'timezone_string', 'UTC' );
	$timezone_abbr   = '';

	if ( ! empty( $timezone_string ) ) {
		$timezone_date = new DateTime( 'now', new DateTimeZone( $timezone_string ) );
		$timezone_abbr = $timezone_date->format( 'T' );
	}

	$scripts->add_inline_script(
		'wp-date',
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
						),
						'startOfWeek'   => (int) get_option( 'start_of_week', 0 ),
					),
					'formats'  => array(
						/* translators: Time format, see https://www.php.net/manual/datetime.format.php */
						'time'                => get_option( 'time_format', __( 'g:i a', 'gutenberg' ) ),
						/* translators: Date format, see https://www.php.net/manual/datetime.format.php */
						'date'                => get_option( 'date_format', __( 'F j, Y', 'gutenberg' ) ),
						/* translators: Date/Time format, see https://www.php.net/manual/datetime.format.php */
						'datetime'            => __( 'F j, Y g:i a', 'gutenberg' ),
						/* translators: Abbreviated date/time format, see https://www.php.net/manual/datetime.format.php */
						'datetimeAbbreviated' => __( 'M j, Y g:i a', 'gutenberg' ),
					),
					'timezone' => array(
						'offset' => get_option( 'gmt_offset', 0 ),
						'string' => $timezone_string,
						'abbr'   => $timezone_abbr,
					),
				)
			)
		),
		'after'
	);
}
add_action( 'wp_default_scripts', 'gutenberg_update_date_settings' );
