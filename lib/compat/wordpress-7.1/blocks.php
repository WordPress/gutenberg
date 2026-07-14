<?php
/**
 * Compatibility shims for blocks for WordPress 7.1.
 *
 * @package gutenberg
 */

if ( ! function_exists( '_wp_apply_content_filters' ) ) {
	/**
	 * Applies standard content filters similar to 'the_content' filter.
	 *
	 * This function runs the typical content processing filters that WordPress
	 * applies to post content, useful for blocks that render nested content.
	 *
	 * The filters applied in order are:
	 * - shortcode_unautop()
	 * - do_shortcode()
	 * - do_blocks()
	 * - wptexturize()
	 * - convert_smilies()
	 * - wp_filter_content_tags()
	 * - $wp_embed->autoembed()
	 *
	 * Optionally supports recursion prevention by accepting a seen IDs array
	 * and an ID. When provided, the ID is added to the array before do_blocks()
	 * and removed after, preventing infinite loops when content references itself.
	 *
	 * @access private
	 *
	 * @global WP_Embed $wp_embed
	 *
	 * @param string      $content  The content to process.
	 * @param string      $context  Optional. Context identifier for wp_filter_content_tags. Default empty string.
	 * @param array|null  $seen_ids Optional. Reference to array tracking seen IDs for recursion prevention. Default null.
	 * @param string|null $id       Optional. Unique identifier for this content, used with $seen_ids. Default null.
	 * @return string The processed content.
	 */
	function _wp_apply_content_filters( $content, $context = '', &$seen_ids = null, $id = null ) {
		$content = shortcode_unautop( $content );
		$content = do_shortcode( $content );

		if ( null !== $seen_ids && null !== $id ) {
			$seen_ids[ $id ] = true;
		}

		$content = do_blocks( $content );

		if ( null !== $seen_ids && null !== $id ) {
			unset( $seen_ids[ $id ] );
		}

		$content = wptexturize( $content );
		$content = convert_smilies( $content );
		$content = wp_filter_content_tags( $content, $context );

		global $wp_embed;
		$content = $wp_embed->autoembed( $content );

		return $content;
	}
}
