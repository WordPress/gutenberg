<?php
/**
 * Plugin Name: Gutenberg Test Allowed Patterns
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-allowed-patterns
 */

register_block_pattern(
	'test-allowed-patterns/lone-heading',
	array(
		'title'   => 'Test: Single heading',
		'content' => '<!-- wp:heading --><h2>Hello!</h2><!-- /wp:heading -->',
	)
);

register_block_pattern(
	'test-allowed-patterns/lone-paragraph',
	array(
		'title'   => 'Test: Single paragraph',
		'content' => '<!-- wp:paragraph --><p>Hello!</p><!-- /wp:paragraph -->',
	)
);

register_block_pattern(
	'test-allowed-patterns/paragraph-inside-group',
	array(
		'title'   => 'Test: Paragraph inside group',
		'content' => '<!-- wp:group --><div class="wp-block-group"><!-- wp:paragraph --><p>Hello!</p><!-- /wp:paragraph --></div><!-- /wp:group -->',
	)
);
