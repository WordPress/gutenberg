<?php
/**
 * Server-side rendering of the `core/comment-form` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/comment-form` block on the server.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 *
 * @return string Returns the HTML representing the comments using the layout
 * defined by the block's inner blocks.
 */
function render_block_core_comment_form( $attributes, $content, $block ) {
	// Bail out early if the post ID is not set for some reason.
	if ( empty( $block->context['postId'] ) ) {
		return '';
	}

	$wrapper_attributes = get_block_wrapper_attributes();

	$form_contents = <<<END
	<h3 id="reply-title" class="comment-reply-title">Leave a Reply</h3>
	<form action="/wp-comments-post.php" method="post" id="commentform" class="comment-form" novalidate>
	<p class="comment-notes"><span id="email-notes">Your email address will not be published.</span> <span class="required-field-message" aria-hidden="true">Required fields are marked <span class="required" aria-hidden="true">*</span></span></p>
	<p class="comment-form-comment"><label for="comment">Comment <span class="required" aria-hidden="true">*</span></label><textarea id="comment" name="comment" cols="45" rows="8" maxlength="65525" required></textarea></p>
	<p class="comment-form-author"><label for="author">Name <span class="required" aria-hidden="true">*</span></label> <input id="author" name="author" type="text" value="" size="30" maxlength="245" required /></p>
	<input type="hidden" name="comment_post_ID" value="{$block->context['postId']}">
	<input type="submit" value="Submit">
	<form>
	END;


	return sprintf(
		'<div %1$s>%2$s</div>',
		$wrapper_attributes,
		$form_contents
	);
}

/**
 * Registers the `core/comment-form` block on the server.
 */
function register_block_core_comment_form() {
	register_block_type_from_metadata(
		__DIR__ . '/comment-form',
		array(
			'render_callback'   => 'render_block_core_comment_form',
			'skip_inner_blocks' => true,
		)
	);
}
add_action( 'init', 'register_block_core_comment_form' );

function add_comment_form_onsubmit_handler() {
    ?>
		<script>
			window.onload = function() {
				const form = document.querySelector( '.comment-form' );
				form.addEventListener( 'submit', submitted, false );
			}

			function submitted( event ) {
				event.preventDefault();
				const el = document.createElement( 'wp-comment-date' );
				document.body.append( el );
			}
		</script>
    <?php
}
add_action('wp_head', 'add_comment_form_onsubmit_handler');