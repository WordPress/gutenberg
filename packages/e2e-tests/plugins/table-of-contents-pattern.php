<?php
/**
 * Plugin Name: Gutenberg Test Table of Contents Pattern
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-table-of-contents-pattern
 */

/**
 * Registers a deterministic server-side block pattern for the Table of Contents
 * e2e tests in test/e2e/specs/editor/blocks/table-of-contents.spec.js.
 *
 * `core/pattern` renders patterns from the server registry on the front end, so
 * the ToC test needs a real registered pattern rather than editor-only pattern
 * settings or a fixture owned by another spec.
 */
function gutenberg_test_table_of_contents_pattern_register() {
	register_block_pattern(
		'gutenberg-test/table-of-contents-pattern-heading',
		array(
			'title'   => 'Table of Contents Pattern Heading',
			'content' => '<!-- wp:heading {"anchor":"registered-pattern-heading"} --><h2 id="registered-pattern-heading" class="wp-block-heading">Registered pattern heading</h2><!-- /wp:heading -->',
		)
	);
}
add_action( 'init', 'gutenberg_test_table_of_contents_pattern_register' );
