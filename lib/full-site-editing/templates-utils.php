<?php
/**
 * Templates and template parts utilities.
 *
 * @package gutenberg
 */

/**
 * Parses the `wp_theme` terms of a template or template part into:
 * [
 *   'is_file_based', // Whether the template is based upon a theme-provided file.
 *   'is_original', // Whether the template is the original theme-provided file.
 *   'themes', // An array of themes that this template belongs to.
 * ]
 *
 * @param int $post_id The template or template part post ID.
 * @return array The parsed wp_theme terms.
 */
function gutenberg_parse_wp_theme_terms( $post_id ) {
	$parsed = array(
	'is_file_based' => false,
	'is_original'   => false,
	'themes'        => array(),
	);
	$terms  = get_the_terms( $post_id, 'wp_theme' );
	if ( empty( $terms ) || is_wp_error( $terms ) ) {
		return $parsed;
	}

	foreach ( $terms as $term ) {
		if ( '_wp_file_based' === $term->slug ) {
			$parsed['is_file_based'] = true;
		} else if ( '_wp_is_original' === $term->slug ) {
			$parsed['is_original'] = true;
		} else {
			$parsed['themes'][] = $term->slug;
		}
	}
	return $parsed;
}

/**
 * Filters the admin list columns to add those relevant to templates and template parts.
 *
 * @param array $columns Columns to display.
 * @return array Filtered $columns.
 */
function gutenberg_templates_lists_custom_columns( array $columns ) {
	$columns['slug']        = __( 'Slug', 'gutenberg' );
	$columns['description'] = __( 'Description', 'gutenberg' );
	$columns['status']      = __( 'Status', 'gutenberg' );
	$columns['theme']       = __( 'Theme', 'gutenberg' );
	if ( isset( $columns['date'] ) ) {
		unset( $columns['date'] );
	}
	return $columns;
}

/**
 * Renders content for the templates and template parts admin list custom columns.
 *
 * @param string $column_name Column name to render.
 * @param int    $post_id     Post ID.
 */
function gutenberg_render_templates_lists_custom_column( $column_name, $post_id ) {
	if ( 'slug' === $column_name ) {
		$post = get_post( $post_id );
		echo esc_html( $post->post_name );
		return;
	}

	if ( 'description' === $column_name && has_excerpt( $post_id ) ) {
		the_excerpt( $post_id );
		return;
	}

	if ( 'status' === $column_name ) {
		$post_status        = get_post_status( $post_id );
		$post_status_object = get_post_status_object( $post_status );
		echo esc_html( $post_status_object->label );
		return;
	}

	if ( 'theme' === $column_name ) {
		$terms  = gutenberg_parse_wp_theme_terms( $post_id );
		$themes = array();
		foreach( $terms['themes'] as $term_theme ) {
			$theme = wp_get_theme( $term_theme );
			if ( $theme->exists() ) {
				$themes[] = esc_html( $theme );
			}
		}
		echo implode( '<br />', $themes );
		if ( $terms['is_original'] ) {
			echo '<br />' . __( '(Template file — not customized)', 'gutenberg' );
		} else if ( $terms['is_file_based'] ) {
			echo '<br />' . __( '(Originated from a template file)', 'gutenberg' );
		}
		return;
	}
}
