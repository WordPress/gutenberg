<?php
/**
 * Inline (partial-text) note support for block comments.
 *
 * Block comments (notes) shipped in WordPress 6.9; see
 * `lib/compat/wordpress-6.9/block-comments.php`. Inline notes - notes anchored
 * to a text selection within a block rather than the whole block - are a 7.1
 * addition and live here.
 *
 * An inline note's anchor is the in-content `<mark class="wp-note" data-id="N">`
 * marker alone: the `data-id` identifies the note and the marker's position
 * follows edits, so no separate selection metadata is stored. The marker is
 * kept in the raw `post_content` (and REST `raw` view) and only stripped from
 * rendered front-end output by the filter below.
 */

/**
 * Strip inline note markers from rendered block output.
 *
 * Inline notes are anchored in raw block content with
 * `<mark class="wp-note" data-id="N">…</mark>` so the marker survives edits,
 * but the public HTML should not expose note metadata. `render_block` unwraps
 * the marker entirely - dropping the `<mark>` open tag and its matching closer
 * while keeping the marked text - so nothing leaks to the front end. The raw
 * `post_content` (and the REST `raw` view, revisions, exports) keeps the marker
 * so the editor can re-attach on reload.
 *
 * Only note markers are unwrapped: `WP_HTML_Tag_Processor::has_class()` matches
 * the `wp-note` class by exact token, so a `<mark>` a user or plugin added
 * (e.g. a `core/text-color` highlight, or an unrelated `wp-note-foo` class) is
 * never flagged and survives byte-for-byte with all of its attributes intact.
 * A naive regex would be wrong here: a `\bwp-note\b` word boundary also matches
 * `wp-note-foo`, which is why the class check goes through the HTML API instead.
 *
 * The HTML API has no public token-removal method yet (it is on the roadmap:
 * https://github.com/WordPress/gutenberg/discussions/54583), so an anonymous
 * `WP_HTML_Tag_Processor` subclass unwraps each note `<mark>` and its matching
 * closer directly on the parsed token stream. Walking tokens - rather than
 * matching `<mark>` with a regex - means `</mark>`-looking text inside a comment
 * or attribute value can never be mistaken for a real tag, and a nesting stack
 * keeps each note opener paired with its own closer so overlapping notes and any
 * user highlight `<mark>` left intact still resolve correctly.
 *
 * @param string $block_content Rendered block HTML.
 * @return string Block HTML with wp-note markers unwrapped.
 */
function gutenberg_strip_inline_note_markers( $block_content ) {
	if ( ! str_contains( $block_content, 'wp-note' ) ) {
		return $block_content;
	}

	// Anonymous subclass exposing token removal, which WP_HTML_Tag_Processor
	// does not provide publicly yet. Removing the current token via its bookmark
	// span unwraps the `<mark>` (opener or closer) while keeping the text it
	// wraps. The redeclaration-guard sniff cannot tell these class methods from
	// global functions, so it is disabled for the class body.
	// phpcs:disable Gutenberg.CodeAnalysis.GuardedFunctionAndClassNames.FunctionNotGuardedAgainstRedeclaration
	$processor = new class( $block_content ) extends WP_HTML_Tag_Processor {
		/**
		 * Removes the current token, keeping any text it wraps.
		 */
		public function remove_token(): void {
			// Always called after next_tag() returned true, so the bookmark is set.
			$this->set_bookmark( 'here' );
			$span = $this->bookmarks['here'];

			$this->lexical_updates[] = new WP_HTML_Text_Replacement( $span->start, $span->length, '' );
		}
	};
	// phpcs:enable Gutenberg.CodeAnalysis.GuardedFunctionAndClassNames.FunctionNotGuardedAgainstRedeclaration

	// Walk every `<mark>`, tracking note nesting on a stack so each note opener
	// pairs with its own closer, and unwrap only the note markers.
	$mark_stack = array();
	$query      = array(
		'tag_name'    => 'MARK',
		'tag_closers' => 'visit',
	);
	while ( $processor->next_tag( $query ) ) {
		if ( $processor->is_tag_closer() ) {
			$is_note = array_pop( $mark_stack );
		} else {
			$is_note      = $processor->has_class( 'wp-note' );
			$mark_stack[] = $is_note;
		}

		if ( true === $is_note ) {
			$processor->remove_token();
		}
	}

	return $processor->get_updated_html();
}
add_filter( 'render_block', 'gutenberg_strip_inline_note_markers' );

/**
 * Allows the note mention attribute on links in comment content.
 *
 * The notes `@` mention completer stores a mention as a link to the mentioned
 * user's author page carrying the user's ID in a data attribute:
 * `<a data-wp-note-mention-user="N" href="…">@Name</a>`. The default comment
 * kses allowlist (`$allowedtags` in `wp-includes/kses.php`) includes `a` but
 * only its `href` and `title` attributes, so for users without
 * `unfiltered_html` the mention attribute would be stripped on save. Data
 * attributes are only allowed by default in the `post` kses context, not the
 * `pre_comment_content` context notes are sanitized in, so a narrow allowance
 * is still required.
 *
 * Unlike the previous `class` allowance, `data-wp-note-mention-user` is a
 * single purpose-specific attribute that is not a CSS or JavaScript selector
 * hook outside the notes sidebar, so it is safe to allow globally in
 * `pre_comment_content` rather than arming it per note write. Only that exact
 * attribute is added, matched by name in `wp_kses_attr_check()`, so no
 * `data-*` wildcard is opened up. Regular (including anonymous) commenters can
 * now persist this one inert attribute on links; notification parsing (see
 * Gutenberg PR #79606 and its Core equivalent) only processes `note`-type
 * comments, so the attribute is meaningless anywhere else.
 *
 * @param array|string $allowed The allowed tags structure for the context.
 * @param string       $context The kses context.
 * @return array|string Modified allowed tags structure.
 */
function gutenberg_notes_allow_mention_attributes( $allowed, $context ) {
	if ( 'pre_comment_content' !== $context || ! is_array( $allowed ) ) {
		return $allowed;
	}

	if ( ! isset( $allowed['a'] ) || ! is_array( $allowed['a'] ) ) {
		$allowed['a'] = array();
	}

	$allowed['a']['data-wp-note-mention-user'] = true;

	return $allowed;
}

/*
 * When WordPress core ships an equivalent allowance (WordPress 7.1+), defer to
 * it.
 */
if ( ! function_exists( '_wp_kses_allow_note_mention_attributes' ) ) {
	add_filter( 'wp_kses_allowed_html', 'gutenberg_notes_allow_mention_attributes', 10, 2 );
}
