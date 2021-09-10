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
	if ( ! WP_Block_Pattern_Categories_Registry::get_instance()->is_registered( 'query' ) ) {
		register_block_pattern_category( 'query', array( 'label' => __( 'Query', 'gutenberg' ) ) );
	}

	$patterns = array(
		'query-standard-posts'                 => array(
			'title'      => _x( 'Standard', 'Block pattern title', 'gutenberg' ),
			'blockTypes' => array( 'core/query' ),
			'categories' => array( 'query' ),
			'content'    => '<!-- wp:query {"query":{"perPage":1,"pages":0,"offset":0,"postType":"post","categoryIds":[],"tagIds":[],"order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":false}} -->
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
			'content'    => '<!-- wp:query {"query":{"perPage":1,"pages":0,"offset":0,"postType":"post","categoryIds":[],"tagIds":[],"order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":false}} -->
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
			'content'    => '<!-- wp:query {"query":{"perPage":1,"pages":0,"offset":0,"postType":"post","categoryIds":[],"tagIds":[],"order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":false}} -->
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
			'content'    => '<!-- wp:query {"query":{"perPage":6,"pages":0,"offset":0,"postType":"post","categoryIds":[],"tagIds":[],"order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"exclude","inherit":false},"displayLayout":{"type":"flex","columns":3}} -->
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
							<div class="wp-block-group alignfull has-text-color has-background" style="background-color:#000000;color:#ffffff;padding-top:100px;padding-right:100px;padding-bottom:100px;padding-left:100px"><!-- wp:query {"query":{"perPage":3,"pages":0,"offset":0,"postType":"post","categoryIds":[],"tagIds":[],"order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":false}} -->
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
							<div class="wp-block-column" style="flex-basis:50%"><!-- wp:query {"query":{"perPage":2,"pages":0,"offset":0,"postType":"post","categoryIds":[],"tagIds":[],"order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"exclude","inherit":false},"displayLayout":{"type":"list"}} -->
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
							<div class="wp-block-column" style="flex-basis:50%"><!-- wp:query {"query":{"perPage":2,"pages":0,"offset":2,"postType":"post","categoryIds":[],"tagIds":[],"order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"exclude","inherit":false},"displayLayout":{"type":"list"}} -->
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
function remove_core_patterns() {
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

/**
 * Register Core's official patterns from wordpress.org/patterns.
 *
 * @since 5.8.0
 */
function load_remote_patterns() {
	// This is the core function that provides the same feature.
	if ( function_exists( '_load_remote_block_patterns' ) ) {
		return;
	}

	/**
	 * Filter to disable remote block patterns.
	 *
	 * @since 5.8.0
	 *
	 * @param bool $should_load_remote
	 */
	$should_load_remote = apply_filters( 'should_load_remote_block_patterns', true );

	if ( $should_load_remote ) {
		$request         = new WP_REST_Request( 'GET', '/wp/v2/pattern-directory/patterns' );
		$core_keyword_id = 11; // 11 is the ID for "core".
		$request->set_param( 'keyword', $core_keyword_id );
		$response = rest_do_request( $request );
		if ( $response->is_error() ) {
			return;
		}
		$patterns = $response->get_data();

		foreach ( $patterns as $settings ) {
			$pattern_name = 'core/' . sanitize_title( $settings['title'] );
			register_block_pattern( $pattern_name, (array) $settings );
		}
	}
}


add_action(
	'init',
	function() {
		if ( ! get_theme_support( 'core-block-patterns' ) || ! function_exists( 'unregister_block_pattern' ) ) {
			return;
		}
		remove_core_patterns();
		register_gutenberg_patterns();
	}
);

add_action(
	'current_screen',
	function( $current_screen ) {
		if ( ! get_theme_support( 'core-block-patterns' ) ) {
			return;
		}

		$is_site_editor = ( function_exists( 'gutenberg_is_edit_site_page' ) && gutenberg_is_edit_site_page( $current_screen->id ) );
		if ( $current_screen->is_block_editor || $is_site_editor ) {
			load_remote_patterns();
		}
	}
);
