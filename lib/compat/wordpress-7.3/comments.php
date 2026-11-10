<?php
/**
 * Comment compatibility functions for WordPress 7.3.
 *
 * @package gutenberg
 */

/**
 * Exposes the filtered comment form strings to the block editor so the
 * Post Comments Form block placeholder matches the front end.
 *
 * `comment_form()` builds its defaults in a function local and applies
 * `comment_form_defaults` there, so there is no accessor to call. The array
 * below mirrors every key core defines: post-independent values are real,
 * post-dependent ones (fields, logged_in_as, must_log_in, comment_notes_before)
 * are empty, so a filter that reads them before writing gets a string rather
 * than a notice.
 *
 * @see https://github.com/WordPress/gutenberg/issues/49196
 *
 * @param array $settings Block editor settings.
 * @return array Filtered block editor settings.
 */
function gutenberg_add_comment_form_defaults_to_editor_settings( $settings ) {
	$html5              = current_theme_supports( 'html5', 'comment-form' );
	$required           = (bool) get_option( 'require_name_email' );
	$required_attribute = $required ? ' required' : '';
	$required_indicator = $required ? ' ' . wp_required_field_indicator() : '';

	$defaults = array(
		'fields'               => array(),
		'comment_field'        => sprintf(
			'<p class="comment-form-comment">%s %s</p>',
			sprintf(
				'<label for="comment">%s%s</label>',
				_x( 'Comment', 'noun' ),
				$required_indicator
			),
			'<textarea id="comment" name="comment" cols="45" rows="8" maxlength="65525"' . $required_attribute . '></textarea>'
		),
		'must_log_in'          => '',
		'logged_in_as'         => '',
		'comment_notes_before' => '',
		'comment_notes_after'  => '',
		'action'               => site_url( '/wp-comments-post.php' ),
		'novalidate'           => false,
		'id_form'              => 'commentform',
		'id_submit'            => 'submit',
		'class_container'      => 'comment-respond',
		'class_form'           => 'comment-form',
		'class_submit'         => 'submit',
		'name_submit'          => 'submit',
		'title_reply'          => __( 'Leave a Reply' ),
		/* translators: %s: Author of the comment being replied to. */
		'title_reply_to'       => __( 'Leave a Reply to %s' ),
		'title_reply_before'   => '<h3 id="reply-title" class="comment-reply-title">',
		'title_reply_after'    => '</h3>',
		'cancel_reply_before'  => ' <small>',
		'cancel_reply_after'   => '</small>',
		'cancel_reply_link'    => __( 'Cancel reply' ),
		'label_submit'         => __( 'Post Comment' ),
		'submit_button'        => '<input name="%1$s" type="submit" id="%2$s" class="%3$s" value="%4$s" />',
		'submit_field'         => '<p class="form-submit">%1$s %2$s</p>',
		'format'               => $html5 ? 'html5' : 'xhtml',
	);

	/** This filter is documented in wp-includes/comment-template.php */
	$filtered = apply_filters( 'comment_form_defaults', $defaults );
	// Match comment_form()'s own guard against filters dropping keys.
	$filtered = array_merge( $defaults, (array) $filtered );

	$settings['__experimentalDiscussionSettings']['commentFormDefaults'] = array(
		'titleReply'  => (string) $filtered['title_reply'],
		'labelSubmit' => (string) $filtered['label_submit'],
	);

	return $settings;
}
add_filter( 'block_editor_settings_all', 'gutenberg_add_comment_form_defaults_to_editor_settings' );
