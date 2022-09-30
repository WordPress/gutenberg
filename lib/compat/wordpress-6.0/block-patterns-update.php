<?php
/**
 * Block patterns registration.
 *
 * @package gutenberg
 */

/**
 * Register Gutenberg bundled patterns.
 */
function gutenberg_register_gutenberg_patterns() {
	$pattern_category_registry = WP_Block_Pattern_Categories_Registry::get_instance();

	// Register categories used for block patterns.
	if ( ! $pattern_category_registry->is_registered( 'query' ) ) {
		register_block_pattern_category( 'query', array( 'label' => __( 'Query', 'gutenberg' ) ) );
	}

	if ( ! $pattern_category_registry->is_registered( 'featured' ) ) {
		register_block_pattern_category( 'featured', array( 'label' => __( 'Featured', 'gutenberg' ) ) );
	}

	$patterns = array(
		'query-standard-posts'                 => array(
			'title'      => _x( 'Standard', 'Block pattern title', 'gutenberg' ),
			'blockTypes' => array( 'core/query' ),
			'categories' => array( 'query' ),
			'content'    => '<!-- wp:query {"query":{"perPage":3,"pages":0,"offset":0,"postType":"post","order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":false}} -->
							<div class="wp-block-query">
							<!-- wp:post-template -->
							<!-- wp:post-title {"isLink":true} /-->
							<!-- wp:post-featured-image  {"isLink":true,"align":"wide"} /-->
							<!-- wp:post-excerpt /-->
							<!-- wp:separator -->
							<hr class="wp-block-separator"/>
							<!-- /wp:separator -->
							<!-- wp:post-date /-->
							<!-- /wp:post-template -->
							</div>
							<!-- /wp:query -->',
		),
		'query-medium-posts'                   => array(
			'title'      => _x( 'Image at left', 'Block pattern title', 'gutenberg' ),
			'blockTypes' => array( 'core/query' ),
			'categories' => array( 'query' ),
			'content'    => '<!-- wp:query {"query":{"perPage":3,"pages":0,"offset":0,"postType":"post","order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":false}} -->
							<div class="wp-block-query">
							<!-- wp:post-template -->
							<!-- wp:columns {"align":"wide"} -->
							<div class="wp-block-columns alignwide"><!-- wp:column {"width":"66.66%"} -->
							<div class="wp-block-column" style="flex-basis:66.66%"><!-- wp:post-featured-image {"isLink":true} /--></div>
							<!-- /wp:column -->
							<!-- wp:column {"width":"33.33%"} -->
							<div class="wp-block-column" style="flex-basis:33.33%"><!-- wp:post-title {"isLink":true} /-->
							<!-- wp:post-excerpt /--></div>
							<!-- /wp:column --></div>
							<!-- /wp:columns -->
							<!-- /wp:post-template -->
							</div>
							<!-- /wp:query -->',
		),
		'query-small-posts'                    => array(
			'title'      => _x( 'Small image and title', 'Block pattern title', 'gutenberg' ),
			'blockTypes' => array( 'core/query' ),
			'categories' => array( 'query' ),
			'content'    => '<!-- wp:query {"query":{"perPage":3,"pages":0,"offset":0,"postType":"post","order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":false}} -->
							<div class="wp-block-query">
							<!-- wp:post-template -->
							<!-- wp:columns {"verticalAlignment":"center"} -->
							<div class="wp-block-columns are-vertically-aligned-center"><!-- wp:column {"verticalAlignment":"center","width":"25%"} -->
							<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:25%"><!-- wp:post-featured-image {"isLink":true} /--></div>
							<!-- /wp:column -->
							<!-- wp:column {"verticalAlignment":"center","width":"75%"} -->
							<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:75%"><!-- wp:post-title {"isLink":true} /--></div>
							<!-- /wp:column --></div>
							<!-- /wp:columns -->
							<!-- /wp:post-template -->
							</div>
							<!-- /wp:query -->',
		),
		'query-grid-posts'                     => array(
			'title'      => _x( 'Grid', 'Block pattern title', 'gutenberg' ),
			'blockTypes' => array( 'core/query' ),
			'categories' => array( 'query' ),
			'content'    => '<!-- wp:query {"query":{"perPage":6,"pages":0,"offset":0,"postType":"post","order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"exclude","inherit":false},"displayLayout":{"type":"flex","columns":3}} -->
							<div class="wp-block-query">
							<!-- wp:post-template -->
							<!-- wp:group {"style":{"spacing":{"padding":{"top":"30px","right":"30px","bottom":"30px","left":"30px"}}},"layout":{"inherit":false}} -->
							<div class="wp-block-group" style="padding-top:30px;padding-right:30px;padding-bottom:30px;padding-left:30px"><!-- wp:post-title {"isLink":true} /-->
							<!-- wp:post-excerpt /-->
							<!-- wp:post-date /--></div>
							<!-- /wp:group -->
							<!-- /wp:post-template -->
							</div>
							<!-- /wp:query -->',
		),
		'query-large-title-posts'              => array(
			'title'      => _x( 'Large title', 'Block pattern title', 'gutenberg' ),
			'blockTypes' => array( 'core/query' ),
			'categories' => array( 'query' ),
			'content'    => '<!-- wp:group {"align":"full","style":{"spacing":{"padding":{"top":"100px","right":"100px","bottom":"100px","left":"100px"}},"color":{"text":"#ffffff","background":"#000000"}}} -->
							<div class="wp-block-group alignfull has-text-color has-background" style="background-color:#000000;color:#ffffff;padding-top:100px;padding-right:100px;padding-bottom:100px;padding-left:100px"><!-- wp:query {"query":{"perPage":3,"pages":0,"offset":0,"postType":"post","order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":false}} -->
							<div class="wp-block-query"><!-- wp:post-template -->
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
							<!-- /wp:post-template --></div>
							<!-- /wp:query --></div>
							<!-- /wp:group -->',
		),
		'query-offset-posts'                   => array(
			'title'      => _x( 'Offset', 'Block pattern title', 'gutenberg' ),
			'blockTypes' => array( 'core/query' ),
			'categories' => array( 'query' ),
			'content'    => '<!-- wp:group {"style":{"spacing":{"padding":{"top":"30px","right":"30px","bottom":"30px","left":"30px"}}},"layout":{"inherit":false}} -->
							<div class="wp-block-group" style="padding-top:30px;padding-right:30px;padding-bottom:30px;padding-left:30px"><!-- wp:columns -->
							<div class="wp-block-columns"><!-- wp:column {"width":"50%"} -->
							<div class="wp-block-column" style="flex-basis:50%"><!-- wp:query {"query":{"perPage":2,"pages":0,"offset":0,"postType":"post","order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"exclude","inherit":false},"displayLayout":{"type":"list"}} -->
							<div class="wp-block-query"><!-- wp:post-template -->
							<!-- wp:post-featured-image /-->
							<!-- wp:post-title /-->
							<!-- wp:post-date /-->
							<!-- wp:spacer {"height":200} -->
							<div style="height:200px" aria-hidden="true" class="wp-block-spacer"></div>
							<!-- /wp:spacer -->
							<!-- /wp:post-template --></div>
							<!-- /wp:query --></div>
							<!-- /wp:column -->
							<!-- wp:column {"width":"50%"} -->
							<div class="wp-block-column" style="flex-basis:50%"><!-- wp:query {"query":{"perPage":2,"pages":0,"offset":2,"postType":"post","order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"exclude","inherit":false},"displayLayout":{"type":"list"}} -->
							<div class="wp-block-query"><!-- wp:post-template -->
							<!-- wp:spacer {"height":200} -->
							<div style="height:200px" aria-hidden="true" class="wp-block-spacer"></div>
							<!-- /wp:spacer -->
							<!-- wp:post-featured-image /-->
							<!-- wp:post-title /-->
							<!-- wp:post-date /-->
							<!-- /wp:post-template --></div>
							<!-- /wp:query --></div>
							<!-- /wp:column --></div>
							<!-- /wp:columns --></div>
							<!-- /wp:group -->',
		),
		'query-post-feed'                   => array(
			'title'      => _x( 'Post feed', 'Block pattern title', 'gutenberg' ),
			'blockTypes' => array( 'core/query' ),
			'categories' => array( 'query' ),
			'content'    => '<!-- wp:query {"query":{"perPage":8,"pages":0,"offset":0,"postType":"post","order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":false},"displayLayout":{"type":"list"}} -->
			<div class="wp-block-query"><!-- wp:post-template -->
			<!-- wp:group {"style":{"spacing":{"padding":{"top":"0px","right":"0px","bottom":"0px","left":"0px"}}}} -->
			<div class="wp-block-group" style="padding-top:0px;padding-right:0px;padding-bottom:0px;padding-left:0px"><!-- wp:columns -->
			<div class="wp-block-columns"><!-- wp:column {"width":"10%"} -->
			<div class="wp-block-column" style="flex-basis:10%"><!-- wp:post-featured-image {"width":"60px","height":"60px"} /--></div>
			<!-- /wp:column -->

			<!-- wp:column {"width":"90%","style":{"spacing":{"padding":{"top":"0px","right":"0px","bottom":"0px","left":"0px"},"blockGap":"0px"}}} -->
			<div class="wp-block-column" style="padding-top:0px;padding-right:0px;padding-bottom:0px;padding-left:0px;flex-basis:90%"><!-- wp:columns -->
			<div class="wp-block-columns"><!-- wp:column {"width":"50%"} -->
			<div class="wp-block-column" style="flex-basis:50%"><!-- wp:post-author {"avatarSize":24,"showAvatar":false} /--></div>
			<!-- /wp:column -->

			<!-- wp:column {"width":"50%"} -->
			<div class="wp-block-column" style="flex-basis:50%"><!-- wp:post-date {"textAlign":"right"} /--></div>
			<!-- /wp:column --></div>
			<!-- /wp:columns -->

			<!-- wp:post-title {"fontSize":"large"} /--></div>
			<!-- /wp:column --></div>
			<!-- /wp:columns -->

			<!-- wp:separator {"opacity":"css","style":{"color":{"background":"#cccdbb"}},"className":"is-style-wide"} -->
			<hr class="wp-block-separator has-text-color has-css-opacity has-background is-style-wide" style="background-color:#cccdbb;color:#cccdbb"/>
			<!-- /wp:separator --></div>
			<!-- /wp:group -->
			<!-- /wp:post-template --></div>
			<!-- /wp:query -->',
		),
		'query-post-table'                   => array(
			'title'      => _x( 'Post table', 'Block pattern title', 'gutenberg' ),
			'blockTypes' => array( 'core/query' ),
			'categories' => array( 'query' ),
			'content'    => '<!-- wp:group {"align":"wide"} -->
<div class="wp-block-group alignwide"><!-- wp:separator {"opacity":"css","className":"alignwide is-style-wide"} -->
<hr class="wp-block-separator has-css-opacity alignwide is-style-wide"/>
<!-- /wp:separator -->

<!-- wp:query {"query":{"perPage":10,"pages":0,"offset":0,"postType":"post","order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":false},"displayLayout":{"type":"list"},"align":"wide"} -->
<div class="wp-block-query alignwide"><!-- wp:post-template {"align":"wide"} -->
<!-- wp:columns {"align":"wide"} -->
<div class="wp-block-columns alignwide"><!-- wp:column -->
<div class="wp-block-column"><!-- wp:post-date {"fontSize":"small"} /--></div>
<!-- /wp:column -->

<!-- wp:column {"width":"30%"} -->
<div class="wp-block-column" style="flex-basis:30%"><!-- wp:post-title {"isLink":true,"fontSize":"small"} /--></div>
<!-- /wp:column -->

<!-- wp:column -->
<div class="wp-block-column"><!-- wp:post-terms {"term":"category","fontSize":"small"} /--></div>
<!-- /wp:column -->

<!-- wp:column -->
<div class="wp-block-column"><!-- wp:post-terms {"term":"post_tag","fontSize":"small"} /--></div>
<!-- /wp:column --></div>
<!-- /wp:columns -->
<!-- /wp:post-template -->

<!-- wp:spacer {"height":"20px"} -->
<div style="height:20px" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer -->

<!-- wp:separator {"opacity":"css","className":"alignwide"} -->
<hr class="wp-block-separator has-css-opacity alignwide"/>
<!-- /wp:separator -->

<!-- wp:spacer {"height":"40px"} -->
<div style="height:40px" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer -->

<!-- wp:query-pagination {"className":"aligncenter"} -->
<!-- wp:query-pagination-previous /-->

<!-- wp:query-pagination-numbers /-->

<!-- wp:query-pagination-next /-->
<!-- /wp:query-pagination --></div>
<!-- /wp:query --></div>
<!-- /wp:group -->',
		),
		'query-post-list-cards'                   => array(
			'title'      => _x( 'Post list cards', 'Block pattern title', 'gutenberg' ),
			'blockTypes' => array( 'core/query' ),
			'categories' => array( 'query' ),
			'content'    => '<!-- wp:query {query":{"perPage":"6","pages":0,"offset":0,"postType":"post","order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":false},"displayLayout":{"type":"list"},"align":"wide"} -->
<div class="wp-block-query alignwide"><!-- wp:post-template {"align":"full"} -->
<!-- wp:group {"style":{"border":{"radius":"0px","width":"4px"},"spacing":{"padding":{"top":"4px","right":"4px","bottom":"4px","left":"4px"}}},"borderColor":"black"} -->
<div class="wp-block-group has-border-color has-black-border-color" style="border-width:4px;border-radius:0px;padding-top:4px;padding-right:4px;padding-bottom:4px;padding-left:4px"><!-- wp:columns {"style":{"spacing":{"padding":{"top":"0px","right":"0px","bottom":"0px","left":"0px"}}}} -->
<div class="wp-block-columns" style="padding-top:0px;padding-right:0px;padding-bottom:0px;padding-left:0px"><!-- wp:column {"verticalAlignment":"center","width":"25%"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:25%"><!-- wp:cover {"useFeaturedImage":true,"dimRatio":0,"minHeight":300} -->
<div class="wp-block-cover" style="min-height:300px"><span aria-hidden="true" class="wp-block-cover__background has-background-dim-0 has-background-dim"></span><div class="wp-block-cover__inner-container"><!-- wp:paragraph {"align":"center","placeholder":"Write title…","fontSize":"large"} -->
<p class="has-text-align-center has-large-font-size"></p>
<!-- /wp:paragraph --></div></div>
<!-- /wp:cover --></div>
<!-- /wp:column -->

<!-- wp:column {"verticalAlignment":"center","width":"75%","style":{"spacing":{"padding":{"top":"0px","right":"0px","bottom":"0px","left":"0px"}}}} -->
<div class="wp-block-column is-vertically-aligned-center" style="padding-top:0px;padding-right:0px;padding-bottom:0px;padding-left:0px;flex-basis:75%"><!-- wp:group {"layout":{"type":"constrained"},"style":{"border":{"radius":"0px"},"spacing":{"blockGap":"12px","padding":{"top":"var:preset|spacing|30","right":"var:preset|spacing|30","bottom":"var:preset|spacing|30","left":"var:preset|spacing|30"}}}} -->
<div class="wp-block-group" style="border-radius:0px;padding-top:var(--wp--preset--spacing--30);padding-right:var(--wp--preset--spacing--30);padding-bottom:var(--wp--preset--spacing--30);padding-left:var(--wp--preset--spacing--30)"><!-- wp:post-title {"textAlign":"center","isLink":true,"style":{"typography":{"fontStyle":"normal","fontWeight":"700","textTransform":"capitalize"}},"fontSize":"x-large"} /-->

<!-- wp:post-author {"textAlign":"center","showAvatar":false} /--></div>
<!-- /wp:group --></div>
<!-- /wp:column --></div>
<!-- /wp:columns --></div>
<!-- /wp:group -->
<!-- /wp:post-template --></div>
<!-- /wp:query -->',
		),
		'query-two-column-text-list'                   => array(
			'title'      => _x( 'Two column text list', 'Block pattern title', 'gutenberg' ),
			'blockTypes' => array( 'core/query' ),
			'categories' => array( 'query' ),
			'content'    => '<!-- wp:query {"query":{"perPage":5,"pages":0,"offset":0,"postType":"post","order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":false},"displayLayout":{"type":"list"},"align":"full"} -->
			<div class="wp-block-query alignfull"><!-- wp:post-template {"align":"full"} -->
			<!-- wp:columns {"align":"wide"} -->
			<div class="wp-block-columns alignwide"><!-- wp:column {"width":"50%","style":{"spacing":{"padding":{"top":"2em","bottom":"0em"}}}} -->
			<div class="wp-block-column" style="padding-top:2em;padding-bottom:0em;flex-basis:50%"><!-- wp:post-title {"isLink":true} /-->

			<!-- wp:post-date {"fontSize":"small"} /--></div>
			<!-- /wp:column -->

			<!-- wp:column {"width":"50%","style":{"spacing":{"padding":{"top":"2em","right":"0em","bottom":"0em","left":"0em"}}}} -->
			<div class="wp-block-column" style="padding-top:2em;padding-right:0em;padding-bottom:0em;padding-left:0em;flex-basis:50%"><!-- wp:post-excerpt {"moreText":"","style":{"typography":{"lineHeight":"1.6"}}} /--></div>
			<!-- /wp:column --></div>
			<!-- /wp:columns -->

			<!-- wp:separator {"opacity":"css","backgroundColor":"cyan-bluish-gray","className":"alignwide is-style-wide"} -->
			<hr class="wp-block-separator has-text-color has-cyan-bluish-gray-color has-alpha-channel-opacity has-cyan-bluish-gray-background-color has-background alignwide is-style-wide"/>
			<!-- /wp:separator -->
			<!-- /wp:post-template -->

			<!-- wp:group {"align":"wide","style":{"spacing":{"padding":{"top":"2em"}}}} -->
			<div class="wp-block-group alignwide" style="padding-top:2em"><!-- wp:query-pagination {"className":"alignwide"} -->
			<!-- wp:query-pagination-previous /-->

			<!-- wp:query-pagination-numbers /-->

			<!-- wp:query-pagination-next /-->
			<!-- /wp:query-pagination --></div>
			<!-- /wp:group --></div>
			<!-- /wp:query -->',
		),
		'query-two-column-with-tags'                   => array(
			'title'      => _x( 'Two column with tags', 'Block pattern title', 'gutenberg' ),
			'blockTypes' => array( 'core/query' ),
			'categories' => array( 'query' ),
			'content'    => '<!-- wp:query {"query":{"perPage":"10","pages":0,"offset":0,"postType":"post","order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":false},"displayLayout":{"type":"list"},"align":"wide"} -->
			<div class="wp-block-query alignwide"><!-- wp:post-template -->
			<!-- wp:columns {"verticalAlignment":"center","align":"wide","style":{"spacing":{"padding":{"top":"0px","right":"0px","bottom":"0px","left":"0px"}}}} -->
			<div class="wp-block-columns alignwide are-vertically-aligned-center" style="padding-top:0px;padding-right:0px;padding-bottom:0px;padding-left:0px"><!-- wp:column {"verticalAlignment":"center","width":"50%","style":{"spacing":{"padding":{"bottom":"0em","top":"0em"}}}} -->
			<div class="wp-block-column is-vertically-aligned-center" style="padding-top:0em;padding-bottom:0em;flex-basis:50%"><!-- wp:post-title {"isLink":true,"fontSize":"large"} /--></div>
			<!-- /wp:column -->

			<!-- wp:column {"verticalAlignment":"center","width":"50%","style":{"spacing":{"padding":{"right":"0em","bottom":"0em","left":"0em","top":"0em"}}}} -->
			<div class="wp-block-column is-vertically-aligned-center" style="padding-top:0em;padding-right:0em;padding-bottom:0em;padding-left:0em;flex-basis:50%"><!-- wp:post-terms {"term":"post_tag"} /--></div>
			<!-- /wp:column --></div>
			<!-- /wp:columns -->
			<!-- /wp:post-template -->

			<!-- wp:group {"align":"wide","style":{"spacing":{"padding":{"top":"2em"}}}} -->
			<div class="wp-block-group alignwide" style="padding-top:2em"><!-- wp:query-pagination {"className":"alignwide"} -->
			<!-- wp:query-pagination-previous /-->

			<!-- wp:query-pagination-numbers /-->

			<!-- wp:query-pagination-next /-->
			<!-- /wp:query-pagination --></div>
			<!-- /wp:group --></div>
			<!-- /wp:query -->',
		),
		'query-colorful-full-width-posts'                   => array(
			'title'      => _x( 'Colorful full width posts', 'Block pattern title', 'gutenberg' ),
			'blockTypes' => array( 'core/query' ),
			'categories' => array( 'query' ),
			'content'    => '<!-- wp:group {"layout":{"type":"constrained"},"align":"full","style":{"spacing":{"blockGap":"0px"}}} -->
			<div class="wp-block-group alignfull"><!-- wp:query {"query":{"perPage":"1","pages":0,"offset":0,"postType":"post","order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":false},"displayLayout":{"type":"list"},"align":"full"} -->
			<div class="wp-block-query alignfull"><!-- wp:post-template {"align":"full"} -->
			<!-- wp:cover {"customOverlayColor":"#eef5e9","minHeight":246,"minHeightUnit":"px","contentPosition":"center center","isDark":false,"align":"full"} -->
			<div class="wp-block-cover alignfull is-light" style="min-height:246px"><span aria-hidden="true" class="wp-block-cover__background has-background-dim-100 has-background-dim" style="background-color:#eef5e9"></span><div class="wp-block-cover__inner-container"><!-- wp:post-title {"textAlign":"center","level":3,"isLink":true,"textColor":"black"} /--></div></div>
			<!-- /wp:cover -->
			<!-- /wp:post-template --></div>
			<!-- /wp:query -->

			<!-- wp:query {"query":{"perPage":"1","pages":0,"offset":1,"postType":"post","order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":false},"displayLayout":{"type":"list"},"align":"full"} -->
			<div class="wp-block-query alignfull"><!-- wp:post-template {"align":"full"} -->
			<!-- wp:cover {"customOverlayColor":"#ffc4a3","minHeight":246,"minHeightUnit":"px","contentPosition":"center center","isDark":false,"align":"full"} -->
			<div class="wp-block-cover alignfull is-light" style="min-height:246px"><span aria-hidden="true" class="wp-block-cover__background has-background-dim-100 has-background-dim" style="background-color:#ffc4a3"></span><div class="wp-block-cover__inner-container"><!-- wp:post-title {"textAlign":"center","level":3,"isLink":true,"textColor":"black"} /--></div></div>
			<!-- /wp:cover -->
			<!-- /wp:post-template --></div>
			<!-- /wp:query -->

			<!-- wp:query {"query":{"perPage":"1","pages":0,"offset":2,"postType":"post","order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":false},"displayLayout":{"type":"list"},"align":"full"} -->
			<div class="wp-block-query alignfull"><!-- wp:post-template {"align":"full"} -->
			<!-- wp:cover {"customOverlayColor":"#cccdbb","minHeight":246,"minHeightUnit":"px","contentPosition":"center center","isDark":false,"align":"full"} -->
			<div class="wp-block-cover alignfull is-light" style="min-height:246px"><span aria-hidden="true" class="wp-block-cover__background has-background-dim-100 has-background-dim" style="background-color:#cccdbb"></span><div class="wp-block-cover__inner-container"><!-- wp:post-title {"textAlign":"center","level":3,"isLink":true,"textColor":"black"} /--></div></div>
			<!-- /wp:cover -->
			<!-- /wp:post-template --></div>
			<!-- /wp:query -->

			<!-- wp:query {"query":{"perPage":"1","pages":0,"offset":3,"postType":"post","order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":false},"displayLayout":{"type":"list"},"align":"full"} -->
			<div class="wp-block-query alignfull"><!-- wp:post-template {"align":"full"} -->
			<!-- wp:cover {"customOverlayColor":"#ffedbf","minHeight":246,"minHeightUnit":"px","contentPosition":"center center","isDark":false,"align":"full"} -->
			<div class="wp-block-cover alignfull is-light" style="min-height:246px"><span aria-hidden="true" class="wp-block-cover__background has-background-dim-100 has-background-dim" style="background-color:#ffedbf"></span><div class="wp-block-cover__inner-container"><!-- wp:post-title {"textAlign":"center","level":3,"isLink":true,"textColor":"black"} /--></div></div>
			<!-- /wp:cover -->
			<!-- /wp:post-template --></div>
			<!-- /wp:query --></div>
			<!-- /wp:group -->',
		),
		'query-featured-post-with-post-list'                   => array(
			'title'      => _x( 'Featured post with post list', 'Block pattern title', 'gutenberg' ),
			'blockTypes' => array( 'core/query' ),
			'categories' => array( 'query' ),
			'content'    => '<!-- wp:columns {"align":"wide"} -->
			<div class="wp-block-columns alignwide"><!-- wp:column {"width":"66.66%"} -->
			<div class="wp-block-column" style="flex-basis:66.66%"><!-- wp:query {"query":{"perPage":1,"pages":0,"offset":0,"postType":"post","order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":false},"displayLayout":{"type":"list"}} -->
			<div class="wp-block-query"><!-- wp:post-template -->
			<!-- wp:post-featured-image {"isLink":true} /-->

			<!-- wp:post-title {"isLink":true} /-->

			<!-- wp:post-date {"fontSize":"tiny"} /-->
			<!-- /wp:post-template --></div>
			<!-- /wp:query --></div>
			<!-- /wp:column -->

			<!-- wp:column -->
			<div class="wp-block-column"><!-- wp:query {"query":{"perPage":7,"pages":0,"offset":1,"postType":"post","order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":false},"displayLayout":{"type":"list","columns":2}} -->
			<div class="wp-block-query"><!-- wp:post-template -->
			<!-- wp:post-title {"isLink":true,"fontSize":"large"} /-->

			<!-- wp:post-date {"fontSize":"extra-small"} /-->

			<!-- wp:spacer {"height":"20px"} -->
			<div style="height:20px" aria-hidden="true" class="wp-block-spacer"></div>
			<!-- /wp:spacer -->

			<!-- wp:separator {"opacity":"css","className":"is-style-wide"} -->
			<hr class="wp-block-separator has-css-opacity is-style-wide"/>
			<!-- /wp:separator -->

			<!-- wp:spacer {"height":"20px"} -->
			<div style="height:20px" aria-hidden="true" class="wp-block-spacer"></div>
			<!-- /wp:spacer -->
			<!-- /wp:post-template --></div>
			<!-- /wp:query --></div>
			<!-- /wp:column --></div>
			<!-- /wp:columns -->',
		),
		'query-more-posts'                   => array(
			'title'      => _x( 'Featured post with more posts', 'Block pattern title', 'gutenberg' ),
			'blockTypes' => array( 'core/query' ),
			'categories' => array( 'query' ),
			'content'    => '<!-- wp:group {"align":"wide","style":{"spacing":{"padding":{"top":"var:preset|spacing|30","right":"var:preset|spacing|30","bottom":"var:preset|spacing|30","left":"var:preset|spacing|30"}}},"backgroundColor":"black"} -->
			<div class="wp-block-group alignwide has-black-background-color has-background" style="padding-top:var(--wp--preset--spacing--30);padding-right:var(--wp--preset--spacing--30);padding-bottom:var(--wp--preset--spacing--30);padding-left:var(--wp--preset--spacing--30)"><!-- wp:query {"query":{"perPage":1,"pages":0,"offset":0,"postType":"post","order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":false},"displayLayout":{"type":"list"}} -->
			<div class="wp-block-query"><!-- wp:post-template -->
			<!-- wp:columns {"verticalAlignment":"center","textColor":"white"} -->
			<div class="wp-block-columns are-vertically-aligned-center has-white-color has-text-color"><!-- wp:column {"verticalAlignment":"center","width":"20%"} -->
			<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:20%"><!-- wp:post-author {"showAvatar":false} /--></div>
			<!-- /wp:column -->

			<!-- wp:column {"verticalAlignment":"center","width":"66.66%"} -->
			<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:66.66%"><!-- wp:post-date /--></div>
			<!-- /wp:column --></div>
			<!-- /wp:columns -->

			<!-- wp:post-featured-image {"isLink":true,"align":"wide"} /-->

			<!-- wp:post-title {"isLink":true,"style":{"elements":{"link":{"color":{"text":"var:preset|color|white"}}}}} /-->

			<!-- wp:post-excerpt {"style":{"elements":{"link":{"color":{"text":"var:preset|color|white"}}}},"textColor":"white"} /-->

			<!-- wp:spacer {"height":"25px"} -->
			<div style="height:25px" aria-hidden="true" class="wp-block-spacer"></div>
			<!-- /wp:spacer -->
			<!-- /wp:post-template --></div>
			<!-- /wp:query -->

			<!-- wp:paragraph {"textColor":"white"} -->
			<p class="has-white-color has-text-color"><strong>More Posts</strong></p>
			<!-- /wp:paragraph -->

			<!-- wp:query {"query":{"perPage":6,"pages":0,"offset":0,"postType":"post","order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"exclude","inherit":false},"displayLayout":{"type":"flex","columns":3}} -->
			<div class="wp-block-query"><!-- wp:post-template -->
			<!-- wp:group {"layout":{"inherit":false},"style":{"spacing":{"padding":{"top":"0px","right":"0px","bottom":"var:preset|spacing|40","left":"0px"}}}} -->
			<div class="wp-block-group" style="padding-top:0px;padding-right:0px;padding-bottom:var(--wp--preset--spacing--40);padding-left:0px"><!-- wp:separator {"backgroundColor":"white"} -->
			<hr class="wp-block-separator has-text-color has-white-color has-alpha-channel-opacity has-white-background-color has-background is-style-wide"/>
			<!-- /wp:separator -->

			<!-- wp:post-title {"isLink":true,"style":{"elements":{"link":{"color":{"text":"var:preset|color|white"}}}}} /--></div>
			<!-- /wp:group -->
			<!-- /wp:post-template --></div>
			<!-- /wp:query --></div>
			<!-- /wp:group -->',
		),
		'query-post-and-date-list'                   => array(
			'title'      => _x( 'Post and date list', 'Block pattern title', 'gutenberg' ),
			'blockTypes' => array( 'core/query' ),
			'categories' => array( 'query' ),
			'content'    => '<!-- wp:group {"style":{"spacing":{"margin":{"top":"14vh","bottom":"0px"}}},"layout":{"inherit":true,"type":"constrained"}} -->
<div class="wp-block-group" style="margin-top:14vh;margin-bottom:0px"><!-- wp:query {"query":{"perPage":"99","pages":0,"offset":0,"postType":"post","order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":false}} -->
<div class="wp-block-query"><!-- wp:post-template -->
<!-- wp:group {"style":{"spacing":{"margin":{"top":"0px","bottom":"0px"},"blockGap":"0px","padding":{"top":"0px","right":"0px","bottom":"0px","left":"0px"}}}} -->
<div class="wp-block-group" style="margin-top:0px;margin-bottom:0px;padding-top:0px;padding-right:0px;padding-bottom:0px;padding-left:0px"><!-- wp:separator {"style":{"color":{"background":"#d6d5d3"}},"className":"is-style-wide"} -->
<hr class="wp-block-separator has-text-color has-alpha-channel-opacity has-background is-style-wide" style="background-color:#d6d5d3;color:#d6d5d3"/>
<!-- /wp:separator -->

<!-- wp:group {"style":{"spacing":{"margin":{"top":"0px","bottom":"0px"},"padding":{"top":"26px","bottom":"0px"},"blockGap":"1em"}},"layout":{"type":"flex","flexWrap":"nowrap","justifyContent":"space-between","verticalAlignment":"top"}} -->
<div class="wp-block-group" style="margin-top:0px;margin-bottom:0px;padding-top:26px;padding-bottom:0px"><!-- wp:post-title {"isLink":true,"style":{"typography":{"fontStyle":"normal","fontWeight":"500"},"elements":{"link":{"color":{"text":"#1d201f"}}}},"fontSize":"medium"} /-->

<!-- wp:post-date {"textAlign":"right","format":"M Y","isLink":true,"style":{"elements":{"link":{"color":{"text":"#707170"}}}},"className":"no-shrink","fontSize":"medium"} /--></div>
<!-- /wp:group --></div>
<!-- /wp:group -->
<!-- /wp:post-template --></div>
<!-- /wp:query -->

<!-- wp:group {"style":{"spacing":{"blockGap":"0px","margin":{"top":"0px","bottom":"0px"},"padding":{"top":"26px"}}}} -->
<div class="wp-block-group" style="margin-top:0px;margin-bottom:0px;padding-top:26px"><!-- wp:separator {"style":{"color":{"background":"#d6d5d3"}},"className":"is-style-wide"} -->
<hr class="wp-block-separator has-text-color has-alpha-channel-opacity has-background is-style-wide" style="background-color:#d6d5d3;color:#d6d5d3"/>
<!-- /wp:separator --></div>
<!-- /wp:group --></div>
<!-- /wp:group -->',
		),
		// Initial block pattern to be used with block transformations with patterns.
		'social-links-shared-background-color' => array(
			'title'         => _x( 'Social links with a shared background color', 'Block pattern title', 'gutenberg' ),
			'categories'    => array( 'buttons' ),
			'blockTypes'    => array( 'core/social-links' ),
			'viewportWidth' => 500,
			'content'       => '<!-- wp:social-links {"customIconColor":"#ffffff","iconColorValue":"#ffffff","customIconBackgroundColor":"#3962e3","iconBackgroundColorValue":"#3962e3","className":"has-icon-color"} -->
								<ul class="wp-block-social-links has-icon-color has-icon-background-color"><!-- wp:social-link {"url":"https://wordpress.org","service":"wordpress"} /-->
								<!-- wp:social-link {"url":"#","service":"chain"} /-->
								<!-- wp:social-link {"url":"#","service":"mail"} /--></ul>
								<!-- /wp:social-links -->',
		),
	);

	foreach ( $patterns as $name => $pattern ) {
		$pattern_name = 'core/' . $name;
		if ( ! WP_Block_Patterns_Registry::get_instance()->is_registered( $pattern_name ) ) {
			register_block_pattern( $pattern_name, $pattern );
		}
	}
}

/**
 * Deactivate the legacy patterns bundled with WordPress.
 */
function gutenberg_remove_core_patterns() {
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
		'query-standard-posts',
		'query-medium-posts',
		'query-small-posts',
		'query-grid-posts',
		'query-large-title-posts',
		'query-offset-posts',
		'social-links-shared-background-color',
	);

	foreach ( $core_block_patterns as $core_block_pattern ) {
		$name = 'core/' . $core_block_pattern;
		if ( WP_Block_Patterns_Registry::get_instance()->is_registered( $name ) ) {
			unregister_block_pattern( $name );
		}
	}
}

add_action(
	'init',
	function() {
		if ( ! get_theme_support( 'core-block-patterns' ) || ! function_exists( 'unregister_block_pattern' ) ) {
			return;
		}
		gutenberg_remove_core_patterns();
		gutenberg_register_gutenberg_patterns();
	}
);
