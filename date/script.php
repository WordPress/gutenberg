<?php
/**
 * Registers the wp-date script
 *
 * @package gutenberg
 */

wp_register_script(
	'wp-date',
	gutenberg_url( 'date/build/index.js' ),
	array( 'moment' ),
	filemtime( gutenberg_dir_path() . 'date/build/index.js' )
);
global $wp_locale;
wp_add_inline_script( 'wp-date', 'window._wpDateSettings = ' . wp_json_encode( array(
	'l10n'     => array(
		'locale'        => get_locale(),
		'months'        => array_values( $wp_locale->month ),
		'monthsShort'   => array_values( $wp_locale->month_abbrev ),
		'weekdays'      => array_values( $wp_locale->weekday ),
		'weekdaysShort' => array_values( $wp_locale->weekday_abbrev ),
		'meridiem'      => (object) $wp_locale->meridiem,
		'relative'      => array(
			/* translators: %s: duration */
			'future' => __( '%s from now', 'default' ),
			/* translators: %s: duration */
			'past'   => __( '%s ago', 'default' ),
		),
	),
	'formats'  => array(
		'time'     => get_option( 'time_format', __( 'g:i a', 'default' ) ),
		'date'     => get_option( 'date_format', __( 'F j, Y', 'default' ) ),
		'datetime' => __( 'F j, Y g:i a', 'default' ),
	),
	'timezone' => array(
		'offset' => get_option( 'gmt_offset', 0 ),
		'string' => get_option( 'timezone_string', 'UTC' ),
	),
) ), 'before' );
