<?php
/**
 * Functions to register client-side assets (scripts and stylesheets) specific
 * for the Gutenberg editor plugin.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

/**
 * Retrieves the root plugin path.
 *
 * @return string Root path to the gutenberg plugin.
 *
 * @since 0.1.0
 */
function gutenberg_dir_path() {
	return plugin_dir_path( __DIR__ );
}

/**
 * Retrieves a URL to a file in the gutenberg plugin.
 *
 * @param  string $path Relative path of the desired file.
 *
 * @return string       Fully qualified URL pointing to the desired file.
 *
 * @since 0.1.0
 */
function gutenberg_url( $path ) {
	return plugins_url( $path, __DIR__ );
}

/**
 * Registers a script according to `wp_register_script`. Honors this request by
 * reassigning internal dependency properties of any script handle already
 * registered by that name. It does not deregister the original script, to
 * avoid losing inline scripts which may have been attached.
 *
 * @since 4.1.0
 *
 * @param WP_Scripts       $scripts   WP_Scripts instance.
 * @param string           $handle    Name of the script. Should be unique.
 * @param string           $src       Full URL of the script, or path of the script relative to the WordPress root directory.
 * @param array            $deps      Optional. An array of registered script handles this script depends on. Default empty array.
 * @param string|bool|null $ver       Optional. String specifying script version number, if it has one, which is added to the URL
 *                                    as a query string for cache busting purposes. If version is set to false, a version
 *                                    number is automatically added equal to current installed WordPress version.
 *                                    If set to null, no version is added.
 * @param bool             $in_footer Optional. Whether to enqueue the script before </body> instead of in the <head>.
 *                                    Default 'false'.
 */
function gutenberg_override_script( $scripts, $handle, $src, $deps = array(), $ver = false, $in_footer = false ) {
	/*
	 * Force `wp-i18n` script to be registered in the <head> as a
	 * temporary workaround for https://meta.trac.wordpress.org/ticket/6195.
	 */
	$in_footer = 'wp-i18n' === $handle ? false : $in_footer;

	$script = $scripts->query( $handle, 'registered' );
	if ( $script ) {
		/*
		 * In many ways, this is a reimplementation of `wp_register_script` but
		 * bypassing consideration of whether a script by the given handle had
		 * already been registered.
		 */

		// See: `_WP_Dependency::__construct` .
		$script->src  = $src;
		$script->deps = $deps;
		$script->ver  = $ver;
		$script->args = $in_footer ? 1 : null;
	} else {
		$scripts->add( $handle, $src, $deps, $ver, ( $in_footer ? 1 : null ) );
	}

	if ( in_array( 'wp-i18n', $deps, true ) ) {
		$scripts->set_translations( $handle );
	}

	/*
	 * Wp-editor module is exposed as window.wp.editor.
	 * Problem: there is quite some code expecting window.wp.oldEditor object available under window.wp.editor.
	 * Solution: fuse the two objects together to maintain backward compatibility.
	 * For more context, see https://github.com/WordPress/gutenberg/issues/33203
	 */
	if ( 'wp-editor' === $handle ) {
		$scripts->add_inline_script(
			'wp-editor',
			'Object.assign( window.wp.editor, window.wp.oldEditor );',
			'after'
		);
	}
}

/**
 * Filters the default translation file load behavior to load the Gutenberg
 * plugin translation file, if available.
 *
 * @param string|false $file   Path to the translation file to load. False if
 *                             there isn't one.
 * @param string       $handle Name of the script to register a translation
 *                             domain to.
 *
 * @return string|false Filtered path to the Gutenberg translation file, if
 *                      available.
 */
function gutenberg_override_translation_file( $file, $handle ) {
	if ( ! $file ) {
		return $file;
	}

	// Ignore scripts whose handle does not have the "wp-" prefix.
	if ( ! str_starts_with( $handle, 'wp-' ) ) {
		return $file;
	}

	// Ignore scripts that are not found in the expected `build/` location.
	$script_path = gutenberg_dir_path() . 'build/' . substr( $handle, 3 ) . '/index.min.js';
	if ( ! file_exists( $script_path ) ) {
		return $file;
	}

	/*
	 * The default file will be in the plugins language directory, omitting the
	 * domain since Gutenberg assigns the script translations as the default.
	 *
	 * Example: /www/wp-content/languages/plugins/de_DE-07d88e6a803e01276b9bfcc1203e862e.json
	 *
	 * The logic of `load_script_textdomain` is such that it will assume to
	 * search in the plugins language directory, since the assigned source of
	 * the overridden Gutenberg script originates in the plugins directory.
	 *
	 * The plugin translation files each begin with the slug of the plugin, so
	 * it's a simple matter of prepending the Gutenberg plugin slug.
	 */
	$path_parts              = pathinfo( $file );
	$plugin_translation_file = (
		$path_parts['dirname'] .
		'/gutenberg-' .
		$path_parts['basename']
	);

	return $plugin_translation_file;
}
add_filter( 'load_script_translation_file', 'gutenberg_override_translation_file', 10, 2 );

