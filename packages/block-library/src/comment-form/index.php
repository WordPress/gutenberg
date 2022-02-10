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
	<turbo-frame id="new_comment">
	<form action="/wp-comments-post.php" method="post">
	<label for="name">Name:</label>
	<input type="text" id="name" name="name" required size="10">

	<label for="comment">Tell us your story:</label>
	<textarea id="comment" name="comment" rows="5" cols="33">
		It was a dark and stormy night...
	</textarea>
	<input type="hidden" name="comment_post_ID" value="{$block->context['postId']}">
	<input type="submit" value="Submit">
	<form>
	</turbo-frame>
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

function hook_javascript() {
    ?>
		<script type="module">
			import hotwiredTurbo from 'https://cdn.skypack.dev/@hotwired/turbo';
		</script>
    <?php
}
add_action('wp_head', 'hook_javascript');