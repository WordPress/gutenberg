<?php
/**
 * PHP and WordPress configuration compatibility functions for the Gutenberg
 * editor plugin changes related to i18n.
 *
 * @package gutenberg
 */

/**
 * Override core's wp_get_word_count_type() introduced in WordPress 6.2.
 * Originally, get_word_count_type() method of the WP_Locale class is executed,
 * but the process is simulated here.
 *
 * This function should not be backported to core.
 */
if ( ! function_exists( 'wp_get_word_count_type' ) ) {
	/**
	 * Retrieves the word count type based on the locale.
	 *
	 * @return string Locale-specific word count type.
	 */
	function wp_get_word_count_type() {
		$word_count_type = _x( 'words', 'Word count type. Do not translate!', 'gutenberg' );

		// Check for valid types.
		if ( 'characters_excluding_spaces' !== $word_count_type && 'characters_including_spaces' !== $word_count_type ) {
			// Defaults to 'words'.
			$word_count_type = 'words';
		}
		return $word_count_type;
	}
}
