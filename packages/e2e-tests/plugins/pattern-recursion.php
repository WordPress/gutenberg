<?php
/**
 * Plugin Name: Gutenberg Test Protection Against Recursive Patterns
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-pattern-recursion
 */

add_filter(
	'init',
	function () {
		register_block_pattern(
			'evil/recursive',
			array(
				'title'       => 'Evil recursive',
				'description' => 'Evil recursive',
				'content'     => '<!-- wp:paragraph --><p>Hello</p><!-- /wp:paragraph --><!-- wp:pattern {"slug":"evil/recursive"} /-->',
			)
		);
	}
);