/**
 * Registers a style according to `wp_register_style`. Honors this request by
 * deregistering any style by the same handler before registration.
 *
 * @since 4.1.0
 *
 * @param WP_Styles        $styles WP_Styles instance.
 * @param string           $handle Name of the stylesheet. Should be unique.
 * @param string           $src    Full URL of the stylesheet, or path of the stylesheet relative to the WordPress root directory.
 * @param array            $deps   Optional. An array of registered stylesheet handles this stylesheet depends on. Default empty array.
 * @param string|bool|null $ver    Optional. String specifying stylesheet version number, if it has one, which is added to the URL
 *                                 as a query string for cache busting purposes. If version is set to false, a version
 *                                 number is automatically added equal to current installed WordPress version.
 *                                 If set to null, no version is added.
 * @param string           $media  Optional. The media for which this stylesheet has been defined.
 *                                 Default 'all'. Accepts media types like 'all', 'print' and 'screen', or media queries like
 *                                 '(orientation: portrait)' and '(max-width: 640px)'.
 */
function gutenberg_override_style( $styles, $handle, $src, $deps = array(), $ver = false, $media = 'all' ) {
	$style = $styles->query( $handle, 'registered' );
	if ( $style ) {
		$styles->remove( $handle );
	}
	$styles->add( $handle, $src, $deps, $ver, $media );
}

/**
 * Registers all the WordPress packages scripts that are in the standardized
 * `build/` location.
 *
 * @since 4.5.0
 *
 * @param WP_Scripts $scripts WP_Scripts instance.
 */
function gutenberg_register_packages_scripts( $scripts ) {
	// When in production, use the plugin's version as the default asset version;
	// else (for development or test) default to use the current time.
	$default_version = defined( 'GUTENBERG_VERSION' ) && ! SCRIPT_DEBUG ? GUTENBERG_VERSION : time();

	foreach ( glob( gutenberg_dir_path() . 'build/*/index.min.js' ) as $path ) {
		// Prefix `wp-` to package directory to get script handle.
		// For example, `…/build/a11y/index.min.js` becomes `wp-a11y`.
		$handle = 'wp-' . basename( dirname( $path ) );

		// Replace extension with `.asset.php` to find the generated dependencies file.
		$asset_file   = substr( $path, 0, -( strlen( '.js' ) ) ) . '.asset.php';
		$asset        = file_exists( $asset_file )
			? require $asset_file
			: null;
		$dependencies = isset( $asset['dependencies'] ) ? $asset['dependencies'] : array();
		$version      = isset( $asset['version'] ) ? $asset['version'] : $default_version;

		// Add dependencies that cannot be detected and generated by build tools.
		switch ( $handle ) {
			case 'wp-block-library':
				if (
					! gutenberg_is_experiment_enabled( 'gutenberg-no-tinymce' ) ||
					! empty( $_GET['requiresTinymce'] ) ||
					gutenberg_post_being_edited_requires_classic_block()
				) {
					array_push( $dependencies, 'editor' );
				}
				break;

			case 'wp-edit-post':
				array_push( $dependencies, 'media-models', 'media-views', 'postbox' );
				break;

			case 'wp-edit-site':
				array_push( $dependencies, 'wp-dom-ready' );
				break;
			case 'wp-preferences':
				array_push( $dependencies, 'wp-preferences-persistence' );
				break;
		}

		// Get the path from Gutenberg directory as expected by `gutenberg_url`.
		$gutenberg_path = substr( $path, strlen( gutenberg_dir_path() ) );

		gutenberg_override_script(
			$scripts,
			$handle,
			gutenberg_url( $gutenberg_path ),
			$dependencies,
			$version,
			true
		);
	}
}
add_action( 'wp_default_scripts', 'gutenberg_register_packages_scripts' );

/**
 * Registers all the WordPress packages styles that are in the standardized
 * `build/` location.
 *
 * @since 6.7.0

 * @param WP_Styles $styles WP_Styles instance.
 */
