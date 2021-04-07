<?php
/**
 * Block patterns registration.
 *
 * @package gutenberg
 */

register_block_pattern_category( 'Query', array( 'label' => __( 'Query', 'gutenberg' ) ) );

// Initial Query block patterns.
register_block_pattern(
	'query/large-posts',
	array(
		'title'      => __( 'Large', 'gutenberg' ),
		'blockTypes' => array( 'core/query' ),
		'categories' => array( 'Query' ),
		'content'    => '<!-- wp:query {"query":{"perPage":1,"pages":0,"offset":0,"postType":"post","categoryIds":[],"tagIds":[],"order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":true}} -->
						<!-- wp:query-loop -->
						<!-- wp:post-title {"isLink":true} /-->
						<!-- wp:post-featured-image  {"isLink":true,"align":"wide"} /-->
						<!-- wp:post-excerpt /-->
						<!-- wp:separator -->
						<hr class="wp-block-separator"/>
						<!-- /wp:separator -->
						<!-- wp:post-date /-->
						<!-- /wp:query-loop -->
						<!-- /wp:query -->',
	)
);

register_block_pattern(
	'query/medium-posts',
	array(
		'title'      => __( 'Medium', 'gutenberg' ),
		'blockTypes' => array( 'core/query' ),
		'categories' => array( 'Query' ),
		'content'    => '<!-- wp:query {"query":{"perPage":1,"pages":0,"offset":0,"postType":"post","categoryIds":[],"tagIds":[],"order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":true}} -->
						<!-- wp:query-loop -->
						<!-- wp:columns {"align":"wide"} -->
						<div class="wp-block-columns alignwide"><!-- wp:column {"width":"66.66%"} -->
						<div class="wp-block-column" style="flex-basis:66.66%"><!-- wp:post-featured-image {"isLink":true} /--></div>
						<!-- /wp:column -->
						<!-- wp:column {"width":"33.33%"} -->
						<div class="wp-block-column" style="flex-basis:33.33%"><!-- wp:post-title {"isLink":true} /-->
						<!-- wp:post-excerpt /--></div>
						<!-- /wp:column --></div>
						<!-- /wp:columns -->
						<!-- /wp:query-loop -->
						<!-- /wp:query -->',
	)
);

register_block_pattern(
	'query/small-posts',
	array(
		'title'      => __( 'Small', 'gutenberg' ),
		'blockTypes' => array( 'core/query' ),
		'categories' => array( 'Query' ),
		'content'    => '<!-- wp:query {"query":{"perPage":1,"pages":0,"offset":0,"postType":"post","categoryIds":[],"tagIds":[],"order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":true}} -->
						<!-- wp:query-loop -->
						<!-- wp:columns {"verticalAlignment":"center"} -->
						<div class="wp-block-columns are-vertically-aligned-center"><!-- wp:column {"verticalAlignment":"center","width":"25%"} -->
						<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:25%"><!-- wp:post-featured-image {"isLink":true} /--></div>
						<!-- /wp:column -->
						<!-- wp:column {"verticalAlignment":"center","width":"75%"} -->
						<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:75%"><!-- wp:post-title {"isLink":true} /--></div>
						<!-- /wp:column --></div>
						<!-- /wp:columns -->
						<!-- /wp:query-loop -->
						<!-- /wp:query -->',
	)
);
