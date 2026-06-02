<?php
/**
 * Block Bindings: Cover block support.
 *
 * Adds `id` and `url` to the server-side supported-attributes list for
 * `core/cover` and rewrites the rendered output to honour active bindings.
 *
 * @since 7.1.0
 * @package gutenberg
 */

/**
 * Saved-markup regex for the parallax/repeat `<div class="wp-block-cover__image-background">`
 * element. The WP HTML API cannot delete elements or change tag names, so
 * `preg_match` is the only way to locate the element for byte-offset splicing.
 *
 * Mirrors the pattern already in `packages/block-library/src/cover/index.php`.
 */
const GUTENBERG_COVER_BINDINGS_DIV_PATTERN = '/<div\s+[^>]*\bwp-block-cover__image-background\b[^>]*><\/div>/U';

/**
 * Saved-markup regex for the plain `<img class="wp-block-cover__image-background">`
 * element used when neither parallax nor repeat is active. Used only by
 * `strip_image` — `rewrite_image` mutates the `<img>` in place via Tag Processor.
 */
const GUTENBERG_COVER_BINDINGS_IMG_PATTERN = '/<img\s+[^>]*\bwp-block-cover__image-background\b[^>]*\/?\s*>/U';

if ( ! function_exists( 'gutenberg_cover_bindings_add_supported_attributes' ) ) {
	/**
	 * Adds `id` and `url` to the bindings-supported attributes for `core/cover`.
	 *
	 * @since 7.1.0
	 */
	function gutenberg_cover_bindings_add_supported_attributes( $attributes, $block_type ) {
		if ( 'core/cover' !== $block_type ) {
			return $attributes;
		}

		if ( ! in_array( 'id', $attributes, true ) ) {
			$attributes[] = 'id';
		}
		if ( ! in_array( 'url', $attributes, true ) ) {
			$attributes[] = 'url';
		}

		return $attributes;
	}
}

add_filter( 'block_bindings_supported_attributes', 'gutenberg_cover_bindings_add_supported_attributes', 10, 2 );

if ( ! function_exists( 'gutenberg_cover_bindings_is_active' ) ) {
	/**
	 * Whether a parsed Cover has a `url` binding (with or without an `id`
	 * binding). A `__default` entry counts. Server-side mirror of
	 * `useCoverBindingState`'s `bindingActive`.
	 *
	 * @since 7.1.0
	 */
	function gutenberg_cover_bindings_is_active( array $attrs ): bool {
		$bindings = $attrs['metadata']['bindings'] ?? null;
		if ( empty( $bindings ) || ! is_array( $bindings ) ) {
			return false;
		}
		return isset( $bindings['__default'] ) || isset( $bindings['url'] );
	}
}

if ( ! function_exists( 'gutenberg_cover_bindings_prepare_block' ) ) {
	/**
	 * Forces `useFeaturedImage` off on bound covers before `WP_Block::render()`.
	 *
	 * @since 7.1.0
	 */
	function gutenberg_cover_bindings_prepare_block( $parsed_block ) {
		if ( 'core/cover' !== ( $parsed_block['blockName'] ?? '' ) ) {
			return $parsed_block;
		}

		$attrs = $parsed_block['attrs'] ?? array();

		if (
			( $attrs['backgroundType'] ?? '' ) === 'embed-video' ||
			! gutenberg_cover_bindings_is_active( $attrs )
		) {
			return $parsed_block;
		}

		if ( ! empty( $attrs['useFeaturedImage'] ) ) {
			$parsed_block['attrs']['useFeaturedImage'] = false;
		}

		return $parsed_block;
	}
}

add_filter( 'render_block_data', 'gutenberg_cover_bindings_prepare_block', 10, 1 );

