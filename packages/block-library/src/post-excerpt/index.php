<?php
/**
 * Server-side rendering of the `core/post-excerpt` block.
 *
 * @package WordPress
 */

/**
 * Collects rendered paragraph HTML from a parsed block tree, up to a word limit.
 *
 * Only `core/paragraph` blocks are rendered, preserving their `<p>` tags.
 * Layout container blocks (Group, Columns, Column, Cover, Media & Text) are
 * recursed into so paragraphs nested inside them are still found.
 * All other blocks (lists, headings, tables, images, embeds, etc.) are skipped,
 * matching the default excerpt which discards non-prose formatting.
 *
 * @since 7.0.2
 *
 * @see excerpt_remove_blocks()
 *
 * @param array $blocks     Parsed block array from parse_blocks().
 * @param int   $max_words  Maximum number of words to include.
 * @param int   $word_count Running word count, passed by reference.
 * @return string Rendered HTML containing one or more `<p>` tags, safely truncated.
 */
function block_core_post_excerpt_render_paragraphs( $blocks, $max_words, &$word_count ) {
	$output = '';

	/*
	 * Use the same wrapper-block allowlist that WordPress core uses in
	 * excerpt_remove_blocks() (wp-includes/blocks.php). Recursing into only
	 * these blocks ensures our preserve-formatting path is consistent with
	 * what core considers "excerpt-worthy" container blocks, and the same
	 * `excerpt_allowed_wrapper_blocks` filter is applied so any site-level
	 * customisation is automatically inherited here too.
	 */
	$allowed_wrapper_blocks = array(
		'core/columns',
		'core/column',
		'core/group',
	);

	/** This filter is documented in wp-includes/blocks.php */
	$allowed_wrapper_blocks = apply_filters( 'excerpt_allowed_wrapper_blocks', $allowed_wrapper_blocks );

	foreach ( $blocks as $block ) {
		if ( $word_count >= $max_words ) {
			break;
		}

		// Recurse into wrapper blocks whose inner content counts toward excerpts.
		if ( in_array( $block['blockName'], $allowed_wrapper_blocks, true ) && ! empty( $block['innerBlocks'] ) ) {
			$output .= block_core_post_excerpt_render_paragraphs( $block['innerBlocks'], $max_words, $word_count );
			continue;
		}

		// Only render core/paragraph blocks — everything else is skipped.
		if ( 'core/paragraph' !== $block['blockName'] ) {
			continue;
		}

		$block_html       = render_block( $block );
		$block_text       = wp_strip_all_tags( $block_html );
		$words            = preg_split( '/\s+/u', trim( $block_text ), -1, PREG_SPLIT_NO_EMPTY );
		$block_word_count = count( $words );

		if ( 0 === $block_word_count ) {
			continue;
		}

		if ( $word_count + $block_word_count <= $max_words ) {
			// Entire paragraph fits within the word limit — render it as-is.
			$output     .= $block_html;
			$word_count += $block_word_count;
		} else {
			// Paragraph exceeds the remaining budget — trim and append ellipsis.
			$remaining     = $max_words - $word_count;
			$trimmed_words = array_slice( $words, 0, $remaining );
			$output       .= '<p>' . esc_html( implode( ' ', $trimmed_words ) ) . '&hellip;</p>';
			$word_count    = $max_words;
		}
	}

	return $output;
}

/**
 * Renders the `core/post-excerpt` block on the server.
 *
 * @since 5.8.0
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 * @return string Returns the filtered post excerpt for the current post wrapped inside "p" tags.
 */
