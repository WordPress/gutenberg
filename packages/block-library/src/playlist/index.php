<?php
/**
 * Server-side rendering of the `core/playlist` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/playlist` block on the server.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 *
 * @return string Returns the playlist block markup.
 */
function render_block_core_playlist( $attributes, $content, $block ) {
	$items        = isset( $attributes['items'] ) ? $attributes['items'] : array();
	$current_item = 0;
	$autoplay      = isset( $attributes['autoplay'] ) && $attributes['autoplay'];
	$loop          = isset( $attributes['loop'] ) && $attributes['loop'];
	$show_items   = isset( $attributes['showItemList'] ) ? $attributes['showItemList'] : true;

	if ( empty( $items ) ) {
		return '';
	}

	// Fetch all attachments in a single query.
	$attachments = get_posts(
		array(
			'post_type'      => 'attachment',
			'post__in'       => $items,
			'posts_per_page' => -1,
		)
	);

	// Index attachments by ID for quick lookup.
	$attachments_by_id = array();
	foreach ( $attachments as $attachment ) {
		$attachments_by_id[ $attachment->ID ] = $attachment;
	}

	// Build items data maintaining the order from $items array.
	$items_data = array();
	foreach ( $items as $item_id ) {
		if ( ! isset( $attachments_by_id[ $item_id ] ) ) {
			continue;
		}

		$attachment = $attachments_by_id[ $item_id ];

		$item_info = array(
			'id'     => $item_id,
			'url'    => wp_get_attachment_url( $item_id ),
			'title'  => get_the_title( $item_id ),
			'image'  => '',
			'artist' => '',
		);

		// Get thumbnail if available.
		// TODO: This should probably be a custom field on the attachment..
		$thumbnail_id = get_post_thumbnail_id( $item_id );
		if ( $thumbnail_id ) {
			$thumbnail = wp_get_attachment_image_src( $thumbnail_id, 'thumbnail' );
			if ( $thumbnail ) {
				$item_info['image'] = $thumbnail[0];
			}
		}

		// Get audio metadata (artist, etc).
		$metadata = wp_get_attachment_metadata( $item_id );
		if ( ! empty( $metadata['audio']['artist'] ) ) {
			$item_info['artist'] = $metadata['audio']['artist'];
		} elseif ( ! empty( $metadata['artist'] ) ) {
			$item_info['artist'] = $metadata['artist'];
		}

		$items_data[] = $item_info;
	}

	if ( empty( $items_data ) ) {
		return '';
	}

	// Current item is always the first item.
	$current_item_data = $items_data[0];

	// Build the context for Interactivity API.
	$context = array(
		'items'       => $items,
		'itemsData'   => $items_data,
		'currentItem' => $current_item,
		'isPlaying'   => false,
		'autoplay'    => $autoplay,
		'loop'        => $loop,
	);

	// Build header image.
	$header_image = '';
	if ( ! empty( $current_item_data['image'] ) ) {
		$img = new WP_HTML_Tag_Processor(
			sprintf(
				'<img src="%s" alt="" />',
				esc_url( $current_item_data['image'] )
			)
		);
		if ( $img->next_tag() ) {
			$img->add_class( 'wp-block-playlist__header-image' );
			$img->set_attribute( 'data-wp-bind--src', 'state.currentItemImage' );
		}
		$header_image = $img->get_updated_html();
	}

	// Build header artist.
	$header_artist = '';
	if ( ! empty( $current_item_data['artist'] ) ) {
		$artist_text = sprintf(
			/* translators: %s is the artist name. */
			__( 'by %s' ),
			esc_html( $current_item_data['artist'] )
		);
		$artist      = new WP_HTML_Tag_Processor( sprintf( '<div class="wp-block-playlist__header-subtitle">%s</div>', $artist_text ) );
		if ( $artist->next_tag() ) {
			$artist->set_attribute( 'data-wp-text', 'state.currentItemArtist' );
		}
		$header_artist = $artist->get_updated_html();
	}

	// Build header title.
	$title = new WP_HTML_Tag_Processor( sprintf( '<div class="wp-block-playlist__header-title">%s</div>', esc_html( $current_item_data['title'] ) ) );
	if ( $title->next_tag() ) {
		$title->set_attribute( 'data-wp-text', 'state.currentItemTitle' );
	}
	$header_title = $title->get_updated_html();

	// Build header.
	$header = sprintf(
		'<div class="wp-block-playlist__header">%s<div class="wp-block-playlist__header-info">%s%s</div></div>',
		$header_image,
		$header_title,
		$header_artist
	);

	// Build audio element.
	$audio = new WP_HTML_Tag_Processor(
		sprintf(
			'<audio src="%s" controls %s></audio>',
			esc_url( $current_item_data['url'] ),
			$autoplay ? 'autoplay' : ''
		)
	);
	if ( $audio->next_tag() ) {
		$audio->add_class( 'wp-block-playlist__audio' );
		$audio->set_attribute( 'data-wp-bind--src', 'state.currentItemSrc' );
		$audio->set_attribute( 'data-wp-on--ended', 'actions.onItemEnded' );
		$audio->set_attribute( 'data-wp-on--play', 'actions.onPlay' );
		$audio->set_attribute( 'data-wp-on--pause', 'actions.onPause' );
	}

	// Build player.
	$player = sprintf(
		'<figure class="wp-block-playlist__player">%s%s</figure>',
		$header,
		$audio->get_updated_html()
	);

	// Build items list.
	$items_list = '';
	if ( $show_items ) {
		$list_items = '';
		foreach ( $items_data as $index => $item ) {
			$item_classes = array( 'wp-block-playlist__item' );
			if ( $index === 0 ) {
				$item_classes[] = 'is-active';
			}

			$item_context = wp_json_encode( array( 'itemIndex' => $index ) );
			$item_number  = sprintf(
				'<span class="wp-block-playlist__item-number">%d.</span>',
				(int) $index + 1
			);
			$item_artist = '';
			if ( ! empty( $item['artist'] ) ) {
				$item_artist = sprintf(
					'<div class="wp-block-playlist__item-artist">%s</div>',
					sprintf(
						/* translators: %s is the artist name. */
						__( 'by %s' ),
						esc_html( $item['artist'] )
					)
				);
			}

			$item_title = sprintf(
				'<div class="wp-block-playlist__item-info"><div class="wp-block-playlist__item-title">%s</div>%s</div>',
				esc_html( $item['title'] ),
				$item_artist
			);

			$list_items .= sprintf(
				'<li class="%s" data-wp-on--click="actions.selectItem" data-wp-context=\'%s\' data-wp-class--is-active="state.isItemActive">%s%s</li>',
				esc_attr( implode( ' ', $item_classes ) ),
				$item_context,
				$item_number,
				$item_title
			);
		}
		$items_list = sprintf( '<ol class="wp-block-playlist__items">%s</ol>', $list_items );
	}

	// Build wrapper with interactivity directives.
	$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => 'wp-block-playlist' ) );
	$interactivity_context = wp_interactivity_data_wp_context( $context );

	return sprintf(
		'<div %s data-wp-interactive="core/playlist" %s data-wp-watch="callbacks.updateAudio">%s%s</div>',
		$wrapper_attributes,
		$interactivity_context,
		$player,
		$items_list
	);
}

/**
 * Registers the `core/playlist` block on the server.
 */
function register_block_core_playlist() {
	register_block_type_from_metadata(
		__DIR__ . '/playlist',
		array(
			'render_callback' => 'render_block_core_playlist',
		)
	);
}
add_action( 'init', 'register_block_core_playlist' );
