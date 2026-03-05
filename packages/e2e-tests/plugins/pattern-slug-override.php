<?php
/**
 * Plugin Name: Gutenberg Test Pattern Slug Override
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-pattern-slug-override
 */

add_action(
	'init',
	function () {
		register_block_pattern(
			'test/slug-pattern',
			array(
				'title'   => 'Slug Pattern',
				'content' => '<!-- wp:heading --><h2 class="wp-block-heading">Pattern Heading</h2><!-- /wp:heading --><!-- wp:paragraph --><p>Pattern paragraph content</p><!-- /wp:paragraph -->',
			)
		);

		register_block_pattern(
			'test/slug-pattern-with-overrides',
			array(
				'title'   => 'Slug Pattern With Overrides',
				'content' => '<!-- wp:heading {"metadata":{"name":"heading","bindings":{"__default":{"source":"core/pattern-overrides"}}}} --><h2 class="wp-block-heading">Default Heading</h2><!-- /wp:heading --><!-- wp:paragraph {"metadata":{"name":"description","bindings":{"__default":{"source":"core/pattern-overrides"}}}} --><p>Default description</p><!-- /wp:paragraph -->',
			)
		);
	}
);