function gutenberg_register_packages_styles( $styles ) {
	// When in production, use the plugin's version as the asset version;
	// else (for development or test) default to use the current time.
	$version = defined( 'GUTENBERG_VERSION' ) && ! SCRIPT_DEBUG ? GUTENBERG_VERSION : time();

	gutenberg_override_style(
		$styles,
		'wp-block-editor-content',
		gutenberg_url( 'build/block-editor/content.css' ),
		array( 'wp-components' ),
		$version
	);
	$styles->add_data( 'wp-block-editor-content', 'rtl', 'replace' );

	// Editor Styles.
	gutenberg_override_style(
		$styles,
		'wp-block-editor',
		gutenberg_url( 'build/block-editor/style.css' ),
		array( 'wp-components', 'wp-preferences' ),
		$version
	);
	$styles->add_data( 'wp-block-editor', 'rtl', 'replace' );

	gutenberg_override_style(
		$styles,
		'wp-editor',
		gutenberg_url( 'build/editor/style.css' ),
		array( 'wp-components', 'wp-block-editor', 'wp-patterns', 'wp-reusable-blocks', 'wp-preferences' ),
		$version
	);
	$styles->add_data( 'wp-editor', 'rtl', 'replace' );

	gutenberg_override_style(
		$styles,
		'wp-edit-post',
		gutenberg_url( 'build/edit-post/style.css' ),
		array( 'wp-components', 'wp-block-editor', 'wp-editor', 'wp-edit-blocks', 'wp-block-library', 'wp-commands', 'wp-preferences' ),
		$version
	);
	$styles->add_data( 'wp-edit-post', 'rtl', 'replace' );

	gutenberg_override_style(
		$styles,
		'wp-components',
		gutenberg_url( 'build/components/style.css' ),
		array( 'dashicons' ),
		$version
	);
	$styles->add_data( 'wp-components', 'rtl', 'replace' );

	$block_library_filename = wp_should_load_separate_core_block_assets() ? 'common' : 'style';
	gutenberg_override_style(
		$styles,
		'wp-block-library',
		gutenberg_url( 'build/block-library/' . $block_library_filename . '.css' ),
		array(),
		$version
	);
	$styles->add_data( 'wp-block-library', 'rtl', 'replace' );
	$styles->add_data( 'wp-block-library', 'path', gutenberg_dir_path() . 'build/block-library/' . $block_library_filename . '.css' );

	gutenberg_override_style(
		$styles,
		'wp-format-library',
		gutenberg_url( 'build/format-library/style.css' ),
		array( 'wp-block-editor', 'wp-components' ),
		$version
	);
	$styles->add_data( 'wp-format-library', 'rtl', 'replace' );

	$wp_edit_blocks_dependencies = array(
		'wp-components',
		// This need to be added before the block library styles,
		// The block library styles override the "reset" styles.
		'wp-reset-editor-styles',
		'wp-block-library',
		'wp-patterns',
		'wp-reusable-blocks',
		// Until #37466, we can't specifically add them as editor styles yet,
		// so we must hard-code it here as a dependency.
		'wp-block-editor-content',
	);

	// Only load the default layout and margin styles for themes without theme.json file.
	if ( ! wp_theme_has_theme_json() ) {
		$wp_edit_blocks_dependencies[] = 'wp-editor-classic-layout-styles';
	}

	global $editor_styles;
	if ( current_theme_supports( 'wp-block-styles' ) && ( ! is_array( $editor_styles ) || count( $editor_styles ) === 0 ) ) {
		// Include opinionated block styles if the theme supports block styles and no $editor_styles are declared, so the editor never appears broken.
		$wp_edit_blocks_dependencies[] = 'wp-block-library-theme';
	}

	gutenberg_override_style(
		$styles,
		'wp-reset-editor-styles',
		gutenberg_url( 'build/block-library/reset.css' ),
		array( 'common', 'forms' ), // Make sure the reset is loaded after the default WP Admin styles.
		$version
	);
	$styles->add_data( 'wp-reset-editor-styles', 'rtl', 'replace' );

	gutenberg_override_style(
		$styles,
		'wp-editor-classic-layout-styles',
		gutenberg_url( 'build/edit-post/classic.css' ),
		array(),
		$version
	);
	$styles->add_data( 'wp-editor-classic-layout-styles', 'rtl', 'replace' );

	gutenberg_override_style(
		$styles,
		'wp-edit-blocks',
		gutenberg_url( 'build/block-library/editor.css' ),
		$wp_edit_blocks_dependencies,
		$version
	);
	$styles->add_data( 'wp-edit-blocks', 'rtl', 'replace' );

	gutenberg_override_style(
		$styles,
		'wp-nux',
		gutenberg_url( 'build/nux/style.css' ),
		array( 'wp-components' ),
		$version
	);
	$styles->add_data( 'wp-nux', 'rtl', 'replace' );

	gutenberg_override_style(
		$styles,
		'wp-block-library-theme',
		gutenberg_url( 'build/block-library/theme.css' ),
		array(),
		$version
	);
	$styles->add_data( 'wp-block-library-theme', 'rtl', 'replace' );

	gutenberg_override_style(
		$styles,
		'wp-list-reusable-blocks',
		gutenberg_url( 'build/list-reusable-blocks/style.css' ),
		array( 'wp-components' ),
		$version
	);
	$styles->add_data( 'wp-list-reusable-block', 'rtl', 'replace' );

	gutenberg_override_style(
		$styles,
		'wp-commands',
		gutenberg_url( 'build/commands/style.css' ),
		array( 'wp-components' ),
		$version
	);
	$styles->add_data( 'wp-commands', 'rtl', 'replace' );

	gutenberg_override_style(
		$styles,
		'wp-edit-site',
		gutenberg_url( 'build/edit-site/style.css' ),
		array( 'wp-components', 'wp-block-editor', 'wp-editor', 'wp-edit-blocks', 'wp-commands', 'wp-preferences' ),
		$version
	);
	$styles->add_data( 'wp-edit-site', 'rtl', 'replace' );

	gutenberg_override_style(
		$styles,
		'wp-edit-widgets',
		gutenberg_url( 'build/edit-widgets/style.css' ),
		array( 'wp-components', 'wp-block-editor', 'wp-editor', 'wp-edit-blocks', 'wp-patterns', 'wp-reusable-blocks', 'wp-widgets', 'wp-preferences' ),
		$version
	);
	$styles->add_data( 'wp-edit-widgets', 'rtl', 'replace' );

	gutenberg_override_style(
		$styles,
		'wp-block-directory',
		gutenberg_url( 'build/block-directory/style.css' ),
		array( 'wp-block-editor', 'wp-components' ),
		$version
	);
	$styles->add_data( 'wp-block-directory', 'rtl', 'replace' );

	gutenberg_override_style(
		$styles,
		'wp-customize-widgets',
		gutenberg_url( 'build/customize-widgets/style.css' ),
		array( 'wp-components', 'wp-block-editor', 'wp-editor', 'wp-edit-blocks', 'wp-widgets', 'wp-preferences' ),
		$version
	);
	$styles->add_data( 'wp-customize-widgets', 'rtl', 'replace' );

	gutenberg_override_style(
		$styles,
		'wp-patterns',
		gutenberg_url( 'build/patterns/style.css' ),
		array( 'wp-components' ),
		$version
	);
	$styles->add_data( 'wp-patterns', 'rtl', 'replace' );

	gutenberg_override_style(
		$styles,
		'wp-reusable-blocks',
		gutenberg_url( 'build/reusable-blocks/style.css' ),
		array( 'wp-components' ),
		$version
	);
	$styles->add_data( 'wp-reusable-blocks', 'rtl', 'replace' );

	gutenberg_override_style(
		$styles,
		'wp-widgets',
		gutenberg_url( 'build/widgets/style.css' ),
		array( 'wp-components' )
	);
	$styles->add_data( 'wp-widgets', 'rtl', 'replace' );

	gutenberg_override_style(
		$styles,
		'wp-preferences',
		gutenberg_url( 'build/preferences/style.css' ),
		array( 'wp-components' ),
		$version
	);
	$styles->add_data( 'wp-preferences', 'rtl', 'replace' );
}
add_action( 'wp_default_styles', 'gutenberg_register_packages_styles' );

