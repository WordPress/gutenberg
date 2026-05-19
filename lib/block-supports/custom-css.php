<?php
/**
 * Custom CSS block support.
 *
 * @package gutenberg
 */

/**
 * Splits a raw CSS string into top level segments, at rules with blocks
 * (e.g. @media, @supports, @layer) and ordinary rule sets.
 *
 * Each returned item is an associative array with:
 *   - 'type'    => 'at-rule' | 'rule'
 *   - 'header'  => string  (for at-rules: e.g. "@media (min-width: 1024px)")
 *   - 'inner'   => string  (content between the outermost braces)
 *   - 'raw'     => string  (full original text, for plain rules)
 *
 * @since 23.0.0
 *
 * @param string $css Raw CSS string.
 * @return array<int, array<string, string>> Parsed segments.
 */
function gutenberg_split_css_top_level_segments( $css ) {
	$segments = array();
	$len      = strlen( $css );
	$i        = 0;

	while ( $i < $len ) {
		// Skip whitespace between rules.
		while ( $i < $len && ctype_space( $css[ $i ] ) ) {
			++$i;
		}
		if ( $i >= $len ) {
			break;
		}

		if ( '@' === $css[ $i ] ) {
			// Collect up to the first '{' or ';'.
			$j = $i;
			while ( $j < $len && '{' !== $css[ $j ] && ';' !== $css[ $j ] ) {
				++$j;
			}

			if ( $j < $len && '{' === $css[ $j ] ) {
				$header = trim( substr( $css, $i, $j - $i ) );
				++$j;

				$depth       = 1;
				$inner_start = $j;
				while ( $j < $len && $depth > 0 ) {
					if ( '{' === $css[ $j ] ) {
						++$depth;
					} elseif ( '}' === $css[ $j ] ) {
						--$depth;
					}
					++$j;
				}

				$inner      = substr( $css, $inner_start, $j - $inner_start - 1 );
				$segments[] = array(
					'type'   => 'at-rule',
					'header' => $header,
					'inner'  => $inner,
				);
				$i          = $j;
			} elseif ( $j < $len && ';' === $css[ $j ] ) {
				$segments[] = array(
					'type' => 'rule',
					'raw'  => substr( $css, $i, $j - $i + 1 ),
				);
				$i          = $j + 1;
			} else {
				$i = $j;
			}
			continue;
		}

		$j           = $i;
		$found_brace = false;
		$depth       = 0;
		$end         = -1;

		while ( $j < $len ) {
			if ( '{' === $css[ $j ] ) {
				++$depth;
				$found_brace = true;
			} elseif ( '}' === $css[ $j ] ) {
				--$depth;
				if ( 0 === $depth && $found_brace ) {
					$end = $j;
					break;
				}
			}
			++$j;
		}

		if ( -1 === $end ) {
			break;
		}

		$segments[] = array(
			'type' => 'rule',
			'raw'  => substr( $css, $i, $end - $i + 1 ),
		);
		$i          = $end + 1;
	}

	return $segments;
}

/**
 * This wrapper splits the CSS into top-level segments first.  For each
 * conditional at rule it delegates only the inner content to the core
 * processor (so `&` resolution still works), then re wraps the result with
 * the original at rule header.  Plain rule sets are passed through unchanged.
 *
 * @since 23.0.0
 *
 * @param string $css      Raw CSS entered by the user.
 * @param string $selector The block's unique CSS class selector, e.g. '.wp-custom-css-abc123'.
 * @return string Processed, browser-ready CSS.
 */
function gutenberg_process_block_custom_css_with_at_rules( $css, $selector ) {
	if ( empty( trim( $css ) ) ) {
		return '';
	}

	$output   = array();
	$segments = gutenberg_split_css_top_level_segments( $css );

	foreach ( $segments as $segment ) {
		if ( 'at-rule' === $segment['type'] ) {
			/*
			 * Recursively process the inner content so that:
			 *   @supports (display: grid) {
			 *     @media (min-width: 768px) { & { … } }
			 *   }
			 * is handled correctly at every nesting depth.
			 */
			$processed_inner = gutenberg_process_block_custom_css_with_at_rules(
				$segment['inner'],
				$selector
			);

			if ( ! empty( trim( $processed_inner ) ) ) {
				$output[] = $segment['header'] . " {\n" . $processed_inner . "\n}";
			}
		} else {
			$processed = WP_Theme_JSON_Gutenberg::process_blocks_custom_css(
				$segment['raw'],
				$selector
			);

			if ( ! empty( trim( $processed ) ) ) {
				$output[] = $processed;
			}
		}
	}

	return implode( "\n", $output );
}

