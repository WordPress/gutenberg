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
 * @param  array $settings Original editor settings.
 * @return array           Filtered settings.
 */
function gutenberg_disable_editor_settings_wpautop( $settings ) {
	$post = get_post();
	if ( is_object( $post ) && gutenberg_post_has_blocks( $post ) ) {
		$settings['wpautop'] = false;
	}

	return $settings;
}
add_filter( 'wp_editor_settings', 'gutenberg_disable_editor_settings_wpautop' );

/**
 * Add TinyMCE fixes for the Classic Editor.
 *
 * @see https://core.trac.wordpress.org/ticket/44308
 */
function gutenberg_add_classic_editor_fixes() {
	// Temp add the fix for not creating paragraphs from HTML comments.
	// TODO: remove after 4.9.7, this should be in core.
	$script = <<<JS
jQuery( document ).on( 'tinymce-editor-setup', function( event, editor ) {
	var hasWpautop = ( window.wp && window.wp.editor && window.wp.editor.autop && editor.getParam( 'wpautop', true ) );

	editor.on( 'BeforeSetContent', function( event ) {
		if ( event.load && event.format !== 'raw' && ! hasWpautop ) {
			// Prevent creation of paragraphs out of multiple HTML comments.
			event.content = event.content.replace( /-->\s+<!--/g, '--><!--' );
		}
	});

	editor.on( 'SaveContent', function( event ) {
		if ( ! hasWpautop ) {
			// Restore formatting of block boundaries.
			event.content = event.content.replace( /-->\s*<!-- wp:/g, '-->\\n\\n<!-- wp:' );
		}
	});
});
JS;

	wp_add_inline_script( 'editor', $script, 'before' );

}
add_action( 'init', 'gutenberg_add_classic_editor_fixes' );

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
	if ( gutenberg_content_has_blocks( $content ) ) {
		return $content;
	}

	return wpautop( $content );
}
remove_filter( 'the_content', 'wpautop' );
add_filter( 'the_content', 'gutenberg_wpautop', 8 );

/**
 * Adds a warning to the Classic Editor when trying to edit a post containing blocks.
 *
 * @since 3.4.0
 */
function gutenberg_warn_classic_about_blocks() {
	global $pagenow;

	if ( ! in_array( $pagenow, array( 'post.php', 'post-new.php' ), true ) || ! isset( $_REQUEST['classic-editor'] ) ) {
		return;
	}

	if ( isset( $_REQUEST['hide-block-warning'] ) ) {
		return;
	}

	$post = get_post();
	if ( ! $post ) {
		return;
	}

	if ( ! gutenberg_post_has_blocks( $post ) ) {
		return;
	}

	$gutenberg_edit_link = $classic_edit_link = get_edit_post_link( $post->ID, 'raw' );

	$classic_edit_link = add_query_arg( array(
		'classic-editor' => '',
		'hide-block-warning' => '',
	), $classic_edit_link );

	$revisions_link = '';
	if ( wp_revisions_enabled( $post ) ) {
		$revisions = wp_get_post_revisions( $post );

		// If there's only one revision, that won't help.
		if ( count( $revisions ) > 1 ) {
			reset( $revisions ); // Reset pointer for key()
			$revisions_link = get_edit_post_link( key( $revisions ) );
		}
	}

	?>
		<style type="text/css">
			/*
			 * Styles copied from wp-admin/css/edit.css
			 */

			#blocks-in-post-dialog .notification-dialog {
				width: 500px;
				margin-left: -250px;
			}
			#blocks-in-post-dialog .blocks-in-post-message {
				margin: 25px;
			}

			#blocks-in-post-dialog .post-locked-message a.button {
				margin-right: 10px;
			}

			#blocks-in-post-dialog .wp-tab-first {
				outline: 0;
			}


		</style>
		<div id="blocks-in-post-dialog" class="notification-dialog-wrap">
			<div class="notification-dialog-background"></div>
			<div class="notification-dialog">
				<div class="blocks-in-post-message">
					<p class="wp-tab-first" tabindex="0">
						<?php
							_e( 'This post was previously edited in the Gutenberg. While you can continue and edit in the Classic Editor, you may lose data or formatting from the Gutenberg version of this page.', 'gutenberg' );
						?>
					</p>
					<?php
						if ( $revisions_link ) {
							?>
								<p><?php _e( 'To continue anyway, click the "Edit in Classic Editor" button. You can also find an earlier revision to edit by clicking the "Browse Revisions" button. Otherwise, press "Edit in Gutenberg" to keep this post in Gutenberg.', 'gutenberg' ); ?></p>
							<?php
						} else {
							?>
								<p><strong><?php _e( "Because this post doesn't have revisions, you won't be able to restore an earlier version of your content.", 'gutenberg' ); ?></strong></p>
								<p><?php _e( 'To continue anyway, click the "Edit in Classic Editor" button. Otherwise, press "Edit in Gutenberg" to continue to Gutenberg, preserving your content and formatting.', 'gutenberg' ); ?></p>
							<?php
						}
					?>
					<p>
						<a class="button" href="<?php echo esc_url( $classic_edit_link ); ?>"><?php _e( 'Edit in Classic Editor', 'gutenberg' ); ?></a>
						<?php
							if ( $revisions_link ) {
								?>
									<a class="button" href="<?php echo esc_url( $revisions_link ); ?>"><?php _e( 'Browse Revisions', 'gutenberg' ); ?></a>
								<?php
							}
						?>
						<a class="button button-primary" href="<?php echo esc_url( $gutenberg_edit_link ); ?>"><?php _e( 'Edit in Gutenberg', 'gutenberg' ); ?></a>
					</p>
				</div>
			</div>
		</div>
	<?php
}
add_action( 'admin_footer', 'gutenberg_warn_classic_about_blocks' );
