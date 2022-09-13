<?php
/**
 * Temporary compatibility shims for block APIs present in Gutenberg.
 *
 * @package gutenberg
 */

/**
 * Update allowed inline style attributes list.
 *
 * Note: This should be removed when the minimum required WP version is >= 6.1.
 *
 * @param string[] $attrs Array of allowed CSS attributes.
 * @return string[] CSS attributes.
 */
function gutenberg_safe_style_attrs_6_1( $attrs ) {
	$attrs[] = 'flex-wrap';
	$attrs[] = 'gap';
	$attrs[] = 'margin-block-start';
	$attrs[] = 'margin-block-end';
	$attrs[] = 'margin-inline-start';
	$attrs[] = 'margin-inline-end';

	return $attrs;
}
add_filter( 'safe_style_css', 'gutenberg_safe_style_attrs_6_1' );

/**
 * Update allowed CSS values to match WordPress 6.1.
 *
 * Note: This should be removed when the minimum required WP version is >= 6.1.
 *
 * The logic in this function follows that provided in: https://core.trac.wordpress.org/ticket/55966.
 *
 * @param boolean $allow_css       Whether or not the current test string is allowed.
 * @param string  $css_test_string The CSS string to be tested.
 * @return boolean
 */
function gutenberg_safecss_filter_attr_allow_css_6_1( $allow_css, $css_test_string ) {
	if ( false === $allow_css ) {
		// Allow some CSS functions.
		$css_test_string = preg_replace( '/\b(?:calc|min|max|minmax|clamp)\(((?:\([^()]*\)?|[^()])*)\)/', '', $css_test_string );

		// Allow CSS var.
		$css_test_string = preg_replace( '/\(?var\(--[\w\-\()[\]\,\s]*\)/', '', $css_test_string );

		// Check for any CSS containing \ ( & } = or comments,
		// except for url(), calc(), or var() usage checked above.
		$allow_css = ! preg_match( '%[\\\(&=}]|/\*%', $css_test_string );
	}
	return $allow_css;
}
add_filter( 'safecss_filter_attr_allow_css', 'gutenberg_safecss_filter_attr_allow_css_6_1', 10, 2 );

/**
 * Registers view scripts for core blocks if handling is missing in WordPress core.
 *
 * @since 6.1.0
 *
 * @param array $settings Array of determined settings for registering a block type.
 * @param array $metadata Metadata provided for registering a block type.
 *
 * @return array Array of settings for registering a block type.
 */
function gutenberg_block_type_metadata_view_script( $settings, $metadata ) {
	if (
		! isset( $metadata['viewScript'] ) ||
		! empty( $settings['view_script'] ) ||
		! isset( $metadata['file'] ) ||
		! str_starts_with( $metadata['file'], gutenberg_dir_path() )
	) {
		return $settings;
	}

	$view_script_path = realpath( dirname( $metadata['file'] ) . '/' . remove_block_asset_path_prefix( $metadata['viewScript'] ) );

	if ( file_exists( $view_script_path ) ) {
		$view_script_id     = str_replace( array( '.min.js', '.js' ), '', basename( remove_block_asset_path_prefix( $metadata['viewScript'] ) ) );
		$view_script_handle = str_replace( 'core/', 'wp-block-', $metadata['name'] ) . '-' . $view_script_id;
		wp_deregister_script( $view_script_handle );

		// Replace suffix and extension with `.asset.php` to find the generated dependencies file.
		$view_asset_file          = substr( $view_script_path, 0, -( strlen( '.js' ) ) ) . '.asset.php';
		$view_asset               = file_exists( $view_asset_file ) ? require( $view_asset_file ) : null;
		$view_script_dependencies = isset( $view_asset['dependencies'] ) ? $view_asset['dependencies'] : array();
		$view_script_version      = isset( $view_asset['version'] ) ? $view_asset['version'] : false;
		$result                   = wp_register_script(
			$view_script_handle,
			gutenberg_url( str_replace( gutenberg_dir_path(), '', $view_script_path ) ),
			$view_script_dependencies,
			$view_script_version
		);
		if ( $result ) {
			$settings['view_script'] = $view_script_handle;

			if ( ! empty( $metadata['textdomain'] ) && in_array( 'wp-i18n', $view_script_dependencies, true ) ) {
				wp_set_script_translations( $view_script_handle, $metadata['textdomain'] );
			}
		}
	}
	return $settings;
}
add_filter( 'block_type_metadata_settings', 'gutenberg_block_type_metadata_view_script', 10, 2 );

