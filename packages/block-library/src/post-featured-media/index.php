<?php
/**
 * Server-side rendering of the `core/post-featured-media` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/post-featured-media` block on the server.
 *
 * Shows the first featured media found for the post, in priority order:
 * featured image > featured video > featured audio.
 *
 * Returning an empty string when no media is set is intentional — the block
 * is designed to be used inside a Query Loop where not every post will have
 * featured media, and the layout is expected to handle absent elements.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 * @return string HTML output or empty string.
 */
function render_block_core_post_featured_media( $attributes, $content, $block ) {
	if ( ! isset( $block->context['postId'] ) ) {
		return '';
	}

	$post_id   = $block->context['postId'];
	$is_link   = ! empty( $attributes['isLink'] );
	$target    = $is_link ? ( $attributes['linkTarget'] ?? '_self' ) : '';
	$size_slug = $attributes['sizeSlug'] ?? 'post-thumbnail';

	$extra_styles = '';
	if ( ! empty( $attributes['aspectRatio'] ) ) {
		$extra_styles .= 'width:100%;height:100%;';
	} elseif ( ! empty( $attributes['height'] ) ) {
		$extra_styles .= 'height:' . esc_attr( safecss_filter_attr( $attributes['height'] ) ) . ';';
	}
	if ( ! empty( $attributes['scale'] ) && ( ! empty( $attributes['height'] ) || ! empty( $attributes['aspectRatio'] ) ) ) {
		$extra_styles .= 'object-fit:' . esc_attr( $attributes['scale'] ) . ';';
	}

	// 1. Featured image.
	$featured_image = get_the_post_thumbnail( $post_id, $size_slug );
	if ( $featured_image ) {
		if ( $extra_styles ) {
			// Inject style onto the <img> tag.
			$processor = new WP_HTML_Tag_Processor( $featured_image );
			if ( $processor->next_tag( 'img' ) ) {
				$existing = $processor->get_attribute( 'style' ) ?? '';
				$processor->set_attribute( 'style', $existing . $extra_styles );
				$featured_image = $processor->get_updated_html();
			}
		}
		return render_block_core_post_featured_media_wrap(
			$featured_image,
			$attributes,
			$is_link,
			$target,
			$post_id
		);
	}

	$controls = $attributes['controls'];

	// 2. Featured video.
	$video_id = (int) get_post_meta( $post_id, '_featured_video_id', true );
	if ( $video_id ) {
		$video_src = wp_get_attachment_url( $video_id );
		if ( $video_src ) {
			$video_style = 'width:100%;' . $extra_styles;
			$inner       = sprintf(
				'<video src="%s" style="%s"%s></video>',
				esc_url( $video_src ),
				esc_attr( $video_style ),
				$controls ? ' controls' : ''
			);
			return render_block_core_post_featured_media_wrap(
				$inner,
				$attributes,
				$is_link,
				$target,
				$post_id
			);
		}
	}

	// 3. Featured audio.
	$audio_id = (int) get_post_meta( $post_id, '_featured_audio_id', true );
	if ( $audio_id ) {
		$audio_src = wp_get_attachment_url( $audio_id );
		if ( $audio_src ) {
			$inner = sprintf(
				'<audio src="%s" style="width:100%%"%s></audio>',
				esc_url( $audio_src ),
				$controls ? ' controls' : ''
			);
			return render_block_core_post_featured_media_wrap(
				$inner,
				$attributes,
				$is_link,
				$target,
				$post_id
			);
		}
	}

	return '';
}

/**
 * Wraps rendered media HTML in an optional link and a <figure> element.
 *
 * @param string $inner      The media HTML (img, video, or audio element).
 * @param array  $attributes Block attributes.
 * @param bool   $is_link    Whether to wrap in a post permalink link.
 * @param string $target     Link target attribute value.
 * @param int    $post_id    The post ID.
 * @return string The complete block HTML.
 */
function render_block_core_post_featured_media_wrap( $inner, $attributes, $is_link, $target, $post_id ) {
	if ( $is_link ) {
		$inner = sprintf(
			'<a href="%s" target="%s">%s</a>',
			esc_url( get_the_permalink( $post_id ) ),
			esc_attr( $target ),
			$inner
		);
	}

	$aspect_ratio = ! empty( $attributes['aspectRatio'] )
		? esc_attr( safecss_filter_attr( 'aspect-ratio:' . $attributes['aspectRatio'] ) ) . ';'
		: '';
	$width        = ! empty( $attributes['width'] )
		? esc_attr( safecss_filter_attr( 'width:' . $attributes['width'] ) ) . ';'
		: '';
	$height       = ! empty( $attributes['height'] )
		? esc_attr( safecss_filter_attr( 'height:' . $attributes['height'] ) ) . ';'
		: '';
	$wrapper_style = $aspect_ratio . $width . $height;

	$wrapper_attributes = $wrapper_style
		? get_block_wrapper_attributes( array( 'style' => $wrapper_style ) )
		: get_block_wrapper_attributes();

	return "<figure {$wrapper_attributes}>{$inner}</figure>";
}

/**
 * Registers the `core/post-featured-media` block on the server.
 */
function register_block_core_post_featured_media() {
	register_block_type_from_metadata(
		__DIR__ . '/post-featured-media',
		array(
			'render_callback' => 'render_block_core_post_featured_media',
		)
	);
}
add_action( 'init', 'register_block_core_post_featured_media' );
