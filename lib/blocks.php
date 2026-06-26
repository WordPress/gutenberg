<?php
/**
 * Block functions specific for the Gutenberg editor plugin.
 *
 * @package gutenberg
 */

/**
 * Substitutes the implementation of a core-registered block type, if exists,
 * with the built result from the plugin.
 */
function gutenberg_reregister_core_block_types() {
	$blocks_dirs = array(
		__DIR__ . '/../build/scripts/block-library/',
		__DIR__ . '/../build/scripts/edit-widgets/blocks/',
		__DIR__ . '/../build/scripts/widgets/blocks/',
	);

	foreach ( $blocks_dirs as $blocks_dir ) {
		$manifest_path = $blocks_dir . 'blocks-manifest.php';
		$blocks        = require $manifest_path;

		foreach ( $blocks as $block_name_folder => $metadata ) {
			if ( ! is_array( $metadata ) || ! isset( $metadata['name'] ) ) {
				continue;
			}

			gutenberg_deregister_core_block_and_assets( $metadata['name'] );
			gutenberg_register_core_block_assets( $block_name_folder );

			$php_file = $blocks_dir . $block_name_folder . '.php';
			if ( file_exists( $php_file ) ) {
				require_once $php_file;
			} else {
				register_block_type_from_metadata( $blocks_dir . $block_name_folder );
			}
		}
	}
}

add_action( 'init', 'gutenberg_reregister_core_block_types' );

/**
 * Adds the defer loading strategy to all registered blocks.
 *
 * This function would not be part of core merge. Instead, the register_block_script_handle() function would be patched
 * as follows.
 *
 * ```
 * --- a/wp-includes/blocks.php
 * +++ b/wp-includes/blocks.php
 * @ @ -153,7 +153,8 @ @ function register_block_script_handle( $metadata, $field_name, $index = 0 ) {
 *                 $script_handle,
 *                 $script_uri,
 *                 $script_dependencies,
 * -           $script_asset['version'] ?? false
 * +         $script_asset['version'] ?? false,
 * +         array( 'strategy' => 'defer' )
 *         );
 *         if ( ! $result ) {
 *                 return false;
 * ```
 *
 * @see register_block_script_handle()
 */
function gutenberg_defer_block_view_scripts() {
	$block_types = WP_Block_Type_Registry::get_instance()->get_all_registered();
	foreach ( $block_types as $block_type ) {
		foreach ( $block_type->view_script_handles as $view_script_handle ) {
			wp_script_add_data( $view_script_handle, 'strategy', 'defer' );
		}
	}
}

add_action( 'init', 'gutenberg_defer_block_view_scripts', 100 );

/**
 * Deregisters the existing core block type and its assets.
 *
 * @param string $block_name The name of the block.
 *
 * @return void
 */
function gutenberg_deregister_core_block_and_assets( $block_name ) {
	$registry = WP_Block_Type_Registry::get_instance();
	if ( $registry->is_registered( $block_name ) ) {
		$block_type = $registry->get_registered( $block_name );
		if ( ! empty( $block_type->view_script_handles ) ) {
			foreach ( $block_type->view_script_handles as $view_script_handle ) {
				if ( str_starts_with( $view_script_handle, 'wp-block-' ) ) {
					wp_deregister_script( $view_script_handle );
				}
			}
		}
		$registry->unregister( $block_name );
	}
}

/**
 * Registers block styles for a core block.
 *
 * @param string $block_name The block-name.
 *
 * @return void
 */
