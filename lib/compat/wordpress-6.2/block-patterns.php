<?php
/**
 * Overrides Core's wp-includes/block-patterns.php to add category descriptions for WP 6.2.
 *
 * @package gutenberg
 */

/**
 * Registers the block pattern categories.
 */
function gutenberg_register_core_block_patterns_categories() {
	register_block_pattern_category(
		'banner',
		array(
			'label' => _x( 'Banners', 'Block pattern category', 'gutenberg' ),
		)
	);
	register_block_pattern_category(
		'buttons',
		array(
			'label'       => _x( 'Buttons', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Patterns that contain buttons and call to actions.', 'gutenberg' ),
		)
	);
	register_block_pattern_category(
		'columns',
		array(
			'label'       => _x( 'Columns', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Multi-column patterns with more complex layouts.', 'gutenberg' ),
		)
	);
	register_block_pattern_category(
		'text',
		array(
			'label'       => _x( 'Text', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Patterns containing mostly text.', 'gutenberg' ),
		)
	);
	register_block_pattern_category(
		'query',
		array(
			'label'       => _x( 'Posts', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Display your latest posts in lists, grids or other layouts.', 'gutenberg' ),
		)
	);
	register_block_pattern_category(
		'featured',
		array(
			'label'       => _x( 'Featured', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'A set of high quality curated patterns.', 'gutenberg' ),
		)
	);

	// Register new core block pattern categories.
	register_block_pattern_category(
		'call-to-action',
		array(
			'label'       => _x( 'Call to Action', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Sections whose purpose is to trigger a specific action.', 'gutenberg' ),
		)
	);
	register_block_pattern_category(
		'team',
		array(
			'label'       => _x( 'Team', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'A variety of designs to display your team members.', 'gutenberg' ),
		)
	);
	register_block_pattern_category(
		'testimonials',
		array(
			'label'       => _x( 'Testimonials', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Share reviews and feedback about your brand/business.', 'gutenberg' ),
		)
	);
	register_block_pattern_category(
		'services',
		array(
			'label'       => _x( 'Services', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Briefly describe what your business does and how you can help.', 'gutenberg' ),
		)
	);
	register_block_pattern_category(
		'contact',
		array(
			'label'       => _x( 'Contact', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Display your contact information.', 'gutenberg' ),
		)
	);
	register_block_pattern_category(
		'about',
		array(
			'label'       => _x( 'About', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Introduce yourself.', 'gutenberg' ),
		)
	);
	register_block_pattern_category(
		'portfolio',
		array(
			'label'       => _x( 'Portfolio', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Showcase your latest work.', 'gutenberg' ),
		)
	);
	register_block_pattern_category(
		'gallery',
		array(
			'label'       => _x( 'Gallery', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Different layouts for displaying images.', 'gutenberg' ),
		)
	);
	register_block_pattern_category(
		'media',
		array(
			'label'       => _x( 'Media', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Different layouts containing video or audio.', 'gutenberg' ),
		)
	);
	register_block_pattern_category(
		'posts',
		array(
			'label'       => _x( 'Posts', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Display your latest posts in lists, grids or other layouts.', 'gutenberg' ),
		)
	);
	// Site building pattern categories.
	register_block_pattern_category(
		'footer',
		array(
			'label'       => _x( 'Footers', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'A variety of footer designs displaying information and site navigation.', 'gutenberg' ),
		)
	);
	register_block_pattern_category(
		'header',
		array(
			'label'       => _x( 'Headers', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'A variety of header designs displaying your site title and navigation.', 'gutenberg' ),
		)
	);
}
add_action( 'init', 'gutenberg_register_core_block_patterns_categories' );

/**
 * Register any patterns that the active theme may provide under its
 * `./patterns/` directory. Each pattern is defined as a PHP file and defines
 * its metadata using plugin-style headers. The minimum required definition is:
 *
 *     /**
 *      * Title: My Pattern
 *      * Slug: my-theme/my-pattern
 *      *
 *
 * The output of the PHP source corresponds to the content of the pattern, e.g.:
 *
 *     <main><p><?php echo "Hello"; ?></p></main>
 *
 * If applicable, this will collect from both parent and child theme.
 *
 * Other settable fields include:
 *
 *   - Description
 *   - Viewport Width
 *   - Categories       (comma-separated values)
 *   - Keywords         (comma-separated values)
 *   - Block Types      (comma-separated values)
 *   - Post Types       (comma-separated values)
 *   - Inserter         (yes/no)
 *
 * @since 6.0.0
 * @access private
 */
function gutenberg_register_theme_block_patterns() {
	$default_headers = array(
		'title'         => 'Title',
		'slug'          => 'Slug',
		'description'   => 'Description',
		'viewportWidth' => 'Viewport Width',
		'categories'    => 'Categories',
		'keywords'      => 'Keywords',
		'blockTypes'    => 'Block Types',
		'postTypes'     => 'Post Types',
		'inserter'      => 'Inserter',
		'templateTypes' => 'Template Types',
	);

	/*
	 * Register patterns for the active theme. If the theme is a child theme,
	 * let it override any patterns from the parent theme that shares the same slug.
	 */
	$themes   = array();
	$wp_theme = wp_get_theme();
	if ( $wp_theme->parent() ) {
		$themes[] = $wp_theme->parent();
	}
	$themes[] = $wp_theme;

	foreach ( $themes as $theme ) {
		$dirpath = $theme->get_stylesheet_directory() . '/patterns/';
		if ( ! is_dir( $dirpath ) || ! is_readable( $dirpath ) ) {
			continue;
		}
		if ( file_exists( $dirpath ) ) {
			$files = glob( $dirpath . '*.php' );
			if ( $files ) {
				foreach ( $files as $file ) {
					$pattern_data = get_file_data( $file, $default_headers );

					if ( empty( $pattern_data['slug'] ) ) {
						_doing_it_wrong(
							'_register_theme_block_patterns',
							sprintf(
							/* translators: %s: file name. */
								__( 'Could not register file "%s" as a block pattern ("Slug" field missing)', 'gutenberg' ),
								$file
							),
							'6.0.0'
						);
						continue;
					}

					if ( ! preg_match( '/^[A-z0-9\/_-]+$/', $pattern_data['slug'] ) ) {
						_doing_it_wrong(
							'_register_theme_block_patterns',
							sprintf(
							/* translators: %1s: file name; %2s: slug value found. */
								__( 'Could not register file "%1$s" as a block pattern (invalid slug "%2$s")', 'gutenberg' ),
								$file,
								$pattern_data['slug']
							),
							'6.0.0'
						);
					}

					if ( WP_Block_Patterns_Registry::get_instance()->is_registered( $pattern_data['slug'] ) ) {
						continue;
					}

					// Title is a required property.
					if ( ! $pattern_data['title'] ) {
						_doing_it_wrong(
							'_register_theme_block_patterns',
							sprintf(
							/* translators: %1s: file name; %2s: slug value found. */
								__( 'Could not register file "%s" as a block pattern ("Title" field missing)', 'gutenberg' ),
								$file
							),
							'6.0.0'
						);
						continue;
					}

					// For properties of type array, parse data as comma-separated.
					foreach ( array( 'categories', 'keywords', 'blockTypes', 'postTypes', 'templateTypes' ) as $property ) {
						if ( ! empty( $pattern_data[ $property ] ) ) {
							$pattern_data[ $property ] = array_filter(
								preg_split(
									'/[\s,]+/',
									(string) $pattern_data[ $property ]
								)
							);
						} else {
							unset( $pattern_data[ $property ] );
						}
					}

					// Parse properties of type int.
					foreach ( array( 'viewportWidth' ) as $property ) {
						if ( ! empty( $pattern_data[ $property ] ) ) {
							$pattern_data[ $property ] = (int) $pattern_data[ $property ];
						} else {
							unset( $pattern_data[ $property ] );
						}
					}

					// Parse properties of type bool.
					foreach ( array( 'inserter' ) as $property ) {
						if ( ! empty( $pattern_data[ $property ] ) ) {
							$pattern_data[ $property ] = in_array(
								strtolower( $pattern_data[ $property ] ),
								array( 'yes', 'true' ),
								true
							);
						} else {
							unset( $pattern_data[ $property ] );
						}
					}

					// Translate the pattern metadata.
					$text_domain = $theme->get( 'TextDomain' );
					//phpcs:ignore WordPress.WP.I18n.NonSingularStringLiteralText, WordPress.WP.I18n.NonSingularStringLiteralContext, WordPress.WP.I18n.NonSingularStringLiteralDomain, WordPress.WP.I18n.LowLevelTranslationFunction
					$pattern_data['title'] = translate_with_gettext_context( $pattern_data['title'], 'Pattern title', $text_domain );
					if ( ! empty( $pattern_data['description'] ) ) {
						//phpcs:ignore WordPress.WP.I18n.NonSingularStringLiteralText, WordPress.WP.I18n.NonSingularStringLiteralContext, WordPress.WP.I18n.NonSingularStringLiteralDomain, WordPress.WP.I18n.LowLevelTranslationFunction
						$pattern_data['description'] = translate_with_gettext_context( $pattern_data['description'], 'Pattern description', $text_domain );
					}

					// The actual pattern content is the output of the file.
					ob_start();
					include $file;
					$pattern_data['content'] = ob_get_clean();
					if ( ! $pattern_data['content'] ) {
						continue;
					}

					register_block_pattern( $pattern_data['slug'], $pattern_data );
				}
			}
		}
	}
}
remove_action( 'init', '_register_theme_block_patterns' );
add_action( 'init', 'gutenberg_register_theme_block_patterns' );

/**
 * Normalize the pattern from the API (snake_case) to the format expected by `register_block_pattern` (camelCase).
 *
 * @since 6.2.0
 *
 * @param array $pattern Pattern as returned from the Pattern Directory API.
 */
function gutenberg_normalize_remote_pattern( $pattern ) {
	if ( isset( $pattern['block_types'] ) ) {
		$pattern['blockTypes'] = $pattern['block_types'];
		unset( $pattern['block_types'] );
	}

	if ( isset( $pattern['viewport_width'] ) ) {
		$pattern['viewportWidth'] = $pattern['viewport_width'];
		unset( $pattern['viewport_width'] );
	}

	return (array) $pattern;
}

/**
 * Register Core's official patterns from wordpress.org/patterns.
 *
 * @since 5.8.0
 * @since 5.9.0 The $current_screen argument was removed.
 * @since 6.2.0 Normalize the pattern from the API (snake_case) to the format expected by `register_block_pattern` (camelCase).
 *
 * @param WP_Screen $deprecated Unused. Formerly the screen that the current request was triggered from.
 */
function gutenberg_load_remote_block_patterns( $deprecated = null ) {
	if ( ! empty( $deprecated ) ) {
		_deprecated_argument( __FUNCTION__, '5.9.0' );
		$current_screen = $deprecated;
		if ( ! $current_screen->is_block_editor ) {
			return;
		}
	}

	$supports_core_patterns = get_theme_support( 'core-block-patterns' );

	/**
	 * Filter to disable remote block patterns.
	 *
	 * @since 5.8.0
	 *
	 * @param bool $should_load_remote
	 */
	$should_load_remote = apply_filters( 'should_load_remote_block_patterns', true );

	if ( $supports_core_patterns && $should_load_remote ) {
		$request         = new WP_REST_Request( 'GET', '/wp/v2/pattern-directory/patterns' );
		$core_keyword_id = 11; // 11 is the ID for "core".
		$request->set_param( 'keyword', $core_keyword_id );
		$response = rest_do_request( $request );
		if ( $response->is_error() ) {
			return;
		}
		$patterns = $response->get_data();

		foreach ( $patterns as $pattern ) {
			$normalized_pattern = gutenberg_normalize_remote_pattern( $pattern );
			$pattern_name       = 'core/' . sanitize_title( $normalized_pattern['title'] );
			register_block_pattern( $pattern_name, (array) $normalized_pattern );
		}
	}
}

/**
 * Register `Featured` (category) patterns from wordpress.org/patterns.
 *
 * @since 5.9.0
 * @since 6.2.0 Normalize the pattern from the API (snake_case) to the format expected by `register_block_pattern` (camelCase).
 */
function gutenberg_load_remote_featured_patterns() {
	$supports_core_patterns = get_theme_support( 'core-block-patterns' );

	/** This filter is documented in wp-includes/block-patterns.php */
	$should_load_remote = apply_filters( 'should_load_remote_block_patterns', true );

	if ( ! $should_load_remote || ! $supports_core_patterns ) {
		return;
	}

	$request         = new WP_REST_Request( 'GET', '/wp/v2/pattern-directory/patterns' );
	$featured_cat_id = 26; // This is the `Featured` category id from pattern directory.
	$request->set_param( 'category', $featured_cat_id );
	$response = rest_do_request( $request );
	if ( $response->is_error() ) {
		return;
	}
	$patterns = $response->get_data();
	$registry = WP_Block_Patterns_Registry::get_instance();
	foreach ( $patterns as $pattern ) {
		$normalized_pattern = gutenberg_normalize_remote_pattern( $pattern );
		$pattern_name       = sanitize_title( $normalized_pattern['title'] );
		// Some patterns might be already registered as core patterns with the `core` prefix.
		$is_registered = $registry->is_registered( $pattern_name ) || $registry->is_registered( "core/$pattern_name" );
		if ( ! $is_registered ) {
			register_block_pattern( $pattern_name, (array) $normalized_pattern );
		}
	}
}

/**
 * Registers patterns from Pattern Directory provided by a theme's
 * `theme.json` file.
 *
 * @since 6.0.0
 * @since 6.2.0 Normalize the pattern from the API (snake_case) to the format expected by `register_block_pattern` (camelCase).
 * @access private
 */
function gutenberg_register_remote_theme_patterns() {
	/** This filter is documented in wp-includes/block-patterns.php */
	if ( ! apply_filters( 'should_load_remote_block_patterns', true ) ) {
		return;
	}

	if ( ! wp_theme_has_theme_json() ) {
		return;
	}

	$pattern_settings = WP_Theme_JSON_Resolver::get_theme_data()->get_patterns();
	if ( empty( $pattern_settings ) ) {
		return;
	}

	$request         = new WP_REST_Request( 'GET', '/wp/v2/pattern-directory/patterns' );
	$request['slug'] = $pattern_settings;
	$response        = rest_do_request( $request );
	if ( $response->is_error() ) {
		return;
	}
	$patterns          = $response->get_data();
	$patterns_registry = WP_Block_Patterns_Registry::get_instance();
	foreach ( $patterns as $pattern ) {
		$normalized_pattern = gutenberg_normalize_remote_pattern( $pattern );
		$pattern_name       = sanitize_title( $normalized_pattern['title'] );
		// Some patterns might be already registered as core patterns with the `core` prefix.
		$is_registered = $patterns_registry->is_registered( $pattern_name ) || $patterns_registry->is_registered( "core/$pattern_name" );
		if ( ! $is_registered ) {
			register_block_pattern( $pattern_name, (array) $normalized_pattern );
		}
	}
}

function gutenberg_register_new_query_block_patterns() {
	$patterns = array(
		'query-post-feed' => array(
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
		'query-post-table' => array(
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
		'query-post-list-cards' => array(
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
		'query-two-column-text-list' => array(
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
		'query-two-column-with-tags' => array(
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
		'query-colorful-full-width-posts' => array(
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
		'query-featured-post-with-post-list' => array(
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
		'query-more-posts' => array(
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
				<p class="has-white-color has-text-color"><strong>' . _x( 'More Posts', 'block pattern sample content', 'gutenberg' ) . '</strong></p>
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
		'query-post-and-date-list' => array(
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
		)
	);

	foreach ( $patterns as $name => $pattern ) {
		$pattern_name = 'core/' . $name;
		if ( ! WP_Block_Patterns_Registry::get_instance()->is_registered( $pattern_name ) ) {
			register_block_pattern( $pattern_name, $pattern );
		}
	}
}
add_action( 'init', 'gutenberg_register_new_query_block_patterns' );
