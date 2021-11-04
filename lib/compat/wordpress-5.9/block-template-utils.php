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

if ( ! function_exists( 'get_block_template' ) ) {
	/**
	 * Retrieves a single unified template object using its id.
	 *
	 * @param string $id Template unique identifier (example: theme_slug//template_slug).
	 * @param array  $template_type wp_template or wp_template_part.
	 *
	 * @return WP_Block_Template|null Template.
	 */
	function get_block_template( $id, $template_type = 'wp_template' ) {
		/**
		 * Filters the block templates array before the query takes place.
		 *
		 * Return a non-null value to bypass the WordPress queries.
		 *
		 * @since 10.8
		 *
		 * @param WP_Block_Template|null $block_template Return block template object to short-circuit the default query,
		 *                                               or null to allow WP to run it's normal queries.
		 * @param string $id Template unique identifier (example: theme_slug//template_slug).
		 * @param array  $template_type wp_template or wp_template_part.
		 */
		$block_template = apply_filters( 'pre_get_block_template', null, $id, $template_type );
		if ( ! is_null( $block_template ) ) {
			return $block_template;
		}

		$parts = explode( '//', $id, 2 );
		if ( count( $parts ) < 2 ) {
			return null;
		}
		list( $theme, $slug ) = $parts;
		$wp_query_args        = array(
			'post_name__in'  => array( $slug ),
			'post_type'      => $template_type,
			'post_status'    => array( 'auto-draft', 'draft', 'publish', 'trash' ),
			'posts_per_page' => 1,
			'no_found_rows'  => true,
			'tax_query'      => array(
				array(
					'taxonomy' => 'wp_theme',
					'field'    => 'name',
					'terms'    => $theme,
				),
			),
		);
		$template_query       = new WP_Query( $wp_query_args );
		$posts                = $template_query->posts;

		if ( count( $posts ) > 0 ) {
			$template = _gutenberg_build_template_result_from_post( $posts[0] );

			if ( ! is_wp_error( $template ) ) {
				return $template;
			}
		}

		$block_template = gutenberg_get_block_file_template( $id, $template_type );

		/**
		 * Filters the array of queried block templates array after they've been fetched.
		 *
		 * @since 10.8
		 *
		 * @param WP_Block_Template $block_template The found block template.
		 * @param string $id Template unique identifier (example: theme_slug//template_slug).
		 * @param array  $template_type wp_template or wp_template_part.
		 */
		return apply_filters( 'get_block_template', $block_template, $id, $template_type );
	}
}

if ( ! function_exists( 'block_template_part' ) ) {
	/**
	 * Print a template-part.
	 *
	 * @param string $part The template-part to print. Use "header" or "footer".
	 *
	 * @return void
	 */
	function block_template_part( $part ) {
		$template_part = get_block_template( get_stylesheet() . '//' . $part, 'wp_template_part' );
		if ( ! $template_part || empty( $template_part->content ) ) {
			return;
		}
		echo do_blocks( $template_part->content );
	}
}

if ( ! function_exists( 'block_header_area' ) ) {
	/**
	 * Print the header template-part.
	 *
	 * @return void
	 */
	function block_header_area() {
		block_template_part( 'header' );
	}
}

if ( ! function_exists( 'block_footer_area' ) ) {
	/**
	 * Print the footer template-part.
	 *
	 * @return void
	 */
	function block_footer_area() {
		block_template_part( 'footer' );
	}
}
