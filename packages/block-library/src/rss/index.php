<?php
/**
 * Server-side rendering of the `core/rss` block.
 *
 * @package WordPress
 */

/**
 * Helper function to trim text to a certain number of characters while preserving whole words.
 *
 * @param string $to_trim The text to trim.
 * @param int    $character_count The maximum number of characters to return.
 * @param string $more The string to append to the trimmed text.
 */
function trim_to_word_boundary( $to_trim, $character_count, $more = ' [&hellip;]' ) {
	// Strip tags to mimic behavior of `wp_trim_words`.
	$to_trim = wp_strip_all_tags( $to_trim );

	if ( strlen( $to_trim ) <= $character_count ) {
		return $to_trim;
	}

	preg_match( '/^.{0,' . $character_count . '}\s/', $to_trim, $parts );
	return $parts[0] . $more;
}

/**
 * Helper funtion to trim text up to the first period (.) followed by a space.
 * If no period is found, the text is trimmed to the nearest word boundary.
 * If multiple periods are found, the last one within $title_length is used.
 *
 * @param string $to_trim The text to trim.
 * @param int    $title_length The maximum number of characters to return.
 */
function trim_title_from_excerpt( $to_trim, $title_length ) {
	$to_trim = trim_to_word_boundary( $to_trim, $title_length, '' );

	// Match to the first period followed by a space.
	preg_match( '/^.{0,' . $title_length . '}\.\s/', $to_trim, $parts );

	if ( empty( $parts[0] ) ) {
		return $to_trim;
	}

	return $parts[0];
}

/**
 * Renders the `core/rss` block on server.
 *
 * @param array $attributes The block attributes.
 *
 * @return string Returns the block content with received rss items.
 */
function render_block_core_rss( $attributes ) {
	if ( in_array( untrailingslashit( $attributes['feedURL'] ), array( site_url(), home_url() ), true ) ) {
		return '<div class="components-placeholder"><div class="notice notice-error">' . __( 'Adding an RSS feed to this site’s homepage is not supported, as it could lead to a loop that slows down your site. Try using another block, like the <strong>Latest Posts</strong> block, to list posts from the site.' ) . '</div></div>';
	}

	$rss = fetch_feed( $attributes['feedURL'] );

	if ( is_wp_error( $rss ) ) {
		return '<div class="components-placeholder"><div class="notice notice-error"><strong>' . __( 'RSS Error:' ) . '</strong> ' . esc_html( $rss->get_error_message() ) . '</div></div>';
	}

	if ( ! $rss->get_item_quantity() ) {
		return '<div class="components-placeholder"><div class="notice notice-error">' . __( 'An error has occurred, which probably means the feed is down. Try again later.' ) . '</div></div>';
	}

	$rss_items  = $rss->get_items( 0, $attributes['itemsToShow'] );
	$list_items = '';
	foreach ( $rss_items as $item ) {
		$excerpt_decoded = html_entity_decode( $item->get_description(), ENT_QUOTES, get_option( 'blog_charset' ) );
		$excerpt_trimmed = esc_attr( wp_trim_words( $excerpt_decoded, $attributes['excerptLength'], ' [&hellip;]' ) );

		$title = esc_html( trim( strip_tags( $item->get_title() ) ) );
		// $excerpt_trimmed and $title are now sanitized

		if ( empty( $title ) ) {
			// If the title is empty, use the begining of the excerpt instead.
			$title = trim_title_from_excerpt( $excerpt_trimmed, $attributes['titleLength'] );
			if ( $attributes['displayExcerpt'] ) {
				// Trim out the words that were used for the title.
				$excerpt_trimmed = trim( substr( $excerpt_trimmed, strlen( $title ) ) );
			} else {
				// If the excerpt is not displayed, append an ellipsis.
				$title = $title . ' [&hellip;]';
			}
		} else {
			// If the title is too long, trim it.
			$title = trim_to_word_boundary( $title, $attributes['titleLength'], ' [&hellip;]' );
		}

		$link = $item->get_link();
		$link = esc_url( $link );
		if ( $link ) {
			$title = "<a href='{$link}'>{$title}</a>";
		}
		$title = "<div class='wp-block-rss__item-title'>{$title}</div>";

		$date = '';
		if ( $attributes['displayDate'] ) {
			$date = $item->get_date( 'U' );

			if ( $date ) {
				$date = sprintf(
					'<time datetime="%1$s" class="wp-block-rss__item-publish-date">%2$s</time> ',
					esc_attr( date_i18n( 'c', $date ) ),
					esc_attr( date_i18n( get_option( 'date_format' ), $date ) )
				);
			}
		}

		$author = '';
		if ( $attributes['displayAuthor'] ) {
			$author = $item->get_author();
			if ( is_object( $author ) ) {
				$author = $author->get_name();
				$author = '<span class="wp-block-rss__item-author">' . sprintf(
					/* translators: %s: the author. */
					__( 'by %s' ),
					esc_html( strip_tags( $author ) )
				) . '</span>';
			}
		}

		$excerpt = '';
		if ( $attributes['displayExcerpt'] ) {
			$excerpt = $excerpt_trimmed;
			// Change existing [...] to [&hellip;].
			if ( '[...]' === substr( $excerpt, -5 ) ) {
				$excerpt = substr( $excerpt, 0, -5 ) . '[&hellip;]';
			}

			$excerpt = '<div class="wp-block-rss__item-excerpt">' . esc_html( $excerpt ) . '</div>';
		}

		$list_items .= "<li class='wp-block-rss__item'>{$title}{$date}{$author}{$excerpt}</li>";
	}

	$classnames = array();
	if ( isset( $attributes['blockLayout'] ) && 'grid' === $attributes['blockLayout'] ) {
		$classnames[] = 'is-grid';
	}
	if ( isset( $attributes['columns'] ) && 'grid' === $attributes['blockLayout'] ) {
		$classnames[] = 'columns-' . $attributes['columns'];
	}
	if ( $attributes['displayDate'] ) {
		$classnames[] = 'has-dates';
	}
	if ( $attributes['displayAuthor'] ) {
		$classnames[] = 'has-authors';
	}
	if ( $attributes['displayExcerpt'] ) {
		$classnames[] = 'has-excerpts';
	}

	$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => implode( ' ', $classnames ) ) );

	return sprintf( '<ul %s>%s</ul>', $wrapper_attributes, $list_items );
}

/**
 * Registers the `core/rss` block on server.
 */
function register_block_core_rss() {
	register_block_type_from_metadata(
		__DIR__ . '/rss',
		array(
			'render_callback' => 'render_block_core_rss',
		)
	);
}
add_action( 'init', 'register_block_core_rss' );
