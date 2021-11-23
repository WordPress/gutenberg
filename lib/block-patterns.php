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
 * FIXME.
 *
 * @since 5.9.0
 */
function _register_theme_block_patterns() {
	$default_headers = array(
		'title'         => 'Pattern Name',
		'description'   => 'Description',
		'viewportWidth' => 'Viewport Width',
		'categories'    => 'Categories',
		'keywords'      => 'Keywords',
		'blockTypes'    => 'Block Types',
	);

	// Register patterns for the active theme, for both parent and child theme,
	// if applicable.
	foreach ( wp_get_active_and_valid_themes() as $theme ) {
		$dirpath = $theme . '/patterns/';
		if ( file_exists( $dirpath ) ) {
			$files = glob( $dirpath . '*.html' );
			if ( $files ) {
				foreach ( $files as $file ) {
					// Parse pattern slug from file name.
					if ( ! preg_match( '#/(?P<slug>[A-z0-9_-]+)\.html$#', $file, $matches ) ) {
						continue; // FIXME: Consider logging notice.
					}
					// Example name: twentytwentytwo/query-grid-posts.
					$pattern_name = get_stylesheet() . '/' . $matches['slug'];

					$pattern_data = get_file_data( $file, $default_headers );

					// Title is a required property.
					if ( ! $pattern_data['title'] ) {
						continue;
					}

					// For properties of type array, parse data as comma-separated.
					foreach ( array( 'categories', 'keywords', 'blockTypes' ) as $property ) {
						$pattern_data[ $property ] = array_filter(
							preg_split(
								'/[\s,]+/',
								(string) $pattern_data[ $property ]
							)
						);
					}

					// Parse properties of type int.
					foreach ( array( 'viewportWidth' ) as $property ) {
						$pattern_data[ $property ] = (int) $pattern_data[ $property ];
					}

					// Remove up empty values, so as not to override defaults.
					foreach ( array_keys( $default_headers ) as $property ) {
						if ( empty( $pattern_data[ $property ] ) ) {
							unset( $pattern_data[ $property ] );
						}
					}

					// The actual pattern is everything following the leading comment.
					$raw_content             = file_get_contents( $file );
					$token                   = '-->';
					$pattern_data['content'] = substr(
						$raw_content,
						strpos( $raw_content, $token ) + strlen( $token )
					);
					if ( ! $pattern_data['content'] ) {
						continue;
					}

					register_block_pattern( $pattern_name, $pattern_data );
				}
			}
		}
		if ( file_exists( $dirpath ) ) {
			$files = glob( $dirpath . '*.php' );
			if ( $files ) {
				foreach ( $files as $file ) {

					// Parse pattern slug from file name.
					if ( ! preg_match( '#/(?P<slug>[A-z0-9_-]+)\.php$#', $file, $matches ) ) {
						continue; // FIXME: Consider logging notice.
					}
					// Example name: twentytwentytwo/query-grid-posts.
					$pattern_name = get_stylesheet() . '/' . $matches['slug'];

					$pattern_data = get_file_data( $file, $default_headers );

					// Title is a required property.
					if ( ! $pattern_data['title'] ) {
						continue;
					}

					// For properties of type array, parse data as comma-separated.
					foreach ( array( 'categories', 'keywords', 'blockTypes' ) as $property ) {
						$pattern_data[ $property ] = array_filter(
							preg_split(
								'/[\s,]+/',
								(string) $pattern_data[ $property ]
							)
						);
					}

					// Parse properties of type int.
					foreach ( array( 'viewportWidth' ) as $property ) {
						$pattern_data[ $property ] = (int) $pattern_data[ $property ];
					}

					// Remove up empty values, so as not to override defaults.
					foreach ( array_keys( $default_headers ) as $property ) {
						if ( empty( $pattern_data[ $property ] ) ) {
							unset( $pattern_data[ $property ] );
						}
					}

					// The actual pattern content is the output of the file.
					ob_start();
					include $file;
					$pattern_data['content'] = ob_get_clean();
					if ( ! $pattern_data['content'] ) {
						continue;
					}

					register_block_pattern( $pattern_name, $pattern_data );
				}
			}
		}
	}
}
add_action( 'init', '_register_theme_block_patterns' );
