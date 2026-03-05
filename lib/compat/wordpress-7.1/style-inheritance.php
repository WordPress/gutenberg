<?php
/**
 * Style inheritance block support — front end rendering.
 *
 * Mirrors the editor logic in
 * packages/block-editor/src/hooks/style-inheritance.js.
 *
 * How it works:
 *   1. render_block_data fires for a provider block BEFORE its inner blocks
 *      render. We push the provider's computed CSS vars onto a stack.
 *   2. render_block fires for each inheritor block while the provider is still
 *      on the stack. We read the nearest provider per group and inject the
 *      appropriate inline styles onto the inheritor's wrapper element.
 *   3. render_block fires for the provider AFTER all inner blocks have rendered.
 *      We pop it from the stack.
 *
 * @package gutenberg
 */

/**
 * Returns (and optionally mutates) the provider stack.
 *
 * Using a static local avoids a global variable while keeping state across
 * the two separate filter callbacks.
 *
 * @param array|null $push Entry to push onto the stack, or null.
 * @param bool       $pop  Whether to pop the top entry.
 * @return array Current stack.
 */
function gutenberg_style_inheritance_stack( $push = null, $pop = false ) {
	static $stack = array();

	if ( null !== $push ) {
		$stack[] = $push;
	}
	if ( $pop ) {
		array_pop( $stack );
	}

	return $stack;
}

/**
 * Pushes provider blocks onto the stack before their inner blocks render.
 *
 * Mirrors the useNearestProvidersByGroup() hook setup in style-inheritance.js.
 *
 * @param array $parsed_block The block data about to be rendered.
 * @return array Unmodified block data.
 */
function gutenberg_style_inheritance_push_provider( $parsed_block ) {
	$block_type = WP_Block_Type_Registry::get_instance()->get_registered(
		$parsed_block['blockName']
	);
	if ( ! $block_type ) {
		return $parsed_block;
	}

	$support = $block_type->supports['__experimentalStyleInheritance'] ?? null;
	if ( ! $support || empty( $support['provides'] ) ) {
		return $parsed_block;
	}

	$vars = gutenberg_style_inheritance_build_provider_vars(
		$support['provides'],
		$parsed_block['attrs'] ?? array()
	);

	// Only push if the provider actually has styles to offer.
	// Set a flag on the parsed block so apply_and_pop knows whether to pop.
	if ( ! empty( $vars ) ) {
		gutenberg_style_inheritance_stack(
			array(
				'provides' => $support['provides'],
				'vars'     => $vars,
			)
		);
		$parsed_block['__styleInheritancePushed'] = true;
	}

	return $parsed_block;
}

/**
 * Applies inherited styles to inheritor blocks and pops providers from the
 * stack after their inner blocks have finished rendering.
 *
 * @param string $block_content Rendered block HTML.
 * @param array  $block         Parsed block data.
 * @return string Updated block HTML.
 */
function gutenberg_style_inheritance_apply_and_pop( $block_content, $block ) {
	$block_type = WP_Block_Type_Registry::get_instance()->get_registered(
		$block['blockName']
	);
	if ( ! $block_type ) {
		return $block_content;
	}

	$support = $block_type->supports['__experimentalStyleInheritance'] ?? null;
	if ( ! $support ) {
		return $block_content;
	}

	// Apply inherited styles before popping, so the provider is still on the
	// stack when a block is both a provider and an inheritor.
	if ( ! empty( $support['inherits'] ) ) {
		$opt_out       = $block['attrs']['styleInheritanceOptOut'] ?? array();
		$block_content = gutenberg_style_inheritance_apply(
			$block_content,
			$support['inherits'],
			$opt_out
		);
	}

	// Pop provider after all inner blocks have rendered, but only if a push
	// actually happened (providers with no styles set are not pushed).
	if ( ! empty( $block['__styleInheritancePushed'] ) ) {
		gutenberg_style_inheritance_stack( null, /* pop */ true );
	}

	return $block_content;
}

/**
 * Injects inherited styles onto the inheritor block's wrapper element.
 *
 * Mirrors buildInheritorCSS() + useInheritorBlockProps() in style-inheritance.js.
 *
 * @param string $block_content Rendered block HTML.
 * @param array  $inherits      Groups this block inherits.
 * @param array  $opt_out       Groups the user has opted out of (group => bool).
 * @return string Updated block HTML.
 */
