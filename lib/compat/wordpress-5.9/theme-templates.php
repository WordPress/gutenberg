<?php
/**
 * Utilities used to fetch and create templates and template parts.
 *
 * @package    Gutenberg
 * @subpackage REST_API
 */

/**
 * Generates a unique slug for templates or template parts.
 *
 * @param string $override_slug The filtered value of the slug (starts as `null` from apply_filter).
 * @param string $slug          The original/un-filtered slug (post_name).
 * @param int    $post_ID       Post ID.
 * @param string $post_status   No uniqueness checks are made if the post is still draft or pending.
 * @param string $post_type     Post type.
 * @return string The original, desired slug.
 */
function gutenberg_filter_wp_template_unique_post_slug( $override_slug, $slug, $post_ID, $post_status, $post_type ) {
	if ( 'wp_template' !== $post_type && 'wp_template_part' !== $post_type ) {
		return $override_slug;
	}

	if ( ! $override_slug ) {
		$override_slug = $slug;
	}

	// Template slugs must be unique within the same theme.
	// TODO - Figure out how to update this to work for a multi-theme
	// environment.  Unfortunately using `get_the_terms` for the 'wp-theme'
	// term does not work in the case of new entities since is too early in
	// the process to have been saved to the entity.  So for now we use the
	// currently activated theme for creation.
	$theme = wp_get_theme()->get_stylesheet();
	$terms = get_the_terms( $post_ID, 'wp_theme' );
	if ( $terms && ! is_wp_error( $terms ) ) {
		$theme = $terms[0]->name;
	}

	$check_query_args = array(
		'post_name__in'  => array( $override_slug ),
		'post_type'      => $post_type,
		'posts_per_page' => 1,
		'no_found_rows'  => true,
		'post__not_in'   => array( $post_ID ),
		'tax_query'      => array(
			array(
				'taxonomy' => 'wp_theme',
				'field'    => 'name',
				'terms'    => $theme,
			),
		),
	);
	$check_query      = new WP_Query( $check_query_args );
	$posts            = $check_query->posts;

	if ( count( $posts ) > 0 ) {
		$suffix = 2;
		do {
			$query_args                  = $check_query_args;
			$alt_post_name               = _truncate_post_slug( $override_slug, 200 - ( strlen( $suffix ) + 1 ) ) . "-$suffix";
			$query_args['post_name__in'] = array( $alt_post_name );
			$query                       = new WP_Query( $query_args );
			$suffix++;
		} while ( count( $query->posts ) > 0 );
		$override_slug = $alt_post_name;
	}

	return $override_slug;
}

// Remove 5.8 filter if it exists.
remove_filter( 'pre_wp_unique_post_slug', 'wp_filter_wp_template_unique_post_slug' );
add_filter( 'pre_wp_unique_post_slug', 'gutenberg_filter_wp_template_unique_post_slug', 10, 5 );

/**
 * Enable block templates (editor mode) for themes with theme.json.
 */
function gutenberg_enable_block_templates() {
	if ( wp_is_block_theme() || WP_Theme_JSON_Resolver_Gutenberg::theme_has_support() ) {
		add_theme_support( 'block-templates' );
	}
}

// Remove 5.8 filter if it exists.
remove_action( 'setup_theme', 'wp_enable_block_templates' );
add_action( 'setup_theme', 'gutenberg_enable_block_templates' );
