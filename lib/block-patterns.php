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

register_block_pattern(
	'query/posts-grid',
	array(
		'title'      => __( 'Post Grid', 'gutenberg' ),
		'blockTypes' => array( 'core/query' ),
		'categories' => array( 'Query' ),
		'content'    => '<!-- wp:query {"query":{"perPage":6,"pages":0,"offset":0,"postType":"post","categoryIds":[],"tagIds":[],"order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"exclude","inherit":true},"layout":{"type":"flex","columns":3}} -->
						<!-- wp:query-loop -->
						<!-- wp:group {"tagName":"main","style":{"spacing":{"padding":{"top":"30px","right":"30px","bottom":"30px","left":"30px"}}},"layout":{"inherit":false}} -->
						<main class="wp-block-group" style="padding-top:30px;padding-right:30px;padding-bottom:30px;padding-left:30px"><!-- wp:post-title {"isLink":true} /-->
						<!-- wp:post-excerpt /-->
						<!-- wp:post-date /--></div>
						<!-- /wp:group -->
						<!-- /wp:query-loop -->
						<!-- /wp:query -->',
	)
);

register_block_pattern(
	'query/large-title-and-date',
	array(
		'title'      => __( 'Large Title and Date', 'gutenberg' ),
		'blockTypes' => array( 'core/query' ),
		'categories' => array( 'Query' ),
		'content'    => '<!-- wp:group {"align":"full","backgroundColor":"black","textColor":"white","style":{"spacing":{"padding":{"top":"100px","right":"100px","bottom":"100px","left":"100px"}}}} -->
						<div class="wp-block-group alignfull has-white-color has-black-background-color has-text-color has-background" style="padding-top:100px;padding-right:100px;padding-bottom:100px;padding-left:100px">
						<!-- wp:query {"query":{"perPage":3,"pages":0,"offset":0,"postType":"post","categoryIds":[],"tagIds":[],"order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":true}} -->
						<!-- wp:query-loop -->
						<!-- wp:separator {"color":"white","align":"wide","className":"is-style-wide"} -->
						<hr class="wp-block-separator alignwide has-text-color has-background has-white-background-color has-white-color is-style-wide"/>
						<!-- /wp:separator -->
						<!-- wp:columns {"verticalAlignment":"center","align":"wide"} -->
						<div class="wp-block-columns alignwide are-vertically-aligned-center"><!-- wp:column {"verticalAlignment":"center","width":"20%"} -->
						<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:20%"><!-- wp:post-date {"textColor":"white","fontSize":"extra-small"} /--></div>
						<!-- /wp:column -->
						<!-- wp:column {"verticalAlignment":"center","width":"80%"} -->
						<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:80%"><!-- wp:post-title {"style":{"typography":{"fontSize":"72px","lineHeight":"1.1"}},"textColor":"white"} /--></div>
						<!-- /wp:column --></div>
						<!-- /wp:columns -->
						<!-- /wp:query-loop -->
						<!-- /wp:query --></div>
						<!-- /wp:group -->',
	)
);

register_block_pattern(
	'query/offset-posts',
	array(
		'title'      => __( 'Offset Posts', 'gutenberg' ),
		'blockTypes' => array( 'core/query' ),
		'categories' => array( 'Query' ),
		'content'    => '<!-- wp:group {"tagName":"main","style":{"spacing":{"padding":{"top":"30px","right":"30px","bottom":"30px","left":"30px"}}},"layout":{"inherit":false}} -->
						<main class="wp-block-group" style="padding-top:30px;padding-right:30px;padding-bottom:30px;padding-left:30px"><!-- wp:columns -->
						<div class="wp-block-columns"><!-- wp:column {"width":"50%"} -->
						<div class="wp-block-column" style="flex-basis:50%"><!-- wp:query {"query":{"perPage":2,"pages":0,"offset":0,"postType":"post","categoryIds":[],"tagIds":[],"order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"exclude","inherit":false},"layout":{"type":"list"}} -->
						<!-- wp:query-loop -->
						<!-- wp:post-featured-image /-->
						<!-- wp:post-title /-->
						<!-- wp:post-date /-->
						<!-- wp:spacer {"height":200} -->
						<div style="height:200px" aria-hidden="true" class="wp-block-spacer"></div>
						<!-- /wp:spacer -->
						<!-- /wp:query-loop -->
						<!-- /wp:query --></div>
						<!-- /wp:column -->
						<!-- wp:column {"width":"50%"} -->
						<div class="wp-block-column" style="flex-basis:50%"><!-- wp:query {"query":{"perPage":2,"pages":0,"offset":2,"postType":"post","categoryIds":[],"tagIds":[],"order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"exclude","inherit":false},"layout":{"type":"list"}} -->
						<!-- wp:query-loop -->
						<!-- wp:spacer {"height":200} -->
						<div style="height:200px" aria-hidden="true" class="wp-block-spacer"></div>
						<!-- /wp:spacer -->
						<!-- wp:post-featured-image /-->
						<!-- wp:post-title /-->
						<!-- wp:post-date /-->
						<!-- /wp:query-loop -->
						<!-- /wp:query --></div>
						<!-- /wp:column --></div>
						<!-- /wp:columns --></main>
						<!-- /wp:group -->',
	)
);
