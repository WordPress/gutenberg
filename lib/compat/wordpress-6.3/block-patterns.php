<?php
/**
 * Overrides Core's wp-includes/block-patterns.php to add new wp_patterns taxonomy, and pattern sources for WP 6.3.
 *
 * @package gutenberg
 */

/**
 * Adds a new taxonomy for organizing patterns.
 *
 * Note: This should be removed when the minimum required WP version is >= 6.3.
 *
 * @see https://github.com/WordPress/gutenberg/pull/51144
 *
 * @return void
 */
function gutenberg_register_taxonomy_patterns() {
	$labels = array(
		'name'          => _x( 'Patterns', 'taxonomy general name' ),
		'singular_name' => _x( 'Pattern', 'taxonomy singular name' ),
		'search_items'  => __( 'Search Patterns' ),
		'all_items'     => __( 'All Pattern Categories' ),
		'edit_item'     => __( 'Edit Pattern Category' ),
		'update_item'   => __( 'Update Pattern Category' ),
		'add_new_item'  => __( 'Add New Pattern Category' ),
		'new_item_name' => __( 'New Pattern Category Name' ),
		'menu_name'     => __( 'Pattern' ),
	);
	$args   = array(
		'hierarchical'      => false,
		'labels'            => $labels,
		'show_ui'           => true,
		'show_in_menu'      => true,
		'show_in_nav_menus' => true,
		'show_admin_column' => true,
		'query_var'         => true,
		'show_in_rest'      => true,
		'rewrite'           => array( 'slug' => 'wp_pattern' ),
	);
	register_taxonomy( 'wp_pattern', array( 'wp_block' ), $args );
}
add_action( 'init', 'gutenberg_register_taxonomy_patterns' );

/**
 * Add categories to new wp_patterns taxonomy for WP 6.3.
 *
 * @package gutenberg
 */