function render_block_core_post_excerpt( $attributes, $content, $block ) {
	if ( ! isset( $block->context['postId'] ) ) {
		return '';
	}

	/*
	 * Preserve Formatting path: when the toggle is on, bypass get_the_excerpt()
	 * and render individual paragraph blocks so that paragraph breaks are kept.
	 * Falls back to the standard flat-text path when:
	 *   - the toggle is off (default),
	 *   - the post has a manually written excerpt, or
	 *   - no paragraph blocks are found in the content.
	 */
	if ( ! empty( $attributes['preserveFormatting'] ) ) {
		$post_id        = (int) $block->context['postId'];
		$manual_excerpt = get_post_field( 'post_excerpt', $post_id );

		if ( empty( trim( (string) $manual_excerpt ) ) ) {
			$post_content  = get_post_field( 'post_content', $post_id, 'raw' );
			$parsed_blocks = parse_blocks( (string) $post_content );
			$word_count    = 0;
			$max_words     = isset( $attributes['excerptLength'] ) ? (int) $attributes['excerptLength'] : 55;

			$excerpt_html = block_core_post_excerpt_render_paragraphs( $parsed_blocks, $max_words, $word_count );

			if ( ! empty( $excerpt_html ) ) {
				$more_text = ! empty( $attributes['moreText'] )
					? '<a class="wp-block-post-excerpt__more-link" href="' . esc_url( get_the_permalink( $post_id ) ) . '">' . wp_kses_post( $attributes['moreText'] ) . '</a>'
					: '';

				$show_more_on_new_line = ! isset( $attributes['showMoreOnNewLine'] ) || $attributes['showMoreOnNewLine'];

				$classes = array();
				if ( isset( $attributes['textAlign'] ) ) {
					$classes[] = 'has-text-align-' . $attributes['textAlign'];
				}
				if ( isset( $attributes['style']['elements']['link']['color']['text'] ) ) {
					$classes[] = 'has-link-color';
				}
				$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => implode( ' ', $classes ) ) );

				/*
				 * Use a <div> wrapper (not <p>) for the excerpt container so that the
				 * rendered paragraph <p> tags inside are never nested within another <p>,
				 * which would produce invalid HTML.
				 */
				$inner = '<div class="wp-block-post-excerpt__excerpt">' . $excerpt_html . '</div>';
				if ( ! empty( $more_text ) ) {
					$inner .= $show_more_on_new_line
						? '<p class="wp-block-post-excerpt__more-text">' . $more_text . '</p>'
						: $more_text;
				}

				return sprintf( '<div %s>%s</div>', $wrapper_attributes, $inner );
			}
		}
		// Falls through to the default path below.
	}

	$more_text           = ! empty( $attributes['moreText'] ) ? '<a class="wp-block-post-excerpt__more-link" href="' . esc_url( get_the_permalink( $block->context['postId'] ) ) . '">' . wp_kses_post( $attributes['moreText'] ) . '</a>' : '';
	$filter_excerpt_more = static function ( $more ) use ( $more_text ) {
		return empty( $more_text ) ? $more : '';
	};
	/**
	 * Some themes might use `excerpt_more` filter to handle the
	 * `more` link displayed after a trimmed excerpt. Since the
	 * block has a `more text` attribute we have to check and
	 * override if needed the return value from this filter.
	 * So if the block's attribute is not empty override the
	 * `excerpt_more` filter and return nothing. This will
	 * result in showing only one `read more` link at a time.
	 *
	 * This hook needs to be applied before the excerpt is retrieved with get_the_excerpt.
	 * Otherwise, the read more link filter from the theme is not removed.
	 */
	add_filter( 'excerpt_more', $filter_excerpt_more );

	/*
	 * The purpose of the excerpt length setting is to limit the length of both
	 * automatically generated and user-created excerpts.
	 * Because the excerpt_length filter only applies to auto generated excerpts,
	 * wp_trim_words is used instead.
	 *
	 * To ensure the block's excerptLength setting works correctly for auto-generated
	 * excerpts, we temporarily override excerpt_length to 101 (the max block setting)
	 * so that wp_trim_excerpt doesn't pre-trim the content before wp_trim_words can
	 * apply the user's desired length.
	 */
	$excerpt_length = $attributes['excerptLength'];
	add_filter( 'excerpt_length', 'block_core_post_excerpt_excerpt_length', PHP_INT_MAX );

	$excerpt = get_the_excerpt( $block->context['postId'] );

	remove_filter( 'excerpt_length', 'block_core_post_excerpt_excerpt_length', PHP_INT_MAX );

	if ( isset( $excerpt_length ) ) {
		$excerpt = wp_trim_words( $excerpt, $excerpt_length );
	}

	$classes = array();
	if ( isset( $attributes['textAlign'] ) ) {
		$classes[] = 'has-text-align-' . $attributes['textAlign'];
	}
	if ( isset( $attributes['style']['elements']['link']['color']['text'] ) ) {
		$classes[] = 'has-link-color';
	}
	$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => implode( ' ', $classes ) ) );

	$content               = '<p class="wp-block-post-excerpt__excerpt">' . $excerpt;
	$show_more_on_new_line = ! isset( $attributes['showMoreOnNewLine'] ) || $attributes['showMoreOnNewLine'];
	if ( $show_more_on_new_line && ! empty( $more_text ) ) {
		$content .= '</p><p class="wp-block-post-excerpt__more-text">' . $more_text . '</p>';
	} elseif ( empty( $more_text ) ) {
		$content .= '</p>';
	} else {
		$separator = '' === $excerpt ? '' : ' ';
		$content  .= $separator . $more_text . '</p>';
	}
	remove_filter( 'excerpt_more', $filter_excerpt_more );
	return sprintf( '<div %1$s>%2$s</div>', $wrapper_attributes, $content );
}

/**
 * Registers the `core/post-excerpt` block on the server.
 *
 * @since 5.8.0
 */
function register_block_core_post_excerpt() {
	register_block_type_from_metadata(
		__DIR__ . '/post-excerpt',
		array(
			'render_callback' => 'render_block_core_post_excerpt',
		)
	);
}
add_action( 'init', 'register_block_core_post_excerpt' );

/**
 * Callback for the excerpt_length filter to override the excerpt length.
 *
 * If themes or plugins filter the excerpt_length, we need to
 * override the filter in the editor, otherwise
 * the excerpt length block setting has no effect.
 * Returns 101 (one more than the max block setting of 100) to ensure
 * wp_trim_words can detect when trimming is needed and add the ellipsis.
 *
 * @since 7.0.0
 *
 * @return int The excerpt length.
 */
function block_core_post_excerpt_excerpt_length() {
	return 101;
}

if ( is_admin() ) {
	add_filter( 'excerpt_length', 'block_core_post_excerpt_excerpt_length', PHP_INT_MAX );
}