function gutenberg_register_core_block_assets( $block_name ) {
	static $gutenberg_url_root = null;
	// Running `gutenberg_url` inside of a loop can be expensive in systems with
	// many callbacks attached to the `plugins_url` hook.
	// Since all of the paths have the same root, we can instead retrieve the
	// corresponding URL root once, and manually concatenate the URL below.
	if ( is_null( $gutenberg_url_root ) ) {
		$gutenberg_url_root = gutenberg_url( '/' );
	}

	if ( ! wp_should_load_separate_core_block_assets() ) {
		return;
	}

	$block_name = str_replace( 'core/', '', $block_name );

	// When in production, use the plugin's version as the default asset version;
	// else (for development or test) default to use the current time.
	$default_version = defined( 'GUTENBERG_VERSION' ) && ! SCRIPT_DEBUG ? GUTENBERG_VERSION : time();
	$suffix          = SCRIPT_DEBUG ? '' : '.min';

	$style_path      = "build/styles/block-library/$block_name/";
	$stylesheet_url  = $gutenberg_url_root . $style_path . 'style' . $suffix . '.css';
	$stylesheet_path = gutenberg_dir_path() . $style_path . ( is_rtl() ? 'style-rtl' . $suffix . '.css' : 'style' . $suffix . '.css' );

	if ( file_exists( $stylesheet_path ) ) {

		wp_deregister_style( "wp-block-{$block_name}" );
		wp_register_style(
			"wp-block-{$block_name}",
			$stylesheet_url,
			array(),
			$default_version
		);
		wp_style_add_data( "wp-block-{$block_name}", 'rtl', 'replace' );
		wp_style_add_data( "wp-block-{$block_name}", 'suffix', $suffix );
		// Add a reference to the stylesheet's path to allow calculations for inlining styles in `wp_head`.
		wp_style_add_data( "wp-block-{$block_name}", 'path', $stylesheet_path );
	} else {
		wp_register_style( "wp-block-{$block_name}", false, array() );
	}

	/*
	 * If the current theme supports wp-block-styles, dequeue the core styles
	 * and enqueue the plugin ones instead.
	 */
	if ( current_theme_supports( 'wp-block-styles' ) ) {

		// Get the path to the block's stylesheet.
		$theme_style_path = is_rtl()
			? "build/styles/block-library/$block_name/theme-rtl{$suffix}.css"
			: "build/styles/block-library/$block_name/theme{$suffix}.css";

		// If the file exists, enqueue it.
		if ( file_exists( gutenberg_dir_path() . $theme_style_path ) ) {
			wp_deregister_style( "wp-block-{$block_name}-theme" );
			wp_register_style(
				"wp-block-{$block_name}-theme",
				$gutenberg_url_root . $theme_style_path,
				array(),
				$default_version
			);
			wp_style_add_data( "wp-block-{$block_name}-theme", 'path', gutenberg_dir_path() . $theme_style_path );
			wp_style_add_data( "wp-block-{$block_name}-theme", 'suffix', $suffix );
		}
	}

	$editor_style_path = "build/styles/block-library/$block_name/style-editor{$suffix}.css";
	if ( file_exists( gutenberg_dir_path() . $editor_style_path ) ) {
		wp_deregister_style( "wp-block-{$block_name}-editor" );
		wp_register_style(
			"wp-block-{$block_name}-editor",
			$gutenberg_url_root . $editor_style_path,
			array(),
			$default_version
		);
		wp_style_add_data( "wp-block-{$block_name}-editor", 'rtl', 'replace' );
		wp_style_add_data( "wp-block-{$block_name}-editor", 'suffix', $suffix );
	} else {
		wp_register_style( "wp-block-{$block_name}-editor", false );
	}
}

/**
 * Complements the implementation of block type `core/social-icon`, whether it
 * be provided by core or the plugin, with derived block types for each
 * "service" (WordPress, Twitter, etc.) supported by Social Links.
 *
 * This ensures backwards compatibility for any users running the Gutenberg
 * plugin who have used Social Links prior to their conversion to block
 * variations.
 *
 * This shim is INTENTIONALLY left out of core, as Social Links have never
 * landed there.
 *
 * @link https://github.com/WordPress/gutenberg/pull/19887
 */
function gutenberg_register_legacy_social_link_blocks() {
	$services = array(
		'amazon',
		'bandcamp',
		'behance',
		'chain',
		'codepen',
		'deviantart',
		'dribbble',
		'dropbox',
		'etsy',
		'facebook',
		'feed',
		'fivehundredpx',
		'flickr',
		'foursquare',
		'goodreads',
		'google',
		'github',
		'instagram',
		'lastfm',
		'linkedin',
		'mail',
		'mastodon',
		'meetup',
		'medium',
		'pinterest',
		'pocket',
		'reddit',
		'skype',
		'snapchat',
		'soundcloud',
		'spotify',
		'tumblr',
		'twitch',
		'twitter',
		'vimeo',
		'vk',
		'wordpress',
		'yelp',
		'youtube',
	);

	foreach ( $services as $service ) {
		register_block_type(
			'core/social-link-' . $service,
			array(
				'category'        => 'widgets',
				'attributes'      => array(
					'url'     => array(
						'type' => 'string',
					),
					'service' => array(
						'type'    => 'string',
						'default' => $service,
					),
					'label'   => array(
						'type' => 'string',
					),
				),
				'render_callback' => 'gutenberg_render_block_core_social_link',
			)
		);
	}
}

