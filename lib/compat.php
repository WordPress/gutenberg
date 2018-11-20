<?php
/**
 * PHP and WordPress configuration compatibility functions for the Gutenberg
 * editor plugin.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

/**
 * Splits a UTF-8 string into an array of UTF-8-encoded codepoints.
 *
 * @since 0.5.0
 *
 * Based on WordPress' _mb_substr() compat function.
 *
 * @param string $str        The string to split.
 * @return array
 */
function _gutenberg_utf8_split( $str ) {
	if ( _wp_can_use_pcre_u() ) {
		// Use the regex unicode support to separate the UTF-8 characters into
		// an array.
		preg_match_all( '/./us', $str, $match );
		return $match[0];
	}

	$regex = '/(
		  [\x00-\x7F]                  # single-byte sequences   0xxxxxxx
		| [\xC2-\xDF][\x80-\xBF]       # double-byte sequences   110xxxxx 10xxxxxx
		| \xE0[\xA0-\xBF][\x80-\xBF]   # triple-byte sequences   1110xxxx 10xxxxxx * 2
		| [\xE1-\xEC][\x80-\xBF]{2}
		| \xED[\x80-\x9F][\x80-\xBF]
		| [\xEE-\xEF][\x80-\xBF]{2}
		| \xF0[\x90-\xBF][\x80-\xBF]{2} # four-byte sequences   11110xxx 10xxxxxx * 3
		| [\xF1-\xF3][\x80-\xBF]{3}
		| \xF4[\x80-\x8F][\x80-\xBF]{2}
	)/x';

	// Start with 1 element instead of 0 since the first thing we do is pop.
	$chars = array( '' );
	do {
		// We had some string left over from the last round, but we counted it
		// in that last round.
		array_pop( $chars );

		// Split by UTF-8 character, limit to 1000 characters (last array
		// element will contain the rest of the string).
		$pieces = preg_split(
			$regex,
			$str,
			1000,
			PREG_SPLIT_DELIM_CAPTURE | PREG_SPLIT_NO_EMPTY
		);

		$chars = array_merge( $chars, $pieces );

		// If there's anything left over, repeat the loop.
		if ( count( $pieces ) > 1 ) {
			$str = array_pop( $pieces );
		} else {
			break;
		}
	} while ( $str );

	return $chars;
}

/**
 * Disables wpautop behavior in classic editor when post contains blocks, to
 * prevent removep from invalidating paragraph blocks.
 *
 * @param  array  $settings  Original editor settings.
 * @param  string $editor_id ID for the editor instance.
 * @return array             Filtered settings.
 */
function gutenberg_disable_editor_settings_wpautop( $settings, $editor_id ) {
	$post = get_post();
	if ( 'content' === $editor_id && is_object( $post ) && has_blocks( $post ) ) {
		$settings['wpautop'] = false;
	}

	return $settings;
}
add_filter( 'wp_editor_settings', 'gutenberg_disable_editor_settings_wpautop', 10, 2 );

/**
 * Add rest nonce to the heartbeat response.
 *
 * @param  array $response Original heartbeat response.
 * @return array           New heartbeat response.
 */
function gutenberg_add_rest_nonce_to_heartbeat_response_headers( $response ) {
	$response['rest-nonce'] = wp_create_nonce( 'wp_rest' );
	return $response;
}
add_filter( 'wp_refresh_nonces', 'gutenberg_add_rest_nonce_to_heartbeat_response_headers' );

/**
 * As a substitute for the default content `wpautop` filter, applies autop
 * behavior only for posts where content does not contain blocks.
 *
 * @param  string $content Post content.
 * @return string          Paragraph-converted text if non-block content.
 */
function gutenberg_wpautop( $content ) {
	if ( has_blocks( $content ) ) {
		return $content;
	}

	return wpautop( $content );
}
remove_filter( 'the_content', 'wpautop' );
add_filter( 'the_content', 'gutenberg_wpautop', 6 );

/**
 * Check if we need to load the block warning in the Classic Editor.
 *
 * @since 3.4.0
 */