if ( ! function_exists( 'wp_enqueue_block_view_script' ) ) {
	/**
	 * Enqueues a frontend script for a specific block.
	 *
	 * Scripts enqueued using this function will only get printed
	 * when the block gets rendered on the frontend.
	 *
	 * @since 6.1.0
	 *
	 * @param string $block_name The block name, including namespace.
	 * @param array  $args       An array of arguments [handle,src,deps,ver,media,textdomain].
	 *
	 * @return void
	 */
	function wp_enqueue_block_view_script( $block_name, $args ) {
		$args = wp_parse_args(
			$args,
			array(
				'handle'     => '',
				'src'        => '',
				'deps'       => array(),
				'ver'        => false,
				'in_footer'  => false,

				// Additional args to allow translations for the script's textdomain.
				'textdomain' => '',
			)
		);

		/**
		 * Callback function to register and enqueue scripts.
		 *
		 * @param string $content When the callback is used for the render_block filter,
		 *                        the content needs to be returned so the function parameter
		 *                        is to ensure the content exists.
		 * @return string Block content.
		 */
		$callback = static function( $content, $block ) use ( $args, $block_name ) {

			// Sanity check.
			if ( empty( $block['blockName'] ) || $block_name !== $block['blockName'] ) {
				return $content;
			}

			// Register the stylesheet.
			if ( ! empty( $args['src'] ) ) {
				wp_register_script( $args['handle'], $args['src'], $args['deps'], $args['ver'], $args['in_footer'] );
			}

			// Enqueue the stylesheet.
			wp_enqueue_script( $args['handle'] );

			// If a textdomain is defined, use it to set the script translations.
			if ( ! empty( $args['textdomain'] ) && in_array( 'wp-i18n', $args['deps'], true ) ) {
				wp_set_script_translations( $args['handle'], $args['textdomain'], $args['domainpath'] );
			}

			return $content;
		};

		/*
		 * The filter's callback here is an anonymous function because
		 * using a named function in this case is not possible.
		 *
		 * The function cannot be unhooked, however, users are still able
		 * to dequeue the script registered/enqueued by the callback
		 * which is why in this case, using an anonymous function
		 * was deemed acceptable.
		 */
		add_filter( 'render_block', $callback, 10, 2 );
	}
}

/**
 * Allow multiple view scripts per block.
 *
 * Filters the metadata provided for registering a block type.
 *
 * @since 6.1.0
 *
 * @param array $metadata Metadata for registering a block type.
 *
 * @return array
 */
function gutenberg_block_type_metadata_multiple_view_scripts( $metadata ) {

	// Early return if viewScript is empty, or not an array.
	if ( ! isset( $metadata['viewScript'] ) || ! is_array( $metadata['viewScript'] ) ) {
		return $metadata;
	}

	// Register all viewScript items.
	foreach ( $metadata['viewScript'] as $view_script ) {
		$item_metadata               = $metadata;
		$item_metadata['viewScript'] = $view_script;
		gutenberg_block_type_metadata_view_script( array(), $item_metadata );
	}

	// Proceed with the default behavior.
	$metadata['viewScript'] = $metadata['viewScript'][0];
	return $metadata;
}
add_filter( 'block_type_metadata', 'gutenberg_block_type_metadata_multiple_view_scripts' );

