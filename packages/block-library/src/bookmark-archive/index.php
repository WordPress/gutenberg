<?php
/**
 * Server-side rendering of the `core/bookmark` block.
 *
 * @package WordPress
 */

/**
 * Renders the `bookmark` block on the server.
 *
 * @since 6.8.0
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 *
 * @return string The rendered block content.
 */
function render_block_core_bookmark_archive() {
	$wrapper_attributes = get_block_wrapper_attributes();
	$custom_content     = '<div ' . $wrapper_attributes . ' >';
	$custom_content    .= '<h1>' . __( 'Your Liked Posts' ) . '</h1>';

	if ( is_user_logged_in() ) {

		// Fetch user's liked posts.
		$current_user_id = get_current_user_id();
		$liked_posts     = get_user_meta( $current_user_id, 'liked_posts', true ) ? get_user_meta( $current_user_id, 'liked_posts', true ) : array();
		$paged           = get_query_var( 'paged' ) ? get_query_var( 'paged' ) : 1;

		$query = new WP_Query(
			array(
				'post_type'      => 'any',
				'post__in'       => ! empty( $liked_posts ) ? array_map( 'intval', $liked_posts ) : array( 0 ),
				'orderby'        => 'post__in',
				'posts_per_page' => 10,
				'paged'          => $paged,
			)
		);

		if ( $query->have_posts() ) {
			$custom_content .= '<ul class="favorites-list">';
			while ( $query->have_posts() ) {
				$query->the_post();
				$custom_content .= '<li><h2><a href="' . get_permalink() . '">' . get_the_title() . '</a></h2></li>';
			}
			$custom_content .= '</ul>';

			$custom_content .= '<div class="pagination">';

			$big             = 999999999; // Need an unlikely integer for pagination base.
			$custom_content .= paginate_links(
				array(
					'base'      => str_replace( $big, '%#%', esc_url( get_pagenum_link( $big ) ) ),
					'format'    => '?paged=%#%',
					'current'   => max( 1, $paged ),
					'total'     => $query->max_num_pages,
					'prev_text' => '« Previous',
					'next_text' => 'Next »',
				)
			);
			$custom_content .= '</div>';

			wp_reset_postdata();
		} else {
			$custom_content .= '<p>' . __( 'No liked posts found.' ) . '</p>';
		}
	} else {
		wp_register_script( 'core-bookmarks-logged-out-user', '/wp-content/plugins/gutenberg/packages/block-library/src/bookmark-archive/bookmarks-logged-out-user.js', array(), filemtime( '/wp-content/plugins/gutenberg/packages/block-library/src/bookmark/bookmarks-logged-out-user.js' ), true );
		wp_enqueue_script( 'core-bookmarks-logged-out-user' );
		// Needed to inject liked posts using js when user is not logged in.
		$custom_content .= '<ul id="liked-posts" class="liked-posts"></ul>';
	}

	$custom_content .= '</div>';

	return $custom_content;
}

/**
 * Registers the `bookmark-archive` block.
 *
 * @since 6.8.0
 */
function register_block_core_bookmark_archive() {
	register_block_type_from_metadata(
		__DIR__ . '/bookmark-archive',
		array(
			'render_callback' => 'render_block_core_bookmark_archive',
		)
	);
}

add_action( 'init', 'register_block_core_bookmark_archive' );
