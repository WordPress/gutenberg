<?php
/**
 * Inline suggestion support for suggest mode.
 *
 * Inline suggestions are anchored in raw block content as
 * `<mark class="wp-suggestion" data-suggestion-id="N" data-suggestion-type="del|add" data-author="A">…</mark>`
 * so a suggestion survives edits elsewhere in the block (offsets are derived
 * from the marker on read, never stored). This mirrors inline notes
 * (`lib/compat/wordpress-7.1/block-comments.php`) but the render-time strip is
 * type-aware.
 */

/**
 * Strip inline suggestion markers from rendered block output.
 *
 * The public HTML must never expose suggestion metadata, and an un-accepted
 * addition must never reach the front end. `render_block` therefore strips the
 * markers, type-aware:
 *
 * - `del` (suggested deletion): the marked text already exists, so the wrapper
 *   is unwrapped but the text is kept. It is only removed when the suggestion
 *   is accepted in the editor.
 * - `add` (suggested addition): the marked text is proposed new content, so the
 *   wrapper *and* the text are removed. It only becomes permanent when accepted.
 *
 * The raw `post_content` (and the REST `raw` view, revisions, exports) keeps the
 * markers so the editor can re-attach on reload. Only `wp-suggestion` markers
 * are touched: `WP_HTML_Tag_Processor::has_class()` matches the class by exact
 * token, so an unrelated `<mark>` (a `core/text-color` highlight, a `wp-note`,
 * or a `wp-suggestion-foo` class) survives byte-for-byte.
 *
 * The HTML API cannot yet remove a tag together with its closer, so a second
 * offset-based pass pairs each flagged `<mark>` with its matching `</mark>` -
 * tracking nesting so overlapping markers still pair correctly - and removes
 * the wrappers (and, for additions, the text between them). Overlapping byte
 * ranges are merged before removal so a deletion nested inside an addition (the
 * whole of which is already removed) cannot corrupt offsets. Tag
 * removal/unwrapping is on the HTML API roadmap
 * (https://github.com/WordPress/gutenberg/discussions/54583); once it lands this
 * offset pass can be replaced with a single `WP_HTML_Tag_Processor` call.
 *
 * @param string $block_content Rendered block HTML.
 * @return string Block HTML with wp-suggestion markers stripped (type-aware).
 */
function gutenberg_strip_inline_suggestion_markers( $block_content ) {
	if ( false === strpos( $block_content, 'wp-suggestion' ) ) {
		return $block_content;
	}

	// Flag the suggestion markers with a sentinel attribute carrying the strip
	// mode so the offset pass below can classify them without re-parsing.
	$processor = new WP_HTML_Tag_Processor( $block_content );
	$found     = false;
	while ( $processor->next_tag( 'MARK' ) ) {
		if ( ! $processor->has_class( 'wp-suggestion' ) ) {
			continue;
		}
		// An unknown or missing type defaults to deletion (unwrap, keep text)
		// so a malformed marker never silently drops content.
		$mode = ( 'add' === $processor->get_attribute( 'data-suggestion-type' ) )
			? 'add'
			: 'del';
		$processor->set_attribute( 'data-wp-suggestion-strip', $mode );
		$found = true;
	}

	if ( ! $found ) {
		return $block_content;
	}

	$block_content = $processor->get_updated_html();

	if ( ! preg_match_all( '~</?mark\b[^>]*>~i', $block_content, $tags, PREG_OFFSET_CAPTURE ) ) {
		return $block_content;
	}

	// Pair each flagged opener with its matching closer via a nesting stack.
	// Collect half-open byte ranges to remove: for a deletion the opener and
	// closer tags only (text kept); for an addition the whole span.
	$open_stack = array();
	$removals   = array();
	foreach ( $tags[0] as $tag ) {
		$html   = $tag[0];
		$offset = $tag[1];
		$length = strlen( $html );

		if ( '/' === $html[1] ) {
			$open = array_pop( $open_stack );
			if ( null === $open || 'none' === $open['mode'] ) {
				continue;
			}
			if ( 'add' === $open['mode'] ) {
				$removals[] = array( $open['start'], $offset + $length );
			} else {
				$removals[] = array( $open['start'], $open['end'] );
				$removals[] = array( $offset, $offset + $length );
			}
			continue;
		}

		$mode = 'none';
		if ( false !== strpos( $html, 'data-wp-suggestion-strip="add"' ) ) {
			$mode = 'add';
		} elseif ( false !== strpos( $html, 'data-wp-suggestion-strip="del"' ) ) {
			$mode = 'del';
		}
		$open_stack[] = array(
			'start' => $offset,
			'end'   => $offset + $length,
			'mode'  => $mode,
		);
	}

	if ( empty( $removals ) ) {
		return $block_content;
	}

	// Merge overlapping/adjacent ranges so a deletion nested inside an addition
	// (already wholly removed) doesn't double-remove and corrupt offsets.
	sort( $removals );
	$merged = array();
	foreach ( $removals as $range ) {
		$last = count( $merged ) - 1;
		if ( $last >= 0 && $range[0] <= $merged[ $last ][1] ) {
			if ( $range[1] > $merged[ $last ][1] ) {
				$merged[ $last ][1] = $range[1];
			}
		} else {
			$merged[] = $range;
		}
	}

	// Remove from the end so earlier offsets remain valid.
	for ( $i = count( $merged ) - 1; $i >= 0; $i-- ) {
		$block_content = substr_replace( $block_content, '', $merged[ $i ][0], $merged[ $i ][1] - $merged[ $i ][0] );
	}

	return $block_content;
}
add_filter( 'render_block', 'gutenberg_strip_inline_suggestion_markers' );
