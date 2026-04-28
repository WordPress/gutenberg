<?php
/**
 * Block states support for frontend CSS generation.
 *
 * Generates scoped CSS for per-instance state styles:
 * - Pseudo-states (e.g., :hover, :focus) for blocks that declare `states` support in block.json.
 * - Responsive states (mobile, tablet) for all blocks.
 *
 * @package WordPress
 */

/**
 * Responsive breakpoints for per-block responsive states.
 * Keep in sync with RESPONSIVE_BREAKPOINTS in packages/global-styles-engine/src/core/render.tsx
 * and WP_Theme_JSON_Gutenberg::RESPONSIVE_BREAKPOINTS.
 */
const BLOCK_STATES_RESPONSIVE_BREAKPOINTS = array(
	'mobile' => '@media (width <= 480px)',
	'tablet' => '@media (480px < width <= 782px)',
);

/**
 * Renders per-instance state styles on the frontend.
 *
 * Handles two categories of states:
 * - Pseudo-states (:hover, :focus, :active): only for blocks that declare `states` support
 *   in block.json. Output as `.wp-states-{hash}:hover { ... }`.
 * - Responsive states (mobile, tablet): available for all blocks automatically.
 *   Output as `@media (...) { .wp-states-{hash} { ... } }`.
 *
 * A single unique class is added to the block's interactive element and shared
 * across both state types so rules from both categories apply to the same element.
 *
 * @param string $block_content The block's rendered HTML.
 * @param array  $block         The block data including blockName and attrs.
 * @return string Modified block content with injected state styles.
 */
function gutenberg_render_block_states_support( $block_content, $block ) {
	if ( empty( $block['blockName'] ) || empty( $block_content ) ) {
		return $block_content;
	}

	$block_type = WP_Block_Type_Registry::get_instance()->get_registered( $block['blockName'] );
	if ( ! $block_type ) {
		return $block_content;
	}

	$style     = $block['attrs']['style'] ?? array();
	$all_rules = array();

	// --- Pseudo-states (only for blocks that declare `states` support) ---
	$supported_states = $block_type->supports['states'] ?? null;
	if ( ! empty( $supported_states ) && is_array( $supported_states ) ) {
		/*
		 * Preset utility classes (e.g. .has-accent-3-background-color) are generated
		 * with !important, so state styles targeting the same properties must also use
		 * !important to win specificity.
		 */
		$preset_class_properties = array( 'color', 'background-color', 'border-color', 'background', 'font-size', 'font-family' );

		foreach ( $supported_states as $state ) {
			if ( empty( $style[ $state ] ) || ! is_array( $style[ $state ] ) ) {
				continue;
			}

			$compiled = wp_style_engine_get_styles( $style[ $state ] );
			if ( ! empty( $compiled['declarations'] ) ) {
				$declarations = array();
				foreach ( $compiled['declarations'] as $property => $value ) {
					$declarations[ $property ] = in_array( $property, $preset_class_properties, true )
						? $value . ' !important'
						: $value;
				}
				$all_rules[] = array(
					'type'         => 'pseudo',
					'state'        => $state,
					'declarations' => $declarations,
				);
			}
		}
	}

	// --- Responsive states (available for all blocks) ---
	foreach ( BLOCK_STATES_RESPONSIVE_BREAKPOINTS as $breakpoint => $media_query ) {
		if ( empty( $style[ $breakpoint ] ) || ! is_array( $style[ $breakpoint ] ) ) {
			continue;
		}

		$compiled = wp_style_engine_get_styles( $style[ $breakpoint ] );
		if ( ! empty( $compiled['declarations'] ) ) {
			$all_rules[] = array(
				'type'         => 'responsive',
				'media_query'  => $media_query,
				'declarations' => $compiled['declarations'],
			);
		}
	}

	if ( empty( $all_rules ) ) {
		return $block_content;
	}

	/*
	 * Build a unique class from all state rules so that two block instances with
	 * identical state styles share the same hash class and therefore the same CSS
	 * (the style engine store deduplicates by selector).
	 */
	$unique_class = 'wp-states-' . substr( md5( wp_json_encode( $all_rules ) ), 0, 8 );

	$style_engine_rules = array();
	foreach ( $all_rules as $rule ) {
		if ( 'pseudo' === $rule['type'] ) {
			$style_engine_rules[] = array(
				'selector'     => ".$unique_class{$rule['state']}",
				'declarations' => $rule['declarations'],
			);
		} else {
			$style_engine_rules[] = array(
				'selector'     => ".$unique_class",
				'declarations' => $rule['declarations'],
				'rules_group'  => $rule['media_query'],
			);
		}
	}

	gutenberg_style_engine_get_stylesheet_from_css_rules(
		$style_engine_rules,
		array(
			'context'  => 'block-supports',
			'prettify' => false,
		)
	);

	// Add the unique class to the interactive element so that state selectors
	// like `.$unique_class:hover` or responsive `.$unique_class` match it directly.
	// If the block declares selectors.root with a descendant (e.g. the button
	// block's ".wp-block-button .wp-block-button__link"), we extract the last
	// class and walk to that element. Otherwise we fall back to the wrapper.
	$root_selector = $block_type->selectors['root'] ?? null;
	$target_class  = null;
	if ( $root_selector && preg_match( '/\.([a-zA-Z0-9_-]+)\s*$/', $root_selector, $matches ) ) {
		$target_class = $matches[1];
	}

	$processor = new WP_HTML_Tag_Processor( $block_content );
	if ( $target_class ) {
		while ( $processor->next_tag() ) {
			if ( $processor->has_class( $target_class ) ) {
				$processor->add_class( $unique_class );
				break;
			}
		}
	} elseif ( $processor->next_tag() ) {
		$processor->add_class( $unique_class );
	}
	return $processor->get_updated_html();
}
add_filter( 'render_block', 'gutenberg_render_block_states_support', 10, 2 );
