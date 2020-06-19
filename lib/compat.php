<?php
/**
 * Temporary compatibility shims for features present in Gutenberg, pending
 * upstream commit to the WordPress core source repository. Functions here
 * exist only as long as necessary for corresponding WordPress support, and
 * each should be associated with a Trac ticket.
 *
 * @package gutenberg
 */

if ( ! function_exists( 'register_block_type_from_metadata' ) ) {
	/**
	 * Removes the block asset's path prefix if provided.
	 *
	 * @since 5.5.0
	 *
	 * @param string $asset_handle_or_path Asset handle or prefixed path.
	 *
	 * @return string Path without the prefix or the original value.
	 */
	function remove_block_asset_path_prefix( $asset_handle_or_path ) {
		$path_prefix = 'file:';
		if ( strpos( $asset_handle_or_path, $path_prefix ) !== 0 ) {
			return $asset_handle_or_path;
		}
		return substr(
			$asset_handle_or_path,
			strlen( $path_prefix )
		);
	}

	/**
	 * Generates the name for an asset based on the name of the block
	 * and the field name provided.
	 *
	 * @since 5.5.0
	 *
	 * @param string $block_name Name of the block.
	 * @param string $field_name Name of the metadata field.
	 *
	 * @return string Generated asset name for the block's field.
	 */
	function generate_block_asset_handle( $block_name, $field_name ) {
		$field_mappings = array(
			'editorScript' => 'editor-script',
			'script'       => 'script',
			'editorStyle'  => 'editor-style',
			'style'        => 'style',
		);
		return str_replace( '/', '-', $block_name ) .
			'-' . $field_mappings[ $field_name ];
	}

	/**
	 * Finds a script handle for the selected block metadata field. It detects
	 * when a path to file was provided and finds a corresponding
	 * asset file with details necessary to register the script under
	 * automatically generated handle name. It returns unprocessed script handle
	 * otherwise.
	 *
	 * @since 5.5.0
	 *
	 * @param array  $metadata Block metadata.
	 * @param string $field_name Field name to pick from metadata.
	 *
	 * @return string|boolean Script handle provided directly or created through
	 *     script's registration, or false on failure.
	 */
	function register_block_script_handle( $metadata, $field_name ) {
		if ( empty( $metadata[ $field_name ] ) ) {
			return false;
		}
		$script_handle = $metadata[ $field_name ];
		$script_path   = remove_block_asset_path_prefix( $metadata[ $field_name ] );
		if ( $script_handle === $script_path ) {
			return $script_handle;
		}

		$script_handle     = generate_block_asset_handle( $metadata['name'], $field_name );
		$script_asset_path = realpath(
			dirname( $metadata['file'] ) . '/' .
			substr_replace( $script_path, '.asset.php', - strlen( '.js' ) )
		);
		if ( ! file_exists( $script_asset_path ) ) {
			$message = sprintf(
				/* translators: %1: field name. %2: block name */
				__( 'The asset file for the "%1$s" defined in "%2$s" block definition is missing.', 'default' ),
				$field_name,
				$metadata['name']
			);
			_doing_it_wrong( __FUNCTION__, $message, '5.5.0' );
			return false;
		}
		$script_asset = require( $script_asset_path );
		$result       = wp_register_script(
			$script_handle,
			plugins_url( $script_path, $metadata['file'] ),
			$script_asset['dependencies'],
			$script_asset['version']
		);
		return $result ? $script_handle : false;
	}

	/**
	 * Finds a style handle for the block metadata field. It detects when a path
	 * to file was provided and registers the style under automatically
	 * generated handle name. It returns unprocessed style handle otherwise.
	 *
	 * @since 5.5.0
	 *
	 * @param array  $metadata Block metadata.
	 * @param string $field_name Field name to pick from metadata.
	 *
	 * @return string|boolean Style handle provided directly or created through
	 *     style's registration, or false on failure.
	 */
	function register_block_style_handle( $metadata, $field_name ) {
		if ( empty( $metadata[ $field_name ] ) ) {
			return false;
		}
		$style_handle = $metadata[ $field_name ];
		$style_path   = remove_block_asset_path_prefix( $metadata[ $field_name ] );
		if ( $style_handle === $style_path ) {
			return $style_handle;
		}

		$style_handle = generate_block_asset_handle( $metadata['name'], $field_name );
		$block_dir    = dirname( $metadata['file'] );
		$result       = wp_register_style(
			$style_handle,
			plugins_url( $style_path, $metadata['file'] ),
			array(),
			filemtime( realpath( "$block_dir/$style_path" ) )
		);
		return $result ? $style_handle : false;
	}

	/**
	 * Registers a block type from metadata stored in the `block.json` file.
	 *
	 * @since 7.9.0
	 *
	 * @param string $file_or_folder Path to the JSON file with metadata definition for
	 *     the block or path to the folder where the `block.json` file is located.
	 * @param array  $args {
	 *     Optional. Array of block type arguments. Any arguments may be defined, however the
	 *     ones described below are supported by default. Default empty array.
	 *
	 *     @type callable $render_callback Callback used to render blocks of this block type.
	 * }
	 * @return WP_Block_Type|false The registered block type on success, or false on failure.
	 */
	function register_block_type_from_metadata( $file_or_folder, $args = array() ) {
		$filename      = 'block.json';
		$metadata_file = ( substr( $file_or_folder, -strlen( $filename ) ) !== $filename ) ?
			trailingslashit( $file_or_folder ) . $filename :
			$file_or_folder;
		if ( ! file_exists( $metadata_file ) ) {
			return false;
		}

		$metadata = json_decode( file_get_contents( $metadata_file ), true );
		if ( ! is_array( $metadata ) || empty( $metadata['name'] ) ) {
			return false;
		}
		$metadata['file'] = $metadata_file;

		$settings          = array();
		$property_mappings = array(
			'title'           => 'title',
			'category'        => 'category',
			'parent'          => 'parent',
			'icon'            => 'icon',
			'description'     => 'description',
			'keywords'        => 'keywords',
			'attributes'      => 'attributes',
			'providesContext' => 'provides_context',
			'usesContext'     => 'uses_context',
			// Deprecated: remove with Gutenberg 8.6 release.
			'context'         => 'context',
			'supports'        => 'supports',
			'styles'          => 'styles',
			'example'         => 'example',
		);

		foreach ( $property_mappings as $key => $mapped_key ) {
			if ( isset( $metadata[ $key ] ) ) {
				$settings[ $mapped_key ] = $metadata[ $key ];
			}
		}

		if ( ! empty( $metadata['editorScript'] ) ) {
			$settings['editor_script'] = register_block_script_handle(
				$metadata,
				'editorScript'
			);
		}

		if ( ! empty( $metadata['script'] ) ) {
			$settings['script'] = register_block_script_handle(
				$metadata,
				'script'
			);
		}

		if ( ! empty( $metadata['editorStyle'] ) ) {
			$settings['editor_style'] = register_block_style_handle(
				$metadata,
				'editorStyle'
			);
		}

		if ( ! empty( $metadata['style'] ) ) {
			$settings['style'] = register_block_style_handle(
				$metadata,
				'style'
			);
		}

		return register_block_type(
			$metadata['name'],
			array_merge(
				$settings,
				$args
			)
		);
	}
}

