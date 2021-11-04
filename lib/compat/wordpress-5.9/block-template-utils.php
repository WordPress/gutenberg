<?php
/**
 * Temporary compatibility shims for features present in Gutenberg.
 * This file should be removed when WordPress 5.9.0 becomes the lowest
 * supported version by this plugin.
 *
 * @package gutenberg
 */

if ( ! function_exists( 'get_allowed_block_template_part_areas' ) ) {
	/**
	 * Returns a filtered list of allowed area values for template parts.
	 *
	 * @return array The supported template part area values.
	 */
	function get_allowed_block_template_part_areas() {
		$default_area_definitions = array(
			array(
				'area'        => WP_TEMPLATE_PART_AREA_UNCATEGORIZED,
				'label'       => __( 'General', 'gutenberg' ),
				'description' => __(
					'General templates often perform a specific role like displaying post content, and are not tied to any particular area.',
					'gutenberg'
				),
				'icon'        => 'layout',
				'area_tag'    => 'div',
			),
			array(
				'area'        => WP_TEMPLATE_PART_AREA_HEADER,
				'label'       => __( 'Header', 'gutenberg' ),
				'description' => __(
					'The Header template defines a page area that typically contains a title, logo, and main navigation.',
					'gutenberg'
				),
				'icon'        => 'header',
				'area_tag'    => 'header',
			),
			array(
				'area'        => WP_TEMPLATE_PART_AREA_FOOTER,
				'label'       => __( 'Footer', 'gutenberg' ),
				'description' => __(
					'The Footer template defines a page area that typically contains site credits, social links, or any other combination of blocks.',
					'gutenberg'
				),
				'icon'        => 'footer',
				'area_tag'    => 'footer',
			),
		);

		/**
		 * Filters the list of allowed template part area values.
		 *
		 * @param array $default_areas An array of supported area objects.
		 */
		return apply_filters( 'default_wp_template_part_areas', $default_area_definitions );
	}
}

if ( ! function_exists( '_flatten_blocks' ) ) {
	/**
	 * Returns an array containing the references of
	 * the passed blocks and their inner blocks.
	 *
	 * @param array $blocks array of blocks.
	 *
	 * @return array block references to the passed blocks and their inner blocks.
	 */
	function _flatten_blocks( &$blocks ) {
		$all_blocks = array();
		$queue      = array();
		foreach ( $blocks as &$block ) {
			$queue[] = &$block;
		}

		while ( count( $queue ) > 0 ) {
			$block = &$queue[0];
			array_shift( $queue );
			$all_blocks[] = &$block;

			if ( ! empty( $block['innerBlocks'] ) ) {
				foreach ( $block['innerBlocks'] as &$inner_block ) {
					$queue[] = &$inner_block;
				}
			}
		}

		return $all_blocks;
	}
}

if ( ! function_exists( '_inject_theme_attribute_in_block_template_content' ) ) {
	/**
	 * Parses wp_template content and injects the current theme's
	 * stylesheet as a theme attribute into each wp_template_part
	 *
	 * @param string $template_content serialized wp_template content.
	 *
	 * @return string Updated wp_template content.
	 */
	function _inject_theme_attribute_in_block_template_content( $template_content ) {
		$has_updated_content = false;
		$new_content         = '';
		$template_blocks     = parse_blocks( $template_content );

		$blocks = _flatten_blocks( $template_blocks );
		foreach ( $blocks as &$block ) {
			if (
				'core/template-part' === $block['blockName'] &&
				! isset( $block['attrs']['theme'] )
			) {
				$block['attrs']['theme'] = wp_get_theme()->get_stylesheet();
				$has_updated_content     = true;
			}
		}

		if ( $has_updated_content ) {
			foreach ( $template_blocks as &$block ) {
				$new_content .= serialize_block( $block );
			}

			return $new_content;
		}

		return $template_content;
	}
}