function gutenberg_check_if_classic_needs_warning_about_blocks() {
	global $pagenow;

	if ( ! in_array( $pagenow, array( 'post.php', 'post-new.php' ), true ) || ! isset( $_REQUEST['classic-editor'] ) ) {
		return;
	}

	$post = get_post();
	if ( ! $post ) {
		return;
	}

	if ( ! has_blocks( $post ) ) {
		return;
	}

	// Enqueue the JS we're going to need in the dialog.
	wp_enqueue_script( 'wp-a11y' );
	wp_enqueue_script( 'wp-sanitize' );

	add_action( 'admin_footer', 'gutenberg_warn_classic_about_blocks' );
}
add_action( 'admin_enqueue_scripts', 'gutenberg_check_if_classic_needs_warning_about_blocks' );

/**
 * Adds a warning to the Classic Editor when trying to edit a post containing blocks.
 *
 * @since 3.4.0
 */
function gutenberg_warn_classic_about_blocks() {
	$post = get_post();

	$gutenberg_edit_link = get_edit_post_link( $post->ID, 'raw' );

	$classic_edit_link = $gutenberg_edit_link;
	$classic_edit_link = add_query_arg(
		array(
			'classic-editor'     => '',
			'hide-block-warning' => '',
		),
		$classic_edit_link
	);

	$revisions_link = '';
	if ( wp_revisions_enabled( $post ) ) {
		$revisions = wp_get_post_revisions( $post );

		// If there's only one revision, that won't help.
		if ( count( $revisions ) > 1 ) {
			reset( $revisions ); // Reset pointer for key().
			$revisions_link = get_edit_post_link( key( $revisions ) );
		}
	}
	?>
		<style type="text/css">
			#blocks-in-post-dialog .notification-dialog {
				position: fixed;
				top: 50%;
				left: 50%;
				width: 500px;
				box-sizing: border-box;
				transform: translate(-50%, -50%);
				margin: 0;
				padding: 25px;
				max-height: 90%;
				background: #fff;
				box-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
				line-height: 1.5;
				z-index: 1000005;
				overflow-y: auto;
			}

			@media only screen and (max-height: 480px), screen and (max-width: 450px) {
				#blocks-in-post-dialog .notification-dialog {
					top: 0;
					left: 0;
					width: 100%;
					height: 100%;
					transform: none;
					max-height: 100%;
				}
			}
		</style>

		<div id="blocks-in-post-dialog" class="notification-dialog-wrap">
			<div class="notification-dialog-background"></div>
			<div class="notification-dialog">
				<div class="blocks-in-post-message">
					<p><?php _e( 'This post was previously edited in Gutenberg. You can continue in the Classic Editor, but you may lose data and formatting.', 'gutenberg' ); ?></p>
					<?php
					if ( $revisions_link ) {
						?>
							<p>
							<?php
								/* translators: link to the post revisions page */
								printf( __( 'You can also <a href="%s">browse previous revisions</a> and restore a version of the post before it was edited in Gutenberg.', 'gutenberg' ), esc_url( $revisions_link ) );
							?>
							</p>
						<?php
					} else {
						?>
							<p><strong><?php _e( 'Because this post does not have revisions, you will not be able to revert any changes you make in the Classic Editor.', 'gutenberg' ); ?></strong></p>
						<?php
					}
					?>
				</div>
				<p>
					<a class="button button-primary blocks-in-post-gutenberg-button" href="<?php echo esc_url( $gutenberg_edit_link ); ?>"><?php _e( 'Edit in Gutenberg', 'gutenberg' ); ?></a>
					<button type="button" class="button blocks-in-post-classic-button"><?php _e( 'Continue to Classic Editor', 'gutenberg' ); ?></button>
				</p>
			</div>
		</div>

		<script type="text/javascript">
			/* <![CDATA[ */
			( function( $ ) {
				var dialog = {};

				dialog.init = function() {
					// The modal
					dialog.warning = $( '#blocks-in-post-dialog' );
					// Get the links and buttons within the modal.
					dialog.warningTabbables = dialog.warning.find( 'a, button' );

					// Get the text within the modal.
					dialog.rawMessage = dialog.warning.find( '.blocks-in-post-message' ).text();

					// Hide all the #wpwrap content from assistive technologies.
					$( '#wpwrap' ).attr( 'aria-hidden', 'true' );

					// Detach the warning modal from its position and append it to the body.
					$( document.body )
						.addClass( 'modal-open' )
						.append( dialog.warning.detach() );

					// Reveal the modal and set focus on the Gutenberg button.
					dialog.warning
						.removeClass( 'hidden' )
						.find( '.blocks-in-post-gutenberg-button' ).focus();

					// Attach event handlers.
					dialog.warningTabbables.on( 'keydown', dialog.constrainTabbing );
					dialog.warning.on( 'click', '.blocks-in-post-classic-button', dialog.dismissWarning );

					// Make screen readers announce the warning message after a short delay (necessary for some screen readers).
					setTimeout( function() {
						wp.a11y.speak( wp.sanitize.stripTags( dialog.rawMessage.replace( /\s+/g, ' ' ) ), 'assertive' );
					}, 1000 );
				};

				dialog.constrainTabbing = function( event ) {
					var firstTabbable, lastTabbable;

					if ( 9 !== event.which ) {
						return;
					}

					firstTabbable = dialog.warningTabbables.first()[0];
					lastTabbable = dialog.warningTabbables.last()[0];

					if ( lastTabbable === event.target && ! event.shiftKey ) {
						firstTabbable.focus();
						event.preventDefault();
					} else if ( firstTabbable === event.target && event.shiftKey ) {
						lastTabbable.focus();
						event.preventDefault();
					}
				};

				dialog.dismissWarning = function() {
					// Hide modal.
					dialog.warning.remove();
					$( '#wpwrap' ).removeAttr( 'aria-hidden' );
					$( 'body' ).removeClass( 'modal-open' );
				};

				$( document ).ready( dialog.init );
			} )( jQuery );
			/* ]]> */
		</script>
	<?php
}

