<?php
/**
 * Plugin Name: Gutenberg Test Query block
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-query-block
 */

/**
 * We need to register a couple of `Query` patterns to test the
 * setup of the block and have reliable results.
 */
register_block_pattern(
	'query/test-1',
	array(
		'title'      => __( 'Query Test 1', 'gutenberg' ),
		'blockTypes' => array( 'core/query' ),
		'content'    => '<!-- wp:query {"query":{"perPage":1,"pages":0,"offset":0,"postType":"post","order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":true}} -->
						<!-- wp:post-template -->
						<!-- wp:post-title {"isLink":true} /-->
						<!-- /wp:post-template -->
						<!-- /wp:query -->',
	)
);
register_block_pattern(
	'query/test-2',
	array(
		'title'      => __( 'Query Test 2', 'gutenberg' ),
		'blockTypes' => array( 'core/query' ),
		'content'    => '<!-- wp:query {"query":{"perPage":1,"pages":0,"offset":0,"postType":"post","order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":true}} -->
						<!-- wp:post-template -->
						<!-- wp:post-title {"isLink":true} /-->
						<!-- wp:post-date /-->
						<!-- /wp:post-template -->
						<!-- /wp:query -->',
	)
);
