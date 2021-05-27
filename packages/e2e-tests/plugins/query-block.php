<?php
/**
 * Plugin Name: Gutenberg Test Query Loop block
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-query-loop-block
 */

/**
 * We need to register a couple of `Query Loop` patterns to test the
 * setup of the block and have reliable results.
 */
register_block_pattern(
	'query-loop-test-1',
	array(
		'title'      => __( 'Query Loop Test 1', 'gutenberg' ),
		'blockTypes' => array( 'core/query-loop' ),
		'content'    => '<!-- wp:query-loop {"query":{"perPage":1,"pages":0,"offset":0,"postType":"post","categoryIds":[],"tagIds":[],"order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":true}} -->
						<div class="wp-block-query-loop">
						<!-- wp:post-template -->
						<!-- wp:post-title {"isLink":true} /-->
						<!-- /wp:post-template -->
						</div>
						<!-- /wp:query-loop -->',
	)
);
register_block_pattern(
	'query-loop-test-2',
	array(
		'title'      => __( 'Query Loop Test 2', 'gutenberg' ),
		'blockTypes' => array( 'core/query' ),
		'content'    => '<!-- wp:query-loop {"query":{"perPage":1,"pages":0,"offset":0,"postType":"post","categoryIds":[],"tagIds":[],"order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":true}} -->
						<div class="wp-block-query-loop">
						<!-- wp:post-template -->
						<!-- wp:post-title {"isLink":true} /-->
						<!-- wp:post-date /-->
						<!-- /wp:post-template -->
						</div>
						<!-- /wp:query-loop -->',
	)
);
