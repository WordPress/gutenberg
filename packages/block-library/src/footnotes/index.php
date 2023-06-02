<?php
/**
 * Server-side rendering of the `core/comment-template` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/comment-template` block on the server.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 *
 * @return string Returns the HTML representing the comments using the layout
 * defined by the block's inner blocks.
 */
function render_block_core_footnotes( $attributes, $content, $block ) {
	// Bail out early if the post ID is not set for some reason.
	if ( empty( $block->context['postId'] ) ) {
		return '';
	}

	if ( post_password_required( $block->context['postId'] ) ) {
		return;
	}

    $footnotes = get_post_meta( $block->context['postId'], 'footnotes', true );
    $footnotes = json_decode( $footnotes, true );

    var_dump($footnotes);

	if ( count( $footnotes ) === 0 ) {
		return '';
	}

	$wrapper_attributes = get_block_wrapper_attributes();

    $block_content = '';

    foreach ( $footnotes as $footnote ) {
        $block_content .= sprintf(
            '<li id="%1$s">%2$s <a href="#%1$s-link">↩︎</a></li>',
            $footnote['id'],
            $footnote['content']
        );
    }

	return sprintf(
		'<ol %1$s>%2$s</ol>',
		$wrapper_attributes,
		$block_content
	);
}

/**
 * Registers the `core/comment-template` block on the server.
 */
function register_block_core_footnotes() {
	register_block_type_from_metadata(
		__DIR__ . '/footnotes',
		array(
			'render_callback'   => 'render_block_core_footnotes',
		)
	);
}
add_action( 'init', 'register_block_core_footnotes' );