add_action( 'init', 'gutenberg_register_legacy_social_link_blocks' );

/**
 * Migrate the legacy `sync_status` meta key (added 16.1) to the new `wp_pattern_sync_status` meta key (16.1.1).
 *
 * This filter is INTENTIONALLY left out of core as the meta key was fist introduced to core in 6.3 as `wp_pattern_sync_status`.
 * see https://github.com/WordPress/gutenberg/pull/52232
 *
 * @param mixed  $value     The value to return, either a single metadata value or an array of values depending on the value of $single.
 * @param int    $object_id ID of the object metadata is for.
 * @param string $meta_key  Metadata key.
 * @param bool   $single    Whether to return only the first value of the specified $meta_key.
 */
function gutenberg_legacy_wp_block_post_meta( $value, $object_id, $meta_key, $single ) {
	if ( 'wp_pattern_sync_status' !== $meta_key ) {
		return $value;
	}

	$sync_status = get_post_meta( $object_id, 'sync_status', $single );

	if ( $single && 'unsynced' === $sync_status ) {
		return $sync_status;
	} elseif ( isset( $sync_status[0] ) && 'unsynced' === $sync_status[0] ) {
		return $sync_status;
	}

	return $value;
}

add_filter( 'default_post_metadata', 'gutenberg_legacy_wp_block_post_meta', 10, 4 );



/**
 * Strips all HTML from the content of footnotes, and sanitizes the ID.
 *
 * This function expects slashed data on the footnotes content.
 *
 * @access private
 *
 * @param string $footnotes JSON encoded string of an array containing the content and ID of each footnote.
 * @return string Filtered content without any HTML on the footnote content and with the sanitized id.
 */
function _gutenberg_filter_post_meta_footnotes( $footnotes ) {
	$footnotes_decoded = json_decode( $footnotes, true );
	if ( ! is_array( $footnotes_decoded ) ) {
		return '';
	}
	$footnotes_sanitized = array();
	foreach ( $footnotes_decoded as $footnote ) {
		if ( ! empty( $footnote['content'] ) && ! empty( $footnote['id'] ) ) {
			$footnotes_sanitized[] = array(
				'id'      => sanitize_key( $footnote['id'] ),
				'content' => wp_unslash( wp_filter_post_kses( wp_slash( $footnote['content'] ) ) ),
			);
		}
	}
	return wp_json_encode( $footnotes_sanitized );
}

/**
 * Adds the filters to filter footnotes meta field.
 *
 * @access private
 */
function _gutenberg_footnotes_kses_init_filters() {
	add_filter( 'sanitize_post_meta_footnotes', '_gutenberg_filter_post_meta_footnotes' );
}

/**
 * Removes the filters that filter footnotes meta field.
 *
 * @access private
 */
function _gutenberg_footnotes_remove_filters() {
	remove_filter( 'sanitize_post_meta_footnotes', '_gutenberg_filter_post_meta_footnotes' );
}

/**
 * Registers the filter of footnotes meta field if the user does not have unfiltered_html capability.
 *
 * @access private
 */
function _gutenberg_footnotes_kses_init() {
	if ( function_exists( '_wp_filter_post_meta_footnotes' ) ) {
		return;
	}
	_gutenberg_footnotes_remove_filters();
	if ( ! current_user_can( 'unfiltered_html' ) ) {
		_gutenberg_footnotes_kses_init_filters();
	}
}

/**
 * Initializes footnotes meta field filters when imported data should be filtered.
 *
 * This filter is the last being executed on force_filtered_html_on_import.
 * If the input of the filter is true it means we are in an import situation and should
 * enable kses, independently of the user capabilities.
 * So in that case we call _gutenberg_footnotes_kses_init_filters;
 *
 * @access private
 *
 * @param string $arg Input argument of the filter.
 * @return string Input argument of the filter.
 */