/**
 * Extends block editor settings to include a list of image dimensions per size.
 *
 * This can be removed when plugin support requires WordPress 5.4.0+.
 *
 * @see https://core.trac.wordpress.org/ticket/49389
 * @see https://core.trac.wordpress.org/changeset/47240
 *
 * @param array $settings Default editor settings.
 *
 * @return array Filtered editor settings.
 */
function gutenberg_extend_settings_image_dimensions( $settings ) {
	/*
	 * Only filter settings if:
	 * 1. `imageDimensions` is not already assigned, in which case it can be
	 *    assumed to have been set from WordPress 5.4.0+ default settings.
	 * 2. `imageSizes` is an array. Plugins may run `block_editor_settings`
	 *    directly and not provide all properties of the settings array.
	 */
	if ( ! isset( $settings['imageDimensions'] ) && ! empty( $settings['imageSizes'] ) ) {
		$image_dimensions = array();
		$all_sizes        = wp_get_registered_image_subsizes();
		foreach ( $settings['imageSizes'] as $size ) {
			$key = $size['slug'];
			if ( isset( $all_sizes[ $key ] ) ) {
				$image_dimensions[ $key ] = $all_sizes[ $key ];
			}
		}
		$settings['imageDimensions'] = $image_dimensions;
	}

	return $settings;
}
add_filter( 'block_editor_settings', 'gutenberg_extend_settings_image_dimensions' );

