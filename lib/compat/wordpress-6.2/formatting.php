<?php
/**
 * New WordPress Formatting API.
 *
 * @package gutenberg
 */

/**
 * Count some words.
 *
 * @since 6.2.0
 *
 * @param string $text The text being processed.
 * @param string $type The type of count. Accepts 'words', 'characters_excluding_spaces', or 'characters_including_spaces'.
 * @return number The word or character count.
 */
function gutenberg_word_count( $text ) {
	// TODO: The logic of the @wordpress/wordcount package needs to be fully implemented here.
	return 500;
}
