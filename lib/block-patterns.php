<?php
/**
 * Block patterns registration.
 *
 * @package gutenberg
 */

// Register categories used for block patterns.
register_block_pattern_category( 'query', array( 'label' => __( 'Query', 'gutenberg' ) ) );

// Initial Query block patterns.
register_block_pattern(
	'query/standard-posts',
	array(
		'title'      => __( 'Standard', 'gutenberg' ),
		'blockTypes' => array( 'core/query' ),
		'categories' => array( 'query' ),
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
		'title'      => __( 'Image at left', 'gutenberg' ),
		'blockTypes' => array( 'core/query' ),
		'categories' => array( 'query' ),
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
		'title'      => __( 'Small image and title', 'gutenberg' ),
		'blockTypes' => array( 'core/query' ),
		'categories' => array( 'query' ),
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
	'query/grid-posts',
	array(
		'title'      => __( 'Grid', 'gutenberg' ),
		'blockTypes' => array( 'core/query' ),
		'categories' => array( 'query' ),
		'content'    => '<!-- wp:query {"query":{"perPage":6,"pages":0,"offset":0,"postType":"post","categoryIds":[],"tagIds":[],"order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"exclude","inherit":true},"layout":{"type":"flex","columns":3}} -->
						<!-- wp:query-loop -->
						<!-- wp:group {"tagName":"main","style":{"spacing":{"padding":{"top":"30px","right":"30px","bottom":"30px","left":"30px"}}},"layout":{"inherit":false}} -->
						<main class="wp-block-group" style="padding-top:30px;padding-right:30px;padding-bottom:30px;padding-left:30px"><!-- wp:post-title {"isLink":true} /-->
						<!-- wp:post-excerpt {"wordCount":20} /-->
						<!-- wp:post-date /--></div>
						<!-- /wp:group -->
						<!-- /wp:query-loop -->
						<!-- /wp:query -->',
	)
);

register_block_pattern(
	'query/large-title-posts',
	array(
		'title'      => __( 'Large title', 'gutenberg' ),
		'blockTypes' => array( 'core/query' ),
		'categories' => array( 'query' ),
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
		'categories' => array( 'query' ),
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
		'title'         => __( 'Large paragraph with background color', 'gutenberg' ),
		'categories'    => array( 'text' ),
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
		'categories'    => array( 'buttons' ),
		'blockTypes'    => array( 'core/social-links' ),
		'viewportWidth' => 500,
		'content'       => '<!-- wp:social-links {"customIconColor":"#ffffff","iconColorValue":"#ffffff","customIconBackgroundColor":"#3962e3","iconBackgroundColorValue":"#3962e3","className":"has-icon-color"} -->
							<ul class="wp-block-social-links has-icon-color has-icon-background-color"><!-- wp:social-link {"url":"https://wordpress.org","service":"wordpress"} /-->
							<!-- wp:social-link {"url":"#","service":"chain"} /-->
							<!-- wp:social-link {"url":"#","service":"mail"} /--></ul>
							<!-- /wp:social-links -->',
	)
);

// Deactivate the legacy patterns bundled with WordPress, and add new block patterns for testing.
// More details in the trac issue (https://core.trac.wordpress.org/ticket/52846).
add_action(
	'init',
	function() {

		$core_block_patterns = array(
			'text-two-columns',
			'two-buttons',
			'two-images',
			'text-two-columns-with-images',
			'text-three-columns-buttons',
			'large-header',
			'large-header-button',
			'three-buttons',
			'heading-paragraph',
			'quote',
		);

		$new_core_block_patterns = array(
			'media-text-nature',
			'two-images-gallery',
			'three-columns-media-text',
			'quote',
			'large-header-left',
			'large-header-text-button',
			'media-text-art',
			'text-two-columns-title',
			'three-columns-text',
			'text-two-columns-title-offset',
			'heading',
			'three-images-gallery',
			'text-two-columns',
			'media-text-arquitecture',
			'two-buttons',
		);

		if ( ! function_exists( 'unregister_block_pattern' ) ) {
			return;
		}

		foreach ( $core_block_patterns as $core_block_pattern ) {
			unregister_block_pattern( 'core/' . $core_block_pattern );
		}

		foreach ( $new_core_block_patterns as $core_block_pattern ) {
			register_block_pattern(
				'core/' . $core_block_pattern,
				require __DIR__ . '/block-patterns/' . $core_block_pattern . '.php'
			);
		}

	}
);
