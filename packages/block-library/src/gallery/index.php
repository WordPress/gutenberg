<?php
/**
 * Server-side rendering of the `core/gallery` block.
 *
 * @package WordPress
 */

/**
 * Handles backwards compatibility for Gallery Blocks,
 * whose images feature a `data-id` attribute.
 *
 * Now that the Gallery Block contains inner Image Blocks,
 * we add a custom `data-id` attribute before rendering the gallery
 * so that the Image Block can pick it up in its render_callback.
 *
 * @since 5.9.0
 *
 * @param array $parsed_block The block being rendered.
 * @return array The migrated block object.
 */
function block_core_gallery_data_id_backcompatibility( $parsed_block ) {
	if ( 'core/gallery' === $parsed_block['blockName'] ) {
		foreach ( $parsed_block['innerBlocks'] as $key => $inner_block ) {
			if ( 'core/image' === $inner_block['blockName'] ) {
				if ( ! isset( $parsed_block['innerBlocks'][ $key ]['attrs']['data-id'] ) && isset( $inner_block['attrs']['id'] ) ) {
					$parsed_block['innerBlocks'][ $key ]['attrs']['data-id'] = esc_attr( $inner_block['attrs']['id'] );
				}
			}
		}
	}

	return $parsed_block;
}

add_filter( 'render_block_data', 'block_core_gallery_data_id_backcompatibility' );

/**
 * Renders the `core/gallery` block on the server.
 *
 * @since 6.0.0
 *
 * @param array  $attributes Attributes of the block being rendered.
 * @param string $content Content of the block being rendered.
 * @return string The content of the block being rendered.
 */
