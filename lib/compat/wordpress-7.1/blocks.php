<?php
/**
 * WordPress 7.1 compatibility: helpers for checking block styles in content.
 *
 * @package gutenberg
 */

if ( ! function_exists( 'has_block_style' ) ) {
	/**
	 * Determines whether a post or string contains a specific block style for a given block.
	 *
	 * This inspects parsed blocks so it can reliably detect style classes even when
	 * the block's `className` contains multiple classes.
	 *
	 * @since 7.1.0
	 *
	 * @param string          $block_name Block type name including namespace, or core block name without namespace.
	 * @param string          $style_name Block style name without the `is-style-` prefix.
	 * @param WP_Post|string|int $post    Optional. Post content, post ID, or post object. Defaults to the current post.
	 * @return bool Whether the block style exists in the provided content.
	 */
	function has_block_style( $block_name, $style_name, $post = null ) {
		if ( ! is_string( $block_name ) || '' === $block_name || ! is_string( $style_name ) || '' === $style_name ) {
			return false;
		}

		if ( ! is_string( $post ) ) {
			$wp_post = get_post( $post );

			if ( ! $wp_post instanceof WP_Post ) {
				return false;
			}

			$post = $wp_post->post_content;
		}

		if ( ! has_blocks( $post ) ) {
			return false;
		}

		if ( ! str_contains( $block_name, '/' ) ) {
			$block_name = 'core/' . $block_name;
		}

		$style_class = 'is-style-' . $style_name;
		$blocks      = parse_blocks( $post );

		while ( ! empty( $blocks ) ) {
			$block = array_shift( $blocks );

			if ( ( $block['blockName'] ?? null ) === $block_name ) {
				$class_name = $block['attrs']['className'] ?? '';

				if ( is_string( $class_name ) ) {
					$classes = preg_split( '/\s+/', trim( $class_name ) );

					if ( false === $classes ) {
						$classes = array();
					}

					if ( true === in_array( $style_class, $classes, true ) ) {
						return true;
					}
				}
			}

			if ( ! empty( $block['innerBlocks'] ) ) {
				array_push( $blocks, ...$block['innerBlocks'] );
			}
		}

		return false;
	}
}
