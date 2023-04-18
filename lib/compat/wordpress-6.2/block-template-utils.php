<?php
/**
 * Temporary compatibility shims for features present in Gutenberg.
 * This file should be removed when WordPress 6.1.0 becomes the lowest
 * supported version by this plugin.
 *
 * @package gutenberg
 */

/**
 * Helper function to get the Template Hierarchy for a given slug.
 * We need to Handle special cases here like `front-page`, `singular` and `archive` templates.
 *
 * Noting that we always add `index` as the last fallback template.
 *
 * @param string  $slug            The template slug to be created.
 * @param boolean $is_custom       Indicates if a template is custom or part of the template hierarchy.
 * @param string  $template_prefix The template prefix for the created template. This is used to extract the main template type ex. in `taxonomy-books` we extract the `taxonomy`.
 *
 * @return array<string> The template hierarchy.
 */
function gutenberg_get_template_hierarchy( $slug, $is_custom = false, $template_prefix = '' ) {
	if ( 'index' === $slug ) {
		return array( 'index' );
	}
	if ( $is_custom ) {
		return array( 'page', 'singular', 'index' );
	}
	if ( 'front-page' === $slug ) {
		return array( 'front-page', 'home', 'index' );
	}

	$matches = array();

	$template_hierarchy = array( $slug );
	// Most default templates don't have `$template_prefix` assigned.
	if ( ! empty( $template_prefix ) ) {
		list( $type ) = explode( '-', $template_prefix );
		// We need these checks because we always add the `$slug` above.
		if ( ! in_array( $template_prefix, array( $slug, $type ), true ) ) {
			$template_hierarchy[] = $template_prefix;
		}
		if ( $slug !== $type ) {
			$template_hierarchy[] = $type;
		}
	} elseif ( preg_match( '/^(author|category|archive|tag|page)-.+$/', $slug, $matches ) ) {
		$template_hierarchy[] = $matches[1];
	} elseif ( preg_match( '/^(taxonomy|single)-(.+)$/', $slug, $matches ) ) {
		$type           = $matches[1];
		$slug_remaining = $matches[2];

		$items = 'single' === $type ? get_post_types() : get_taxonomies();
		foreach ( $items as $item ) {
			if ( ! str_starts_with( $slug_remaining, $item ) ) {
					continue;
			}

			// If $slug_remaining is equal to $post_type or $taxonomy we have
			// the single-$post_type template or the taxonomy-$taxonomy template.
			if ( $slug_remaining === $item ) {
				$template_hierarchy[] = $type;
				break;
			}

			// If $slug_remaining is single-$post_type-$slug template.
			if ( strlen( $slug_remaining ) > strlen( $item ) + 1 ) {
				$template_hierarchy[] = "$type-$item";
				$template_hierarchy[] = $type;
				break;
			}
		}
	}
	// Handle `archive` template.
	if (
		str_starts_with( $slug, 'author' ) ||
		str_starts_with( $slug, 'taxonomy' ) ||
		str_starts_with( $slug, 'category' ) ||
		str_starts_with( $slug, 'tag' ) ||
		'date' === $slug
	) {
		$template_hierarchy[] = 'archive';
	}
	// Handle `single` template.
	if ( 'attachment' === $slug ) {
		$template_hierarchy[] = 'single';
	}
	// Handle `singular` template.
	if (
		str_starts_with( $slug, 'single' ) ||
		str_starts_with( $slug, 'page' ) ||
		'attachment' === $slug
	) {
		$template_hierarchy[] = 'singular';
	}
	$template_hierarchy[] = 'index';
	return $template_hierarchy;
}


/**
 * Updates the list of default template types, containing their
 * localized titles and descriptions.
 *
 * We will only need to update `get_default_block_template_types` function.
 *
 * @param array $default_template_types The default template types.
 *
 * @return array The default template types.
 */