function block_core_gallery_render( $attributes, $content, $block ) {
	// Adds a style tag for the --wp--style--unstable-gallery-gap var.
	// The Gallery block needs to recalculate Image block width based on
	// the current gap setting in order to maintain the number of flex columns
	// so a css var is added to allow this.

	$gap = $attributes['style']['spacing']['blockGap'] ?? null;
	// Skip if gap value contains unsupported characters.
	// Regex for CSS value borrowed from `safecss_filter_attr`, and used here
	// because we only want to match against the value, not the CSS attribute.
	if ( is_array( $gap ) ) {
		foreach ( $gap as $key => $value ) {
			// Make sure $value is a string to avoid PHP 8.1 deprecation error in preg_match() when the value is null.
			$value = is_string( $value ) ? $value : '';
			$value = $value && preg_match( '%[\\\(&=}]|/\*%', $value ) ? null : $value;

			// Get spacing CSS variable from preset value if provided.
			if ( is_string( $value ) && str_contains( $value, 'var:preset|spacing|' ) ) {
				$index_to_splice = strrpos( $value, '|' ) + 1;
				$slug            = _wp_to_kebab_case( substr( $value, $index_to_splice ) );
				$value           = "var(--wp--preset--spacing--$slug)";
			}

			$gap[ $key ] = $value;
		}
	} else {
		// Make sure $gap is a string to avoid PHP 8.1 deprecation error in preg_match() when the value is null.
		$gap = is_string( $gap ) ? $gap : '';
		$gap = $gap && preg_match( '%[\\\(&=}]|/\*%', $gap ) ? null : $gap;

		// Get spacing CSS variable from preset value if provided.
		if ( is_string( $gap ) && str_contains( $gap, 'var:preset|spacing|' ) ) {
			$index_to_splice = strrpos( $gap, '|' ) + 1;
			$slug            = _wp_to_kebab_case( substr( $gap, $index_to_splice ) );
			$gap             = "var(--wp--preset--spacing--$slug)";
		}
	}

	$unique_gallery_classname = wp_unique_id( 'wp-block-gallery-' );
	$processed_content        = new WP_HTML_Tag_Processor( $content );
	$processed_content->next_tag();
	$processed_content->add_class( $unique_gallery_classname );

	// --gallery-block--gutter-size is deprecated. --wp--style--gallery-gap-default should be used by themes that want to set a default
	// gap on the gallery.
	$fallback_gap = 'var( --wp--style--gallery-gap-default, var( --gallery-block--gutter-size, var( --wp--style--block-gap, 0.5em ) ) )';
	$gap_value    = $gap ? $gap : $fallback_gap;
	$gap_column   = $gap_value;

	if ( is_array( $gap_value ) ) {
		$gap_row    = isset( $gap_value['top'] ) ? $gap_value['top'] : $fallback_gap;
		$gap_column = isset( $gap_value['left'] ) ? $gap_value['left'] : $fallback_gap;
		$gap_value  = $gap_row === $gap_column ? $gap_row : $gap_row . ' ' . $gap_column;
	}

	// The unstable gallery gap calculation requires a real value (such as `0px`) and not `0`.
	if ( '0' === $gap_column ) {
		$gap_column = '0px';
	}

	// Set the CSS variable to the column value, and the `gap` property to the combined gap value.
	$gallery_styles = array(
		array(
			'selector'     => ".wp-block-gallery.{$unique_gallery_classname}",
			'declarations' => array(
				'--wp--style--unstable-gallery-gap' => $gap_column,
				'gap'                               => $gap_value,
			),
		),
	);

	wp_style_engine_get_stylesheet_from_css_rules(
		$gallery_styles,
		array(
			'context' => 'block-supports',
		)
	);

	$lightbox_settings = block_core_image_get_lightbox_settings( $block->parsed_block );

	if (
		isset( $lightbox_settings ) &&
		// 'none' === $link_destination &&
		isset( $lightbox_settings['enabled'] ) &&
		true === $lightbox_settings['enabled']
	) {
		$processed_content->set_attribute( 'data-wp-interactive', 'core/gallery' );
		$processed_content->set_attribute( 'data-wp-context', '{"lightbox": true, "images": []}' );
		$processed_content->set_attribute( 'data-wp-init', 'callbacks.init' );
		$processed_content->set_attribute( 'data-wp-on-async--load', 'callbacks.init' );

		$suffix = wp_scripts_get_suffix();
		if ( defined( 'IS_GUTENBERG_PLUGIN' ) && IS_GUTENBERG_PLUGIN ) {
			$module_url = gutenberg_url( '/build/interactivity/gallery.min.js' );
		}

		wp_register_script_module(
			'@wordpress/block-library/gallery',
			isset( $module_url ) ? $module_url : includes_url( "blocks/gallery/view{$suffix}.js" ),
			array( '@wordpress/interactivity' ),
			defined( 'GUTENBERG_VERSION' ) ? GUTENBERG_VERSION : get_bloginfo( 'version' )
		);

		wp_enqueue_script_module( '@wordpress/block-library/gallery' );

	}

	// The WP_HTML_Tag_Processor class calls get_updated_html() internally
	// when the instance is treated as a string, but here we explicitly
	// convert it to a string.
	$updated_content = $processed_content->get_updated_html();

	/*
	 * Randomize the order of image blocks. Ideally we should shuffle
	 * the `$parsed_block['innerBlocks']` via the `render_block_data` hook.
	 * However, this hook doesn't apply inner block updates when blocks are
	 * nested.
	 * @todo In the future, if this hook supports updating innerBlocks in
	 * nested blocks, it should be refactored.
	 *
	 * @see: https://github.com/WordPress/gutenberg/pull/58733
	 */
	if ( empty( $attributes['randomOrder'] ) ) {
		return $updated_content;
	}

	// This pattern matches figure elements with the `wp-block-image` class to
	// avoid the gallery's wrapping `figure` element and extract images only.
	$pattern = '/<figure[^>]*\bwp-block-image\b[^>]*>.*?<\/figure>/';

	// Find all Image blocks.
	preg_match_all( $pattern, $updated_content, $matches );
	if ( ! $matches ) {
		return $updated_content;
	}
	$image_blocks = $matches[0];

	// Randomize the order of Image blocks.
	shuffle( $image_blocks );
	$i       = 0;
	$content = preg_replace_callback(
		$pattern,
		static function () use ( $image_blocks, &$i ) {
			$new_image_block = $image_blocks[ $i ];
			++$i;
			return $new_image_block;
		},
		$updated_content
	);

	return $content;
}

// NOTE: this setting isn't required for the gallery block.
// since lightbox implementation is done in the image block, it can totally be removed.
function block_core_gallery_get_lightbox_settings( $block ) {
	// Gets the lightbox setting from the block attributes.
	if ( isset( $block['attrs']['lightbox'] ) ) {
		$lightbox_settings = $block['attrs']['lightbox'];
	}

	if ( ! isset( $lightbox_settings ) ) {
		// TODO: change it to gallery block name.
		$lightbox_settings = wp_get_global_settings( array( 'lightbox' ), array( 'block_name' => 'core/image' ) );

		// If not present in global settings, check the top-level global settings.
		//
		// NOTE: If no block-level settings are found, the previous call to
		// `wp_get_global_settings` will return the whole `theme.json` structure in
		// which case we can check if the "lightbox" key is present at the top-level
		// of the global settings and use its value.
		if ( isset( $lightbox_settings['lightbox'] ) ) {
			$lightbox_settings = wp_get_global_settings( array( 'lightbox' ) );
		}
	}

	return $lightbox_settings ?? null;
}

/**
 * Registers the `core/gallery` block on server.
 *
 * @since 5.9.0
 */
function register_block_core_gallery() {
	register_block_type_from_metadata(
		__DIR__ . '/gallery',
		array(
			'render_callback' => 'block_core_gallery_render',
		)
	);
}

add_action( 'init', 'register_block_core_gallery' );
