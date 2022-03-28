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
	// Register categories used for block patterns.
	if ( ! WP_Block_Pattern_Categories_Registry::get_instance()->is_registered( 'query' ) ) {
		register_block_pattern_category( 'query', array( 'label' => __( 'Query', 'gutenberg' ) ) );
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
		// 'query-medium-posts'                   => array(
		// 'title'      => _x( 'Image at left', 'Block pattern title', 'gutenberg' ),
		// 'blockTypes' => array( 'core/query' ),
		// 'categories' => array( 'query' ),
		// 'content'    => '<!-- wp:query {"query":{"perPage":3,"pages":0,"offset":0,"postType":"post","order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":false}} -->
		// <div class="wp-block-query">
		// <!-- wp:post-template -->
		// <!-- wp:columns {"align":"wide"} -->
		// <div class="wp-block-columns alignwide"><!-- wp:column {"width":"66.66%"} -->
		// <div class="wp-block-column" style="flex-basis:66.66%"><!-- wp:post-featured-image {"isLink":true} /--></div>
		// <!-- /wp:column -->
		// <!-- wp:column {"width":"33.33%"} -->
		// <div class="wp-block-column" style="flex-basis:33.33%"><!-- wp:post-title {"isLink":true} /-->
		// <!-- wp:post-excerpt /--></div>
		// <!-- /wp:column --></div>
		// <!-- /wp:columns -->
		// <!-- /wp:post-template -->
		// </div>
		// <!-- /wp:query -->',
		// ),
		// 'query-small-posts'                    => array(
		// 'title'      => _x( 'Small image and title', 'Block pattern title', 'gutenberg' ),
		// 'blockTypes' => array( 'core/query' ),
		// 'categories' => array( 'query' ),
		// 'content'    => '<!-- wp:query {"query":{"perPage":3,"pages":0,"offset":0,"postType":"post","order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":false}} -->
		// <div class="wp-block-query">
		// <!-- wp:post-template -->
		// <!-- wp:columns {"verticalAlignment":"center"} -->
		// <div class="wp-block-columns are-vertically-aligned-center"><!-- wp:column {"verticalAlignment":"center","width":"25%"} -->
		// <div class="wp-block-column is-vertically-aligned-center" style="flex-basis:25%"><!-- wp:post-featured-image {"isLink":true} /--></div>
		// <!-- /wp:column -->
		// <!-- wp:column {"verticalAlignment":"center","width":"75%"} -->
		// <div class="wp-block-column is-vertically-aligned-center" style="flex-basis:75%"><!-- wp:post-title {"isLink":true} /--></div>
		// <!-- /wp:column --></div>
		// <!-- /wp:columns -->
		// <!-- /wp:post-template -->
		// </div>
		// <!-- /wp:query -->',
		// ),
		// 'query-grid-posts'                     => array(
		// 'title'      => _x( 'Grid', 'Block pattern title', 'gutenberg' ),
		// 'blockTypes' => array( 'core/query' ),
		// 'categories' => array( 'query' ),
		// 'content'    => '<!-- wp:query {"query":{"perPage":6,"pages":0,"offset":0,"postType":"post","order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"exclude","inherit":false},"displayLayout":{"type":"flex","columns":3}} -->
		// <div class="wp-block-query">
		// <!-- wp:post-template -->
		// <!-- wp:group {"style":{"spacing":{"padding":{"top":"30px","right":"30px","bottom":"30px","left":"30px"}}},"layout":{"inherit":false}} -->
		// <div class="wp-block-group" style="padding-top:30px;padding-right:30px;padding-bottom:30px;padding-left:30px"><!-- wp:post-title {"isLink":true} /-->
		// <!-- wp:post-excerpt /-->
		// <!-- wp:post-date /--></div>
		// <!-- /wp:group -->
		// <!-- /wp:post-template -->
		// </div>
		// <!-- /wp:query -->',
		// ),
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
		// 'query-offset-posts'                   => array(
		// 'title'      => _x( 'Offset', 'Block pattern title', 'gutenberg' ),
		// 'blockTypes' => array( 'core/query' ),
		// 'categories' => array( 'query' ),
		// 'content'    => '<!-- wp:group {"style":{"spacing":{"padding":{"top":"30px","right":"30px","bottom":"30px","left":"30px"}}},"layout":{"inherit":false}} -->
		// <div class="wp-block-group" style="padding-top:30px;padding-right:30px;padding-bottom:30px;padding-left:30px"><!-- wp:columns -->
		// <div class="wp-block-columns"><!-- wp:column {"width":"50%"} -->
		// <div class="wp-block-column" style="flex-basis:50%"><!-- wp:query {"query":{"perPage":2,"pages":0,"offset":0,"postType":"post","order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"exclude","inherit":false},"displayLayout":{"type":"list"}} -->
		// <div class="wp-block-query"><!-- wp:post-template -->
		// <!-- wp:post-featured-image /-->
		// <!-- wp:post-title /-->
		// <!-- wp:post-date /-->
		// <!-- wp:spacer {"height":200} -->
		// <div style="height:200px" aria-hidden="true" class="wp-block-spacer"></div>
		// <!-- /wp:spacer -->
		// <!-- /wp:post-template --></div>
		// <!-- /wp:query --></div>
		// <!-- /wp:column -->
		// <!-- wp:column {"width":"50%"} -->
		// <div class="wp-block-column" style="flex-basis:50%"><!-- wp:query {"query":{"perPage":2,"pages":0,"offset":2,"postType":"post","order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"exclude","inherit":false},"displayLayout":{"type":"list"}} -->
		// <div class="wp-block-query"><!-- wp:post-template -->
		// <!-- wp:spacer {"height":200} -->
		// <div style="height:200px" aria-hidden="true" class="wp-block-spacer"></div>
		// <!-- /wp:spacer -->
		// <!-- wp:post-featured-image /-->
		// <!-- wp:post-title /-->
		// <!-- wp:post-date /-->
		// <!-- /wp:post-template --></div>
		// <!-- /wp:query --></div>
		// <!-- /wp:column --></div>
		// <!-- /wp:columns --></div>
		// <!-- /wp:group -->',
		// ),
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

/**
 * WC Athens 2022 demo patterns.
 */
function register_wc_athens_patterns() {
	$category_name = 'wc-athens';
	if ( ! WP_Block_Pattern_Categories_Registry::get_instance()->is_registered( $category_name ) ) {
		register_block_pattern_category( $category_name, array( 'label' => __( 'WC Athens', 'default' ) ) );
	}

	register_block_pattern(
		'wc-athens-about',
		array(
			'title'      => __( 'WC Athens about page', 'default' ),
			'categories' => array( $category_name, 'pages' ),
			'content'    => '
				<!-- wp:media-text {"align":"full","mediaPosition":"right","mediaLink":"' . esc_url( get_template_directory_uri() ) . '/assets/images/bird-on-black.jpg","mediaType":"image","style":{"elements":{"link":{"color":{"text":"var:preset|color|background"}}}},"backgroundColor":"foreground","textColor":"background"} -->
						<div class="wp-block-media-text alignfull has-media-on-the-right is-stacked-on-mobile has-background-color has-foreground-background-color has-text-color has-background has-link-color">
						<figure class="wp-block-media-text__media"><img src="' . esc_url( get_template_directory_uri() ) . '/assets/images/bird-on-black.jpg" alt="' . esc_attr__( 'An image of a bird flying', 'default' ) . '"/></figure>
						<div class="wp-block-media-text__content">
							<!-- wp:group {"style":{"spacing":{"padding":{"right":"min(8rem, 5vw)","top":"min(20rem, 20vw)"}}}} -->
							<div class="wp-block-group" style="padding-top:min(20rem, 20vw);padding-right:min(8rem, 5vw)">
								<!-- wp:heading {"style":{"typography":{"fontWeight":"300","lineHeight":"1.115","fontSize":"clamp(3rem, 6vw, 4.5rem)"}}} -->
								<h2 style="font-size:clamp(3rem, 6vw, 4.5rem);font-weight:300;line-height:1.115"><em>' . wp_kses_post( __( 'Emery<br>Driscoll', 'default' ) ) . '</em></h2>
								<!-- /wp:heading -->
								<!-- wp:paragraph {"style":{"typography":{"lineHeight":"1.6"}}} -->
								<p style="line-height:1.6">' . esc_html__(
									'Oh hello. My name’s Emery, and you’ve found your way to my website. I’m an avid bird watcher, and I also broadcast my own radio show on Tuesday evenings at 11PM EDT.',
									'default'
								) . '</p>
								<!-- /wp:paragraph -->
								<!-- wp:spacer {"height":40} -->
								<div style="height:40px" aria-hidden="true" class="wp-block-spacer"></div>
								<!-- /wp:spacer -->

								<!-- wp:social-links {"iconColor":"background","iconColorValue":"var(--wp--preset--color--foreground)","iconBackgroundColor":"foreground","iconBackgroundColorValue":"var(--wp--preset--color--background)"} -->
								<ul class="wp-block-social-links has-icon-color has-icon-background-color"><!-- wp:social-link {"url":"#","service":"wordpress"} /-->
								<!-- wp:social-link {"url":"#","service":"twitter"} /-->
								<!-- wp:social-link {"url":"#","service":"instagram"} /--></ul>
								<!-- /wp:social-links --></div>
							<!-- /wp:group --></div>

							<!-- wp:spacer {"height":32} -->
							<div style="height:32px" aria-hidden="true" class="wp-block-spacer"></div>
							<!-- /wp:spacer --></div>
							<!-- /wp:media-text -->',
		)
	);
}

add_action( 'init', 'register_wc_athens_patterns' );