function _gutenberg_footnotes_force_filtered_html_on_import_filter( $arg ) {
	if ( function_exists( '_wp_filter_post_meta_footnotes' ) ) {
		return;
	}
	// force_filtered_html_on_import is true we need to init the global styles kses filters.
	if ( $arg ) {
		_gutenberg_footnotes_kses_init_filters();
	}
	return $arg;
}

add_action( 'init', '_gutenberg_footnotes_kses_init' );
add_action( 'set_current_user', '_gutenberg_footnotes_kses_init' );
add_filter( 'force_filtered_html_on_import', '_gutenberg_footnotes_force_filtered_html_on_import_filter', 999 );

/**
 * Maps the 'rich-text' attribute type to 'string' in JSON Schemas.
 *
 * The 'rich-text' type is editor metadata, not a JSON Schema type. Keep it in
 * the registered block type so the editor can identify rich text attributes,
 * but use 'string' when validating server-side render requests.
 *
 * @param array $schema Attribute schema.
 * @return array Modified attribute schema.
 */
function gutenberg_map_rich_text_attribute_type_for_json_schema( $schema ) {
	if ( ! is_array( $schema ) ) {
		return $schema;
	}

	if ( isset( $schema['type'] ) ) {
		if ( 'rich-text' === $schema['type'] ) {
			$schema['type'] = 'string';
		} elseif (
			is_array( $schema['type'] ) &&
			in_array( 'rich-text', $schema['type'], true )
		) {
			$schema['type'] = array_map(
				static function ( $type ) {
					return 'rich-text' === $type ? 'string' : $type;
				},
				$schema['type']
			);
		}
	}

	foreach ( $schema as $key => $value ) {
		if ( in_array( $key, array( 'type', 'default', 'enum', 'example' ), true ) ) {
			continue;
		}

		if ( in_array( $key, array( 'properties', 'query' ), true ) ) {
			$schema[ $key ] = gutenberg_map_rich_text_attribute_map_for_json_schema( $value );
			continue;
		}

		if ( is_array( $value ) ) {
			$schema[ $key ] = gutenberg_map_rich_text_attribute_type_for_json_schema( $value );
		}
	}

	return $schema;
}

/**
 * Maps rich-text attribute types in a map of block attribute schemas.
 *
 * Attribute names may overlap with JSON Schema keywords such as 'default',
 * 'enum', 'example', or 'type', so map each attribute schema individually.
 *
 * @param array $attributes Attribute schemas keyed by attribute name.
 * @return array Modified attribute schemas.
 */
function gutenberg_map_rich_text_attribute_map_for_json_schema( $attributes ) {
	if ( ! is_array( $attributes ) ) {
		return $attributes;
	}

	foreach ( $attributes as $attribute_name => $attribute_schema ) {
		$attributes[ $attribute_name ] = gutenberg_map_rich_text_attribute_type_for_json_schema(
			$attribute_schema
		);
	}

	return $attributes;
}

/**
 * Returns a JSON Schema-compatible block attributes schema for REST requests.
 *
 * @param string $block_name Block name.
 * @return array|null REST-compatible attributes schema, or null when the block
 *                    is not registered.
 */
function gutenberg_get_block_renderer_attributes_rest_schema( $block_name ) {
	$block = WP_Block_Type_Registry::get_instance()->get_registered( $block_name );
	if ( ! $block ) {
		return null;
	}

	return array(
		'type'                 => 'object',
		'properties'           => gutenberg_map_rich_text_attribute_map_for_json_schema(
			$block->get_attributes()
		),
		'additionalProperties' => false,
	);
}

/**
 * Validates block renderer attributes with a JSON Schema-compatible rich-text type.
 *
 * @param mixed           $value   Request value.
 * @param WP_REST_Request $request Request object.
 * @return true|WP_Error True if the value is valid, otherwise WP_Error.
 */
function gutenberg_validate_block_renderer_attributes( $value, $request ) {
	$schema = gutenberg_get_block_renderer_attributes_rest_schema( $request['name'] );
	if ( ! $schema ) {
		// This will get rejected by WP_REST_Block_Renderer_Controller::get_item().
		return true;
	}

	return rest_validate_value_from_schema( $value, $schema );
}

/**
 * Sanitizes block renderer attributes with a JSON Schema-compatible rich-text type.
 *
 * @param mixed           $value   Request value.
 * @param WP_REST_Request $request Request object.
 * @return mixed Sanitized value.
 */
