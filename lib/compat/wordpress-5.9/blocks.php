<?php
/**
 * Temporary compatibility shims for features present in Gutenberg.
 * This file should be removed when WordPress 5.9.0 becomes the lowest
 * supported version by this plugin.
 *
 * @package gutenberg
 */

if ( ! function_exists( 'get_query_pagination_arrow' ) ) {
	/**
	 * Helper function that returns the proper pagination arrow html for
	 * `QueryPaginationNext` and `QueryPaginationPrevious` blocks based
	 * on the provided `paginationArrow` from `QueryPagination` context.
	 *
	 * It's used in QueryPaginationNext and QueryPaginationPrevious blocks.
	 *
	 * @param WP_Block $block   Block instance.
	 * @param boolean  $is_next Flag for handling `next/previous` blocks.
	 *
	 * @return string|null Returns the constructed WP_Query arguments.
	 */
	function get_query_pagination_arrow( $block, $is_next ) {
		$arrow_map = array(
			'none'    => '',
			'arrow'   => array(
				'next'     => '→',
				'previous' => '←',
			),
			'chevron' => array(
				'next'     => '»',
				'previous' => '«',
			),
		);
		if ( ! empty( $block->context['paginationArrow'] ) && array_key_exists( $block->context['paginationArrow'], $arrow_map ) && ! empty( $arrow_map[ $block->context['paginationArrow'] ] ) ) {
			$pagination_type = $is_next ? 'next' : 'previous';
			$arrow_attribute = $block->context['paginationArrow'];
			$arrow           = $arrow_map[ $block->context['paginationArrow'] ][ $pagination_type ];
			$arrow_classes   = "wp-block-query-pagination-$pagination_type-arrow is-arrow-$arrow_attribute";
			return "<span class='$arrow_classes'>$arrow</span>";
		}
		return null;
	}
}

/**
 * Update allowed inline style attributes list.
 *
 * Note: This should be removed when the minimum required WP version is >= 5.9.
 *
 * @param string[] $attrs Array of allowed CSS attributes.
 * @return string[] CSS attributes.
 */
function gutenberg_safe_style_attrs( $attrs ) {
	$attrs[] = 'object-position';
	$attrs[] = 'border-top-left-radius';
	$attrs[] = 'border-top-right-radius';
	$attrs[] = 'border-bottom-right-radius';
	$attrs[] = 'border-bottom-left-radius';
	$attrs[] = 'filter';

	return $attrs;
}
add_filter( 'safe_style_css', 'gutenberg_safe_style_attrs' );

if ( ! function_exists( '_wp_normalize_relative_css_links' ) ) {
	/**
	 * Make URLs relative to the WordPress installation.
	 *
	 * @since 5.9.0
	 *
	 * @param string $css            The CSS to make URLs relative to the WordPress installation.
	 * @param string $stylesheet_url The URL to the stylesheet.
	 *
	 * @return string The CSS with URLs made relative to the WordPress installation.
	 */
	function _wp_normalize_relative_css_links( $css, $stylesheet_url ) {
		$has_src_results = preg_match_all( '#url\s*\(\s*[\'"]?\s*([^\'"\)]+)#', $css, $src_results );
		if ( $has_src_results ) {
			// Loop through the URLs to find relative ones.
			foreach ( $src_results[1] as $src_index => $src_result ) {
				// Skip if this is an absolute URL.
				if ( 0 === strpos( $src_result, 'http' ) || 0 === strpos( $src_result, '//' ) ) {
					continue;
				}

				// Build the absolute URL.
				$absolute_url = dirname( $stylesheet_url ) . '/' . $src_result;
				$absolute_url = str_replace( '/./', '/', $absolute_url );
				// Convert to URL related to the site root.
				$relative_url = wp_make_link_relative( $absolute_url );

				// Replace the URL in the CSS.
				$css = str_replace(
					$src_results[0][ $src_index ],
					str_replace( $src_result, $relative_url, $src_results[0][ $src_index ] ),
					$css
				);
			}
		}

		return $css;
	}
}

