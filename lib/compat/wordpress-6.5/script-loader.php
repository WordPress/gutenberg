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
 * @since 6.4.0 Added relative time date strings.
 * @since 6.5.0 Added timezone offset value.
 *
 * @global WP_Locale $wp_locale WordPress date and time locale object.
 *
 * @param WP_Scripts $scripts WP_Scripts object.
 */
function gutenberg_update_wp_date_settings( $scripts ) {
	if ( did_action( 'init' ) && $scripts->query( 'wp-date', 'registered' ) ) {
		global $wp_locale;
		// Calculate the timezone abbr (EDT, PST) if possible.
		$timezone_string = get_option( 'timezone_string', 'UTC' );
		$timezone_abbr   = '';

		if ( ! empty( $timezone_string ) ) {
			$timezone_date = new DateTime( 'now', new DateTimeZone( $timezone_string ) );
			$timezone_abbr = $timezone_date->format( 'T' );
		}

		$gmt_offset = get_option( 'gmt_offset', 0 );

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
								/* translators: %d: Duration in seconds from or to a particular datetime, e.g., "4 seconds ago" or "4 seconds from now". */
								'ss'     => __( '%d seconds', 'gutenberg' ),
								/* translators: One minute from or to a particular datetime, e.g., "a minute ago" or "a minute from now". */
								'm'      => __( 'a minute', 'gutenberg' ),
								/* translators: %d: Duration in minutes from or to a particular datetime, e.g., "4 minutes ago" or "4 minutes from now". */
								'mm'     => __( '%d minutes', 'gutenberg' ),
								/* translators: One hour from or to a particular datetime, e.g., "an hour ago" or "an hour from now". */
								'h'      => __( 'an hour', 'gutenberg' ),
								/* translators: %d: Duration in hours from or to a particular datetime, e.g., "4 hours ago" or "4 hours from now". */
								'hh'     => __( '%d hours', 'gutenberg' ),
								/* translators: One day from or to a particular datetime, e.g., "a day ago" or "a day from now". */
								'd'      => __( 'a day', 'gutenberg' ),
								/* translators: %d: Duration in days from or to a particular datetime, e.g., "4 days ago" or "4 days from now". */
								'dd'     => __( '%d days', 'gutenberg' ),
								/* translators: One month from or to a particular datetime, e.g., "a month ago" or "a month from now". */
								'M'      => __( 'a month', 'gutenberg' ),
								/* translators: %d: Duration in months from or to a particular datetime, e.g., "4 months ago" or "4 months from now". */
								'MM'     => __( '%d months', 'gutenberg' ),
								/* translators: One year from or to a particular datetime, e.g., "a year ago" or "a year from now". */
								'y'      => __( 'a year', 'gutenberg' ),
								/* translators: %d: Duration in years from or to a particular datetime, e.g., "4 years ago" or "4 years from now". */
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
							'offset'          => (float) $gmt_offset,
							'offsetFormatted' => str_replace( array( '.25', '.5', '.75' ), array( ':15', ':30', ':45' ), (string) $gmt_offset ),
							'string'          => $timezone_string,
							'abbr'            => $timezone_abbr,
						),
					)
				)
			),
		);
	}
}

add_action( 'wp_default_scripts', 'gutenberg_update_wp_date_settings' );

/**
 * Prints inline JavaScript wrapped in `<script>` tag.
 *
 * It is possible to inject attributes in the `<script>` tag via the  {@see 'wp_script_attributes'}  filter.
 * Automatically injects type attribute if needed.
 *
 * @since 5.7.0
 *
 * @param string $javascript Inline JavaScript code.
 * @param array  $attributes Optional. Key-value pairs representing `<script>` tag attributes.
 */
function gutenberg_print_inline_script_tag( $javascript, $attributes = array() ) {
	echo gutenberg_get_inline_script_tag( $javascript, $attributes );
}


/**
 * Wraps inline JavaScript in `<script>` tag.
 *
 * It is possible to inject attributes in the `<script>` tag via the  {@see 'wp_script_attributes'}  filter.
 * Automatically injects type attribute if needed.
 *
 * @since 5.7.0
 *
 * @param string $javascript Inline JavaScript code.
 * @param array  $attributes Optional. Key-value pairs representing `<script>` tag attributes.
 * @return string String containing inline JavaScript code wrapped around `<script>` tag.
 */
function gutenberg_get_inline_script_tag( $data, $attributes = array() ) {
	$is_html5 = current_theme_supports( 'html5', 'script' ) || is_admin();
	if ( ! isset( $attributes['type'] ) && ! $is_html5 ) {
		// Keep the type attribute as the first for legacy reasons (it has always been this way in core).
		$attributes = array_merge(
			array( 'type' => 'text/javascript' ),
			$attributes
		);
	}

	/*
	 * XHTML extracts the contents of the SCRIPT element and then the XML parser
	 * decodes character references and other syntax elements. This can lead to
	 * misinterpretation of the script contents or invalid XHTML documents.
	 *
	 * Wrapping the contents in a CDATA section instructs the XML parser not to
	 * transform the contents of the SCRIPT element before passing them to the
	 * JavaScript engine.
	 *
	 * Example:
	 *
	 *     <script>console.log('&hellip;');</script>
	 *
	 *     In an HTML document this would print "&hellip;" to the console,
	 *     but in an XHTML document it would print "…" to the console.
	 *
	 *     <script>console.log('An image is <img> in HTML');</script>
	 *
	 *     In an HTML document this would print "An image is <img> in HTML",
	 *     but it's an invalid XHTML document because it interprets the `<img>`
	 *     as an empty tag missing its closing `/`.
	 *
	 * @see https://www.w3.org/TR/xhtml1/#h-4.8
	 */
	if (
		! $is_html5 &&
		(
			! isset( $attributes['type'] ) ||
			'module' === $attributes['type'] ||
			str_contains( $attributes['type'], 'javascript' ) ||
			str_contains( $attributes['type'], 'ecmascript' ) ||
			str_contains( $attributes['type'], 'jscript' ) ||
			str_contains( $attributes['type'], 'livescript' )
		)
	) {
		/*
		 * If the string `]]>` exists within the JavaScript it would break
		 * out of any wrapping CDATA section added here, so to start, it's
		 * necessary to escape that sequence which requires splitting the
		 * content into two CDATA sections wherever it's found.
		 *
		 * Note: it's only necessary to escape the closing `]]>` because
		 * an additional `<![CDATA[` leaves the contents unchanged.
		 */
		$data = str_replace( ']]>', ']]]]><![CDATA[>', $data );

		// Wrap the entire escaped script inside a CDATA section.
		$data = sprintf( "/* <![CDATA[ */\n%s\n/* ]]> */", $data );
	}

	$data = "\n" . trim( $data, "\n\r " ) . "\n";

	/**
	 * Filters attributes to be added to a script tag.
	 *
	 * @since 5.7.0
	 *
	 * @param array  $attributes Key-value pairs representing `<script>` tag attributes.
	 *                           Only the attribute name is added to the `<script>` tag for
	 *                           entries with a boolean value, and that are true.
	 * @param string $data       Inline data.
	 */
	$attributes = apply_filters( 'wp_inline_script_attributes', $attributes, $data );

	return sprintf( "<script%s>%s</script>\n", wp_sanitize_script_attributes( $attributes ), $data );
}