/**
 * Fetches, processes and compiles stored core styles, then combines and renders them to the page.
 * Styles are stored via the Style Engine API.
 *
 * This hook also exists, and should be backported to Core in future versions.
 * However, it is envisaged that Gutenberg will continue to use the Style Engine's `gutenberg_*` functions and `_Gutenberg` classes to aid continuous development.
 *
 * See: https://developer.wordpress.org/block-editor/reference-guides/packages/packages-style-engine/
 *
 * @param array $options {
 *     Optional. An array of options to pass to gutenberg_style_engine_get_stylesheet_from_context(). Default empty array.
 *
 *     @type bool $optimize Whether to optimize the CSS output, e.g., combine rules. Default is `false`.
 *     @type bool $prettify Whether to add new lines and indents to output. Default is the test of whether the global constant `SCRIPT_DEBUG` is defined.
 * }
 *
 * @since 6.1
 *
 * @return void
 */
function gutenberg_enqueue_stored_styles( $options = array() ) {
	$is_block_theme   = wp_is_block_theme();
	$is_classic_theme = ! $is_block_theme;

	/*
	 * For block themes, print stored styles in the header.
	 * For classic themes, in the footer.
	 */
	if (
		( $is_block_theme && doing_action( 'wp_footer' ) ) ||
		( $is_classic_theme && doing_action( 'wp_enqueue_scripts' ) )
	) {
		return;
	}

	$core_styles_keys         = array( 'block-supports' );
	$compiled_core_stylesheet = '';
	$style_tag_id             = 'core';
	foreach ( $core_styles_keys as $style_key ) {
		// Adds comment if code is prettified to identify core styles sections in debugging.
		$should_prettify = isset( $options['prettify'] ) ? true === $options['prettify'] : SCRIPT_DEBUG;
		if ( $should_prettify ) {
			$compiled_core_stylesheet .= "/**\n * Core styles: $style_key\n */\n";
		}
		// Chains core store ids to signify what the styles contain.
		$style_tag_id             .= '-' . $style_key;
		$compiled_core_stylesheet .= gutenberg_style_engine_get_stylesheet_from_context( $style_key, $options );
	}

	// Combines Core styles.
	if ( ! empty( $compiled_core_stylesheet ) ) {
		wp_register_style( $style_tag_id, false, array(), true, true );
		wp_add_inline_style( $style_tag_id, $compiled_core_stylesheet );
		wp_enqueue_style( $style_tag_id );
	}

	// If there are any other stores registered by themes etc., print them out.
	$additional_stores = WP_Style_Engine_CSS_Rules_Store_Gutenberg::get_stores();

	/*
	 * Since the corresponding action hook in Core is removed below,
	 * this function should still honour any styles stored using the Core Style Engine store.
	 */
	if ( class_exists( 'WP_Style_Engine_CSS_Rules_Store' ) ) {
		$additional_stores = array_merge( $additional_stores, WP_Style_Engine_CSS_Rules_Store::get_stores() );
	}

	foreach ( array_keys( $additional_stores ) as $store_name ) {
		if ( in_array( $store_name, $core_styles_keys, true ) ) {
			continue;
		}
		$styles = gutenberg_style_engine_get_stylesheet_from_context( $store_name, $options );
		if ( ! empty( $styles ) ) {
			$key = "wp-style-engine-$store_name";
			wp_register_style( $key, false, array(), true, true );
			wp_add_inline_style( $key, $styles );
			wp_enqueue_style( $key );
		}
	}
}

