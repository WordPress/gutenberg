<?php
/**
 * Block level presets support.
 *
 * @package gutenberg
 */

/**
 * Update the block content with block level presets class name.
 *
 * @access private
 *
 * @param  string $block_content Rendered block content.
 * @param  array  $block         Block object.
 * @return string                Filtered block content.
 */
function _gutenberg_add_block_level_presets_class( $block_content, $block ) {
	if ( ! $block_content ) {
		return $block_content;
	}

	// return early if the block doesn't have support for settings.
	$block_type = WP_Block_Type_Registry::get_instance()->get_registered( $block['blockName'] );
	if ( ! block_has_support( $block_type, array( '__experimentalSettings' ), false ) ) {
		return $block_content;
	}

	// return early if no settings are found on the block attributes.
	$block_settings = $block['attrs']['settings'] ?? null;
	if ( empty( $block_settings ) ) {
		return $block_content;
	}

	// Like the layout hook this assumes the hook only applies to blocks with a single wrapper.
	// Add the class name to the first element, presuming it's the wrapper, if it exists.
	$tags = new WP_HTML_Tag_Processor( $block_content );
	if ( $tags->next_tag() ) {
		$tags->add_class( _wp_get_presets_class_name( $block ) );
	}

	return $tags->get_updated_html();
}

/**
 * Render the block level presets stylesheet.
 *
 * @access private
 *
 * @param string|null $pre_render   The pre-rendered content. Default null.
 * @param array       $block The block being rendered.
 *
 * @return null
 */
function _gutenberg_add_block_level_preset_styles( $pre_render, $block ) {
	// Return early if the block has not support for descendent block styles.
	$block_type = WP_Block_Type_Registry::get_instance()->get_registered( $block['blockName'] );
	if ( ! block_has_support( $block_type, array( '__experimentalSettings' ), false ) ) {
		return null;
	}

	// return early if no settings are found on the block attributes.
	$block_settings = $block['attrs']['settings'] ?? null;
	if ( empty( $block_settings ) ) {
		return null;
	}

	$class_name = '.' . _wp_get_presets_class_name( $block );

	// the root selector for preset variables needs to target every possible block selector
	// in order for the general setting to override any bock specific setting of a parent block or
	// the site root.
	$variables_root_selector = '*,[class*="wp-block"]';
	$registry                = WP_Block_Type_Registry::get_instance();
	$blocks                  = $registry->get_all_registered();
	foreach ( $blocks as $block_type ) {
		// We only want to append selectors for block's using custom selectors
		// i.e. not `wp-block-<name>`.
		$has_custom_selector =
			( isset( $block_type->supports['__experimentalSelector'] ) && is_string( $block_type->supports['__experimentalSelector'] ) ) ||
			( isset( $block_type->selectors['root'] ) && is_string( $block_type->selectors['root'] ) );

		if ( $has_custom_selector ) {
			$variables_root_selector .= ',' . wp_get_block_css_selector( $block_type );
		}
	}
	$variables_root_selector = WP_Theme_JSON_Gutenberg::scope_selector( $class_name, $variables_root_selector );

	// Remove any potentially unsafe styles.
	$theme_json_shape  = WP_Theme_JSON_Gutenberg::remove_insecure_properties(
		array(
			'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
			'settings' => $block_settings,
		)
	);
	$theme_json_object = new WP_Theme_JSON_Gutenberg( $theme_json_shape );

	$styles = '';

	// include preset css variables declaration on the stylesheet.
	$styles .= $theme_json_object->get_stylesheet(
		array( 'variables' ),
		null,
		array(
			'root_selector' => $variables_root_selector,
			'scope'         => $class_name,
		)
	);

	// include preset css classes on the stylesheet.
	$styles .= $theme_json_object->get_stylesheet(
		array( 'presets' ),
		null,
		array(
			'root_selector' => $class_name . ',' . $class_name . ' *',
			'scope'         => $class_name,
		)
	);

	if ( ! empty( $styles ) ) {
		/*
		 * This method is deprecated since WordPress 6.2.
		 * We could enqueue these styles separately,
		 * or print them out with other settings presets.
		 */
		wp_enqueue_block_support_styles( $styles );
	}

	return null;
}
// Remove WordPress core filter to avoid rendering duplicate settings style blocks.
remove_filter( 'render_block', '_wp_add_block_level_presets_class', 10, 2 );
remove_filter( 'pre_render_block', '_wp_add_block_level_preset_styles', 10, 2 );
add_filter( 'render_block', '_gutenberg_add_block_level_presets_class', 10, 2 );
add_filter( 'pre_render_block', '_gutenberg_add_block_level_preset_styles', 10, 2 );
