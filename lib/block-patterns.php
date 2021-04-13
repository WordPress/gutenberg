<?php
/**
 * Block patterns registration.
 *
 * @package gutenberg
 */

register_block_pattern_category( 'Query', array( 'label' => __( 'Query', 'gutenberg' ) ) );

// Initial Query block patterns.
register_block_pattern(
	'query/standard-posts',
	array(
		'title'      => __( 'Standard', 'gutenberg' ),
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
		'title'      => __( 'Image at Left', 'gutenberg' ),
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
	'query/grid-posts',
	array(
		'title'      => __( 'Grid', 'gutenberg' ),
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
	'query/large-title-posts',
	array(
		'title'      => __( 'Large Title', 'gutenberg' ),
		'blockTypes' => array( 'core/query' ),
		'categories' => array( 'Query' ),
		'content'    => '<!-- wp:group {"align":"full","style":{"spacing":{"padding":{"top":"100px","right":"100px","bottom":"100px","left":"100px"}},"color":{"text":"#ffffff","background":"#000000"}}} -->
						<div class="wp-block-group alignfull has-text-color has-background" style="background-color:#000000;color:#ffffff;padding-top:100px;padding-right:100px;padding-bottom:100px;padding-left:100px"><!-- wp:query {"query":{"perPage":3,"pages":0,"offset":0,"postType":"post","categoryIds":[],"tagIds":[],"order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":true}} -->
						<!-- wp:query-loop -->
						<!-- wp:separator {"customColor":"#ffffff","align":"wide","className":"is-style-wide"} -->
						<hr class="wp-block-separator alignwide has-text-color has-background is-style-wide" style="background-color:#ffffff;color:#ffffff"/>
						<!-- /wp:separator -->

						<!-- wp:columns {"verticalAlignment":"center","align":"wide"} -->
						<div class="wp-block-columns alignwide are-vertically-aligned-center"><!-- wp:column {"verticalAlignment":"center","width":"20%"} -->
						<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:20%"><!-- wp:post-date {"style":{"color":{"text":"#ffffff"}},"fontSize":"extra-small"} /--></div>
						<!-- /wp:column -->

						<!-- wp:column {"verticalAlignment":"center","width":"80%"} -->
						<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:80%"><!-- wp:post-title {"isLink":true,"style":{"typography":{"fontSize":"72px","lineHeight":"1.1"},"color":{"text":"#ffffff","link":"#ffffff"}}} /--></div>
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
		'title'      => __( 'Offset', 'gutenberg' ),
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

// Initial block patterns to be used in block transformations with patterns.
register_block_pattern(
	'paragraph/large-with-background-color',
	array(
		'title'         => __( 'Large Paragraph with background color', 'gutenberg' ),
		'blockTypes'    => array( 'core/paragraph' ),
		'viewportWidth' => 500,
		'content'       => '<!-- wp:paragraph {"style":{"color":{"link":"#FFFFFF","text":"#FFFFFF","background":"#000000"},"typography":{"lineHeight":"1.3","fontSize":"26px"}}} -->
						 	<p class="has-text-color has-background has-link-color" style="--wp--style--color--link:#FFFFFF;background-color:#000000;color:#FFFFFF;font-size:26px;line-height:1.3">The whole series of my life appeared to me as a dream; I sometimes doubted if indeed it were all true, for it never presented itself to my mind with the force of reality.</p>
							<!-- /wp:paragraph -->',
	)
);
register_block_pattern(
	'social-links/shared-background-color',
	array(
		'title'         => __( 'Social links with a shared background color', 'gutenberg' ),
		'blockTypes'    => array( 'core/social-links' ),
		'viewportWidth' => 500,
		'content'       => '<!-- wp:social-links {"customIconColor":"#ffffff","iconColorValue":"#ffffff","customIconBackgroundColor":"#3962e3","iconBackgroundColorValue":"#3962e3","className":"has-icon-color"} -->
							<ul class="wp-block-social-links has-icon-color has-icon-background-color"><!-- wp:social-link {"url":"https://wordpress.org","service":"wordpress"} /-->
							<!-- wp:social-link {"url":"#","service":"chain"} /-->
							<!-- wp:social-link {"url":"#","service":"mail"} /--></ul>
							<!-- /wp:social-links -->',
	)
);