if ( ! function_exists( 'gutenberg_cover_bindings_strip_image' ) ) {
	/**
	 * Removes the saved Cover image element (either `<img>` or parallax `<div>`).
	 *
	 * @since 7.1.0
	 * @access private
	 */
	function gutenberg_cover_bindings_strip_image( string $content ): string {
		// Parallax/repeat <div> form is probed first; <img>-only regex would miss it.
		foreach ( array( GUTENBERG_COVER_BINDINGS_DIV_PATTERN, GUTENBERG_COVER_BINDINGS_IMG_PATTERN ) as $pattern ) {
			if ( 1 === preg_match( $pattern, $content, $m, PREG_OFFSET_CAPTURE ) ) {
				return substr( $content, 0, $m[0][1] ) . substr( $content, $m[0][1] + strlen( $m[0][0] ) );
			}
		}
		return $content;
	}
}

if ( ! function_exists( 'gutenberg_cover_bindings_rewrite_image' ) ) {
	/**
	 * Rewrites the saved Cover image element to point at the bound URL/ID.
	 *
	 * Handles both forms emitted by `save.js`: the parallax/repeat `<div>` is
	 * replaced wholesale with a freshly-built `<img>`; the plain `<img>` form is
	 * rewritten in place via Tag Processor. Idempotent on its own output.
	 *
	 * @since 7.1.0
	 * @access private
	 */
	function gutenberg_cover_bindings_rewrite_image( string $content, string $resolved_url, int $resolved_id, array $attrs ): string {
		$alt          = $resolved_id > 0
			? trim( strip_tags( (string) get_post_meta( $resolved_id, '_wp_attachment_image_alt', true ) ) )
			: '';
		$wp_image_cls = $resolved_id > 0 ? ' wp-image-' . $resolved_id : '';
		$size_slug    = isset( $attrs['sizeSlug'] ) && '' !== $attrs['sizeSlug']
			? ' size-' . $attrs['sizeSlug']
			: '';

		$object_position = '';
		if (
			isset( $attrs['focalPoint']['x'], $attrs['focalPoint']['y'] ) &&
			is_numeric( $attrs['focalPoint']['x'] ) &&
			is_numeric( $attrs['focalPoint']['y'] )
		) {
			$object_position = sprintf(
				'%s%% %s%%',
				round( (float) $attrs['focalPoint']['x'] * 100 ),
				round( (float) $attrs['focalPoint']['y'] * 100 )
			);
		}

		// Parallax/repeat <div> form: rebuild as an <img>. Saved markup is
		// the source of truth, NOT $attrs['hasParallax']/['isRepeated'].
		if ( 1 === preg_match( GUTENBERG_COVER_BINDINGS_DIV_PATTERN, $content, $m, PREG_OFFSET_CAPTURE ) ) {
			$object_position_attrs = '' === $object_position ? '' : sprintf(
				' data-object-position="%s" style="object-position:%s;"',
				esc_attr( $object_position ),
				esc_attr( $object_position )
			);

			$rebuilt_img = sprintf(
				'<img class="wp-block-cover__image-background%s%s" alt="%s" src="%s" data-object-fit="cover"%s />',
				esc_attr( $wp_image_cls ),
				esc_attr( $size_slug ),
				esc_attr( $alt ),
				esc_url( $resolved_url ),
				$object_position_attrs
			);

			return substr( $content, 0, $m[0][1] ) . $rebuilt_img . substr( $content, $m[0][1] + strlen( $m[0][0] ) );
		}

		// Plain <img> form: rewrite attributes in place.
		$processor = new WP_HTML_Tag_Processor( $content );
		if ( ! $processor->next_tag(
			array(
				'tag_name'   => 'IMG',
				'class_name' => 'wp-block-cover__image-background',
			)
		) ) {
			// No image element saved (Cover authored without picking media,
			// then bound). Inject a fresh `<img>` before the overlay `<span>`.
			$object_position_attrs = '' === $object_position ? '' : sprintf(
				' data-object-position="%s" style="object-position:%s;"',
				esc_attr( $object_position ),
				esc_attr( $object_position )
			);
			$injected_img          = sprintf(
				'<img class="wp-block-cover__image-background%s%s" alt="%s" src="%s" data-object-fit="cover"%s />',
				esc_attr( $wp_image_cls ),
				esc_attr( $size_slug ),
				esc_attr( $alt ),
				esc_url( $resolved_url ),
				$object_position_attrs
			);
			if ( 1 === preg_match(
				'/<span\s+[^>]*\bwp-block-cover__background\b[^>]*>/U',
				$content,
				$sm,
				PREG_OFFSET_CAPTURE
			) ) {
				return substr( $content, 0, $sm[0][1] ) . $injected_img . substr( $content, $sm[0][1] );
			}
			return $content;
		}

		$processor->set_attribute( 'src', $resolved_url );
		$processor->set_attribute( 'alt', $alt );

		// Strip any saved wp-image-{old} before adding the resolved one.
		// Collect first — remove_class while iterating the Generator is unsafe.
		$class_list = $processor->class_list();
		if ( null !== $class_list ) {
			$to_remove = array();
			foreach ( $class_list as $cls ) {
				if ( 0 === strpos( $cls, 'wp-image-' ) ) {
					$to_remove[] = $cls;
				}
			}
			foreach ( $to_remove as $cls ) {
				$processor->remove_class( $cls );
			}
		}
		if ( $resolved_id > 0 ) {
			$processor->add_class( 'wp-image-' . $resolved_id );
		}

		return $processor->get_updated_html();
	}
}

