<?php
/**
 * Block states support for frontend CSS generation.
 *
 * Generates scoped CSS for per-instance state styles (e.g., :hover, :focus,
 * @current) declared in block attributes under `style[':hover']`,
 * `style['@current']`, etc.
 *
 * Custom (`@`-prefixed) states map to a CSS selector fragment via the block's
 * `selectors.states` meta. Compound states (e.g., `@current` + `:hover`) are
 * stored nested: `style['@current'][':hover']`.
 *
 * @package Gutenberg
 */

/**
 * Returns the CSS selector suffix for a custom (`@`-prefixed) state, by
 * looking up `selectors.states` on the block type.
 *
 * Example: for `@current` on `core/navigation-link`, where
 * `selectors.states['@current'] = ".wp-block-navigation .current-menu-item"`,
 * returns `.current-menu-item` (the last compound selector segment).
 *
 * @param WP_Block_Type $block_type The registered block type.
 * @param string        $state      The custom state key, e.g. `'@current'`.
 * @return string|null The CSS class selector suffix (e.g. `.current-menu-item`),
 *                     or null if not declared.
 */
function gutenberg_get_custom_state_selector( $block_type, $state ) {
	$state_selector = $block_type->selectors['states'][ $state ] ?? null;
	if ( ! $state_selector ) {
		return null;
	}
	/*
	 * Extract the last compound selector segment (class or pseudo-class).
	 * ".wp-block-navigation .current-menu-item" → ".current-menu-item"
	 */
	if ( preg_match( '/(\.[a-zA-Z0-9_-]+(?:\:[a-zA-Z0-9_-]+)?)\s*$/', $state_selector, $matches ) ) {
		return $matches[1];
	}
	return null;
}

/**
 * Collects CSS rule descriptors from the block's `style` attribute for all
 * supported states, including compound states nested under custom (`@`-prefixed)
 * keys.
 *
 * Returns an array of rule descriptors:
 * [
 *   [ 'selector_suffix' => ':hover',               'declarations' => [ 'color' => 'red' ] ],
 *   [ 'selector_suffix' => '.current-menu-item',   'declarations' => [ 'color' => 'blue' ] ],
 *   [ 'selector_suffix' => '.current-menu-item:hover', 'declarations' => [ 'color' => 'purple' ] ],
 * ]
 *
 * @param WP_Block_Type $block_type       The registered block type.
 * @param array         $style            The block's `style` attribute value.
 * @param array         $supported_states The states declared in `supports.states`.
 * @return array Array of `[ 'selector_suffix', 'declarations' ]` rule descriptors.
 */
function gutenberg_collect_state_css_rules( $block_type, $style, $supported_states ) {
	$css_rules = array();

	foreach ( $supported_states as $state ) {
		if ( empty( $style[ $state ] ) || ! is_array( $style[ $state ] ) ) {
			continue;
		}

		$state_data = $style[ $state ];

		if ( str_starts_with( $state, '@' ) ) {
			/*
			 * Custom class-based state (e.g. `@current`). Resolve its CSS
			 * selector suffix from the block's `selectors.states` declaration.
			 */
			$custom_suffix = gutenberg_get_custom_state_selector( $block_type, $state );
			if ( ! $custom_suffix ) {
				continue;
			}

			/*
			 * Separate direct style properties from nested pseudo-state
			 * sub-objects within this custom state. E.g. for `@current`:
			 *   { "color": {...}, ":hover": { "color": {...} } }
			 * The "color" key is the direct style; ":hover" is a compound state.
			 */
			$direct_styles   = array();
			$pseudo_sub_keys = array();
			foreach ( $state_data as $key => $value ) {
				if ( str_starts_with( $key, ':' ) && is_array( $value ) ) {
					$pseudo_sub_keys[ $key ] = $value;
				} else {
					$direct_styles[ $key ] = $value;
				}
			}

			// Direct custom-state styles.
			if ( ! empty( $direct_styles ) ) {
				$compiled = wp_style_engine_get_styles( $direct_styles );
				if ( ! empty( $compiled['declarations'] ) ) {
					$css_rules[] = array(
						'selector_suffix' => $custom_suffix,
						'declarations'    => $compiled['declarations'],
					);
				}
			}

			// Compound states: `@current` + `:hover`, etc.
			foreach ( $pseudo_sub_keys as $pseudo => $pseudo_styles ) {
				$compiled = wp_style_engine_get_styles( $pseudo_styles );
				if ( ! empty( $compiled['declarations'] ) ) {
					$css_rules[] = array(
						'selector_suffix' => $custom_suffix . $pseudo,
						'declarations'    => $compiled['declarations'],
					);
				}
			}
		} else {
			// Standard pseudo-selector state (e.g. `:hover`, `:focus`).
			$compiled = wp_style_engine_get_styles( $state_data );
			if ( ! empty( $compiled['declarations'] ) ) {
				$css_rules[] = array(
					'selector_suffix' => $state,
					'declarations'    => $compiled['declarations'],
				);
			}
		}
	}

	return $css_rules;
}

/**
 * Renders per-instance state styles on the frontend for blocks that declare
 * `states` support.
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

	$supported_states = $block_type->supports['states'] ?? null;
	if ( empty( $supported_states ) || ! is_array( $supported_states ) ) {
		return $block_content;
	}

	$style     = $block['attrs']['style'] ?? array();
	$css_rules = gutenberg_collect_state_css_rules( $block_type, $style, $supported_states );

	if ( empty( $css_rules ) ) {
		return $block_content;
	}

	$unique_class = 'wp-states-' . substr( md5( wp_json_encode( $css_rules ) ), 0, 8 );

	/*
	 * Register each state's CSS rules with the block-supports style engine store.
	 * The store deduplicates rules by selector — two block instances with identical
	 * state styles share the same hash class and therefore the same selector, so
	 * only one CSS rule is emitted. The store is flushed to the page by
	 * gutenberg_enqueue_stored_styles() rather than injected inline here.
	 *
	 * Preset utility classes (e.g. .has-accent-3-background-color) are generated
	 * with !important, so state styles targeting the same properties must also use
	 * !important to win. Properties without preset utility classes don't need it.
	 */
	$preset_class_properties = array( 'color', 'background-color', 'border-color', 'background', 'font-size', 'font-family' );

	$style_rules = array();
	foreach ( $css_rules as $rule ) {
		$declarations = array();
		foreach ( $rule['declarations'] as $property => $value ) {
			$declarations[ $property ] = in_array( $property, $preset_class_properties, true )
				? $value . ' !important'
				: $value;
		}
		$style_rules[] = array(
			'selector'     => ".$unique_class{$rule['selector_suffix']}",
			'declarations' => $declarations,
		);
	}

	gutenberg_style_engine_get_stylesheet_from_css_rules(
		$style_rules,
		array(
			'context'  => 'block-supports',
			'prettify' => false,
		)
	);

	/*
	 * Add the unique class to the interactive element so that state selectors
	 * like `.$unique_class:hover` and `.$unique_class.current-menu-item` match
	 * directly. If the block declares selectors.root with a descendant (e.g. the
	 * button block's ".wp-block-button .wp-block-button__link"), we extract the
	 * last class and walk to that element. Otherwise we fall back to the wrapper.
	 */
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
