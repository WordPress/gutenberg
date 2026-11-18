<?php
/**
 * Plugin Name: Gutenberg Test Starter Page Patterns
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-starter-page-patterns
 */

register_block_pattern_category(
	'test-about',
	array( 'label' => 'Test About' )
);
register_block_pattern_category(
	'test-services',
	array( 'label' => 'Test Services' )
);
register_block_pattern_category(
	'test-post-only',
	array( 'label' => 'Test Post Only' )
);

register_block_pattern(
	'starter-page-patterns/about',
	array(
		'title'      => 'About page',
		'categories' => array( 'test-about' ),
		'blockTypes' => array( 'core/post-content' ),
		'postTypes'  => array( 'page' ),
		'content'    => '<!-- wp:heading --><h2 class="wp-block-heading">About us</h2><!-- /wp:heading --><!-- wp:paragraph --><p>We build websites.</p><!-- /wp:paragraph -->',
	)
);

register_block_pattern(
	'starter-page-patterns/services',
	array(
		'title'      => 'Services page',
		'categories' => array( 'test-services' ),
		'blockTypes' => array( 'core/post-content' ),
		'postTypes'  => array( 'page' ),
		'content'    => '<!-- wp:heading --><h2 class="wp-block-heading">Our services</h2><!-- /wp:heading -->',
	)
);

register_block_pattern(
	'starter-page-patterns/no-category',
	array(
		'title'      => 'Plain page',
		'blockTypes' => array( 'core/post-content' ),
		'postTypes'  => array( 'page' ),
		'content'    => '<!-- wp:paragraph --><p>A plain start.</p><!-- /wp:paragraph -->',
	)
);

register_block_pattern(
	'starter-page-patterns/post-only',
	array(
		'title'      => 'Post call to action',
		'categories' => array( 'test-post-only' ),
		'blockTypes' => array( 'core/post-content' ),
		'postTypes'  => array( 'post' ),
		'content'    => '<!-- wp:paragraph --><p>Posts only.</p><!-- /wp:paragraph -->',
	)
);
