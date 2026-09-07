<?php
/**
 * Server-side rendering of the `core/block` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/block` block on server.
 *
 * @since 5.0.0
 *
 * @global WP_Embed $wp_embed
 *
 * @param array    $attributes     The block attributes. Either `ref`, the ID of a
 *                                 `wp_block` post, or `slug`, the name of a
 *                                 registered pattern. `tagName` optionally wraps
 *                                 the output in an element.
 * @param string   $content        The block content.
 * @param WP_Block $block_instance The block instance.
 *
 * @return string Rendered HTML of the referenced block.
 */
function render_block_core_block( $attributes, $content, $block_instance ) {
	static $seen_refs = array();

	$ref  = ! empty( $attributes['ref'] ) ? (int) $attributes['ref'] : 0;
	$slug = ! empty( $attributes['slug'] ) ? (string) $attributes['slug'] : '';

	if ( ! $ref && ! $slug ) {
		return '';
	}

	$reusable_block = null;

	if ( $ref ) {
		// A user pattern: a `wp_block` post.
		$reusable_block = get_post( $ref );
		if ( ! $reusable_block || 'wp_block' !== $reusable_block->post_type ) {
			return '';
		}

		if ( 'publish' !== $reusable_block->post_status || ! empty( $reusable_block->post_password ) ) {
			return '';
		}

		$seen_key = 'ref:' . $ref;
		$content  = $reusable_block->post_content;
	} else {
		$seen_key = 'slug:' . $slug;

		// A registered pattern, referenced by its name. An edited copy saved
		// as a `wp_block` post wins over the registry for the content; the
		// registration still provides defaults such as the area.
		$pattern        = WP_Block_Patterns_Registry::get_instance()->get_registered( $slug );
		$reusable_block = block_core_block_get_pattern_override( $slug );

		if ( $reusable_block ) {
			$content = $reusable_block->post_content;
		} elseif ( $pattern ) {
			$content = $pattern['content'];
		} else {
			return '';
		}
	}

	if ( isset( $seen_refs[ $seen_key ] ) ) {
		// WP_DEBUG_DISPLAY must only be honored when WP_DEBUG. This precedent
		// is set in `wp_debug_mode()`.
		$is_debug = WP_DEBUG && WP_DEBUG_DISPLAY;

		return $is_debug ?
			// translators: Visible only in the front end, this warning takes the place of a faulty block.
			__( '[block rendering halted]' ) :
			'';
	}

	$seen_refs[ $seen_key ] = true;

	// Handle embeds for reusable blocks.
	global $wp_embed;
	$content = $wp_embed->run_shortcode( $content );
	$content = $wp_embed->autoembed( $content );

	// Back compat.
	// For blocks that have not been migrated in the editor, add some back compat
	// so that front-end rendering continues to work.

	// This matches the `v2` deprecation. Removes the inner `values` property
	// from every item.
	if ( isset( $attributes['content'] ) ) {
		foreach ( $attributes['content'] as &$content_data ) {
			if ( isset( $content_data['values'] ) ) {
				$is_assoc_array = is_array( $content_data['values'] ) && ! wp_is_numeric_array( $content_data['values'] );

				if ( $is_assoc_array ) {
					$content_data = $content_data['values'];
				}
			}
		}
	}

	// This matches the `v1` deprecation. Rename `overrides` to `content`.
	if ( isset( $attributes['overrides'] ) && ! isset( $attributes['content'] ) ) {
		$attributes['content'] = $attributes['overrides'];
	}

	// Apply Block Hooks. Registered patterns already have them applied by the registry.
	if ( $reusable_block ) {
		$content = apply_block_hooks_to_content_from_post_object( $content, $reusable_block );
	}

	/**
	 * We attach the blocks from $content as inner blocks to the Synced Pattern block instance.
	 * This ensures that block context available to the Synced Pattern block instance is provided to
	 * those blocks.
	 */
	$block_instance->parsed_block['innerBlocks']  = parse_blocks( $content );
	$block_instance->parsed_block['innerContent'] = array_fill( 0, count( $block_instance->parsed_block['innerBlocks'] ), null );
	$block_instance->refresh_context_dependents();

	$content = $block_instance->render( array( 'dynamic' => false ) );
	unset( $seen_refs[ $seen_key ] );

	// Wrap the output when the instance asks for an element, or when its area
	// defines one, so a pattern standing in for a header or footer keeps its
	// landmark. The instance's `tagName` wins over the area's default.
	$tag_name = $attributes['tagName'] ?? '';
	if ( '' === $tag_name ) {
		$area = block_core_block_get_area( $attributes, isset( $pattern ) ? $pattern : null );
		if ( $area ) {
			foreach ( get_allowed_block_template_part_areas() as $area_definition ) {
				if ( $area_definition['area'] === $area && ! empty( $area_definition['area_tag'] ) ) {
					$tag_name = $area_definition['area_tag'];
					break;
				}
			}
		}
	}
	if ( in_array( $tag_name, array( 'header', 'main', 'section', 'article', 'aside', 'footer', 'div' ), true ) ) {
		$content = "<$tag_name " . get_block_wrapper_attributes() . '>' . $content . "</$tag_name>";
	}

	return $content;
}

