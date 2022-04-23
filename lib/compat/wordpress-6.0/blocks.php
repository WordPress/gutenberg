<?php
/**
 * Temporary compatibility shims for features present in Gutenberg.
 *
 * @package gutenberg
 */

/**
 * Helper function that constructs a WP_Query args array from
 * a `Query` block properties.
 *
 * It's used in QueryLoop, QueryPaginationNumbers and QueryPaginationNext blocks.
 *
 * `build_query_vars_from_query_block` was introduced in 5.8, for 6.0 we just need
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
	}
	return $query;
}

/**
 * Registers view scripts for core blocks if handling is missing in WordPress core.
 *
 * This is a temporary solution until the Gutenberg plugin sets
 * the required WordPress version to 6.0.
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
		strpos( $metadata['file'], gutenberg_dir_path() ) !== 0
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
	 * @since 6.0.0
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

				// Additional arg to allow translations for the script's textdomain.
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
				wp_set_script_translations( $args['handle'], $args['textdomain'] );
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
 * @since 6.0.0
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

if ( ! function_exists( 'build_comment_query_vars_from_block' ) ) {
	/**
	 * Helper function that constructs a comment query vars array from the passed block properties.
	 *
	 * It's used with the Comment Query Loop inner blocks.
	 *
	 * @since 6.0.0
	 *
	 * @param WP_Block $block Block instance.
	 *
	 * @return array Returns the comment query parameters to use with the WP_Comment_Query constructor.
	 */
	function build_comment_query_vars_from_block( $block ) {

		$comment_args = array(
			'orderby'                   => 'comment_date_gmt',
			'order'                     => 'ASC',
			'status'                    => 'approve',
			'no_found_rows'             => false,
			'update_comment_meta_cache' => false, // We lazy-load comment meta for performance.
		);

		if ( ! empty( $block->context['postId'] ) ) {
			$comment_args['post_id'] = (int) $block->context['postId'];
		}

		if ( get_option( 'thread_comments' ) ) {
			$comment_args['hierarchical'] = 'threaded';
		} else {
			$comment_args['hierarchical'] = false;
		}

		if ( get_option( 'page_comments' ) === '1' || get_option( 'page_comments' ) === true ) {
			$per_page     = get_option( 'comments_per_page' );
			$default_page = get_option( 'default_comments_page' );
			if ( $per_page > 0 ) {
				$comment_args['number'] = $per_page;

				$page = (int) get_query_var( 'cpage' );
				if ( $page ) {
					$comment_args['paged'] = $page;
				} elseif ( 'oldest' === $default_page ) {
					$comment_args['paged'] = 1;
				} elseif ( 'newest' === $default_page ) {
					$comment_args['paged'] = (int) ( new WP_Comment_Query( $comment_args ) )->max_num_pages;
				}
				// Set the `cpage` query var to ensure the previous and next pagination links are correct
				// when inheriting the Discussion Settings.
				if ( 0 === $page && isset( $comment_args['paged'] ) && $comment_args['paged'] > 0 ) {
					set_query_var( 'cpage', $comment_args['paged'] );
				}
			}
		}

		return $comment_args;
	}
}

if ( ! function_exists( 'get_comments_pagination_arrow' ) ) {
	/**
	 * Helper function that returns the proper pagination arrow html for
	 * `CommentsPaginationNext` and `CommentsPaginationPrevious` blocks based
	 * on the provided `paginationArrow` from `CommentsPagination` context.
	 *
	 * It's used in CommentsPaginationNext and CommentsPaginationPrevious blocks.
	 *
	 * @since 6.0.0
	 *
	 * @param WP_Block $block   Block instance.
	 * @param string   $pagination_type Type of the arrow we will be rendering. Default 'next'. Accepts 'next' or 'previous'.
	 *
	 * @return string|null Returns the constructed WP_Query arguments.
	 */
	function get_comments_pagination_arrow( $block, $pagination_type = 'next' ) {
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
		if ( ! empty( $block->context['comments/paginationArrow'] ) && ! empty( $arrow_map[ $block->context['comments/paginationArrow'] ][ $pagination_type ] ) ) {
			$arrow_attribute = $block->context['comments/paginationArrow'];
			$arrow           = $arrow_map[ $block->context['comments/paginationArrow'] ][ $pagination_type ];
			$arrow_classes   = "wp-block-comments-pagination-$pagination_type-arrow is-arrow-$arrow_attribute";
			return "<span class='$arrow_classes'>$arrow</span>";
		}
		return null;
	}
}

/**
 * Workaround for getting discussion settings as block editor settings
 * so any user can access to them without needing to be an admin.
 *
 * @param array $settings Default editor settings.
 *
 * @return array Filtered editor settings.
 */
function gutenberg_extend_block_editor_settings_with_discussion_settings( $settings ) {

	$settings['__experimentalDiscussionSettings'] = array(
		'commentOrder'        => get_option( 'comment_order' ),
		'commentsPerPage'     => get_option( 'comments_per_page' ),
		'defaultCommentsPage' => get_option( 'default_comments_page' ),
		'pageComments'        => get_option( 'page_comments' ),
		'threadComments'      => get_option( 'thread_comments' ),
		'threadCommentsDepth' => get_option( 'thread_comments_depth' ),
		'avatarURL'           => get_avatar_url(
			'',
			array(
				'size'          => 96,
				'force_default' => true,
				'default'       => get_option( 'avatar_default' ),
			)
		),
	);

	return $settings;
}
add_filter( 'block_editor_settings_all', 'gutenberg_extend_block_editor_settings_with_discussion_settings' );

/**
 * Mark the `children` attr of comments as embeddable so they can be included in
 * REST API responses without additional requests.
 *
 * @return void
 */
function gutenberg_rest_comment_set_children_as_embeddable() {
	add_filter(
		'rest_prepare_comment',
		function ( $response ) {
			$links = $response->get_links();
			if ( isset( $links['children'] ) ) {
				$href = $links['children'][0]['href'];
				$response->remove_link( 'children', $href );
				$response->add_link( 'children', $href, array( 'embeddable' => true ) );
			}
			return $response;
		}
	);
}
add_action( 'rest_api_init', 'gutenberg_rest_comment_set_children_as_embeddable' );