/**
 * Registers vendor JavaScript files to be used as dependencies of the editor
 * and plugins.
 *
 * This function is called from a script during the plugin build process, so it
 * should not call any WordPress PHP functions.
 *
 * @since 13.0
 *
 * @param WP_Scripts $scripts WP_Scripts instance.
 */
function gutenberg_register_vendor_scripts( $scripts ) {
	$extension = SCRIPT_DEBUG ? '.js' : '.min.js';

	gutenberg_override_script(
		$scripts,
		'react',
		gutenberg_url( 'build/vendors/react' . $extension ),
		// See https://github.com/pmmmwh/react-refresh-webpack-plugin/blob/main/docs/TROUBLESHOOTING.md#externalising-react.
		SCRIPT_DEBUG ? array( 'wp-react-refresh-entry', 'wp-polyfill' ) : array( 'wp-polyfill' ),
		'18'
	);
	gutenberg_override_script(
		$scripts,
		'react-dom',
		gutenberg_url( 'build/vendors/react-dom' . $extension ),
		array( 'react' ),
		'18'
	);
}
add_action( 'wp_default_scripts', 'gutenberg_register_vendor_scripts' );


/*
 * Always remove the Core action hook while gutenberg_enqueue_stored_styles() exists to avoid styles being printed twice.
 * This is also because gutenberg_enqueue_stored_styles uses the Style Engine's `gutenberg_*` functions and `_Gutenberg` classes,
 * which are in continuous development and generally ahead of Core.
 */
remove_action( 'wp_enqueue_scripts', 'wp_enqueue_stored_styles' );
remove_action( 'wp_footer', 'wp_enqueue_stored_styles', 1 );

// Enqueue stored styles.
add_action( 'wp_enqueue_scripts', 'gutenberg_enqueue_stored_styles' );
add_action( 'wp_footer', 'gutenberg_enqueue_stored_styles', 1 );