/**
 * Add 'actual_size' to the prepared attachment data for the Media Library.
 *
 * Needed as `wp_prepare_attachment_for_js()` (for the media modal) constrains
 * the image sizes to the theme's `$content_width`.
 *
 * @param array   $response   Array of prepared attachment data.
 * @param WP_Post $attachment Attachment object.
 * @param array   $meta       Array of attachment meta data.
 * @return array Array of prepared attachment data.
 */
function gutenberg_prepare_attachment_for_js( $response, $attachment, $meta ) {
	if ( ! empty( $response['type'] ) && 'image' === $response['type'] && ! empty( $response['sizes'] ) ) {
		foreach ( $response['sizes'] as $size_name => $size ) {
			if ( array_key_exists( $size_name, $meta['sizes'] ) ) {
				$response['sizes'][ $size_name ]['actual_size'] = array(
					'width'  => (int) $meta['sizes'][ $size_name ]['width'],
					'height' => (int) $meta['sizes'][ $size_name ]['height'],
				);
			}
		}
	}

	return $response;
}
add_filter( 'wp_prepare_attachment_for_js', 'gutenberg_prepare_attachment_for_js', 10, 3 );

/**
 * Warm the object cache with post and meta information for all found image
 * blocks to avoid making individual database calls (similarly to
 * `wp_make_content_images_responsive()`).
 *
 * @access private
 * @since 4.5.0
 *
 * @param string $content The post content.
 * @return string $content Unchanged post content.
 */
function _gutenberg_cache_images_meta( $content ) {
	// Need to find all image blocks and their attachment IDs BEFORE block
	// filtering evaluates the rendered result so that attachements meta is
	// retrieved all at once from the DB.
	//
	// [TODO]: When available, the regular expression should be avoided in
	// favor of a filter on the parsed result of blocks, still prior to the
	// rendered evaluation.
	if ( preg_match_all( '/^<!-- wp:image {.*"id":(\d+).*} -->$/m', $content, $matches ) ) {
		_prime_post_caches(
			$matches[1],
			/* $update_term_cache */ false,
			/* $update_meta_cache */ true
		);
	}

	return $content;
}