if ( ! function_exists( 'wp_enqueue_block_style' ) ) {
	/**
	 * Enqueue a stylesheet for a specific block.
	 *
	 * If the theme has opted-in to separate-styles loading,
	 * then the stylesheet will be enqueued on-render,
	 * otherwise when the block inits.
	 *
	 * @since 5.9.0
	 *
	 * @param string $block_name The block-name, including namespace.
	 * @param array  $args       An array of arguments [handle,src,deps,ver,media].
	 *
	 * @return void
	 */
	function wp_enqueue_block_style( $block_name, $args ) {
		$args = wp_parse_args(
			$args,
			array(
				'handle' => '',
				'src'    => '',
				'deps'   => array(),
				'ver'    => false,
				'media'  => 'all',
			)
		);

		/**
		 * Callback function to register and enqueue styles.
		 *
		 * @param string $content When the callback is used for the render_block filter,
		 *                        the content needs to be returned so the function parameter
		 *                        is to ensure the content exists.
		 * @return string Block content.
		 */
		$callback = static function( $content ) use ( $args ) {
			// Register the stylesheet.
			if ( ! empty( $args['src'] ) ) {
				wp_register_style( $args['handle'], $args['src'], $args['deps'], $args['ver'], $args['media'] );
			}

			// Add `path` data if provided.
			if ( isset( $args['path'] ) ) {
				wp_style_add_data( $args['handle'], 'path', $args['path'] );

				// Get the RTL file path.
				$rtl_file_path = str_replace( '.css', '-rtl.css', $args['path'] );

				// Add RTL stylesheet.
				if ( file_exists( $rtl_file_path ) ) {
					wp_style_add_data( $args['handle'], 'rtl', 'replace' );

					if ( is_rtl() ) {
						wp_style_add_data( $args['handle'], 'path', $rtl_file_path );
					}
				}
			}

			// Enqueue the stylesheet.
			wp_enqueue_style( $args['handle'] );

			return $content;
		};

		$hook = did_action( 'wp_enqueue_scripts' ) ? 'wp_footer' : 'wp_enqueue_scripts';
		if ( wp_should_load_separate_core_block_assets() ) {
			/**
			 * Callback function to register and enqueue styles.
			 *
			 * @param string $content The block content.
			 * @param array  $block   The full block, including name and attributes.
			 * @return string Block content.
			 */
			$callback_separate = static function( $content, $block ) use ( $block_name, $callback ) {
				if ( ! empty( $block['blockName'] ) && $block_name === $block['blockName'] ) {
					return $callback( $content );
				}
				return $content;
			};

			/*
			 * The filter's callback here is an anonymous function because
			 * using a named function in this case is not possible.
			 *
			 * The function cannot be unhooked, however, users are still able
			 * to dequeue the stylesheets registered/enqueued by the callback
			 * which is why in this case, using an anonymous function
			 * was deemed acceptable.
			 */
			add_filter( 'render_block', $callback_separate, 10, 2 );
			return;
		}

		/*
		 * The filter's callback here is an anonymous function because
		 * using a named function in this case is not possible.
		 *
		 * The function cannot be unhooked, however, users are still able
		 * to dequeue the stylesheets registered/enqueued by the callback
		 * which is why in this case, using an anonymous function
		 * was deemed acceptable.
		 */
		add_filter( $hook, $callback );

		// Enqueue assets in the editor.
		add_action( 'enqueue_block_assets', $callback );
	}
}

/**
 * Allow multiple block styles.
 *
 * @since 5.9.0
 *
 * @param array $metadata Metadata for registering a block type.
 *
 * @return array
 */
function gutenberg_multiple_block_styles( $metadata ) {
	foreach ( array( 'style', 'editorStyle' ) as $key ) {
		if ( ! empty( $metadata[ $key ] ) && is_array( $metadata[ $key ] ) ) {
			$default_style = array_shift( $metadata[ $key ] );
			foreach ( $metadata[ $key ] as $handle ) {
				$args = array( 'handle' => $handle );
				if ( 0 === strpos( $handle, 'file:' ) && isset( $metadata['file'] ) ) {
					$style_path = remove_block_asset_path_prefix( $handle );
					$args       = array(
						'handle' => sanitize_key( "{$metadata['name']}-{$style_path}" ),
						'src'    => plugins_url( $style_path, $metadata['file'] ),
					);
				}

				wp_enqueue_block_style( $metadata['name'], $args );
			}

			// Only return the 1st item in the array.
			$metadata[ $key ] = $default_style;
		}
	}
	return $metadata;
}
add_filter( 'block_type_metadata', 'gutenberg_multiple_block_styles' );
