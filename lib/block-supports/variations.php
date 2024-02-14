<?php
/**
 * Block support to enable per-section styling of block types via
 * block style variations.
 *
 * @package gutenberg
 */

/**
 * Get the class name for this application of this blocks variation styles.
 *
 * @param array  $block     Block object.
 * @param string $variation Slug for the variation..
 *
 * @return string The unique class name.
 */
function gutenberg_get_variation_class_name( $block, $variation ) {
	return 'is-style-' . $variation . '-' . md5( serialize( $block ) );
}

/**
 * Update the block content with the variation's class name.
 *
 * @param string $block_content Rendered block content.
 * @param array  $block         Block object.
 *
 * @return string Filtered block content.
 */
function gutenberg_render_variation_support( $block_content, $block ) {
	if ( ! $block_content || empty( $block['attrs'] ) ) {
		return $block_content;
	}

	// Apply the variation's classname. Like the layout hook, this assumes the
	// hook only applies to blocks with a single wrapper.
	$tags = new WP_HTML_Tag_Processor( $block_content );

	if ( $tags->next_tag() ) {
		preg_match( '/\bis-style-(\S+)\b/', $tags->get_attribute( 'class' ), $matches );
		$variation = $matches[1] ?? null;

		if ( $variation ) {
			$tree       = WP_Theme_JSON_Resolver_Gutenberg::get_merged_data();
			$theme_json = $tree->get_raw_data();

			if ( ! empty( $theme_json['styles']['blocks'][ $block['blockName'] ]['variations'][ $variation ] ) ) {
				$tags->add_class( gutenberg_get_variation_class_name( $block, $variation ) );
			}
		}
	}

	return $tags->get_updated_html();
}

/**
 * Render the block style variation's styles.
 *
 * In the case of nested blocks with variations applies, we want the parent
 * variation's styles to be rendered before their descendants. This solves the
 * issue of a block type being styled in both the parent and descendant: we want
 * the descendant style to take priority, and this is done by loading it after,
 * in the DOM order. This is why the variation stylesheet generation is in a
 * different filter.
 *
 * @param string|null $pre_render The pre-rendered content. Default null.
 * @param array       $block      The block being rendered.
 *
 * @return null
 */
function gutenberg_render_variation_support_styles( $pre_render, $block ) {
	$variation = $block['attrs']['style']['variation'] ?? null;

	if ( ! $variation ) {
		return null;
	}

	$tree           = WP_Theme_JSON_Resolver_Gutenberg::get_merged_data();
	$theme_json     = $tree->get_raw_data();
	$variation_data = $theme_json['styles']['blocks'][ $block['blockName'] ]['variations'][ $variation ] ?? array();

	if ( empty( $variation_data ) ) {
		return null;
	}

	$config = array(
		'version' => 2,
		'styles'  => $variation_data,
	);

	$class_name = gutenberg_get_variation_class_name( $block, $variation );
	$class_name = ".$class_name";

	if ( ! is_admin() ) {
		remove_filter( 'wp_theme_json_get_style_nodes', 'wp_filter_out_block_nodes' );
	}

	$variation_theme_json = new WP_Theme_JSON_Gutenberg( $config, 'blocks' );
	$variation_styles     = $variation_theme_json->get_stylesheet(
		array( 'styles' ),
		array( 'custom' ),
		array(
			'root_selector'           => $class_name,
			'skip_root_layout_styles' => true,
			'scope'                   => $class_name,
		)
	);

	if ( ! is_admin() ) {
		add_filter( 'wp_theme_json_get_style_nodes', 'wp_filter_out_block_nodes' );
	}

	if ( empty( $variation_styles ) ) {
		return null;
	}

	wp_register_style( 'variation-styles', false, array( 'global-styles' ) );
	wp_add_inline_style( 'variation-styles', $variation_styles );
}

/**
 * Merges any shared block style variation definitions from a theme style
 * variation into their appropriate block type within theme json styles. Any
 * custom user selections already made will take precedence over the shared
 * style variation value.
 *
 * @param WP_Theme_JSON_Data_Gutenberg $theme_json Current theme.json data.
 *
 * @return WP_Theme_JSON_Data_Gutenberg
 */
function gutenberg_resolve_block_style_variations_from_theme_style_variation( $theme_json ) {
	$theme_json_data   = $theme_json->get_data();
	$shared_variations = $theme_json_data['styles']['blocks']['variations'] ?? array();
	$variations_data   = gutenberg_resolve_and_register_block_style_variations( $shared_variations );

	return gutenberg_merge_block_style_variations_data( $variations_data, $theme_json, 'user' );
}

/**
 * Collects block style variation data for merging with theme.json data.
 * As each block style variation is processed it is registered if it hasn't
 * been already. This registration is required for later sanitization of
 * theme.json data.
 *
 * @param array $variations Shared block style variations.
 *
 * @return array Block variations data to be merged under styles.blocks
 */
