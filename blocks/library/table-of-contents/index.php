<?php
/**
 * Server-side rendering of the `core/table-of-contents` block.
 *
 * @package gutenberg
 */

/**
 * Renders the `core/table-of-contents` block on server.
 *
 * @param array $attributes The block attributes.
 *
 * @return string Returns the post content with table-of-contents added.
 */
function gutenberg_render_block_core_table_of_contents( $attributes ) {
	global $post;

	if ( empty( $post->post_content ) ) {
		return '<!-- Here should be a table of contents, if you were in the_loop(). -->';
	}

	$blocks = gutenberg_parse_blocks( $post->post_content );
	$headings = array_filter( $blocks, 'filter_block_array_for_headings' );
	
	if ( ! $headings ) {
		return '<!-- There were no headings. -->';
	}

	$html = '';

	$levelCounts = array(
		1 => 0,
		2 => 0,
		3 => 0,
		4 => 0,
		5 => 0,
		6 => 0,
	);

	foreach ( $headings as $heading ) {
		$content = trim( $heading['rawContent'] );
		if ( ! $content ) {
			continue;
		}

		preg_match( '/^<h([1-6]) id="([^"]+)"/i', $content, $matches );
		if ( ! $matches[1] ) {
			continue;
		}

		$levelCounts[ $matches[1] ]++;

		$levelString = '';
		if ( $attributes['numbered'] ) {
			$levelString = create_level_string( $levelCounts, $matches[1] ) . ' ';
		}

		$html .= "<li class='level{$matches[1]}'>$levelString<a href='#$matches[2]'>" . wp_strip_all_tags( $content ) . '</a></li>';

	}

	if ( $html ) {
		$html = "<ul class='wp-block-table-of-contents'>$html</ul>";
		return "<h2>{$attributes['title']}</h2>$html";
	}

	return '<!-- There were no valid headings -->';
}

function filter_block_array_for_headings( $block ) {
	return 'core/heading' === $block['blockName'];
}

function create_level_string( $levelCounts, $level ) {
	$string = '';
	for ( $ii = 2; $ii <= $level; $ii++ ) {
		$string .= $levelCounts[ $ii ];
		if ( $ii != $level ) {
			$string .= '.';
		}
	}

	for ( ; $ii <= 6; $ii++ ) {
		$levelCounts[ $ii ] = 0;
	}

	return $string;
}

register_block_type( 'core/table-of-contents', array(
	'attributes' => array(
		'title' => array(
			'type'    => 'string',
			'default' => __( 'Table of Contents', 'gutenberg' ),
		),
		'numbered' => array(
			'type'    => 'bool',
			'default' => true,
		),
	),
	'render_callback' => 'gutenberg_render_block_core_table_of_contents',
) );
