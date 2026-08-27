<?php
/**
 * Server-side rendering of the `core/video` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/video` block on the server to supply the width and height attributes from the attachment metadata.
 *
 * @since 6.9.0
 *
 * @phpstan-param  array{ "id"?: positive-int } $attributes
 *
 * @param array   $attributes The block attributes.
 * @param string  $content    The block content.
 * @return string The block content with the dimensions added.
 */
function render_block_core_video( array $attributes, string $content ): string {
	// If the content lacks any video tag (either <video> or <VIDEO>), abort. Note that str_contains() is case-sensitive.
	if ( stripos( $content, '<video' ) === false ) {
		return $content;
	}

	// If the 'id' attribute is not populated for a video attachment, abort.
	if (
		! isset( $attributes['id'] ) ||
		! is_int( $attributes['id'] ) ||
		$attributes['id'] <= 0
	) {
		return $content;
	}

	// If the 'id' attribute wasn't for an attachment, abort.
	if ( get_post_type( $attributes['id'] ) !== 'attachment' ) {
		return $content;
	}

	// Get the width and height metadata for the video, and abort if absent or invalid.
	$metadata = wp_get_attachment_metadata( $attributes['id'] );
	if (
		! isset( $metadata['width'], $metadata['height'] ) ||
		! ( is_int( $metadata['width'] ) && is_int( $metadata['height'] ) ) ||
		! ( $metadata['width'] > 0 && $metadata['height'] > 0 )
	) {
		return $content;
	}

	// Locate the VIDEO tag to add the dimensions.
	$p = new WP_HTML_Tag_Processor( $content );
	if ( ! $p->next_tag( array( 'tag_name' => 'VIDEO' ) ) ) {
		return $content;
	}

	$p->set_attribute( 'width', (string) $metadata['width'] );
	$p->set_attribute( 'height', (string) $metadata['height'] );

	/*
	 * The aspect-ratio style is needed due to an issue with the CSS spec: <https://github.com/w3c/csswg-drafts/issues/7524>.
	 * Note that a style rule using attr() like the following cannot currently be used:
	 *
	 *     .wp-block-video video[width][height] {
	 *         aspect-ratio: attr(width type(<number>)) / attr(height type(<number>));
	 *     }
	 *
	 * This is because this attr() is yet only implemented in Chromium: <https://caniuse.com/css3-attr>.
	 */
	$style = $p->get_attribute( 'style' );
	if ( ! is_string( $style ) ) {
		$style = '';
	}
	$aspect_ratio_style = sprintf( 'aspect-ratio: %d / %d;', $metadata['width'], $metadata['height'] );
	$p->set_attribute( 'style', $aspect_ratio_style . $style );

	block_core_video_add_live_photo_directives( $metadata, $p );

	return $p->get_updated_html();
}

/**
 * Makes a Live photo play while the reader points at or focuses it.
 *
 * A Live photo is a converted HEIC/HEIF image sequence, shown as a muted
 * looping video that does not autoplay so it rests on its still frame. Playing
 * it on hover is what makes it read as a photograph with motion inside rather
 * than as a video player, and that needs a script: `autoplay` would make it a
 * looping animation instead, and `controls` would make it a player.
 *
 * The behavior is deliberately not part of the block's saved markup. Adding
 * Interactivity API directives to save output would require a block
 * deprecation, and the script would then load on every page carrying any video
 * block. Attaching them here instead keeps ordinary videos untouched, and the
 * module is enqueued only when a Live photo is actually on the page.
 *
 * The playback signature alone is not enough to identify one: a hand-built
 * video can happen to be muted, looping, and inline. The attachment's
 * `animated_video` companion is the real evidence that this block came from a
 * converted sequence.
 *
 * The signature is read from the rendered markup rather than the block
 * attributes, because these are all `source: attribute` values: they live on
 * the saved VIDEO tag, and the copy in $attributes holds only defaults.
 *
 * @since 6.9.0
 *
 * @param array                 $metadata Attachment metadata for the block's image.
 * @param WP_HTML_Tag_Processor $p        Processor positioned on the VIDEO tag.
 */
function block_core_video_add_live_photo_directives( array $metadata, WP_HTML_Tag_Processor $p ): void {
	if ( empty( $metadata['animated_video'] ) ) {
		return;
	}

	$is_live_photo = (
		null === $p->get_attribute( 'controls' ) &&
		null === $p->get_attribute( 'autoplay' ) &&
		true === $p->get_attribute( 'loop' ) &&
		true === $p->get_attribute( 'muted' ) &&
		true === $p->get_attribute( 'playsinline' )
	);

	if ( ! $is_live_photo ) {
		return;
	}

	wp_enqueue_script_module( '@wordpress/block-library/video/view' );

	$p->set_attribute( 'data-wp-interactive', 'core/video' );
	$p->set_attribute( 'data-wp-on--pointerenter', 'actions.playLivePhoto' );
	$p->set_attribute( 'data-wp-on--pointerleave', 'actions.pauseLivePhoto' );
	// Focus events reach the motion without a pointer, e.g. by keyboard.
	$p->set_attribute( 'data-wp-on--focus', 'actions.playLivePhoto' );
	$p->set_attribute( 'data-wp-on--blur', 'actions.pauseLivePhoto' );
	// Without this the video is not focusable, since it has no controls.
	if ( null === $p->get_attribute( 'tabindex' ) ) {
		$p->set_attribute( 'tabindex', '0' );
	}
}

/**
 * Registers the `core/video` block on server.
 *
 * @since 6.9.0
 */
function register_block_core_video(): void {
	register_block_type_from_metadata(
		__DIR__ . '/video',
		array(
			'render_callback' => 'render_block_core_video',
		)
	);
}
add_action( 'init', 'register_block_core_video' );
