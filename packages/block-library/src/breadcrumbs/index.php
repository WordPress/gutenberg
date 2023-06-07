<?php
/**
 * Server-side rendering of the `core/breadcrumbs` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/breadcrumbs` block on the server.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 *
 * @return string Returns the filtered breadcrumbs for the current post.
 */
function render_block_core_breadcrumbs( $attributes, $content, $block ) {
	if ( ! isset( $block->context['postId'] ) ) {
		return '';
	}

	$post_id   = $block->context['postId'];
	$post_type = get_post_type( $post_id );

	if ( false === $post_type ) {
		return '';
	}

	$ancestor_ids       = array();
	$has_post_hierarchy = is_post_type_hierarchical( $post_type );
	$show_site_title    = ! empty( $attributes['showSiteTitle'] );
	$show_current_page  = ! empty( $attributes['showCurrentPageTitle'] );

	if ( $has_post_hierarchy ) {
		$ancestor_ids = get_post_ancestors( $post_id );

		if (
			empty( $ancestor_ids ) &&
			! ( $show_site_title && $show_current_page )
		) {
			return '';
		}
	} else {
		$terms = get_the_terms( $post_id, 'category' );

		if ( empty( $terms ) || is_wp_error( $terms ) ) {
			return '';
		}

		$term = get_term( $terms[0], 'category' );

		$ancestor_ids[] = $term->term_id;
		$ancestor_ids   = array_merge( $ancestor_ids, get_ancestors( $term->term_id, 'category' ) );
	}

	$breadcrumbs = array();

	// Prepend site title breadcrumb if available and set to show.
	$site_title = get_bloginfo( 'name' );
	if ( $site_title && $show_site_title ) {
		$site_title = ! empty( $attributes['siteTitleOverride'] ) ?
			$attributes['siteTitleOverride'] :
			$site_title;

		$breadcrumbs[] = array(
			'url'   => get_bloginfo( 'url' ),
			'title' => $site_title,
		);
	}

	if ( $has_post_hierarchy ) {
		// Construct remaining breadcrumbs from ancestor ids.
		foreach ( array_reverse( $ancestor_ids ) as $ancestor_id ) {
			$breadcrumbs[] = array(
				'url'   => get_the_permalink( $ancestor_id ),
				'title' => get_the_title( $ancestor_id ),
			);
		}
	} else {
		foreach ( array_reverse( $ancestor_ids ) as $ancestor_id ) {
			$breadcrumbs[] = array(
				'url'   => get_category_link( $ancestor_id ),
				'title' => get_cat_name( $ancestor_id ),
			);
		}
	}

	// Append current page title if set to show.
	if ( $show_current_page ) {
		$breadcrumbs[] = array(
			'url'   => get_the_permalink( $post_id ),
			'title' => get_the_title( $post_id ),
		);
	}

	$inner_markup = '';

	/**
	 * Filters the list of breadcrumb links within the Breadcrumbs block render callback.
	 *
	 * @since 6.3.0
	 *
	 * @param array[] An array of Breadcrumb arrays with `url` and `title` keys.
	 */
	$breadcrumbs = apply_filters( 'block_core_breadcrumbs_links', $breadcrumbs );

	foreach ( $breadcrumbs as $index => $breadcrumb ) {
		$show_separator = $index < count( $breadcrumbs ) - 1;
		$inner_markup  .= build_block_core_breadcrumbs_inner_markup_item(
			$breadcrumb['url'],
			$breadcrumb['title'],
			$attributes,
			$index,
			$show_separator,
			( $show_current_page && count( $breadcrumbs ) - 1 === $index )
		);
	}

	$classnames = '';

	if ( ! empty( $attributes['contentJustification'] ) ) {
		if ( 'left' === $attributes['contentJustification'] ) {
			$classnames = 'is-content-justification-left';
		}

		if ( 'center' === $attributes['contentJustification'] ) {
			$classnames = 'is-content-justification-center';
		}

		if ( 'right' === $attributes['contentJustification'] ) {
			$classnames = 'is-content-justification-right';
		}
	}

	$wrapper_attributes = get_block_wrapper_attributes(
		array(
			'class'      => $classnames,
			'aria-label' => __( 'Breadcrumb' ),
		)
	);

	return sprintf(
		'<nav %1$s><ol>%2$s</ol></nav>',
		$wrapper_attributes,
		$inner_markup
	);
}

/**
 * Builds the markup for a single Breadcrumb item.
 *
 * Used when iterating over a list of breadcrumb urls and titles.
 *
 * @param string $url             The url for the link in the breadcrumb.
 * @param string $title           The label/title for the breadcrumb item.
 * @param array  $attributes      Block attributes.
 * @param int    $index           The position in a list of ids.
 * @param bool   $show_separator  Whether to show the separator character where available.
 * @param bool   $is_current_page Whether to mark the breadcrumb item as the current page.
 *
 * @return string The markup for a single breadcrumb item wrapped in an `li` element.
 */
function build_block_core_breadcrumbs_inner_markup_item( $url, $title, $attributes, $index, $show_separator = true, $is_current_page = false ) {
	$li_class        = 'wp-block-breadcrumbs__item';
	$separator_class = 'wp-block-breadcrumbs__separator';

	$markup = '';

	// Render leading separator if specified.
	if (
		! empty( $attributes['showLeadingSeparator'] ) &&
		! empty( $attributes['separator'] ) &&
		0 === $index
	) {
		$markup .= sprintf(
			'<span class="%1$s">%2$s</span>',
			$separator_class,
			wp_kses_post( $attributes['separator'] )
		);
	}

	$markup .= sprintf(
		'<a href="%s"%s>%s</a>',
		esc_url( $url ),
		$is_current_page ? ' aria-current="page"' : '',
		wp_kses_post( $title )
	);

	if (
		$show_separator &&
		! empty( $attributes['separator'] )
	) {
		$markup .= sprintf(
			'<span class="%1$s" aria-hidden="true">%2$s</span>',
			$separator_class,
			wp_kses_post( $attributes['separator'] )
		);
	}

	return sprintf(
		'<li class="%1$s">%2$s</li>',
		$li_class,
		$markup
	);
}

/**
 * Registers the `core/post-title` block on the server.
 */
function register_block_core_breadcrumbs() {
	register_block_type_from_metadata(
		__DIR__ . '/breadcrumbs',
		array(
			'render_callback' => 'render_block_core_breadcrumbs',
		)
	);
}
add_action( 'init', 'register_block_core_breadcrumbs' );
