<?php
/**
 * Block patterns registration.
 *
 * @package gutenberg
 */

/**
 * Register Gutenberg bundled patterns.
 */
function register_gutenberg_patterns() {
	// Register categories used for block patterns.
	register_block_pattern_category( 'query', array( 'label' => __( 'Query', 'gutenberg' ) ) );
	register_block_pattern_category( 'page-header', array( 'label' => __( 'Page Header', 'gutenberg' ) ) );
	register_block_pattern_category( 'page-footer', array( 'label' => __( 'Page Footer', 'gutenberg' ) ) );

	// Initial Query block patterns.
	register_block_pattern(
		'query/standard-posts',
		array(
			'title'      => __( 'Standard', 'gutenberg' ),
			'blockTypes' => array( 'core/query' ),
			'categories' => array( 'query' ),
			'content'    => '<!-- wp:query {"query":{"perPage":1,"pages":0,"offset":0,"postType":"post","categoryIds":[],"tagIds":[],"order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":false}} -->
							<div class="wp-block-query">
							<!-- wp:query-loop -->
							<!-- wp:post-title {"isLink":true} /-->
							<!-- wp:post-featured-image  {"isLink":true,"align":"wide"} /-->
							<!-- wp:post-excerpt /-->
							<!-- wp:separator -->
							<hr class="wp-block-separator"/>
							<!-- /wp:separator -->
							<!-- wp:post-date /-->
							<!-- /wp:query-loop -->
							</div>
							<!-- /wp:query -->',
		)
	);

	register_block_pattern(
		'query/medium-posts',
		array(
			'title'      => __( 'Image at left', 'gutenberg' ),
			'blockTypes' => array( 'core/query' ),
			'categories' => array( 'query' ),
			'content'    => '<!-- wp:query {"query":{"perPage":1,"pages":0,"offset":0,"postType":"post","categoryIds":[],"tagIds":[],"order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":false}} -->
							<div class="wp-block-query">
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
							</div>
							<!-- /wp:query -->',
		)
	);

	register_block_pattern(
		'query/small-posts',
		array(
			'title'      => __( 'Small image and title', 'gutenberg' ),
			'blockTypes' => array( 'core/query' ),
			'categories' => array( 'query' ),
			'content'    => '<!-- wp:query {"query":{"perPage":1,"pages":0,"offset":0,"postType":"post","categoryIds":[],"tagIds":[],"order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":false}} -->
							<div class="wp-block-query">
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
							</div>
							<!-- /wp:query -->',
		)
	);

	register_block_pattern(
		'query/grid-posts',
		array(
			'title'      => __( 'Grid', 'gutenberg' ),
			'blockTypes' => array( 'core/query' ),
			'categories' => array( 'query' ),
			'content'    => '<!-- wp:query {"query":{"perPage":6,"pages":0,"offset":0,"postType":"post","categoryIds":[],"tagIds":[],"order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"exclude","inherit":false},"layout":{"type":"flex","columns":3}} -->
							<div class="wp-block-query">
							<!-- wp:query-loop -->
							<!-- wp:group {"tagName":"main","style":{"spacing":{"padding":{"top":"30px","right":"30px","bottom":"30px","left":"30px"}}},"layout":{"inherit":false}} -->
							<main class="wp-block-group" style="padding-top:30px;padding-right:30px;padding-bottom:30px;padding-left:30px"><!-- wp:post-title {"isLink":true} /-->
							<!-- wp:post-excerpt {"wordCount":20} /-->
							<!-- wp:post-date /--></div>
							<!-- /wp:group -->
							<!-- /wp:query-loop -->
							</div>
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
							<div class="wp-block-group alignfull has-text-color has-background" style="background-color:#000000;color:#ffffff;padding-top:100px;padding-right:100px;padding-bottom:100px;padding-left:100px"><!-- wp:query {"query":{"perPage":3,"pages":0,"offset":0,"postType":"post","categoryIds":[],"tagIds":[],"order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":false}} -->
							<div class="wp-block-query"><!-- wp:query-loop -->
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
							<!-- /wp:query-loop --></div>
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
							<div class="wp-block-query"><!-- wp:query-loop -->
							<!-- wp:post-featured-image /-->
							<!-- wp:post-title /-->
							<!-- wp:post-date /-->
							<!-- wp:spacer {"height":200} -->
							<div style="height:200px" aria-hidden="true" class="wp-block-spacer"></div>
							<!-- /wp:spacer -->
							<!-- /wp:query-loop --></div>
							<!-- /wp:query --></div>
							<!-- /wp:column -->
							<!-- wp:column {"width":"50%"} -->
							<div class="wp-block-column" style="flex-basis:50%"><!-- wp:query {"query":{"perPage":2,"pages":0,"offset":2,"postType":"post","categoryIds":[],"tagIds":[],"order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"exclude","inherit":false},"layout":{"type":"list"}} -->
							<div class="wp-block-query"><!-- wp:query-loop -->
							<!-- wp:spacer {"height":200} -->
							<div style="height:200px" aria-hidden="true" class="wp-block-spacer"></div>
							<!-- /wp:spacer -->
							<!-- wp:post-featured-image /-->
							<!-- wp:post-title /-->
							<!-- wp:post-date /-->
							<!-- /wp:query-loop --></div>
							<!-- /wp:query --></div>
							<!-- /wp:column --></div>
							<!-- /wp:columns --></main>
							<!-- /wp:group -->',
		)
	);

	// Initial block pattern to be used with block transformations with patterns.
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

	// Initial Template Part block patterns.
	register_block_pattern(
		'template-part/header-site-title-navigation',
		array(
			'title'      => __( 'Header with title and navigation', 'gutenberg' ),
			'categories'    => array( 'page-header' ),
			'blockTypes' => array( 'core/template-part/header' ),
			'content'    => '<!-- wp:columns {"verticalAlignment":"center","align":"full","style":{"color":{"link":"#ffffff","text":"#ffffff","background":"#000000"}}} -->
							<div class="wp-block-columns alignfull are-vertically-aligned-center has-text-color has-background has-link-color" style="--wp--style--color--link:#ffffff;background-color:#000000;color:#ffffff"><!-- wp:column {"verticalAlignment":"center","width":"33.33%"} -->
							<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:33.33%"><!-- wp:site-title {"fontSize":"normal"} /--></div>
							<!-- /wp:column -->
							<!-- wp:column {"verticalAlignment":"center","width":"66.66%"} -->
							<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:66.66%"><!-- wp:navigation {"orientation":"horizontal","itemsJustification":"right"} /--></div>
							<!-- /wp:column --></div>
							<!-- /wp:columns -->',
		)
	);

	register_block_pattern(
		'template-part/header-two-navigation-areas',
		array(
			'title'      => __( 'Header with two navigation areas and logo', 'gutenberg' ),
			'categories'    => array( 'page-header' ),
			'blockTypes' => array( 'core/template-part/header' ),
			'content'    => '<!-- wp:columns {"verticalAlignment":"center","align":"full"} -->
							<div class="wp-block-columns alignfull are-vertically-aligned-center"><!-- wp:column {"verticalAlignment":"center","width":"50%"} -->
							<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:50%"><!-- wp:navigation {"orientation":"horizontal","itemsJustification":"right"} /--></div>
							<!-- /wp:column -->
							<!-- wp:column {"verticalAlignment":"center","width":"120px"} -->
							<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:120px"><!-- wp:site-logo {"align":"center","width":80,"className":"is-style-rounded"} /--></div>
							<!-- /wp:column -->
							<!-- wp:column {"verticalAlignment":"center","width":"50%"} -->
							<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:50%"><!-- wp:navigation {"orientation":"horizontal","itemsJustification":"left"} /--></div>
							<!-- /wp:column --></div>
							<!-- /wp:columns -->',
		)
	);

	register_block_pattern(
		'template-part/header-with-social-links',
		array(
			'title'      => __( 'Header with social links', 'gutenberg' ),
			'categories'    => array( 'page-header' ),
			'blockTypes' => array( 'core/template-part/header' ),
			'content'    => '<!-- wp:columns {"verticalAlignment":"center","align":"full","style":{"color":{"background":"#e7ecde"}}} -->
							<div class="wp-block-columns alignfull are-vertically-aligned-center has-background" style="background-color:#e7ecde"><!-- wp:column {"verticalAlignment":"center","width":"33.33%"} -->
							<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:33.33%"><!-- wp:navigation {"orientation":"horizontal","itemsJustification":"left"} /--></div>
							<!-- /wp:column -->
							<!-- wp:column {"verticalAlignment":"center","width":"33.33%"} -->
							<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:33.33%"><!-- wp:site-title {"textAlign":"center"} /--></div>
							<!-- /wp:column -->
							<!-- wp:column {"verticalAlignment":"center","width":"33.33%"} -->
							<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:33.33%"><!-- wp:social-links {"iconColor":"black","iconColorValue":"#000000","customIconBackgroundColor":"#e7ecde","iconBackgroundColorValue":"#e7ecde"} -->
							<ul class="wp-block-social-links has-icon-color has-icon-background-color items-justified-right"><!-- wp:social-link {"url":"#","service":"twitter"} /-->
							<!-- wp:social-link {"url":"#","service":"instagram"} /-->
							<!-- wp:social-link {"url":"#","service":"mail"} /--></ul>
							<!-- /wp:social-links --></div>
							<!-- /wp:column --></div>
							<!-- /wp:columns -->',
		)
	);

	register_block_pattern(
		'template-part/header-large-image',
		array(
			'title'      => __( 'Header with large image', 'gutenberg' ),
			'categories'    => array( 'page-header' ),
			'blockTypes' => array( 'core/template-part/header' ),
			'content'    => '<!-- wp:cover {"url":"https://s.w.org/images/core/5.8/forest.jpg","id":2613,"minHeight":600,"contentPosition":"center center","align":"full"} -->
							<div class="wp-block-cover alignfull has-background-dim" style="min-height:600px"><img class="wp-block-cover__image-background wp-image-2613" alt="" src="https://s.w.org/images/core/5.8/forest.jpg" data-object-fit="cover"/><div class="wp-block-cover__inner-container"><!-- wp:columns {"align":"wide"} -->
							<div class="wp-block-columns alignwide"><!-- wp:column {"verticalAlignment":"center"} -->
							<div class="wp-block-column is-vertically-aligned-center"><!-- wp:site-title {"style":{"color":{"link":"#ffffff"}}} /--></div>
							<!-- /wp:column -->

							<!-- wp:column -->
							<div class="wp-block-column"><!-- wp:navigation {"orientation":"horizontal","itemsJustification":"right","fontSize":"normal"} /--></div>
							<!-- /wp:column --></div>
							<!-- /wp:columns -->

							<!-- wp:spacer {"height":400} -->
							<div style="height:400px" aria-hidden="true" class="wp-block-spacer"></div>
							<!-- /wp:spacer -->

							<!-- wp:columns {"align":"wide"} -->
							<div class="wp-block-columns alignwide"><!-- wp:column {"width":"75%"} -->
							<div class="wp-block-column" style="flex-basis:75%"><!-- wp:heading {"style":{"typography":{"fontSize":"48px"}}} -->
							<h2 style="font-size:48px">' . esc_html__( 'Our natural environment provides endless opportunities for adventure.', 'default' ) . '</h2>
							<!-- /wp:heading -->

							<!-- wp:button {"style":{"color":{"text":"#000000","background":"#ffffff"},"border":{"radius":0}}} -->
							<div class="wp-block-button"><a class="wp-block-button__link has-text-color has-background no-border-radius" href="#" style="background-color:#ffffff;color:#000000">' . esc_html__( 'Learn more.', 'default' ) . '</a></div>
							<!-- /wp:button --></div>
							<!-- /wp:column --></div>
							<!-- /wp:columns -->

							<!-- wp:column -->
							<div class="wp-block-column"></div>
							<!-- /wp:column --></div></div>
							<!-- /wp:cover -->',
		)
	);

	register_block_pattern(
		'template-part/centered-header-background-color',
		array(
			'title'      => __( 'Centered page header with background color', 'gutenberg' ),
			'categories'    => array( 'page-header' ),
			'blockTypes' => array( 'core/template-part/header' ),
			'content'    => '<!-- wp:group {"align":"full","style":{"color":{"background":"#f8f8f8"},"spacing":{"padding":{"top":"2em","right":"2em","bottom":"2em","left":"2em"}}}} -->
							<div class="wp-block-group alignfull has-background" style="background-color:#f8f8f8;padding-top:2em;padding-right:2em;padding-bottom:2em;padding-left:2em"><!-- wp:spacer {"height":150} -->
							<div style="height:150px" aria-hidden="true" class="wp-block-spacer"></div>
							<!-- /wp:spacer -->

							<!-- wp:site-logo {"align":"center"} /-->

							<!-- wp:site-title {"textAlign":"center","style":{"typography":{"fontSize":"48px","textTransform":"capitalize","lineHeight":"1.1"},"spacing":{"padding":{"top":"0px","right":"0px","bottom":"0px","left":"0px"}}}} /-->

							<!-- wp:site-tagline {"textAlign":"center","style":{"color":{"text":"#000000"},"spacing":{"padding":{"bottom":"30px","top":"0px","right":"0px","left":"0px"}}}} /-->

							<!-- wp:spacer {"height":150} -->
							<div style="height:150px" aria-hidden="true" class="wp-block-spacer"></div>
							<!-- /wp:spacer -->

							<!-- wp:navigation {"orientation":"horizontal","itemsJustification":"center","style":{"color":{"text":"#000000"}}} /--></div>
							<!-- /wp:group -->',
		)
	);

	register_block_pattern(
		'template-part/modern-header-with-image-on-the-right',
		array(
			'title'      => __( 'Modern header with image on the right', 'gutenberg' ),
			'categories'    => array( 'page-header' ),
			'blockTypes' => array( 'core/template-part/header' ),
			'content'    => '<!-- wp:media-text {"align":"full","mediaPosition":"right","mediaId":2589,"mediaLink":"https://s.w.org/images/core/5.8/nature-above-02.jpg","mediaType":"image","imageFill":true,"style":{"color":{"background":"#fffbee","text":"#000000"}}} -->
							<div class="wp-block-media-text alignfull has-media-on-the-right is-stacked-on-mobile is-image-fill has-text-color has-background" style="background-color:#fffbee;color:#000000"><figure class="wp-block-media-text__media" style="background-image:url(https://s.w.org/images/core/5.8/nature-above-02.jpg);background-position:50% 50%"><img src="https://s.w.org/images/core/5.8/nature-above-02.jpg" alt="" class="wp-image-2589 size-full"/></figure><div class="wp-block-media-text__content"><!-- wp:spacer {"height":50} -->
							<div style="height:50px" aria-hidden="true" class="wp-block-spacer"></div>
							<!-- /wp:spacer -->

							<!-- wp:site-logo {"className":"is-style-default"} /-->

							<!-- wp:spacer {"height":400} -->
							<div style="height:400px" aria-hidden="true" class="wp-block-spacer"></div>
							<!-- /wp:spacer -->

							<!-- wp:site-title {"style":{"typography":{"textTransform":"capitalize","fontSize":"84px","lineHeight":"1.0"}}} /-->

							<!-- wp:navigation {"orientation":"horizontal","color":{"text":"#161616"}},"style":{"typography":{"textTransform":"uppercase"}},"fontSize":"normal"} /-->

							<!-- wp:spacer {"height":50} -->
							<div style="height:50px" aria-hidden="true" class="wp-block-spacer"></div>
							<!-- /wp:spacer --></div></div>
							<!-- /wp:media-text -->',
		)
	);

	register_block_pattern(
		'template-part/footer-navigation-credit',
		array(
			'title'      => __( 'Footer with navigation and credit line', 'gutenberg' ),
			'categories'    => array( 'page-footer' ),
			'blockTypes' => array( 'core/template-part/footer' ),
			'content'    => '<!-- wp:columns {"verticalAlignment":"center","align":"full","style":{"color":{"background":"#000000","text":"#ffffff"}}} -->
							<div class="wp-block-columns alignfull are-vertically-aligned-center has-text-color has-background" style="background-color:#000000;color:#ffffff"><!-- wp:column -->
							<div class="wp-block-column"><!-- wp:navigation {"orientation":"horizontal","fontSize":"normal"} /--></div>
							<!-- /wp:column -->
							<!-- wp:column -->
							<div class="wp-block-column"><!-- wp:paragraph {"align":"right","fontSize":"normal"} -->
							<p class="has-text-align-right has-normal-font-size">' . esc_html__( 'Proudly powered by WordPress', 'default' ) . '</p>
							<!-- /wp:paragraph --></div>
							<!-- /wp:column --></div>
							<!-- /wp:columns -->',
		)
	);

	register_block_pattern(
		'template-part/footer-centered-navigation-social',
		array(
			'title'      => __( 'Centered footer with navigation and social links', 'gutenberg' ),
			'categories'    => array( 'page-footer' ),
			'blockTypes' => array( 'core/template-part/footer' ),
			'content'    => '<!-- wp:navigation {"orientation":"horizontal","itemsJustification":"center","fontSize":"normal"} /-->

							<!-- wp:spacer {"height":10} -->
							<div style="height:10px" aria-hidden="true" class="wp-block-spacer"></div>
							<!-- /wp:spacer -->

							<!-- wp:social-links {"className":"items-justified-center"} -->
							<ul class="wp-block-social-links items-justified-center"><!-- wp:social-link {"url":"#","service":"twitter"} /-->

							<!-- wp:social-link {"url":"#","service":"instagram"} /-->

							<!-- wp:social-link {"url":"#","service":"mail"} /--></ul>
							<!-- /wp:social-links -->

							<!-- wp:spacer {"height":10} -->
							<div style="height:10px" aria-hidden="true" class="wp-block-spacer"></div>
							<!-- /wp:spacer -->

							<!-- wp:paragraph {"align":"center","style":{"typography":{"fontSize":"16px"}}} -->
							<p class="has-text-align-center" style="font-size:16px">' . esc_html__( 'Powered by WordPress', 'default' ) . '</p>
							<!-- /wp:paragraph -->',
		)
	);

	register_block_pattern(
		'template-part/footer-latest-posts',
		array(
			'title'      => __( 'Footer with latest posts', 'gutenberg' ),
			'categories'    => array( 'page-footer' ),
			'blockTypes' => array( 'core/template-part/footer' ),
			'content'    => '<!-- wp:group {"align":"full","style":{"color":{"background":"#e7ecde"}}} -->
							<div class="wp-block-group alignfull has-background" style="background-color:#e7ecde"><!-- wp:spacer {"height":10} -->
							<div style="height:10px" aria-hidden="true" class="wp-block-spacer"></div>
							<!-- /wp:spacer -->
							<!-- wp:latest-posts {"postsToShow":3,"displayPostContent":true,"excerptLength":12,"postLayout":"grid","displayFeaturedImage":true,"featuredImageSizeSlug":"large","addLinkToFeaturedImage":true} /-->
							<!-- wp:spacer {"height":20} -->
							<div style="height:20px" aria-hidden="true" class="wp-block-spacer"></div>
							<!-- /wp:spacer -->
							<!-- wp:columns {"verticalAlignment":"bottom","align":"wide"} -->
							<div class="wp-block-columns alignwide are-vertically-aligned-bottom"><!-- wp:column {"verticalAlignment":"bottom","width":"33.33%"} -->
							<div class="wp-block-column is-vertically-aligned-bottom" style="flex-basis:33.33%"><!-- wp:site-title {"fontSize":"large"} /--></div>
							<!-- /wp:column -->
							<!-- wp:column {"verticalAlignment":"bottom","width":"66.67%"} -->
							<div class="wp-block-column is-vertically-aligned-bottom" style="flex-basis:66.67%"><!-- wp:paragraph {"align":"right","fontSize":"extra-small"} -->
							<p class="has-text-align-right has-extra-small-font-size">' . esc_html__( '© 2021 The Earth', 'default' ) . '</p>
							<!-- /wp:paragraph --></div>
							<!-- /wp:column --></div>
							<!-- /wp:columns -->
							<!-- wp:spacer {"height":10} -->
							<div style="height:10px" aria-hidden="true" class="wp-block-spacer"></div>
							<!-- /wp:spacer --></div>
							<!-- /wp:group -->',
		)
	);

	register_block_pattern(
		'template-part/footer-modern',
		array(
			'title'      => __( 'Modern footer with description and logo', 'gutenberg' ),
			'categories'    => array( 'page-footer' ),
			'blockTypes' => array( 'core/template-part/footer' ),
			'content'    => '<!-- wp:columns {"align":"full","style":{"color":{"background":"#fffbee"}}} -->
							<div class="wp-block-columns alignfull has-background" style="background-color:#fffbee"><!-- wp:column {"width":"33%"} -->
							<div class="wp-block-column" style="flex-basis:33%"><!-- wp:paragraph -->
							<p><strong>' . esc_html__( 'ABOUT US', 'default' ) . '</strong></p>
							<!-- /wp:paragraph -->
							<!-- wp:paragraph -->
							<p>' . esc_html__( 'This website has been around since 2003. Its current iteration includes a photography blog, an art gallery dedicated to found geometric shapes, and a store that sells t-shirts.', 'default' ) . '</p>
							<!-- /wp:paragraph -->
							<!-- wp:spacer {"height":200} -->
							<div style="height:200px" aria-hidden="true" class="wp-block-spacer"></div>
							<!-- /wp:spacer -->
							<!-- wp:paragraph {"fontSize":"extra-small"} -->
							<p class="has-extra-small-font-size">' . esc_html__( '© The Earth', 'default' ) . '</p>
							<!-- /wp:paragraph --></div>
							<!-- /wp:column -->
							<!-- wp:column {"width":"33.33%"} -->
							<div class="wp-block-column" style="flex-basis:33.33%"></div>
							<!-- /wp:column -->
							<!-- wp:column {"verticalAlignment":"bottom","width":"33.33%"} -->
							<div class="wp-block-column is-vertically-aligned-bottom" style="flex-basis:33.33%"><!-- wp:site-logo {"align":"right","width":40} /--></div>
							<!-- /wp:column --></div>
							<!-- /wp:columns -->',
		)
	);

	// Initial block pattern to be used with block transformations with patterns.
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
}

/**
 * Deactivate the legacy patterns bundled with WordPress, and add new block patterns for testing.
 * More details in the trac issue (https://core.trac.wordpress.org/ticket/52846).
 */
function update_core_patterns() {
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

	foreach ( $core_block_patterns as $core_block_pattern ) {
		$name = 'core/' . $core_block_pattern;
		if ( WP_Block_Patterns_Registry::get_instance()->is_registered( $name ) ) {
			unregister_block_pattern( $name );
		}
	}

	foreach ( $new_core_block_patterns as $core_block_pattern ) {
		register_block_pattern(
			'core/' . $core_block_pattern,
			require __DIR__ . '/block-patterns/' . $core_block_pattern . '.php'
		);
	}
}

add_action(
	'init',
	function() {
		if ( ! get_theme_support( 'core-block-patterns' ) || ! function_exists( 'unregister_block_pattern' ) ) {
			return;
		}
		register_gutenberg_patterns();
		update_core_patterns();
	}
);