function gutenberg_sanitize_block_renderer_attributes( $value, $request ) {
	$schema = gutenberg_get_block_renderer_attributes_rest_schema( $request['name'] );
	if ( ! $schema ) {
		// This will get rejected by WP_REST_Block_Renderer_Controller::get_item().
		return true;
	}

	return rest_sanitize_value_from_schema( $value, $schema );
}

/**
 * Temporarily maps rich-text attribute types before a block is rendered.
 *
 * WP_Block validates attributes when a WP_Block instance is created or rendered.
 * Keep the registered block metadata unchanged outside the current render stack,
 * but make render-time validation use JSON Schema-compatible attribute types.
 *
 * @param array $context      Default context.
 * @param array $parsed_block Block being rendered.
 * @return array Unmodified context.
 */
function gutenberg_prepare_rich_text_attribute_types_for_render(
	$context,
	$parsed_block
) {
	if ( empty( $parsed_block['blockName'] ) ) {
		return $context;
	}

	$block = WP_Block_Type_Registry::get_instance()->get_registered( $parsed_block['blockName'] );
	if ( ! $block ) {
		return $context;
	}

	$attributes        = $block->get_attributes();
	$mapped_attributes = gutenberg_map_rich_text_attribute_map_for_json_schema( $attributes );
	if ( $mapped_attributes === $attributes ) {
		return $context;
	}

	$GLOBALS['_gutenberg_block_render_original_attributes'][] = array(
		'block_name' => $parsed_block['blockName'],
		'block'      => $block,
		'attributes' => $block->attributes,
	);
	$block->attributes                                        = $mapped_attributes;

	return $context;
}
add_filter(
	'render_block_context',
	'gutenberg_prepare_rich_text_attribute_types_for_render',
	PHP_INT_MAX,
	2
);

/**
 * Restores block attributes after a block is rendered.
 *
 * @param string   $block_content Rendered block content.
 * @param array    $block         Block being rendered.
 * @return string Unmodified rendered block content.
 */
function gutenberg_restore_rich_text_attribute_types_after_render(
	$block_content,
	$block
) {
	if (
		empty( $block['blockName'] ) ||
		empty( $GLOBALS['_gutenberg_block_render_original_attributes'] )
	) {
		return $block_content;
	}

	$restore         = null;
	$attribute_stack = &$GLOBALS['_gutenberg_block_render_original_attributes'];
	for (
		$index = count( $attribute_stack ) - 1;
		$index >= 0;
		--$index
	) {
		if ( $attribute_stack[ $index ]['block_name'] === $block['blockName'] ) {
			$restore = $attribute_stack[ $index ];
			array_splice( $attribute_stack, $index, 1 );
			break;
		}
	}

	if ( ! $restore ) {
		return $block_content;
	}

	if ( $restore['block'] instanceof WP_Block_Type ) {
		$restore['block']->attributes = $restore['attributes'];
	}

	return $block_content;
}
add_filter(
	'render_block',
	'gutenberg_restore_rich_text_attribute_types_after_render',
	0,
	2
);

/**
 * Replaces block renderer attribute validation with a rich-text-aware callback.
 *
 * @param array $endpoints REST API endpoints.
 * @return array Modified REST API endpoints.
 */
function gutenberg_replace_block_renderer_attributes_rest_callbacks( $endpoints ) {
	// WP_REST_Block_Renderer_Controller registers one route with GET/POST endpoints.
	$route = '/wp/v2/block-renderer/(?P<name>[a-z0-9-]+/[a-z0-9-]+)';
	if ( empty( $endpoints[ $route ] ) || ! is_array( $endpoints[ $route ] ) ) {
		return $endpoints;
	}

	foreach ( $endpoints[ $route ] as $index => $endpoint ) {
		if (
			empty( $endpoint['args']['attributes'] ) ||
			! is_array( $endpoint['args']['attributes'] )
		) {
			continue;
		}

		$attributes_args                      = &$endpoints[ $route ][ $index ]['args']['attributes'];
		$attributes_args['validate_callback'] = 'gutenberg_validate_block_renderer_attributes';
		$attributes_args['sanitize_callback'] = 'gutenberg_sanitize_block_renderer_attributes';
		unset( $attributes_args );
	}

	return $endpoints;
}
add_filter( 'rest_endpoints', 'gutenberg_replace_block_renderer_attributes_rest_callbacks' );
