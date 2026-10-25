<?php
/**
 * Optional block delimiters: reads HTML outside block delimiters as blocks on
 * the server too, the same way the editor does, so render filters see each
 * block whether or not it has delimiters.
 *
 * @package gutenberg
 */

require_once __DIR__ . '/class-gutenberg-undelimited-tag-processor.php';
require_once __DIR__ . '/class-gutenberg-undelimited-block-parser.php';

/**
 * Renders post content like `do_blocks()`, reading HTML outside delimiters as
 * blocks. Only content is rendered this way: code that parses and serializes
 * blocks again, like kses, needs the default parser, which keeps HTML as is.
 *
 * @param string $content Post content.
 * @return string Rendered content.
 */
function gutenberg_do_blocks_without_delimiters( $content ) {
	$parser = new Gutenberg_Undelimited_Block_Parser();
	$output = '';
	foreach ( $parser->parse( $content ) as $block ) {
		$output .= render_block( $block );
	}

	// If there are blocks in this content, we shouldn't run wpautop() on it later.
	$priority = has_filter( 'the_content', 'wpautop' );
	if ( false !== $priority && doing_filter( 'the_content' ) && has_blocks( $content ) ) {
		remove_filter( 'the_content', 'wpautop', $priority );
		add_filter( 'the_content', '_restore_wpautop_hook', $priority + 1 );
	}

	return $output;
}

remove_filter( 'the_content', 'do_blocks', 9 );
add_filter( 'the_content', 'gutenberg_do_blocks_without_delimiters', 9 );