function gutenberg_register_wp_patterns_taxonomy_categories() {
	$categories = array(
		array(
			'slug'        => 'banner',
			'label'       => _x( 'Banners', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Patterns used for adding banners', 'gutenberg' ),
		),
		array(
			'slug'        => 'buttons',
			'label'       => _x( 'Buttons', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Patterns that contain buttons and call to actions.', 'gutenberg' ),
		),
		array(
			'slug'        => 'columns',
			'label'       => _x( 'Columns', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Multi-column patterns with more complex layouts.', 'gutenberg' ),
		),
		array(
			'slug'        => 'text',
			'label'       => _x( 'Text', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Patterns containing mostly text.', 'gutenberg' ),
		),
		array(
			'slug'        => 'query',
			'label'       => _x( 'Posts', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Display your latest posts in lists, grids or other layouts.', 'gutenberg' ),
		),
		array(
			'slug'        => 'featured',
			'label'       => _x( 'Featured', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'A set of high quality curated patterns.', 'gutenberg' ),
		),

		// Register new core block pattern categories.
		array(
			'slug'        => 'call-to-action',
			'label'       => _x( 'Call to Action', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Sections whose purpose is to trigger a specific action.', 'gutenberg' ),
		),
		array(
			'slug'        => 'team',
			'label'       => _x( 'Team', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'A variety of designs to display your team members.', 'gutenberg' ),
		),
		array(
			'slug'        => 'testimonials',
			'label'       => _x( 'Testimonials', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Share reviews and feedback about your brand/business.', 'gutenberg' ),
		),
		array(
			'slug'        => 'services',
			'label'       => _x( 'Services', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Briefly describe what your business does and how you can help.', 'gutenberg' ),
		),
		array(
			'slug'        => 'contact',
			'label'       => _x( 'Contact', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Display your contact information.', 'gutenberg' ),
		),
		array(
			'slug'        => 'about',
			'label'       => _x( 'About', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Introduce yourself.', 'gutenberg' ),
		),
		array(
			'slug'        => 'portfolio',
			'label'       => _x( 'Portfolio', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Showcase your latest work.', 'gutenberg' ),
		),
		array(
			'slug'        => 'gallery',
			'label'       => _x( 'Gallery', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Different layouts for displaying images.', 'gutenberg' ),
		),
		array(
			'slug'        => 'media',
			'label'       => _x( 'Media', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Different layouts containing video or audio.', 'gutenberg' ),
		),
		array(
			'slug'        => 'posts',
			'label'       => _x( 'Posts', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Display your latest posts in lists, grids or other layouts.', 'gutenberg' ),
		),
		// Site building pattern categories.
		array(
			'slug'        => 'footer',
			'label'       => _x( 'Footers', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'A variety of footer designs displaying information and site navigation.', 'gutenberg' ),
		),
		array(
			'slug'        => 'header',
			'label'       => _x( 'Headers', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'A variety of header designs displaying your site title and navigation.', 'gutenberg' ),
		),
	);

	$query_category_id = null;

	foreach ( $categories as $category ) {
		if ( empty( term_exists( $category['slug'], 'wp_pattern' ) ) ) {
			$category_term = wp_insert_term(
				$category['label'],
				'wp_pattern',
				array(
					'slug'        => $category['slug'],
					'description' => $category['description'],
				)
			);

			if ( 'query' === $category['slug'] ) {
				$query_category_id = (string) $category_term['term_id'];
			}
		}

		// Special treatment hack to see if we can register the `posts`
		// category as it's slug would match the `query` category's label.
		if ( 'posts' === $category['slug'] && $query_category_id ) {
			$term = term_exists( $category['slug'], 'wp_pattern' );

			if ( isset( $term['term_id'] ) && (string) $term['term_id'] === (string) $query_category_id ) {
				wp_insert_term(
					$category['label'],
					'wp_pattern',
					array(
						'slug'        => $category['slug'],
						'description' => $category['description'],
					)
				);
			}
		}
	}
}
add_action( 'init', 'gutenberg_register_wp_patterns_taxonomy_categories', 20 );

/**
 * Registers the block pattern sources.
 */
function gutenberg_register_core_block_patterns_sources() {
	$should_register_core_patterns = get_theme_support( 'core-block-patterns' );

	if ( $should_register_core_patterns ) {
		$core_block_patterns = array(
			'query-standard-posts',
			'query-medium-posts',
			'query-small-posts',
			'query-grid-posts',
			'query-large-title-posts',
			'query-offset-posts',
			'social-links-shared-background-color',
		);

		foreach ( $core_block_patterns as $core_block_pattern ) {
			$pattern           = require ABSPATH . WPINC . '/block-patterns/' . $core_block_pattern . '.php';
			$pattern['source'] = 'core';
			register_block_pattern( 'core/' . $core_block_pattern, $pattern );
		}
	}
}
add_action( 'init', 'gutenberg_register_core_block_patterns_sources' );

/**
 * Register Core's official patterns from wordpress.org/patterns.
 *
 * @since 5.8.0
 * @since 5.9.0 The $current_screen argument was removed.
 * @since 6.2.0 Normalize the pattern from the API (snake_case) to the format expected by `register_block_pattern` (camelCase).
 * @since 6.3.0 Add 'core' to the pattern's 'source'.
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
			$pattern['source']  = 'core';
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
 * @since 6.3.0 Add 'core' to the pattern's 'source'.
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
		$pattern['source']  = 'core';
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
 * @since 6.3.0 Add 'core' to the pattern's 'source'.
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

	$pattern_settings = gutenberg_get_remote_theme_patterns();
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
		$pattern['source']  = 'core';
		$normalized_pattern = gutenberg_normalize_remote_pattern( $pattern );
		$pattern_name       = sanitize_title( $normalized_pattern['title'] );
		// Some patterns might be already registered as core patterns with the `core` prefix.
		$is_registered = $patterns_registry->is_registered( $pattern_name ) || $patterns_registry->is_registered( "core/$pattern_name" );
		if ( ! $is_registered ) {
			register_block_pattern( $pattern_name, (array) $normalized_pattern );
		}
	}
}
