<?php
/**
 * Plugin Name: Gutenberg Test Many Starter Page Patterns
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-many-starter-page-patterns
 */

register_block_pattern_category(
	'test-landing',
	array( 'label' => 'Test Landing' )
);
register_block_pattern_category(
	'test-portfolio',
	array( 'label' => 'Test Portfolio' )
);

// 60 page start patterns, enough for several pages of previews: the first 30
// belong to "Test Landing", the next 25 to "Test Portfolio" and the last 5 to
// no category.
for ( $index = 1; $index <= 60; $index++ ) {
	$number = sprintf( '%02d', $index );

	if ( $index <= 30 ) {
		$categories = array( 'test-landing' );
	} elseif ( $index <= 55 ) {
		$categories = array( 'test-portfolio' );
	} else {
		$categories = array();
	}

	$column  = '<!-- wp:column --><div class="wp-block-column"><!-- wp:heading {"level":3} --><h3 class="wp-block-heading">Feature</h3><!-- /wp:heading --><!-- wp:paragraph --><p>A short description of what this page offers.</p><!-- /wp:paragraph --></div><!-- /wp:column -->';
	$content = '<!-- wp:group {"layout":{"type":"constrained"}} --><div class="wp-block-group">'
		. '<!-- wp:heading {"level":1} --><h1 class="wp-block-heading">Starter page ' . $number . '</h1><!-- /wp:heading -->'
		. '<!-- wp:paragraph --><p>An introduction to this page, long enough to wrap over a couple of lines in the preview.</p><!-- /wp:paragraph -->'
		. '<!-- wp:columns --><div class="wp-block-columns">' . $column . $column . $column . '</div><!-- /wp:columns -->'
		. '<!-- wp:buttons --><div class="wp-block-buttons"><!-- wp:button --><div class="wp-block-button"><a class="wp-block-button__link wp-element-button">Get in touch</a></div><!-- /wp:button --></div><!-- /wp:buttons -->'
		. '</div><!-- /wp:group -->';

	register_block_pattern(
		'many-starter-page-patterns/page-' . $number,
		array(
			'title'      => 'Starter page ' . $number,
			'categories' => $categories,
			'blockTypes' => array( 'core/post-content' ),
			'postTypes'  => array( 'page' ),
			'content'    => $content,
		)
	);
}