// Run before blocks are parsed.
add_filter( 'the_content', '_gutenberg_cache_images_meta', 3 );

/**
 * Calculates the image width and height based on $block_witdh and the
 * `editWidth` block attribute.
 *
 * @since 4.5.0
 *
 * @param array $block_attributes The block attributes.
 * @param array $image_meta       Optional. The image attachment meta data.
 * @return array|bool An array of the image width and height, in that order, or
 *                    false if the image data is missing from $block_attributes.
 */
function gutenberg_get_image_width_height( $block_attributes, $image_meta = null ) {
	if ( ! empty( $block_attributes['width'] ) && ! empty( $block_attributes['height'] ) ) {
		// The image was resized.
		$image_dimensions = array(
			$block_attributes['width'],
			$block_attributes['height'],
		);

		/*
		 * Here we can use `$block_attributes['editWidth']` to scale the image
		 * if we know the theme's "expected width" (in pixels).
		 *
		 * Note that if the `$block_attributes['userSetDimensions']` is set/true, the user has entered
		 * the width and height by hand, they shouldn't probably be changed.
		 *
		 * Something like:
		 *	if ( empty( $block_attributes['userSetDimensions'] ) && ! empty( $block_attributes['editWidth'] ) && $content_width <> $block_attributes['editWidth'] ) {
		 *		// Scale the image if the block width in the editor was different than the current theme width.
		 *		$scale = $content_width / $block_attributes['editWidth'];
		 *		$image_width = round( $block_attributes['width'] * $scale );
		 *	}
		 *	$image_dimensions = wp_constrain_dimensions( $image_file_width, $image_file_height, $image_width );
		 */
	} elseif ( ! empty( $block_attributes['fileWidth'] ) && ! empty( $block_attributes['fileHeight'] ) ) {
		$image_dimensions = array(
			$block_attributes['fileWidth'],
			$block_attributes['fileHeight'],
		);
	} else {
		return false;
	}

	/*
	 * Do not constrain images with "wide" and "full" alignment to the "large" image size.
	 * TODO: To reduce (fix) the need for upscaling or using the "full" size images
	 * add "xlarge" image size generated by default!
	 */
	if ( ! empty( $image_meta ) &&
		( 'wide' === $block_attributes['align'] || 'full' === $block_attributes['align'] ) &&
		! empty( $block_attributes['fileWidth'] ) &&
		$block_attributes['fileWidth'] < $image_meta['width'] &&
		max( (int) $image_meta['width'], (int) $image_meta['height'] ) < 4300 && // max 12 MP photo (that's still may be over 3MB, consider reducing).
		! empty( $image_meta['sizes']['large'] ) &&
		$block_attributes['fileWidth'] === (int) $image_meta['sizes']['large']['width'] &&
		wp_image_matches_ratio( $block_attributes['fileWidth'], $block_attributes['fileHeight'], $image_meta['width'], $image_meta['height'] )
	) {
		$image_dimensions = array(
			$image_meta['width'],
			$image_meta['height'],
		);
	}

	/**
	 * Filters the image size for the image block.
	 *
	 * @since 4.5.0
	 *
	 * @param array $image_size       The calculated image size width and
	 *                                height (in that order).
	 * @param array $block_attributes The block attributes.
	 * @param array $image_meta       The image attachment meta data.
	 */
	return apply_filters( 'block_core_image_get_width_height', $image_dimensions, $block_attributes, $image_meta );
}

/**
 * Filters the rendered output of the Image block to include generated HTML
 * attributes for front-end display.
 *
 * @since 4.5.0
 *
 * @param string $html  Original HTML.
 * @param array  $block Parsed block.
 * @return string Filtered Image block HTML.
 */
