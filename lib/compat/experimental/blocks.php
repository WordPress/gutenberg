<?php
/**
 * Temporary compatibility shims for features present in Gutenberg.
 *
 * @package gutenberg
 */

if ( ! function_exists( 'build_comment_query_vars_from_block' ) ) {
	/**
	 * Helper function that constructs a comment query vars array from the passed block properties.
	 *
	 * It's used with the Comment Query Loop inner blocks.
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

		$inherit = ! empty( $block->context['comments/inherit'] );

		$per_page = 0;
		if ( $inherit && get_option( 'page_comments' ) ) {
			$per_page = get_option( 'comments_per_page' );
		}

		if ( ! $inherit && ! empty( $block->context['comments/perPage'] ) ) {
			$per_page = (int) $block->context['comments/perPage'];
		}

		$default_page = get_option( 'default_comments_page' );
		if ( ! $inherit && ! empty( $block->context['comments/defaultPage'] ) ) {
			$default_page = $block->context['comments/defaultPage'];
		}

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

if ( ! function_exists( 'extend_block_editor_settings_with_discussion_settings' ) ) {
	/**
	 * Workaround for getting discussion settings as block editor settings
	 * so any user can access to them without needing to be an admin.
	 *
	 * @param array $settings Default editor settings.
	 *
	 * @return array Filtered editor settings.
	 */
	function extend_block_editor_settings_with_discussion_settings( $settings ) {

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
}
add_filter( 'block_editor_settings_all', 'extend_block_editor_settings_with_discussion_settings' );

if ( ! function_exists( 'gutenberg_rest_comment_set_children_as_embeddable' ) ) {
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
}
add_action( 'rest_api_init', 'gutenberg_rest_comment_set_children_as_embeddable' );

/**
 * Sets a global JS variable used to trigger the availability of the experimental list block.
 */
function gutenberg_enable_experimental_list_block() {
	if ( get_option( 'gutenberg-experiments' ) && array_key_exists( 'gutenberg-list-v2', get_option( 'gutenberg-experiments' ) ) ) {
		wp_add_inline_script( 'wp-block-library', 'window.__experimentalEnableListBlockV2 = true', 'before' );
	}
}

add_action( 'admin_init', 'gutenberg_enable_experimental_list_block' );
