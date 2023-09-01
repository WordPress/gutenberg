<?php
/**
 * Temporary compatibility shims for features present in Gutenberg.
 * This file should be removed when WordPress 6.2.0 becomes the lowest
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
