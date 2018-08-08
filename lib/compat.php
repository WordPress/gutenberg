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
	if ( 'content' === $editor_id && is_object( $post ) && gutenberg_post_has_blocks( $post ) ) {
		$settings['wpautop'] = false;
	}

	return $settings;
}
add_filter( 'wp_editor_settings', 'gutenberg_disable_editor_settings_wpautop', 10, 2 );

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

	if ( ! gutenberg_post_has_blocks( $post ) && ! isset( $_REQUEST['cloudflare-error'] ) ) {
		return;
	}

	// Enqueue the JS we're going to need in the dialog.
	wp_enqueue_script( 'wp-a11y' );
	wp_enqueue_script( 'wp-sanitize' );

	if ( isset( $_REQUEST['cloudflare-error'] ) ) {
		add_action( 'admin_footer', 'gutenberg_warn_classic_about_cloudflare' );
	} else {
		add_action( 'admin_footer', 'gutenberg_warn_classic_about_blocks' );
	}
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
	$classic_edit_link = add_query_arg( array(
		'classic-editor'     => '',
		'hide-block-warning' => '',
	), $classic_edit_link );

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
				padding: 25px;
			}

			@media only screen and (max-height: 480px), screen and (max-width: 450px) {
				#blocks-in-post-dialog .notification-dialog {
					width: 100%;
					height: 100%;
					max-height: 100%;
					position: fixed;
					top: 0;
					margin: 0;
					left: 0;
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
								printf( __( 'You can also <a href="%s">browse previous revisions</a> and restore a version of the page before it was edited in Gutenberg.', 'gutenberg' ), esc_url( $revisions_link ) );
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
 * Adds a warning to the Classic Editor when CloudFlare is blocking REST API requests.
 *
 * @since 3.4.0
 */
function gutenberg_warn_classic_about_cloudflare() {
	?>
		<style type="text/css">
			#cloudflare-block-dialog .notification-dialog {
				padding: 25px;
			}

			#cloudflare-block-dialog ul {
				list-style: initial;
				padding-left: 20px;
			}

			@media only screen and (max-height: 480px), screen and (max-width: 450px) {
				#cloudflare-block-dialog .notification-dialog {
					width: 100%;
					height: 100%;
					max-height: 100%;
					position: fixed;
					top: 0;
					margin: 0;
					left: 0;
				}
			}
		</style>

		<div id="cloudflare-block-dialog" class="notification-dialog-wrap">
			<div class="notification-dialog-background"></div>
			<div class="notification-dialog">
				<div class="cloudflare-block-message">
					<h2><?php _e( 'Cloudflare is blocking REST API requests.', 'gutenberg' ); ?></h2>
					<p><?php _e( 'Your site uses Cloudflare, which provides a Web Application Firewall (WAF) to secure your site against attacks. Unfortunately, some of these WAF rules are incorrectly blocking legitimate access to your site, preventing Gutenberg from functioning correctly.', 'gutenberg' ); ?></p>
					<p><?php _e( "We're working closely with Cloudflare to fix this issue, but in the mean time, you can work around it in one of two ways:", 'gutenberg' ); ?></p>
					<ul>
						<li><?php _e( 'If you have a Cloudflare Pro account, log in to Cloudflare, visit the Firewall settings page, open the "Cloudflare Rule Set" details, open the "Cloudflare WordPress" ruleset, then set the rules "WP0025A" and "WP0025B" to "Disable".', 'gutenberg' ); ?></li>
						<li>
						<?php
							printf(
								/* translators: %s: link to a comment in the Gutenberg repository */
								__( 'For free Cloudflare accounts, you can <a href="%s">change the REST API URL</a>, to avoid triggering the WAF rules. Please be aware that this may cause issues with other plugins that use the REST API, and removes any other protection Cloudflare may be offering for the REST API.', 'gutenberg' ),
								'https://github.com/WordPress/gutenberg/issues/2704#issuecomment-410582252'
							);
						?>
						</li>
					</ul>
					<p>
					<?php
						printf(
							/* translators: %s link to an issue in the Gutenberg repository */
							__( 'If neither of these options are possible for you, please <a href="%s">follow this issue for updates</a>. We hope to have this issue rectifed soon!', 'gutenberg' ),
							'https://github.com/WordPress/gutenberg/issues/2704'
						);
					?>
					</p>
				</div>
				<p>
					<button type="button" class="button button-primary cloudflare-block-classic-button"><?php _e( 'Continue to Classic Editor', 'gutenberg' ); ?></button>
				</p>
			</div>
		</div>

		<script type="text/javascript">
			/* <![CDATA[ */
			( function( $ ) {
				var dialog = {};

				dialog.init = function() {
					// The modal
					dialog.warning = $( '#cloudflare-block-dialog' );
					// Get the links and buttons within the modal.
					dialog.warningTabbables = dialog.warning.find( 'a, button' );

					// Get the text within the modal.
					dialog.rawMessage = dialog.warning.find( '.cloudflare-block-message' ).text();

					// Hide all the #wpwrap content from assistive technologies.
					$( '#wpwrap' ).attr( 'aria-hidden', 'true' );

					// Detach the warning modal from its position and append it to the body.
					$( document.body )
						.addClass( 'modal-open' )
						.append( dialog.warning.detach() );

					// Reveal the modal and set focus on the Gutenberg button.
					dialog.warning
						.removeClass( 'hidden' )
						.find( '.cloudflare-block-gutenberg-button' ).focus();

					// Attach event handlers.
					dialog.warningTabbables.on( 'keydown', dialog.constrainTabbing );
					dialog.warning.on( 'click', '.cloudflare-block-classic-button', dialog.dismissWarning );

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
