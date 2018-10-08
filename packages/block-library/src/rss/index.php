<?php
/**
 * Server-side rendering of the `core/rss` block.
 *
 * @package gutenberg
 */

/**
 * Renders the rss error message.
 *
 * @param string $message RSS error message.
 * @return string|void Void if renders on frontend.
 */
function render_rss_error_message( $message ) {
	if ( ! is_admin() ) {
		return;
	}
	return '<div class="components-placeholder"><div class="notice notice-alt notice-error">' . $message . '</div></div>';
}

/**
 * Renders the `core/rss` block on server.
 *
 * @param array $attributes The block attributes.
 *
 * @return string Returns the block content with received rss items.
 */
function render_block_core_rss( $attributes ) {

	$url = $attributes['feedURL'];

	if ( empty( $url ) ) {
		return;
	}

	while ( stristr( $url, 'http' ) !== $url ) {
		$url = substr( $url, 1 );
	}

	// self-url destruction sequence.
	if ( in_array( untrailingslashit( $url ), array( site_url(), home_url() ) ) ) {
		return render_rss_error_message( __( 'Use \'Latest Posts\' block for this domain', 'gutenberg' ) );
	}

	$rss = fetch_feed( $url );

	if ( is_wp_error( $rss ) ) {
		return render_rss_error_message( '<strong>' . __( 'RSS Error:', 'gutenberg' ) . '</strong> ' . $rss->get_error_message() );
	}

	if ( ! $rss->get_item_quantity() ) {
		$rss->__destruct();
		unset( $rss );
		return render_rss_error_message( __( 'An error has occurred, which probably means the feed is down. Try again later.', 'gutenberg' ) );
	}

	$items = (int) $attributes['itemsToShow'];
	if ( $items < 1 || 10 < $items ) {
		$items = 5;
	}

	$list_items = '';
	foreach ( $rss->get_items( 0, $items ) as $item ) {
		$link = $item->get_link();

		while ( stristr( $link, 'http' ) != $link ) {
			$link = substr( $link, 1 );
		}

		$title = esc_html( trim( strip_tags( $item->get_title() ) ) );
		if ( empty( $title ) ) {
			$title = __( '(Untitled)', 'gutenberg' );
		}

		$link = esc_url( strip_tags( $link ) );
		if ( $link ) {
			$title = "<a href='$link'>$title</a>";
		}

		$title = "<div class='wp-block-rss__item-title'>$title</div>";

		$date = '';
		if ( $attributes['displayDate'] ) {
			$date = $item->get_date( 'U' );

			if ( $date ) {
				$date = sprintf(
					'<time datetime="%1$s" class="wp-block-rss__item-publish-date">%2$s</time>',
					date_i18n( get_option( 'c' ), $date ),
					date_i18n( get_option( 'date_format' ), $date )
				);
			}
		}

		$author = '';
		if ( $attributes['displayAuthor'] ) {
			$author = $item->get_author();
			if ( is_object( $author ) ) {
				$author = $author->get_name();
				$author = '<span class="wp-block-rss__item-author">' . __( 'By', 'gutenberg' ) . ' ' . esc_html( strip_tags( $author ) ) . '</span>';
			}
		}

		$excerpt = '';
		if ( $attributes['displayExcerpt'] ) {
			$excerpt = @html_entity_decode( $item->get_description(), ENT_QUOTES, get_option( 'blog_charset' ) );
			$excerpt = esc_attr( wp_trim_words( $excerpt, $attributes['excerptLength'], ' [&hellip;]' ) );

			// Change existing [...] to [&hellip;].
			if ( '[...]' == substr( $excerpt, -5 ) ) {
				$excerpt = substr( $excerpt, 0, -5 ) . '[&hellip;]';
			}

			$excerpt = '<div class="wp-block-rss__item-excerpt">' . esc_html( $excerpt ) . '</div>';
		}

		$list_items .= "<li class='wp-block-rss__item'>{$title}{$date}{$author}{$excerpt}</li>";
	}

	$columns_class = 'grid' === $attributes['blockLayout'] ? 'columns-' . $attributes['columns'] . ' ' : '';
	$is_grid       = 'grid' === $attributes['blockLayout'] ? 'is-grid' : '';

	$list_items_markup = "<ul class='wp-block-rss {$columns_class}{$is_grid}'>{$list_items}</ul>";

	$rss->__destruct();
	unset( $rss );
	return $list_items_markup;
}

/**
 * Registers the `core/rss` block on server.
 */
function register_block_core_rss() {
	register_block_type( 'core/rss',
		array(
			'attributes'      => array(
				'columns'        => array(
					'type'    => 'number',
					'default' => 2,
				),
				'blockLayout'    => array(
					'type'    => 'string',
					'default' => 'list',
				),
				'feedURL'        => array(
					'type' => 'string',
				),
				'itemsToShow'    => array(
					'type'    => 'number',
					'default' => 5,
				),
				'displayExcerpt' => array(
					'type' => 'boolean',
				),
				'displayAuthor'  => array(
					'type' => 'boolean',
				),
				'displayDate'    => array(
					'type' => 'boolean',
				),
				'excerptLength'  => array(
					'type'    => 'number',
					'default' => 55,
				),
			),
			'render_callback' => 'render_block_core_rss',
		)
	);
}

add_action( 'init', 'register_block_core_rss' );