/**
 * Adds a polyfill for the WHATWG URL in environments which do not support it.
 * The intention in how this action is handled is under the assumption that this
 * code would eventually be placed at `wp_default_packages_vendor`, which is
 * called as a result of `wp_default_packages` via the `wp_default_scripts`.
 *
 * This can be removed when plugin support requires WordPress 5.4.0+.
 *
 * The script registration occurs in `gutenberg_register_vendor_scripts`, which
 * should be removed in coordination with this function.
 *
 * @see gutenberg_register_vendor_scripts
 * @see https://core.trac.wordpress.org/ticket/49360
 * @see https://developer.mozilla.org/en-US/docs/Web/API/URL/URL
 * @see https://developer.wordpress.org/reference/functions/wp_default_packages_vendor/
 *
 * @since 7.3.0
 *
 * @param WP_Scripts $scripts WP_Scripts object.
 */
function gutenberg_add_url_polyfill( $scripts ) {
	did_action( 'init' ) && $scripts->add_inline_script(
		'wp-polyfill',
		wp_get_script_polyfill(
			$scripts,
			array(
				'window.URL && window.URL.prototype && window.URLSearchParams' => 'wp-polyfill-url',
			)
		)
	);
}
add_action( 'wp_default_scripts', 'gutenberg_add_url_polyfill', 20 );

/**
 * Adds a polyfill for DOMRect in environments which do not support it.
 *
 * This can be removed when plugin support requires WordPress 5.4.0+.
 *
 * The script registration occurs in `gutenberg_register_vendor_scripts`, which
 * should be removed in coordination with this function.
 *
 * @see gutenberg_register_vendor_scripts
 * @see gutenberg_add_url_polyfill
 * @see https://core.trac.wordpress.org/ticket/49360
 * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMRect
 * @see https://developer.wordpress.org/reference/functions/wp_default_packages_vendor/
 *
 * @since 7.5.0
 *
 * @param WP_Scripts $scripts WP_Scripts object.
 */
function gutenberg_add_dom_rect_polyfill( $scripts ) {
	did_action( 'init' ) && $scripts->add_inline_script(
		'wp-polyfill',
		wp_get_script_polyfill(
			$scripts,
			array(
				'window.DOMRect' => 'wp-polyfill-dom-rect',
			)
		)
	);
}
add_action( 'wp_default_scripts', 'gutenberg_add_dom_rect_polyfill', 20 );

/**
 * Filters default block categories to substitute legacy category names with new
 * block categories.
 *
 * This can be removed when plugin support requires WordPress 5.5.0+.
 *
 * @see https://core.trac.wordpress.org/ticket/50278
 *
 * @param array[] $default_categories Array of block categories.
 *
 * @return array[] Filtered block categories.
 */