function gutenberg_get_default_block_template_types( $default_template_types ) {
	if ( isset( $default_template_types['index'] ) ) {
		$default_template_types['index'] = array(
			'title'       => _x( 'Index', 'Template name', 'gutenberg' ),
			'description' => __(
				'Used as a fallback template for all pages when a more specific template is not defined.',
				'gutenberg'
			),
		);
	}
	if ( isset( $default_template_types['home'] ) ) {
		$default_template_types['home'] = array(
			'title'       => _x( 'Home', 'Template name', 'gutenberg' ),
			'description' => __(
				'Displays the latest posts as either the site homepage or a custom page defined under reading settings. If it exists, the Front Page template overrides this template when posts are shown on the front page.',
				'gutenberg'
			),
		);
	}
	if ( isset( $default_template_types['front-page'] ) ) {
		$default_template_types['front-page'] = array(
			'title'       => _x( 'Front Page', 'Template name', 'gutenberg' ),
			'description' => __(
				"Displays your site's front page, whether it is set to display latest posts or a static page. The Front Page template takes precedence over all templates.",
				'gutenberg'
			),
		);
	}
	if ( isset( $default_template_types['singular'] ) ) {
		$default_template_types['singular'] = array(
			'title'       => _x( 'Singular', 'Template name', 'gutenberg' ),
			'description' => __(
				'Displays any single entry, such as a post or a page. This template will serve as a fallback when a more specific template (e.g., Single Post, Page, or Attachment) cannot be found.',
				'gutenberg'
			),
		);
	}
	if ( isset( $default_template_types['single'] ) ) {
		$default_template_types['single'] = array(
			'title'       => _x( 'Single', 'Template name', 'gutenberg' ),
			'description' => __( 'Displays single posts on your website unless a custom template has been applied to that post or a dedicated template exists.', 'gutenberg' ),
		);
	}
	if ( isset( $default_template_types['page'] ) ) {
		$default_template_types['page'] = array(
			'title'       => _x( 'Page', 'Template name', 'gutenberg' ),
			'description' => __( 'Display all static pages unless a custom template has been applied or a dedicated template exists.', 'gutenberg' ),
		);
	}
	if ( isset( $default_template_types['archive'] ) ) {
		$default_template_types['archive'] = array(
			'title'       => _x( 'Archive', 'Template name', 'gutenberg' ),
			'description' => __(
				'Displays any archive, including posts by a single author, category, tag, taxonomy, custom post type, and date. This template will serve as a fallback when more specific templates (e.g., Category or Tag) cannot be found.',
				'gutenberg'
			),
		);
	}
	if ( isset( $default_template_types['author'] ) ) {
		$default_template_types['author'] = array(
			'title'       => _x( 'Author', 'Template name', 'gutenberg' ),
			'description' => __(
				"Displays a single author's post archive. This template will serve as a fallback when a more a specific template (e.g., Author: Admin) cannot be found.",
				'gutenberg'
			),
		);
	}
	if ( isset( $default_template_types['category'] ) ) {
		$default_template_types['category'] = array(
			'title'       => _x( 'Category', 'Template name', 'gutenberg' ),
			'description' => __(
				'Displays a post category archive. This template will serve as a fallback when more specific template (e.g., Category: Recipes) cannot be found.',
				'gutenberg'
			),
		);
	}
	if ( isset( $default_template_types['taxonomy'] ) ) {
		$default_template_types['taxonomy'] = array(
			'title'       => _x( 'Taxonomy', 'Template name', 'gutenberg' ),
			'description' => __(
				'Displays a custom taxonomy archive. Like categories and tags, taxonomies have terms which you use to classify things. For example: a taxonomy named "Art" can have multiple terms, such as "Modern" and "18th Century." This template will serve as a fallback when a more specific template (e.g, Taxonomy: Art) cannot be found.',
				'gutenberg'
			),
		);
	}
	if ( isset( $default_template_types['date'] ) ) {
		$default_template_types['date'] = array(
			'title'       => _x( 'Date', 'Template name', 'gutenberg' ),
			'description' => __( 'Displays a post archive when a specific date is visited (e.g., example.com/2023/).', 'gutenberg' ),
		);
	}
	if ( isset( $default_template_types['tag'] ) ) {
		$default_template_types['tag'] = array(
			'title'       => _x( 'Tag', 'Template name', 'gutenberg' ),
			'description' => __(
				'Displays a post tag archive. This template will serve as a fallback when more specific template (e.g., Tag: Pizza) cannot be found.',
				'gutenberg'
			),
		);
	}
	if ( isset( $default_template_types['attachment'] ) ) {
		$default_template_types['attachment'] = array(
			'title'       => _x( 'Media', 'Template name', 'gutenberg' ),
			'description' => __( 'Displays when a visitor views the dedicated page that exists for any media attachment.', 'gutenberg' ),
		);
	}
	if ( isset( $default_template_types['search'] ) ) {
		$default_template_types['search'] = array(
			'title'       => _x( 'Search', 'Template name', 'gutenberg' ),
			'description' => __( 'Displays when a visitor performs a search on your website.', 'gutenberg' ),
		);
	}
	if ( isset( $default_template_types['privacy-policy'] ) ) {
		$default_template_types['privacy-policy'] = array(
			'title'       => _x( 'Privacy Policy', 'Template name', 'gutenberg' ),
			'description' => __(
				"Displays your site's Privacy Policy page.",
				'gutenberg'
			),
		);
	}
	if ( isset( $default_template_types['404'] ) ) {
		$default_template_types['404'] = array(
			'title'       => _x( '404', 'Template name', 'gutenberg' ),
			'description' => __( 'Displays when a visitor views a non-existent page, such as a dead link or a mistyped URL.', 'gutenberg' ),
		);
	}

	return $default_template_types;
}
add_filter( 'default_template_types', 'gutenberg_get_default_block_template_types', 10 );