function gutenberg_resolve_and_register_block_style_variations( $variations ) {
	$variations_data = array();

	if ( empty( $variations ) ) {
		return $variations_data;
	}

	$registry              = WP_Block_Styles_Registry::get_instance();
	$have_named_variations = array_keys( $variations ) !== range( 0, count( $variations ) - 1 );

	foreach ( $variations as $key => $variation ) {
		$supported_blocks = $variation['supportedBlockTypes'] ?? array();
		// Standalone theme.json partial files for block style variations
		// will have their styles under a top-level property by the same name.
		// Variations defined within an existing theme.json or theme style
		// variation will themselves already be the required styles data.
		$variation_data = $variation['styles'] ?? $variation;
		// Block style variations read in via standalone theme.json partials
		// need to have their name set to the kebab case version of their title.
		$variation_name = $have_named_variations ? $key : _wp_to_kebab_case( $variation['title'] );

		if ( empty( $variation_data ) ) {
			continue;
		}

		foreach ( $supported_blocks as $block_type ) {
			$registered_styles = $registry->get_registered_styles_for_block( $block_type );

			if ( ! array_key_exists( $variation_name, $registered_styles ) ) {
				gutenberg_register_block_style(
					$block_type,
					array(
						'name'  => $variation_name,
						'label' => $variation['title'] ?? $variation_name,
					)
				);
			}

			$path = array( $block_type, 'variations', $variation_name );
			_wp_array_set( $variations_data, $path, $variation_data );
		}
	}

	return $variations_data;
}

/**
 * Merges variations data with existing theme.json data ensuring that the
 * current theme.json data values take precedence.
 *
 * @param array                        $variations_data Block style variations data keyed by block type.
 * @param WP_Theme_JSON_Data_Gutenberg $theme_json      Current theme.json data.
 * @param string                       $origin          Origin for the theme.json data.
 *
 * @return WP_Theme_JSON_Gutenberg The merged theme.json data.
 */
function gutenberg_merge_block_style_variations_data( $variations_data, $theme_json, $origin = 'theme' ) {
	if ( empty( $variations_data ) ) {
		return $theme_json;
	}

	$variations_theme_json_data = array(
		'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
		'styles'  => array( 'blocks' => $variations_data ),
	);

	$variations_theme_json = new WP_Theme_JSON_Data_Gutenberg( $variations_theme_json_data, $origin );

	// Merge the current theme.json data over shared variation data so that
	// any explicit per block variation values take precedence.
	return $variations_theme_json->update_with( $theme_json->get_data() );
}

/**
 * Merges block style variation data sourced from standalone partial
 * theme.json files.
 *
 * @param WP_Theme_JSON_Data_Gutenberg $theme_json Current theme.json data.
 *
 * @return WP_Theme_JSON_Data_Gutenberg
 */
function gutenberg_resolve_block_style_variations_from_theme_json_partials( $theme_json ) {
	$block_style_variations = WP_Theme_JSON_Resolver_Gutenberg::get_style_variations( '/block-styles' );
	$variations_data        = gutenberg_resolve_and_register_block_style_variations( $block_style_variations );

	return gutenberg_merge_block_style_variations_data( $variations_data, $theme_json );
}

/**
 * Merges shared block style variations registered within the
 * `styles.blocks.variations` property of the primary theme.json file.
 *
 * @param WP_Theme_JSON_Data_Gutenberg $theme_json Current theme.json data.
 *
 * @return WP_Theme_JSON_Data_Gutenberg
 */
function gutenberg_resolve_block_style_variations_from_primary_theme_json( $theme_json ) {
	$theme_json_data        = $theme_json->get_data();
	$block_style_variations = $theme_json_data['styles']['blocks']['variations'] ?? array();
	$variations_data        = gutenberg_resolve_and_register_block_style_variations( $block_style_variations );

	return gutenberg_merge_block_style_variations_data( $variations_data, $theme_json );
}

/**
 * Merges block style variations registered via the block styles registry with a
 * style object, under their appropriate block types within theme.json styles.
 * Any variation values defined within the theme.json specific to a block type
 * will take precedence over these shared definitions.
 *
 * @param WP_Theme_JSON_Data_Gutenberg $theme_json Current theme.json data.
 *
 * @return WP_Theme_JSON_Data_Gutenberg
 */
function gutenberg_resolve_block_style_variations_from_styles_registry( $theme_json ) {
	$registry        = WP_Block_Styles_Registry::get_instance();
	$styles          = $registry->get_all_registered();
	$variations_data = array();

	foreach ( $styles as $block_type => $variations ) {
		foreach ( $variations as $variation_name => $variation ) {
			if ( ! empty( $variation['style_data'] ) ) {
				$path = array( $block_type, 'variations', $variation_name );
				_wp_array_set( $variations_data, $path, $variation['style_data'] );
			}
		}
	}

	return gutenberg_merge_block_style_variations_data( $variations_data, $theme_json );
}

/**
 * Enqueues styles for block style variations.
 */
function gutenberg_enqueue_variation_styles() {
	wp_enqueue_style( 'variation-styles' );
}

// Register the block support.
WP_Block_Supports::get_instance()->register( 'variation', array() );

add_filter( 'pre_render_block', 'gutenberg_render_variation_support_styles', 10, 2 );
add_filter( 'render_block', 'gutenberg_render_variation_support', 10, 2 );
add_action( 'wp_enqueue_scripts', 'gutenberg_enqueue_variation_styles', 1 );

// Resolve block style variations from all their potential sources. The order here is deliberate.
add_filter( 'wp_theme_json_data_theme', 'gutenberg_resolve_block_style_variations_from_primary_theme_json', 10, 1 );
add_filter( 'wp_theme_json_data_theme', 'gutenberg_resolve_block_style_variations_from_theme_json_partials', 10, 1 );
add_filter( 'wp_theme_json_data_theme', 'gutenberg_resolve_block_style_variations_from_styles_registry', 10, 1 );

add_filter( 'wp_theme_json_data_user', 'gutenberg_resolve_block_style_variations_from_theme_style_variation', 10, 1 );