/**
 * Render the custom CSS stylesheet and add class name to block as required.
 *
 * @since 7.0.0
 *
 * @param array $parsed_block The parsed block.
 * @return array The same parsed block with custom CSS class name added if appropriate.
 */
function gutenberg_render_custom_css_support_styles( $parsed_block ) {
	$block_type = WP_Block_Type_Registry::get_instance()->get_registered( $parsed_block['blockName'] );

	if ( ! block_has_support( $block_type, 'customCSS', true ) ) {
		return $parsed_block;
	}

	$custom_css = trim( $parsed_block['attrs']['style']['css'] ?? '' );

	if ( empty( $custom_css ) ) {
		return $parsed_block;
	}

	// Validate CSS doesn't contain HTML markup (same validation as global styles REST API).
	if ( preg_match( '#</?\w+#', $custom_css ) ) {
		return $parsed_block;
	}

	// Generate a unique class name for this block instance.
	$class_name         = wp_unique_id_from_values( $parsed_block, 'wp-custom-css-' );
	$updated_class_name = isset( $parsed_block['attrs']['className'] )
		? $parsed_block['attrs']['className'] . " $class_name"
		: $class_name;

	_wp_array_set( $parsed_block, array( 'attrs', 'className' ), $updated_class_name );

	// Process the custom CSS with full at rule support (@media, @supports …).
	$selector      = '.' . $class_name;
	$processed_css = gutenberg_process_block_custom_css_with_at_rules( $custom_css, $selector );

	if ( ! empty( $processed_css ) ) {
		/*
		 * Register and add inline style for block custom CSS.
		 * The style depends on global-styles to ensure custom CSS loads after
		 * and can override global styles.
		 */
		wp_register_style( 'wp-block-custom-css', false, array( 'global-styles' ) );
		wp_add_inline_style( 'wp-block-custom-css', $processed_css );
	}

	return $parsed_block;
}

/**
 * Enqueues the block custom CSS styles.
 *
 * @since 7.0.0
 */
function gutenberg_enqueue_block_custom_css() {
	wp_enqueue_style( 'wp-block-custom-css' );
}

/**
 * Applies the custom CSS class name to the block's rendered HTML.
 *
 * The class name is generated in `gutenberg_render_custom_css_support_styles`
 * and stored in block attributes. This filter adds it to the actual markup.
 *
 * @since 7.0.0
 *
 * @param string $block_content Rendered block content.
 * @param array  $block         Block object.
 * @return string               Filtered block content.
 */
function gutenberg_render_custom_css_class_name( $block_content, $block ) {
	$class_string = $block['attrs']['className'] ?? '';
	preg_match( '/\bwp-custom-css-\S+\b/', $class_string, $matches );

	if ( empty( $matches ) ) {
		return $block_content;
	}

	$tags = new WP_HTML_Tag_Processor( $block_content );

	if ( $tags->next_tag() ) {
		$tags->add_class( 'has-custom-css' );
		$tags->add_class( $matches[0] );
	}

	return $tags->get_updated_html();
}

// Remove core filters and action to avoid rendering duplicate custom CSS styles.
if ( function_exists( 'wp_render_custom_css_class_name' ) ) {
	remove_filter( 'render_block', 'wp_render_custom_css_class_name' );
}
if ( function_exists( 'wp_render_custom_css_support_styles' ) ) {
	remove_filter( 'render_block_data', 'wp_render_custom_css_support_styles' );
}
if ( function_exists( 'wp_enqueue_block_custom_css' ) ) {
	remove_action( 'wp_enqueue_scripts', 'wp_enqueue_block_custom_css' );
}

// Add Gutenberg filters and action.
add_filter( 'render_block', 'gutenberg_render_custom_css_class_name', 10, 2 );
add_filter( 'render_block_data', 'gutenberg_render_custom_css_support_styles', 10, 1 );
add_action( 'wp_enqueue_scripts', 'gutenberg_enqueue_block_custom_css', 1 );

/**
 * Registers the style block attribute for block types that support it.
 *
 * @param WP_Block_Type $block_type Block Type.
 */
function gutenberg_register_custom_css_support( $block_type ) {
	// Setup attributes and styles within that if needed.
	if ( ! $block_type->attributes ) {
		$block_type->attributes = array();
	}

	// Check for existing style attribute definition e.g. from block.json.
	if ( array_key_exists( 'style', $block_type->attributes ) ) {
		return;
	}

	$has_custom_css_support = block_has_support( $block_type, array( 'customCSS' ), true );

	if ( $has_custom_css_support ) {
		$block_type->attributes['style'] = array(
			'type' => 'object',
		);
	}
}

// Register the block support.
WP_Block_Supports::get_instance()->register(
	'custom-css',
	array(
		'register_attribute' => 'gutenberg_register_custom_css_support',
	)
);
