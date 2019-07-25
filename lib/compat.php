<?php
/**
 * Temporary compatibility shims for features present in Gutenberg, pending
 * upstream commit to the WordPress core source repository. Functions here
 * exist only as long as necessary for corresponding WordPress support, and
 * each should be associated with a Trac ticket.
 *
 * @package gutenberg
 */

/**
 * Filters allowed CSS attributes to include `flex-basis`, included in saved
 * markup of the Column block.
 *
 * This can be removed when plugin support requires WordPress 5.3.0+.
 *
 * @see https://core.trac.wordpress.org/ticket/47281
 * @see https://core.trac.wordpress.org/changeset/45363
 *
 * @since 5.7.0
 *
 * @param string[] $attr Array of allowed CSS attributes.
 *
 * @return string[] Filtered array of allowed CSS attributes.
 */
function gutenberg_safe_style_css_column_flex_basis( $attr ) {
	$attr[] = 'flex-basis';

	return $attr;
}
add_filter( 'safe_style_css', 'gutenberg_safe_style_css_column_flex_basis' );

/**
 * Filters inserted post data to update an existing post's status to draft if
 * currently an auto-draft. This is intended to ensure that a post which is
 * explicitly updated should no longer be subjected to auto-draft purge.
 *
 * @param array $data    An array of slashed post data.
 * @param array $postarr An array of sanitized, but otherwise unmodified post
 *                       data.
 *
 * @return array Filtered post data.
 */
function gutenberg_update_post_autodraft_to_draft( $data, $postarr ) {
	if ( ! empty( $postarr['ID'] ) && $postarr['post_status'] === 'auto-draft' ) {
		$data['post_status'] = 'draft';
	}

	return $data;
}
add_filter( 'wp_insert_post_data', 'gutenberg_update_post_autodraft_to_draft', 10, 2 );

/**
 * Filters auto-draft post creation to unset any assigned post title. The status
 * of an auto-draft should be ready from its `post_status` and not inferred via
 * title. A post with an explicit title should be created as 'draft' status, not
 * as 'auto-draft'.
 *
 * @param array $data    An array of slashed post data.
 * @param array $postarr An array of sanitized, but otherwise unmodified post
 *                       data.
 *
 * @return array Filtered post data.
 */
function gutenberg_set_empty_auto_draft_title( $data ) {
	if ( $data['post_status'] === 'auto-draft' ) {
		$data['post_title'] = '';
	}

	return $data;
}
add_filter( 'wp_insert_post_data', 'gutenberg_set_empty_auto_draft_title' );
