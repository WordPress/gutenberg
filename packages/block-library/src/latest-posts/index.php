<?php
/**
 * Server-side rendering of the `core/latest-posts` block.
 *
 * @package WordPress
 */

/**
 * Filter the WPQuery vars to add a custom pagination key for the latest posts block.
 *
 * @param array $query_vars The query vars.
 *
 * @return array Returns the filtered query vars.
 */
function block_core_latest_posts_filter_query_vars( $query_vars ) {
	$query_vars[] = 'latest_posts_page';
	return $query_vars;
}
add_filter( 'query_vars', 'block_core_latest_posts_filter_query_vars' );

/**
 * Renders the `core/latest-posts` block on server.
 *
 * @param array $attributes The block attributes.
 *
 * @return string Returns the post content with latest posts added.
 */
function render_block_core_latest_posts( $attributes ) {
	$args = array(
		'posts_per_page'   => $attributes['postsToShow'] + 1,
		'post_status'      => 'publish',
		'order'            => $attributes['order'],
		'orderby'          => $attributes['orderBy'],
		'suppress_filters' => false,
	);

	if ( isset( $attributes['categories'] ) ) {
		$args['category'] = $attributes['categories'];
	}

	$pagination_markup = '';
	$latest_posts_page = get_query_var( 'latest_posts_page' );
	if ( ! empty( $attributes['paginate'] ) && ! empty( $latest_posts_page ) ) {
		$args['offset'] = ( $latest_posts_page - 1 ) * $attributes['postsToShow'];

		if ( $latest_posts_page > 1 ) {
			$pagination_markup .= sprintf(
				'<a class="wp-block-latest-posts__navigation-link" href="%1$s" alt="%2$s">%2$s</a>',
				esc_attr( add_query_arg( 'latest_posts_page', $latest_posts_page - 1 ) ),
				__( 'Previous', 'gutenberg' )
			);
		}
	}

	$recent_posts = get_posts( $args );
	if ( count( $recent_posts ) === $attributes['postsToShow'] + 1 ) {
		array_pop( $recent_posts );

		if ( ! empty( $attributes['paginate'] ) ) {
			$pagination_markup .= sprintf(
				'<a class="wp-block-latest-posts__navigation-link" href="%1$s" alt="%2$s">%2$s</a>',
				esc_attr( add_query_arg( 'latest_posts_page', max( 2, $latest_posts_page + 1 ) ) ),
				__( 'Next', 'gutenberg' )
			);
		}
	}
	$list_items_markup = '';

	$excerpt_length = $attributes['excerptLength'];

	foreach ( $recent_posts as $post ) {
		$title = get_the_title( $post );
		if ( ! $title ) {
			$title = __( '(no title)' );
		}
		$list_items_markup .= sprintf(
			'<li><a href="%1$s">%2$s</a>',
			esc_url( get_permalink( $post ) ),
			$title
		);

		if ( isset( $attributes['displayPostDate'] ) && $attributes['displayPostDate'] ) {
			$list_items_markup .= sprintf(
				'<time datetime="%1$s" class="wp-block-latest-posts__post-date">%2$s</time>',
				esc_attr( get_the_date( 'c', $post ) ),
				esc_html( get_the_date( '', $post ) )
			);
		}

		if ( isset( $attributes['displayPostContent'] ) && $attributes['displayPostContent']
			&& isset( $attributes['displayPostContentRadio'] ) && 'excerpt' === $attributes['displayPostContentRadio'] ) {
			$post_excerpt = $post->post_excerpt;
			if ( ! ( $post_excerpt ) ) {
				$post_excerpt = $post->post_content;
			}
			$trimmed_excerpt = esc_html( wp_trim_words( $post_excerpt, $excerpt_length, ' &hellip; ' ) );

			$list_items_markup .= sprintf(
				'<div class="wp-block-latest-posts__post-excerpt">%1$s',
				$trimmed_excerpt
			);

			if ( strpos( $trimmed_excerpt, ' &hellip; ' ) !== false ) {
				$list_items_markup .= sprintf(
					'<a href="%1$s">%2$s</a></div>',
					esc_url( get_permalink( $post ) ),
					__( 'Read more' )
				);
			} else {
				$list_items_markup .= sprintf(
					'</div>'
				);
			}
		}

		if ( isset( $attributes['displayPostContent'] ) && $attributes['displayPostContent']
			&& isset( $attributes['displayPostContentRadio'] ) && 'full_post' === $attributes['displayPostContentRadio'] ) {
			$list_items_markup .= sprintf(
				'<div class="wp-block-latest-posts__post-full-content">%1$s</div>',
				wp_kses_post( html_entity_decode( $post->post_content, ENT_QUOTES, get_option( 'blog_charset' ) ) )
			);
		}

		$list_items_markup .= "</li>\n";
	}

	$class = 'wp-block-latest-posts wp-block-latest-posts__list';
	if ( isset( $attributes['align'] ) ) {
		$class .= ' align' . $attributes['align'];
	}

	if ( isset( $attributes['postLayout'] ) && 'grid' === $attributes['postLayout'] ) {
		$class .= ' is-grid';
	}

	if ( isset( $attributes['columns'] ) && 'grid' === $attributes['postLayout'] ) {
		$class .= ' columns-' . $attributes['columns'];
	}

	if ( isset( $attributes['displayPostDate'] ) && $attributes['displayPostDate'] ) {
		$class .= ' has-dates';
	}

	if ( isset( $attributes['className'] ) ) {
		$class .= ' ' . $attributes['className'];
	}

	return sprintf(
		'<ul class="%1$s">%2$s%3$s</ul>',
		esc_attr( $class ),
		$list_items_markup,
		$pagination_markup
	);
}

/**
 * Registers the `core/latest-posts` block on server.
 */
function register_block_core_latest_posts() {
	register_block_type(
		'core/latest-posts',
		array(
			'attributes'      => array(
				'align'                   => array(
					'type' => 'string',
					'enum' => array( 'left', 'center', 'right', 'wide', 'full' ),
				),
				'className'               => array(
					'type' => 'string',
				),
				'categories'              => array(
					'type' => 'string',
				),
				'postsToShow'             => array(
					'type'    => 'number',
					'default' => 5,
				),
				'displayPostContent'      => array(
					'type'    => 'boolean',
					'default' => false,
				),
				'displayPostContentRadio' => array(
					'type'    => 'string',
					'default' => 'excerpt',
				),
				'excerptLength'           => array(
					'type'    => 'number',
					'default' => 55,
				),
				'displayPostDate'         => array(
					'type'    => 'boolean',
					'default' => false,
				),
				'postLayout'              => array(
					'type'    => 'string',
					'default' => 'list',
				),
				'columns'                 => array(
					'type'    => 'number',
					'default' => 3,
				),
				'order'                   => array(
					'type'    => 'string',
					'default' => 'desc',
				),
				'orderBy'                 => array(
					'type'    => 'string',
					'default' => 'date',
				),
				'paginate'                => array(
					'type'    => 'boolean',
					'default' => false,
				),
			),
			'render_callback' => 'render_block_core_latest_posts',
		)
	);
}
add_action( 'init', 'register_block_core_latest_posts' );