function gutenberg_style_inheritance_apply( $block_content, $inherits, $opt_out ) {
	$stack = gutenberg_style_inheritance_stack();
	if ( empty( $stack ) ) {
		return $block_content;
	}

	// Mirrors useNearestProvidersByGroup().
	$providers_by_group = array();
	foreach ( array_reverse( $stack ) as $provider ) {
		foreach ( $inherits as $group ) {
			if ( ! empty( $opt_out[ $group ] ) ) {
				continue; // User has overridden this group.
			}
			if ( isset( $providers_by_group[ $group ] ) ) {
				continue; // Already found the nearest provider for this group.
			}
			if ( in_array( $group, $provider['provides'], true ) ) {
				$providers_by_group[ $group ] = $provider['vars'];
			}
		}
	}

	if ( empty( $providers_by_group ) ) {
		return $block_content;
	}

	// Merge vars from all active providers.
	$all_vars = array();
	foreach ( $providers_by_group as $vars ) {
		$all_vars = array_merge( $all_vars, $vars );
	}

	$active_groups = array_keys( $providers_by_group );
	$declarations  = gutenberg_style_inheritance_build_declarations(
		$active_groups,
		$all_vars
	);

	if ( empty( $declarations ) ) {
		return $block_content;
	}

	// Build inline style string.
	$css_parts = array();
	foreach ( $declarations as $property => $value ) {
		$css_parts[] = "$property: $value";
	}
	$css = implode( '; ', $css_parts );

	// Inject onto the outermost element using WP_HTML_Tag_Processor.
	$tags = new WP_HTML_Tag_Processor( $block_content );
	if ( $tags->next_tag() ) {
		$existing = $tags->get_attribute( 'style' );
		if ( $existing ) {
			$separator = str_ends_with( $existing, ';' ) ? ' ' : '; ';
			$tags->set_attribute( 'style', $existing . $separator . $css );
		} else {
			$tags->set_attribute( 'style', $css );
		}
	}

	return $tags->get_updated_html();
}

/**
 * Builds CSS custom property name → value pairs for a provider block.
 *
 * Mirrors buildProviderStyleVars() in style-inheritance.js.
 *
 * @param string[] $provides Groups this block provides.
 * @param array    $attrs    Block attributes.
 * @return array CSS var name => value.
 */
function gutenberg_style_inheritance_build_provider_vars( $provides, $attrs ) {
	$vars = array();

	if ( in_array( 'color', $provides, true ) ) {
		if ( ! empty( $attrs['textColor'] ) ) {
			$vars['--wp--inherited--color--text'] = 'var(--wp--preset--color--' . $attrs['textColor'] . ')';
		} elseif ( ! empty( $attrs['style']['color']['text'] ) ) {
			$vars['--wp--inherited--color--text'] = $attrs['style']['color']['text'];
		}

		if ( ! empty( $attrs['backgroundColor'] ) ) {
			$vars['--wp--inherited--color--background'] = 'var(--wp--preset--color--' . $attrs['backgroundColor'] . ')';
		} elseif ( ! empty( $attrs['style']['color']['background'] ) ) {
			$vars['--wp--inherited--color--background'] = $attrs['style']['color']['background'];
		}

		if ( ! empty( $attrs['gradient'] ) ) {
			$vars['--wp--inherited--color--gradient'] = 'var(--wp--preset--gradient--' . $attrs['gradient'] . ')';
		} elseif ( ! empty( $attrs['style']['color']['gradient'] ) ) {
			$vars['--wp--inherited--color--gradient'] = $attrs['style']['color']['gradient'];
		}

		if ( ! empty( $attrs['style']['elements']['link']['color']['text'] ) ) {
			$vars['--wp--inherited--color--link'] = $attrs['style']['elements']['link']['color']['text'];
		}
	}

	if ( in_array( 'typography', $provides, true ) ) {
		if ( ! empty( $attrs['fontSize'] ) ) {
			$vars['--wp--inherited--typography--font-size'] = 'var(--wp--preset--font-size--' . $attrs['fontSize'] . ')';
		} elseif ( ! empty( $attrs['style']['typography']['fontSize'] ) ) {
			$vars['--wp--inherited--typography--font-size'] = $attrs['style']['typography']['fontSize'];
		}

		if ( ! empty( $attrs['fontFamily'] ) ) {
			$vars['--wp--inherited--typography--font-family'] = 'var(--wp--preset--font-family--' . $attrs['fontFamily'] . ')';
		} elseif ( ! empty( $attrs['style']['typography']['fontFamily'] ) ) {
			$vars['--wp--inherited--typography--font-family'] = $attrs['style']['typography']['fontFamily'];
		}

		$typography_map = array(
			'fontWeight'     => '--wp--inherited--typography--font-weight',
			'lineHeight'     => '--wp--inherited--typography--line-height',
			'letterSpacing'  => '--wp--inherited--typography--letter-spacing',
			'textTransform'  => '--wp--inherited--typography--text-transform',
			'textDecoration' => '--wp--inherited--typography--text-decoration',
		);
		foreach ( $typography_map as $attr_key => $var_name ) {
			if ( ! empty( $attrs['style']['typography'][ $attr_key ] ) ) {
				$vars[ $var_name ] = $attrs['style']['typography'][ $attr_key ];
			}
		}
	}

	if ( in_array( 'spacing', $provides, true ) ) {
		$spacing_map = array(
			array( 'padding', 'top', '--wp--inherited--spacing--padding-top' ),
			array( 'padding', 'right', '--wp--inherited--spacing--padding-right' ),
			array( 'padding', 'bottom', '--wp--inherited--spacing--padding-bottom' ),
			array( 'padding', 'left', '--wp--inherited--spacing--padding-left' ),
			array( 'margin', 'top', '--wp--inherited--spacing--margin-top' ),
			array( 'margin', 'right', '--wp--inherited--spacing--margin-right' ),
			array( 'margin', 'bottom', '--wp--inherited--spacing--margin-bottom' ),
			array( 'margin', 'left', '--wp--inherited--spacing--margin-left' ),
		);
		foreach ( $spacing_map as list( $prop, $side, $var_name ) ) {
			if ( ! empty( $attrs['style']['spacing'][ $prop ][ $side ] ) ) {
				$vars[ $var_name ] = $attrs['style']['spacing'][ $prop ][ $side ];
			}
		}
	}

	if ( in_array( 'border', $provides, true ) ) {
		$border_map = array(
			'color'  => '--wp--inherited--border--color',
			'width'  => '--wp--inherited--border--width',
			'radius' => '--wp--inherited--border--radius',
			'style'  => '--wp--inherited--border--style',
		);
		foreach ( $border_map as $attr_key => $var_name ) {
			if ( ! empty( $attrs['style']['border'][ $attr_key ] ) ) {
				$vars[ $var_name ] = $attrs['style']['border'][ $attr_key ];
			}
		}
	}

	return $vars;
}

