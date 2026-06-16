<?php
/**
 * Inline (partial-text) note support for block comments.
 *
 * Block comments (notes) shipped in WordPress 6.9; see
 * `lib/compat/wordpress-6.9/block-comments.php`. Inline notes - notes anchored
 * to a text selection within a block rather than the whole block - are a 7.1
 * addition and live here.
 */

/**
 * Register comment metadata for an inline note's text selection anchor.
 *
 * Stored as a fallback anchor for when the in-content `core/note` marker can't
 * be found (e.g. legacy content, or before a CRDT migration writes its own
 * range).
 */
function gutenberg_register_inline_note_metadata() {
	register_meta(
		'comment',
		'_wp_note_selection',
		array(
			'type'          => 'object',
			'description'   => __( 'Inline note text selection anchor', 'gutenberg' ),
			'single'        => true,
			'show_in_rest'  => array(
				'schema' => array(
					'type'                 => 'object',
					'required'             => array( 'attributeKey', 'start', 'end' ),
					'properties'           => array(
						'attributeKey' => array(
							'type'      => 'string',
							'minLength' => 1,
						),
						'start'        => array(
							'type'    => 'integer',
							'minimum' => 0,
						),
						'end'          => array(
							'type'    => 'integer',
							'minimum' => 0,
						),
					),
					'additionalProperties' => false,
				),
			),
			'auth_callback' => function ( $allowed, $meta_key, $object_id ) {
				return current_user_can( 'edit_comment', $object_id );
			},
		)
	);
}
add_action( 'init', 'gutenberg_register_inline_note_metadata' );

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
 * The HTML API cannot yet remove a tag together with its closer, so a second
 * offset-based pass pairs each flagged `<mark>` with its matching `</mark>` -
 * tracking `<mark>` nesting so overlapping notes and any user highlight `<mark>`
 * left intact still pair correctly - and removes only the note wrappers. Tag
 * removal/unwrapping is on the HTML API roadmap
 * (https://github.com/WordPress/gutenberg/discussions/54583); once it lands this
 * offset pass can be replaced with a single `WP_HTML_Tag_Processor` call.
 *
 * @param string $block_content Rendered block HTML.
 * @return string Block HTML with wp-note markers unwrapped.
 */
function gutenberg_strip_inline_note_markers( $block_content ) {
	if ( false === strpos( $block_content, 'wp-note' ) ) {
		return $block_content;
	}

	// Flag the note markers with a sentinel attribute so the offset pass below
	// can identify them without re-parsing classes from raw strings.
	$processor = new WP_HTML_Tag_Processor( $block_content );
	$found     = false;
	while ( $processor->next_tag( 'MARK' ) ) {
		if ( ! $processor->has_class( 'wp-note' ) ) {
			continue;
		}
		$processor->set_attribute( 'data-wp-note-strip', '' );
		$found = true;
	}

	if ( ! $found ) {
		return $block_content;
	}

	$block_content = $processor->get_updated_html();

	if ( ! preg_match_all( '~</?mark\b[^>]*>~i', $block_content, $tags, PREG_OFFSET_CAPTURE ) ) {
		return $block_content;
	}

	// Pair each flagged opener with its matching closer via a nesting stack,
	// then collect both byte ranges for removal.
	$open_stack = array();
	$removals   = array();
	foreach ( $tags[0] as $tag ) {
		$html   = $tag[0];
		$offset = $tag[1];

		if ( '/' === $html[1] ) {
			$open = array_pop( $open_stack );
			if ( null !== $open && $open['is_note'] ) {
				$removals[] = array( $offset, strlen( $html ) );
				$removals[] = $open['range'];
			}
			continue;
		}

		$open_stack[] = array(
			'range'   => array( $offset, strlen( $html ) ),
			'is_note' => false !== strpos( $html, 'data-wp-note-strip' ),
		);
	}

	if ( empty( $removals ) ) {
		return $block_content;
	}

	// Remove from the end so earlier offsets remain valid.
	usort(
		$removals,
		static function ( $a, $b ) {
			return $b[0] - $a[0];
		}
	);
	foreach ( $removals as $range ) {
		$block_content = substr_replace( $block_content, '', $range[0], $range[1] );
	}

	return $block_content;
}
add_filter( 'render_block', 'gutenberg_strip_inline_note_markers' );