/**
 * Returns the area of a pattern instance: the instance's `area` attribute,
 * else the area the referenced pattern was registered with.
 *
 * @since 7.2.0
 *
 * @param array      $attributes The block attributes.
 * @param array|null $pattern    The registered pattern, if any.
 * @return string The area, or an empty string.
 */
function block_core_block_get_area( $attributes, $pattern ) {
	if ( ! empty( $attributes['area'] ) && is_string( $attributes['area'] ) ) {
		return $attributes['area'];
	}
	if ( $pattern && ! empty( $pattern['area'] ) && is_string( $pattern['area'] ) ) {
		return $pattern['area'];
	}
	return '';
}

/**
 * Returns one block variation per template part area, so a pattern instance
 * standing in for a header or footer shows that area's icon and title.
 *
 * @since 7.2.0
 *
 * @return array Array containing the block variation objects.
 */
function block_core_block_build_area_variations() {
	$variations = array();
	foreach ( get_allowed_block_template_part_areas() as $area ) {
		if ( 'uncategorized' === $area['area'] || 'navigation-overlay' === $area['area'] ) {
			continue;
		}
		$variations[] = array(
			'name'        => 'area_' . $area['area'],
			'title'       => $area['label'],
			'description' => $area['description'],
			'attributes'  => array(
				'area' => $area['area'],
			),
			// Patterns are inserted from the patterns inserter, not as
			// area placeholders.
			'scope'       => array(),
			'icon'        => $area['icon'],
		);
	}
	return $variations;
}

/**
 * Returns the `wp_block` post that is the edited copy of a registered pattern.
 *
 * The copy is linked to the registered pattern by its `wp_pattern_slug` meta,
 * the same way an edited template part is linked to its theme file by slug.
 *
 * @since 7.2.0
 *
 * @param string $pattern_name Registered pattern name.
 * @return WP_Post|null The published copy, or null when the pattern is not edited.
 */
function block_core_block_get_pattern_customization( $pattern_name ) {
	$posts = get_posts(
		array(
			'post_type'      => 'wp_block',
			'post_status'    => 'publish',
			'posts_per_page' => 1,
			'meta_key'       => 'wp_pattern_slug',
			'meta_value'     => $pattern_name,
			'no_found_rows'  => true,
		)
	);

	return $posts ? $posts[0] : null;
}

/**
 * Registers the `core/block` block.
 *
 * @since 5.3.0
 */
function register_block_core_block() {
	register_block_type_from_metadata(
		__DIR__ . '/block',
		array(
			'render_callback'    => 'render_block_core_block',
			'variation_callback' => 'block_core_block_build_area_variations',
		)
	);
}
add_action( 'init', 'register_block_core_block' );