function gutenberg_replace_default_block_categories( $default_categories ) {
	$substitution = array(
		'common'     => array(
			'slug'  => 'text',
			'title' => __( 'Text', 'gutenberg' ),
			'icon'  => null,
		),
		'formatting' => array(
			'slug'  => 'media',
			'title' => __( 'Media', 'gutenberg' ),
			'icon'  => null,
		),
		'layout'     => array(
			'slug'  => 'design',
			'title' => __( 'Design', 'gutenberg' ),
			'icon'  => null,
		),
	);

	// Loop default categories to perform in-place substitution by legacy slug.
	foreach ( $default_categories as $i => $default_category ) {
		$slug = $default_category['slug'];
		if ( isset( $substitution[ $slug ] ) ) {
			$default_categories[ $i ] = $substitution[ $slug ];
			unset( $substitution[ $slug ] );
		}
	}

	/*
	 * At this point, `$substitution` should contain only the categories which
	 * could not be in-place substituted with a default category, likely in the
	 * case that core has since been updated to use the default categories.
	 * Check to verify they exist.
	 */
	$default_category_slugs = wp_list_pluck( $default_categories, 'slug' );
	foreach ( $substitution as $i => $substitute_category ) {
		if ( in_array( $substitute_category['slug'], $default_category_slugs, true ) ) {
			unset( $substitution[ $i ] );
		}
	}

	/*
	 * Any substitutes remaining should be appended, as they are not yet
	 * assigned in the default categories array.
	 */
	return array_merge( $default_categories, array_values( $substitution ) );
}
add_filter( 'block_categories', 'gutenberg_replace_default_block_categories' );

/**
 * Shim that hooks into `pre_render_block` so as to override `render_block` with
 * a function that assigns block context.
 *
 * This can be removed when plugin support requires WordPress 5.5.0+.
 *
 * @see https://core.trac.wordpress.org/ticket/49927
 *
 * @param string|null $pre_render   The pre-rendered content. Defaults to null.
 * @param array       $parsed_block The parsed block being rendered.
 *
 * @return string String of rendered HTML.
 */
function gutenberg_render_block_with_assigned_block_context( $pre_render, $parsed_block ) {
	global $post, $wp_query;

	/*
	 * If a non-null value is provided, a filter has run at an earlier priority
	 * and has already handled custom rendering and should take precedence.
	 */
	if ( null !== $pre_render ) {
		return $pre_render;
	}

	$source_block = $parsed_block;

	/** This filter is documented in src/wp-includes/blocks.php */
	$parsed_block = apply_filters( 'render_block_data', $parsed_block, $source_block );

	$context = array(
		'postId'   => $post->ID,

		/*
		 * The `postType` context is largely unnecessary server-side, since the
		 * ID is usually sufficient on its own. That being said, since a block's
		 * manifest is expected to be shared between the server and the client,
		 * it should be included to consistently fulfill the expectation.
		 */
		'postType' => $post->post_type,

		'query'    => array( 'categoryIds' => array() ),
	);

	if ( isset( $wp_query->tax_query->queried_terms['category'] ) ) {
		foreach ( $wp_query->tax_query->queried_terms['category']['terms'] as $category_slug_or_id ) {
			$context['query']['categoryIds'][] = 'slug' === $wp_query->tax_query->queried_terms['category']['field'] ? get_cat_ID( $category_slug_or_id ) : $category_slug_or_id;
		}
	}

	/**
	 * Filters the default context provided to a rendered block.
	 *
	 * @param array $context      Default context.
	 * @param array $parsed_block Block being rendered, filtered by `render_block_data`.
	 */
	$context = apply_filters( 'render_block_context', $context, $parsed_block );

	$block = new WP_Block( $parsed_block, $context );

	return $block->render();
}
add_filter( 'pre_render_block', 'gutenberg_render_block_with_assigned_block_context', 9, 2 );

/**
 * Avoid enqueueing block assets of all registered blocks for all posts, instead
 * deferring to block render mechanics to enqueue scripts, thereby ensuring only
 * blocks of the content have their assets enqueued.
 *
 * This can be removed once minimum support for the plugin is outside the range
 * of the version associated with closure of the following ticket.
 *
 * @see https://core.trac.wordpress.org/ticket/50328
 *
 * @see WP_Block::render
 */
remove_action( 'enqueue_block_assets', 'wp_enqueue_registered_block_scripts_and_styles' );
