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

	$post_id      = $block->context['postId'];
	$post_type    = get_post_type( $post_id );

	if ( false === $post_type ) {
		return '';
	}

	$ancestor_ids       = array();
	$has_post_hierarchy = is_post_type_hierarchical( $post_type );

	if ( $has_post_hierarchy ) {
		$ancestor_ids = get_post_ancestors( $post_id );

		if ( empty( $ancestor_ids ) ) {
			return '';
		}
	} else {
		$terms = get_the_terms( $post_id, 'category' );

		if ( ! $terms || is_wp_error( $terms ) ) {
			return '';
		}

		$term = get_term( $terms[0], 'category' );

		$ancestor_ids[] = $term->term_id;
		$ancestor_ids   = array_merge( $ancestor_ids, get_ancestors( $term->term_id, 'category' ) );
	}

	$breadcrumbs = array();

	// Prepend site title breadcrumb if available and set to show.
	$site_title = get_bloginfo( 'name' );
	if ( $site_title && ! empty( $attributes['showSiteTitle'] ) ) {
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

	// Trim the list of breadcrumbs based on nesting level if available.
	if ( ! empty( $attributes['nestingLevel'] ) && is_numeric( $attributes['nestingLevel'] ) ) {
		$breadcrumbs = array_slice(
			$breadcrumbs,
			0 - intval( $attributes['nestingLevel'] )
		);
	}

	// Append current page title if set to show.
	if ( ! empty( $attributes['showCurrentPageTitle'] ) ) {
		$breadcrumbs[] = array(
			'url'   => get_the_permalink( $post_id ),
			'title' => get_the_title( $post_id ),
		);
	}

	$inner_markup = '';

	foreach ( $breadcrumbs as $index => $breadcrumb ) {
		$show_separator = $index < count( $breadcrumbs ) - 1;
		$inner_markup  .= build_block_core_breadcrumbs_inner_markup_item(
			$breadcrumb['url'],
			$breadcrumb['title'],
			$attributes,
			$index,
			$show_separator
		);
	}

	$align_class_name   = empty( $attributes['textAlign'] ) ? '' : "has-text-align-{$attributes['textAlign']}";
	$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => $align_class_name ) );

	return sprintf(
		'<nav %1$s><ol itemscope itemtype="https://schema.org/BreadcrumbList">%2$s</ol></nav>',
		$wrapper_attributes,
		$inner_markup
	);
}

/**
 * Builds the markup for a single Breadcrumb item.
 *
 * Used when iterating over a list of breadcrumb urls and titles.
 *
 * @param string $url            The url for the link in the breadcrumb.
 * @param string $title          The label/title for the breadcrumb item.
 * @param array  $attributes     Block attributes.
 * @param int    $index          The position in a list of ids.
 * @param bool   $show_separator Whether to show the separator character where available.
 *
 * @return string The markup for a single breadcrumb item wrapped in an `li` element.
 */
function build_block_core_breadcrumbs_inner_markup_item( $url, $title, $attributes, $index, $show_separator = true ) {
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
			esc_html( $attributes['separator'] )
		);
	}

	$markup .= sprintf(
		'<a itemprop="item" href="%s">%s%s</a>',
		esc_url( $url ),
		sprintf( '<span itemprop="name">%s</span>', esc_html( $title ) ),
		sprintf( '<meta itemprop="position" content="%s" />', $index + 1 )
	);

	if (
		$show_separator &&
		! empty( $attributes['separator'] )
	) {
		$markup .= sprintf(
			'<span class="%1$s">%2$s</span>',
			$separator_class,
			esc_html( $attributes['separator'] )
		);
	}

	return sprintf(
		'<li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem" class="%1$s">%2$s</li>',
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