/**
 * Helper function that constructs a WP_Query args array from
 * a `Query` block properties.
 *
 * It's used in QueryLoop, QueryPaginationNumbers and QueryPaginationNext blocks.
 *
 * `build_query_vars_from_query_block` was introduced in 5.8, for 6.1 we just need
 * to update that function and not create a new one.
 *
 * @param WP_Block $block Block instance.
 * @param int      $page  Current query's page.
 *
 * @return array Returns the constructed WP_Query arguments.
 */
function gutenberg_build_query_vars_from_query_block( $block, $page ) {
	$query = array(
		'post_type'    => 'post',
		'order'        => 'DESC',
		'orderby'      => 'date',
		'post__not_in' => array(),
	);

	if ( isset( $block->context['query'] ) ) {
		if ( ! empty( $block->context['query']['postType'] ) ) {
			$post_type_param = $block->context['query']['postType'];
			if ( is_post_type_viewable( $post_type_param ) ) {
				$query['post_type'] = $post_type_param;
			}
		}
		if ( isset( $block->context['query']['sticky'] ) && ! empty( $block->context['query']['sticky'] ) ) {
			$sticky = get_option( 'sticky_posts' );
			if ( 'only' === $block->context['query']['sticky'] ) {
				/**
				 * Passing an empty array to post__in will return have_posts() as true (and all posts will be returned).
				 * Logic should be used before hand to determine if WP_Query should be used in the event that the array
				 * being passed to post__in is empty.
				 *
				 * @see https://core.trac.wordpress.org/ticket/28099
				 */
				$query['post__in']            = ! empty( $sticky ) ? $sticky : array( 0 );
				$query['ignore_sticky_posts'] = 1;
			} else {
				$query['post__not_in'] = array_merge( $query['post__not_in'], $sticky );
			}
		}
		if ( ! empty( $block->context['query']['exclude'] ) ) {
			$excluded_post_ids     = array_map( 'intval', $block->context['query']['exclude'] );
			$excluded_post_ids     = array_filter( $excluded_post_ids );
			$query['post__not_in'] = array_merge( $query['post__not_in'], $excluded_post_ids );
		}
		if (
			isset( $block->context['query']['perPage'] ) &&
			is_numeric( $block->context['query']['perPage'] )
		) {
			$per_page = absint( $block->context['query']['perPage'] );
			$offset   = 0;

			if (
				isset( $block->context['query']['offset'] ) &&
				is_numeric( $block->context['query']['offset'] )
			) {
				$offset = absint( $block->context['query']['offset'] );
			}

			$query['offset']         = ( $per_page * ( $page - 1 ) ) + $offset;
			$query['posts_per_page'] = $per_page;
		}

		// We need to migrate `categoryIds` and `tagIds` to `tax_query` for backwards compatibility.
		if ( ! empty( $block->context['query']['categoryIds'] ) || ! empty( $block->context['query']['tagIds'] ) ) {
			$tax_query = array();
			if ( ! empty( $block->context['query']['categoryIds'] ) ) {
				$tax_query[] = array(
					'taxonomy'         => 'category',
					'terms'            => array_filter( array_map( 'intval', $block->context['query']['categoryIds'] ) ),
					'include_children' => false,
				);
			}
			if ( ! empty( $block->context['query']['tagIds'] ) ) {
				$tax_query[] = array(
					'taxonomy'         => 'post_tag',
					'terms'            => array_filter( array_map( 'intval', $block->context['query']['tagIds'] ) ),
					'include_children' => false,
				);
			}
			$query['tax_query'] = $tax_query;
		}
		if ( ! empty( $block->context['query']['taxQuery'] ) ) {
			$query['tax_query'] = array();
			foreach ( $block->context['query']['taxQuery'] as $taxonomy => $terms ) {
				if ( is_taxonomy_viewable( $taxonomy ) && ! empty( $terms ) ) {
					$query['tax_query'][] = array(
						'taxonomy'         => $taxonomy,
						'terms'            => array_filter( array_map( 'intval', $terms ) ),
						'include_children' => false,
					);
				}
			}
		}
		if (
			isset( $block->context['query']['order'] ) &&
				in_array( strtoupper( $block->context['query']['order'] ), array( 'ASC', 'DESC' ), true )
		) {
			$query['order'] = strtoupper( $block->context['query']['order'] );
		}
		if ( isset( $block->context['query']['orderBy'] ) ) {
			$query['orderby'] = $block->context['query']['orderBy'];
		}
		if ( ! empty( $block->context['query']['author'] ) ) {
			$query['author'] = $block->context['query']['author'];
		}
		if ( ! empty( $block->context['query']['search'] ) ) {
			$query['s'] = $block->context['query']['search'];
		}
		if ( ! empty( $block->context['query']['parents'] ) && is_post_type_hierarchical( $query['post_type'] ) ) {
			$query['post_parent__in'] = array_filter( array_map( 'intval', $block->context['query']['parents'] ) );
		}
	}

	/**
	 * Filters the arguments which will be passed to `WP_Query` for the Query Loop Block.
	 *
	 * Anything to this filter should be compatible with the `WP_Query` API to form
	 * the query context which will be passed down to the Query Loop Block's children.
	 * This can help, for example, to include additional settings or meta queries not
	 * directly supported by the core Query Loop Block, and extend its capabilities.
	 *
	 * Please note that this will only influence the query that will be rendered on the
	 * front-end. The editor preview is not affected by this filter. Also, worth noting
	 * that the editor preview uses the REST API, so, ideally, one should aim to provide
	 * attributes which are also compatible with the REST API, in order to be able to
	 * implement identical queries on both sides.
	 *
	 * @since 6.1.0
	 *
	 * @param array    $query Array containing parameters for `WP_Query` as parsed by the block context.
	 * @param WP_Block $block Block instance.
	 * @param int      $page  Current query's page.
	 */
	return apply_filters( 'query_loop_block_query_vars', $query, $block, $page );
}