/**
 * Builds CSS property => value declarations to apply to the inheritor element.
 * Mirrors buildInheritorCSS() in style-inheritance.js.
 *
 * @param string[] $active_groups Groups that are active (not opted out, have provider).
 * @param array    $parent_vars   Merged CSS var map from nearest providers.
 * @return array CSS property => value declarations.
 */
function gutenberg_style_inheritance_build_declarations( $active_groups, $parent_vars ) {
	$declarations = array();

	if ( in_array( 'color', $active_groups, true ) ) {
		if ( ! empty( $parent_vars['--wp--inherited--color--text'] ) ) {
			$declarations['color'] = 'inherit !important';
		}
		if ( ! empty( $parent_vars['--wp--inherited--color--background'] ) ) {
			$declarations['background-color'] = 'var(--wp--inherited--color--background) !important';
		}
		if ( ! empty( $parent_vars['--wp--inherited--color--gradient'] ) ) {
			$declarations['background'] = 'var(--wp--inherited--color--gradient) !important';
		}
	}

	if ( in_array( 'typography', $active_groups, true ) ) {
		$typography_map = array(
			'--wp--inherited--typography--font-size'       => 'font-size',
			'--wp--inherited--typography--font-family'     => 'font-family',
			'--wp--inherited--typography--font-weight'     => 'font-weight',
			'--wp--inherited--typography--line-height'     => 'line-height',
			'--wp--inherited--typography--letter-spacing'  => 'letter-spacing',
			'--wp--inherited--typography--text-transform'  => 'text-transform',
			'--wp--inherited--typography--text-decoration' => 'text-decoration',
		);
		foreach ( $typography_map as $var_name => $css_prop ) {
			if ( ! empty( $parent_vars[ $var_name ] ) ) {
				$declarations[ $css_prop ] = 'inherit !important';
			}
		}
	}

	if ( in_array( 'spacing', $active_groups, true ) ) {
		$spacing_map = array(
			'--wp--inherited--spacing--padding-top'    => 'padding-top',
			'--wp--inherited--spacing--padding-right'  => 'padding-right',
			'--wp--inherited--spacing--padding-bottom' => 'padding-bottom',
			'--wp--inherited--spacing--padding-left'   => 'padding-left',
			'--wp--inherited--spacing--margin-top'     => 'margin-top',
			'--wp--inherited--spacing--margin-right'   => 'margin-right',
			'--wp--inherited--spacing--margin-bottom'  => 'margin-bottom',
			'--wp--inherited--spacing--margin-left'    => 'margin-left',
		);
		foreach ( $spacing_map as $var_name => $css_prop ) {
			if ( ! empty( $parent_vars[ $var_name ] ) ) {
				$declarations[ $css_prop ] = 'var(' . $var_name . ') !important';
			}
		}
	}

	if ( in_array( 'border', $active_groups, true ) ) {
		$border_map = array(
			'--wp--inherited--border--color'  => 'border-color',
			'--wp--inherited--border--width'  => 'border-width',
			'--wp--inherited--border--radius' => 'border-radius',
			'--wp--inherited--border--style'  => 'border-style',
		);
		foreach ( $border_map as $var_name => $css_prop ) {
			if ( ! empty( $parent_vars[ $var_name ] ) ) {
				$declarations[ $css_prop ] = 'var(' . $var_name . ') !important';
			}
		}
	}

	return $declarations;
}

add_filter( 'render_block_data', 'gutenberg_style_inheritance_push_provider' );
add_filter( 'render_block', 'gutenberg_style_inheritance_apply_and_pop', 10, 2 );