function gutenberg_render_block_core_image( $html, $block ) {
	// Old post or... something's wrong.
	if ( empty( $html ) || empty( $block['attrs'] ) ) {
		return $html;
	}

	$defaults = array(
		'url'   => '',
		'alt'   => '',
		'id'    => 0,
		'align' => '',
	);

	$block_attributes = wp_parse_args( $block['attrs'], $defaults );

	if ( empty( $block_attributes['url'] ) ) {
		// We don't have enough data to construct new img tag. Fall back to the existing HTML.
		return $html;
	}

	if ( ! empty( $block_attributes['id'] ) ) {
		$attachment_id = (int) $block_attributes['id'];
		$image_meta    = wp_get_attachment_metadata( $attachment_id );
	} else {
		$attachment_id = 0;
		$image_meta    = null;
	}

	$image_dimensions = gutenberg_get_image_width_height( $block_attributes, $image_meta );
	$image_src        = '';
	$srcset           = '';
	$sizes            = '';

	if ( empty( $image_dimensions ) ) {
		// We don't have enough data to construct new img tag. Fall back to the existing HTML.
		return $html;
	}

	$image_src = $block_attributes['url'];

	$image_attributes = array(
		'src'    => $image_src,
		'alt'    => empty( $block_attributes['alt'] ) ? '' : $block_attributes['alt'],
		'width'  => $image_dimensions[0],
		'height' => $image_dimensions[1],
	);

	if ( $image_meta ) {
		// TODO: pass `$block_attributes` to the filter.
		$srcset = wp_calculate_image_srcset( $image_dimensions, $image_src, $image_meta, $attachment_id );

		if ( ! empty( $srcset ) ) {
			// TODO: pass `$block_attributes` to the filter. This will let themes generate better `sizes` attribute.
			$sizes = wp_calculate_image_sizes( $image_dimensions, $image_src, $image_meta, $attachment_id );
		}

		if ( $srcset && $sizes ) {
			$image_attributes['srcset'] = $srcset;
			$image_attributes['sizes']  = $sizes;
		}
	}

	/**
	 * Filters the image tag attributes when rendering the core image block.
	 *
	 * @since 4.5.0
	 *
	 * @param array  $image_attributes The (recalculated) image attributes.
	 *                                 Note: expects valid HTML 5.0 attribute names.
	 * @param array  $block_attributes The image block attributes.
	 * @param string $html             The image block HTML coming from the
	 *                                 editor. The img tag will be replaced.
	 */
	$image_attributes = apply_filters( 'render_block_core_image_tag_attributes', $image_attributes, $block_attributes, $html );

	$attr = '';
	foreach ( $image_attributes as $name => $value ) {
		// Sanitize for valid HTML 5.0 attribute names, see: https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes.
		$name = preg_replace( '/[^a-z0-9-]+/', '', strtolower( $name ) );

		if ( empty( $name ) ) {
			continue;
		}

		if ( 'src' === $name ) {
			$value = esc_url( $value );
		} elseif ( ( 'width' === $name || 'height' === $name ) && ! empty( $value ) ) {
			$value = (int) $value;
		} else {
			$value = esc_attr( $value );
		}

		if ( empty( $value ) ) {
			$attr .= ' ' . $name;
		} else {
			$attr .= sprintf( ' %s="%s"', $name, $value );
		}
	}

	$image_tag = '<img' . $attr . ' />';

	// Replace the img tag.
	$html = preg_replace( '/<img\s?[^>]+>/', $image_tag, $html );

	return $html;
}
// Needs WP 5.0-beta4 to work.
add_filter( 'render_block', 'gutenberg_render_block_core_image', 10, 2 );

/**
 * Display the privacy policy help notice.
 *
 * In Gutenberg, the `edit_form_after_title` hook is not supported. Because
 * WordPress Core uses this hook to display this notice, it never displays.
 * Outputting the notice on the `admin_notices` hook allows Gutenberg to
 * consume the notice and display it with the Notices API.
 *
 * @since 4.5.0
 */
function gutenberg_show_privacy_policy_help_text() {
	if ( is_gutenberg_page() && has_action( 'edit_form_after_title', array( 'WP_Privacy_Policy_Content', 'notice' ) ) ) {
		remove_action( 'edit_form_after_title', array( 'WP_Privacy_Policy_Content', 'notice' ) );

		WP_Privacy_Policy_Content::notice( get_post() );
	}
}
add_action( 'admin_notices', 'gutenberg_show_privacy_policy_help_text' );