/**
 * Register render template for core blocks if handling is missing in WordPress core.
 *
 * @since 6.1.0
 *
 * @param array $settings Array of determined settings for registering a block type.
 * @param array $metadata Metadata provided for registering a block type.
 *
 * @return array Array of settings for registering a block type.
 */
function gutenberg_block_type_metadata_render_template( $settings, $metadata ) {
	if ( empty( $metadata['render'] ) || isset( $settings['render_callback'] ) ) {
		return $settings;
	}

	$template_path = wp_normalize_path(
		realpath(
			dirname( $metadata['file'] ) . '/' .
			remove_block_asset_path_prefix( $metadata['render'] )
		)
	);

	// Bail if the file does not exist.
	if ( ! file_exists( $template_path ) ) {
		return $settings;
	}
	/**
	 * Renders the block on the server.
	 *
	 * @param array    $attributes Block attributes.
	 * @param string   $content    Block default content.
	 * @param WP_Block $block      Block instance.
	 *
	 * @return string Returns the block content.
	 */
	$settings['render_callback'] = function( $attributes, $content, $block ) use ( $template_path ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		ob_start();
		require $template_path;
		return ob_get_clean();
	};

	return $settings;
}
add_filter( 'block_type_metadata_settings', 'gutenberg_block_type_metadata_render_template', 10, 2 );

/**
 * Registers the metadata block attribute for block types.
 *
 * Once 6.1 is the minimum supported WordPress version for the Gutenberg
 * plugin, this shim can be removed
 *
 * @param array $args Array of arguments for registering a block type.
 * @return array $args
 */
function gutenberg_register_metadata_attribute( $args ) {
	// Setup attributes if needed.
	if ( ! isset( $args['attributes'] ) || ! is_array( $args['attributes'] ) ) {
		$args['attributes'] = array();
	}

	if ( ! array_key_exists( 'metadata', $args['attributes'] ) ) {
		$args['attributes']['metadata'] = array(
			'type' => 'object',
		);
	}

	return $args;
}
add_filter( 'register_block_type_args', 'gutenberg_register_metadata_attribute' );