if ( ! function_exists( 'gutenberg_cover_bindings_render_block' ) ) {
	/**
	 * Rewrites a rendered Cover block to honour an active `id`+`url` binding.
	 *
	 * Registered at priority 9 — MUST run before the generic priority-10
	 * `gutenberg_block_bindings_render_block` in `wordpress-6.9/block-bindings.php`
	 * so the substitution runs on saved markup, not bindings-resolved markup.
	 *
	 * @since 7.1.0
	 */
	function gutenberg_cover_bindings_render_block( $block_content, $block, $instance ) {
		if ( 'core/cover' !== ( $block['blockName'] ?? '' ) ) {
			return $block_content;
		}

		$attrs = $instance->attributes ?? array();

		if ( ( $attrs['backgroundType'] ?? '' ) === 'embed-video' ) {
			return $block_content;
		}

		if ( ! gutenberg_cover_bindings_is_active( $attrs ) ) {
			return $block_content;
		}

		$url = $attrs['url'] ?? null;
		if ( empty( $url ) ) {
			return gutenberg_cover_bindings_strip_image( $block_content );
		}

		// `id` is optional. When present and resolving to a non-attachment,
		// strip — that's the explicit "unresolvable internal media" state.
		$id = (int) ( $attrs['id'] ?? 0 );
		if ( $id > 0 ) {
			$attachment = get_post( $id );
			if ( ! $attachment || 'attachment' !== $attachment->post_type ) {
				return gutenberg_cover_bindings_strip_image( $block_content );
			}
		}

		$block_content = gutenberg_cover_bindings_rewrite_image( $block_content, (string) $url, $id, $attrs );

		// Relax stored dimRatio:100 and discard auto-derived overlay colors,
		// which may have been computed from a different image.
		$processor       = new WP_HTML_Tag_Processor( $block_content );
		$relax_dim_class = 100 === (int) ( $attrs['dimRatio'] ?? 100 );
		while ( $processor->next_tag(
			array(
				'tag_name'   => 'SPAN',
				'class_name' => 'wp-block-cover__background',
			)
		) ) {
			if ( $relax_dim_class ) {
				$processor->remove_class( 'has-background-dim-100' );
			}
			if ( empty( $attrs['isUserOverlayColor'] ) ) {
				$processor->remove_attribute( 'style' );
			}
		}

		return $processor->get_updated_html();
	}
}

// Priority 9 — must run before the generic priority-10 filter.
add_filter( 'render_block', 'gutenberg_cover_bindings_render_block', 9, 3 );
