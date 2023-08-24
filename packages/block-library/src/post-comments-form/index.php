<?php
/**
 * Server-side rendering of the `core/post-comments-form` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/post-comments-form` block on the server.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 * @return string Returns the filtered post comments form for the current post.
 */
function render_block_core_post_comments_form( $attributes, $content, $block ) {
	if ( ! isset( $block->context['postId'] ) ) {
		return '';
	}

	if ( post_password_required( $block->context['postId'] ) ) {
		return;
	}

	$classes = array( 'comment-respond' ); // See comment further below.
	if ( isset( $attributes['textAlign'] ) ) {
		$classes[] = 'has-text-align-' . $attributes['textAlign'];
	}
	if ( isset( $attributes['style']['elements']['link']['color']['text'] ) ) {
		$classes[] = 'has-link-color';
	}
	$wrapper_attributes = get_block_wrapper_attributes(
		array(
			'class'        => implode( ' ', $classes ),
			'data-wp-fill' => 'context.core.comments.replyTo',
		)
	);

	add_filter( 'comment_form_defaults', 'post_comments_form_block_form_defaults' );

	ob_start();
	comment_form( array(), $block->context['postId'] );
	$form = ob_get_clean();

	remove_filter( 'comment_form_defaults', 'post_comments_form_block_form_defaults' );

	// We use the outermost wrapping `<div />` returned by `comment_form()`
	// which is identified by its default classname `comment-respond` to inject
	// our wrapper attributes. This way, it is guaranteed that all styling applied
	// to the block is carried along when the comment form is moved to the location
	// of the 'Reply' link that the user clicked by Core's `comment-reply.js` script.
	$form = str_replace( 'class="comment-respond"', $wrapper_attributes, $form );

	$enhanced_submission = $block->context['enhancedSubmission'];
	$enhanced_form       = false;

	if ( $enhanced_submission ) {
		$p = new WP_HTML_Tag_Processor( $form );

		// Try to find the form element. This is not optinal, if it fails, we don't
		// enhance the submission.
		if ( $p->next_tag(
			array(
				'tag_name' => 'FORM',
				'id'       => 'commentform',
			)
		) ) {
			// Add the necessary directives.
			$p->set_attribute( 'data-wp-on--submit', 'actions.core.comments.submit' );

			// Try to find the different input fields and save their values on the
			// context so it can be restored when the form is moved around. This is
			// optional.
			//
			// TODO: Use `input[name="..."]` to find them, and add the rest of inputs.
			if ( $p->next_tag( 'textarea' ) ) {
				$p->set_attribute( 'data-wp-bind--value', 'context.core.comments.text' );
				$p->set_attribute( 'data-wp-on--change', 'actions.core.comments.updateText' );
			}

			// Try to find the submit button and add directives to change its value
			// on submission. This is optinal.
			while ( $p->next_tag( 'input' ) ) {
				if ( $p->get_attribute( 'type' ) === 'submit' ) {
					// Add the necessary directives.
					$p->set_attribute( 'data-wp-bind--value', 'selectors.core.comments.submitText' );
					$p->set_attribute( 'data-wp-bind--disabled', 'context.core.comments.isSubmitting' );

					// Add translated strings to the state.
					$submit_text = $p->get_attribute( 'value' );
					wp_store(
						array(
							'state'     => array(
								'core' => array(
									'comments' => array(
										'submitText'  => $submit_text,
										'loadingText' => __( 'Submitting…' ),
									),
								),
							),
							'selectors' => array(
								'core' => array(
									'comments' => array(
										'submitText' => $submit_text,
									),
								),
							),
						)
					);
					break;
				}
			}

			// Mark the block as interactive.
			$block->block_type->supports['interactivity'] = true;

			// Add a div to show error messages below the form and another div to
			// announce the spoken notices.
			wp_store(
				array(
					'state' => array(
						'core' => array(
							'comments' => array(
								'submittedNotice' => __( 'Comment submitted. You can continue navigating.' ),
							),
						),
					),
				)
			);
			$enhanced_form     = $p->get_updated_html();
			$last_div_position = strripos( $enhanced_form, '</form>' );
			$enhanced_form     = substr_replace(
				$enhanced_form,
				'<div 
					class="wp-block-post-comments-form__error"
					data-wp-style--display="selectors.core.comments.showError"
					data-wp-effect="effects.core.comments.scrollToError"
				>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
						<path d="M12 3.2c-4.8 0-8.8 3.9-8.8 8.8 0 4.8 3.9 8.8 8.8 8.8 4.8 0 8.8-3.9 8.8-8.8 0-4.8-4-8.8-8.8-8.8zm0 16c-4 0-7.2-3.3-7.2-7.2C4.8 8 8 4.8 12 4.8s7.2 3.3 7.2 7.2c0 4-3.2 7.2-7.2 7.2zM11 17h2v-6h-2v6zm0-8h2V7h-2v2z"></path>
					</svg>
					<span 
						data-wp-text="state.core.comments.error"
						aria-live="polite"
					></span>
				</div>
				<div
					style="position:absolute;clip:rect(0,0,0,0);width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;border:0;"
					aria-live="polite"
					data-wp-text="context.core.comments.notice"
				></div>
				</form>',
				$last_div_position,
				0
			);
		}
	}

	$view_asset = 'wp-block-post-comments-form-view';
	if ( ! wp_script_is( $view_asset ) ) {
		$script_handles = $block->block_type->view_script_handles;
		// If the script is not needed, and it is still in the `view_script_handles`, remove it.
		if ( ! $enhanced_submission && in_array( $view_asset, $script_handles, true ) ) {
			$block->block_type->view_script_handles = array_diff( $script_handles, array( $view_asset ) );
		}
		// If the script is needed, but it was previously removed, add it again.
		if ( $enhanced_submission && ! in_array( $view_asset, $script_handles, true ) ) {
			$block->block_type->view_script_handles = array_merge( $script_handles, array( $view_asset ) );
		}
	}

	if ( $enhanced_form ) {
		return $enhanced_form;
	}

	// If something failed or there is no enhanced submission, enqueue the regular
	// comment-reply script and return the HTML without the directives.
	wp_enqueue_script( 'comment-reply' );
	return $form;
}

/**
 * Registers the `core/post-comments-form` block on the server.
 */
function register_block_core_post_comments_form() {
	register_block_type_from_metadata(
		__DIR__ . '/post-comments-form',
		array(
			'render_callback' => 'render_block_core_post_comments_form',
		)
	);
}
add_action( 'init', 'register_block_core_post_comments_form' );

/**
 * Use the button block classes for the form-submit button.
 *
 * @param array $fields The default comment form arguments.
 *
 * @return array Returns the modified fields.
 */
function post_comments_form_block_form_defaults( $fields ) {
	if ( wp_is_block_theme() ) {
		$fields['submit_button'] = '<input name="%1$s" type="submit" id="%2$s" class="wp-block-button__link ' . wp_theme_get_element_class_name( 'button' ) . '" value="%4$s" />';
		$fields['submit_field']  = '<p class="form-submit wp-block-button">%1$s %2$s</p>';
	}

	return $fields;
}
