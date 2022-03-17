<?php
/**
 * Block patterns registration from `theme.json` and Pattern Directory.
 *
 * @package gutenberg
 */

/**
 * Registers patterns from Pattern Directory provided by a theme's
 * `theme.json` file.
 */
function gutenberg_register_remote_theme_patterns() {
	$pattern_settings = WP_Theme_JSON_Resolver_Gutenberg::get_theme_data()->get_patterns();
	if ( empty( $pattern_settings ) ) {
		return;
	}
	$request         = new WP_REST_Request( 'GET', '/wp/v2/pattern-directory/patterns' );
	$request['slug'] = implode( ',', $pattern_settings );
	$response        = rest_do_request( $request );
	if ( $response->is_error() ) {
		return;
	}
	$patterns          = $response->get_data();
	$patterns_registry = WP_Block_Patterns_Registry::get_instance();
	foreach ( $patterns as $pattern ) {
		$pattern_name = sanitize_title( $pattern['title'] );
		// Some patterns might be already registered as core patterns with the `core` prefix.
		$is_registered = $patterns_registry->is_registered( $pattern_name ) || $patterns_registry->is_registered( "core/$pattern_name" );
		if ( ! $is_registered ) {
			register_block_pattern( $pattern_name, (array) $pattern );
		}
	}
}

add_action(
	'current_screen',
	function( $current_screen ) {
		if ( ! get_theme_support( 'core-block-patterns' ) ) {
			return;
		}
		if ( ! apply_filters( 'should_load_remote_block_patterns', true ) ) {
			return;
		}
		if ( ! WP_Theme_JSON_Resolver_Gutenberg::theme_has_support() ) {
			return;
		}

		$is_site_editor = ( function_exists( 'gutenberg_is_edit_site_page' ) && gutenberg_is_edit_site_page( $current_screen->id ) );
		if ( $current_screen->is_block_editor || $is_site_editor ) {
			gutenberg_register_remote_theme_patterns();
		}
	}
);

/**
 * Register any patterns that the active theme may provide under its
 * `./patterns/` directory. Each pattern is defined as a PHP file and defines
 * its metadata using plugin-style headers. The minimum required definition is:
 *
 *     /**
 *      * Title: My Pattern
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
 *   - Slug             (otherwise inferred from filename)
 *   - Description
 *   - Viewport Width
 *   - Categories       (comma-separated values)
 *   - Keywords         (comma-separated values)
 *   - Block Types      (comma-separated values)
 *   - Inserter         (yes/no)
 *
 * @since 6.0.0
 * @access private
 * @internal
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
		'inserter'      => 'Inserter',
	);

	// Register patterns for the active theme. If the theme is a child theme,
	// let it override any patterns from the parent theme that shares the same
	// slug.
	foreach ( wp_get_active_and_valid_themes() as $theme ) {
		$dirpath = $theme . '/patterns/';
		if ( file_exists( $dirpath ) ) {
			$files = glob( $dirpath . '*.php' );
			if ( $files ) {
				foreach ( $files as $file ) {
					$pattern_data = get_file_data( $file, $default_headers );

					$pattern_slug = $pattern_data[ 'slug' ];

					// Compute slug from the theme and the basename of the pattern file.
					//
					// Example: twentytwentytwo/query-grid-posts.
					if ( empty( $pattern_slug ) ) {
						if ( ! preg_match( '#/(?P<slug>[A-z0-9_-]+)\.php$#', $file, $matches ) ) {
							trigger_error(
								sprintf(
									__( 'Could not register file "%s" as a block pattern ("Slug" field missing)', 'gutenberg' ),
									$file
								)
							);
							continue;
						}

						$pattern_slug = get_stylesheet() . "/" . $matches[ 'slug' ];
					}

					if ( WP_Block_Patterns_Registry::get_instance()->is_registered( $pattern_slug ) ) {
						continue;
					}

					// Title is a required property.
					if ( ! $pattern_data['title'] ) {
						trigger_error(
							sprintf(
								__( 'Could not register file "%s" as a block pattern ("Title" field missing)', 'gutenberg' ),
								$file
							)
						);
						continue;
					}

					// For properties of type array, parse data as comma-separated.
					foreach ( array( 'categories', 'keywords', 'blockTypes' ) as $property ) {
						if ( ! empty( $pattern_data[ $property ] ) ) {
							$pattern_data[ $property ] = array_filter(
								preg_split(
									'/[\s,]+/',
									(string) $pattern_data[ $property ]
								)
							);
						} else unset( $pattern_data[ $property ] );
					}

					// Parse properties of type int.
					foreach ( array( 'viewportWidth' ) as $property ) {
						if ( ! empty( $pattern_data[ $property ] ) ) {
							$pattern_data[ $property ] = (int) $pattern_data[ $property ];
						} else unset( $pattern_data[ $property ] );
					}

					// Parse properties of type bool.
					foreach ( array( 'inserter' ) as $property ) {
						if ( ! empty( $pattern_data[ $property ] ) ) {
							$pattern_data[ $property ] = in_array(
								strtolower( $pattern_data[ $property ] ),
								array( "yes", "true" )
							);
						} else unset( $pattern_data[ $property ] );
					}

					// The actual pattern content is the output of the file.
					ob_start();
					include $file;
					$pattern_data['content'] = ob_get_clean();
					if ( ! $pattern_data['content'] ) {
						continue;
					}

					register_block_pattern( $pattern_slug, $pattern_data );
				}
			}
		}
	}
}
add_action( 'init', 'gutenberg_register_theme_block_patterns' );
