<?php
/**
 * Server-side kses allowlist for note (block comment) content.
 *
 * The note form ships rich text — bold, italic, link, and code — via the
 * REST API. The default comment filter chain is wrong for notes in both
 * directions: `wp_filter_kses` strips the allowed tags for users without
 * `unfiltered_html`, while users with `unfiltered_html` are not filtered at
 * all and could store arbitrary HTML. This file installs a narrow,
 * note-specific kses allowlist on `pre_comment_content` for the duration of
 * any REST request that targets a note, so note content is held to exactly
 * the supported tags for every user, leaving non-note comments on their
 * existing filter chain.
 *
 * @package gutenberg
 * @since   7.1.0
 */

if ( ! function_exists( 'gutenberg_get_note_allowed_html' ) ) {
	/**
	 * Returns the allowlist of HTML tags and attributes permitted in note content.
	 *
	 * Kept intentionally small: bold, italic, links, and code. Link rels are
	 * normalised by `gutenberg_note_content_pre_filter()` so the allowlist does
	 * not need to enumerate every valid rel value. The `class` and
	 * `data-user-id` attributes on links carry `@` mentions, which are stored
	 * as `<a class="wp-note-mention" data-user-id="…">` so they can be styled
	 * and, in a follow-up, resolved to notification recipients.
	 *
	 * @return array Allowed tags structure compatible with wp_kses().
	 */
	function gutenberg_get_note_allowed_html() {
		return array(
			'strong' => array(),
			'em'     => array(),
			'a'      => array(
				'href'         => true,
				'target'       => true,
				'rel'          => true,
				'title'        => true,
				'class'        => true,
				'data-user-id' => true,
			),
			'code'   => array(),
		);
	}
}

if ( ! function_exists( 'gutenberg_note_content_pre_filter' ) ) {
	/**
	 * Sanitizes note content through wp_kses with the note allowlist.
	 *
	 * Replaces `wp_filter_kses` on `pre_comment_content` while a note is being
	 * saved. Applies to every user, including those with `unfiltered_html`, so
	 * note content is always limited to the small note allowlist. Forces
	 * `rel="noopener noreferrer nofollow"` on outbound links so a hostile
	 * client cannot use saved notes as a vector for SEO manipulation,
	 * referrer leakage, or window.opener-based attacks.
	 *
	 * @param string $content Slashed comment content.
	 * @return string Sanitized, re-slashed content.
	 */
	function gutenberg_note_content_pre_filter( $content ) {
		$unslashed = wp_unslash( $content );
		$filtered  = wp_kses( $unslashed, gutenberg_get_note_allowed_html() );

		// Normalize link rels via the HTML API.
		$processor = new WP_HTML_Tag_Processor( $filtered );
		while ( $processor->next_tag( 'A' ) ) {
			$processor->set_attribute( 'rel', 'noopener noreferrer nofollow' );
		}
		$filtered = $processor->get_updated_html();

		return wp_slash( $filtered );
	}
}

if ( ! function_exists( 'gutenberg_maybe_install_note_kses' ) ) {
	/**
	 * Installs the note-specific kses filter when a REST request targets a note.
	 *
	 * Triggers on POST/PUT/PATCH requests to /wp/v2/comments where either the
	 * incoming body specifies `type=note` (create) or the targeted comment is
	 * already a note (update). The filter is removed again on `rest_post_dispatch`
	 * so the swap is strictly scoped to the current request.
	 *
	 * @param mixed           $result  Response to short-circuit dispatch, or null.
	 * @param WP_REST_Server  $server  Server instance.
	 * @param WP_REST_Request $request The incoming REST request.
	 * @return mixed Untouched $result.
	 */
	function gutenberg_maybe_install_note_kses( $result, $server, $request ) {
		unset( $server );

		$route = $request->get_route();
		if ( ! str_starts_with( $route, '/wp/v2/comments' ) ) {
			return $result;
		}

		if ( ! in_array( $request->get_method(), array( 'POST', 'PUT', 'PATCH' ), true ) ) {
			return $result;
		}

		$is_note = ( 'note' === $request->get_param( 'type' ) );

		/*
		 * On update the request often omits `type`. Route params are not yet
		 * populated at `rest_pre_dispatch` (the route is matched during
		 * dispatch), so `get_url_params()` is empty here. Parse the comment ID
		 * straight from the route and look up the existing comment's type so
		 * the note allowlist is installed for updates as well as creates.
		 */
		if ( ! $is_note && preg_match( '#^/wp/v2/comments/(\d+)$#', $route, $matches ) ) {
			$existing = get_comment( (int) $matches[1] );
			if ( $existing && 'note' === $existing->comment_type ) {
				$is_note = true;
			}
		}

		if ( ! $is_note ) {
			return $result;
		}

		// Replace the standard comment kses filters with the note-specific one.
		remove_filter( 'pre_comment_content', 'wp_filter_kses' );
		remove_filter( 'pre_comment_content', 'wp_filter_post_kses' );
		add_filter( 'pre_comment_content', 'gutenberg_note_content_pre_filter' );

		add_filter( 'rest_post_dispatch', 'gutenberg_uninstall_note_kses', 10, 3 );

		return $result;
	}
	add_filter( 'rest_pre_dispatch', 'gutenberg_maybe_install_note_kses', 10, 3 );
}

if ( ! function_exists( 'gutenberg_uninstall_note_kses' ) ) {
	/**
	 * Restores the standard comment kses filters after a note REST dispatch.
	 *
	 * @param WP_REST_Response $response The outgoing response.
	 * @param WP_REST_Server   $server   Server instance.
	 * @param WP_REST_Request  $request  The dispatched request.
	 * @return WP_REST_Response Untouched response.
	 */
	function gutenberg_uninstall_note_kses( $response, $server, $request ) {
		unset( $server, $request );

		remove_filter( 'pre_comment_content', 'gutenberg_note_content_pre_filter' );

		if ( ! current_user_can( 'unfiltered_html' ) ) {
			add_filter( 'pre_comment_content', 'wp_filter_kses' );
		} else {
			add_filter( 'pre_comment_content', 'wp_filter_post_kses' );
		}

		remove_filter( 'rest_post_dispatch', 'gutenberg_uninstall_note_kses', 10 );

		return $response;
	}
}
