<?php
/**
 * Templates and template parts utilities.
 *
 * @package gutenberg
 */

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
		$post_status = get_post_status( $post_id );
		$post_status_object = get_post_status_object( $post_status );
		echo esc_html( $post_status_object->label );
		return;
	}

	if ( 'theme' === $column_name ) {
		$terms = get_the_terms( $post_id, 'wp_theme' );
		if ( empty( $terms ) || is_wp_error( $terms ) ) {
			return;
		}
		$themes        = array();
		$is_file_based = false;
		foreach ( $terms as $term ) {
			if ( '_wp_file_based' === $term->slug ) {
				$is_file_based = true;
			} else {
				$themes[] = esc_html( wp_get_theme( $term->slug ) );
			}
		}
		echo implode( '<br />', $themes );
		if ( $is_file_based ) {
			echo '<br />' . __( '(Created from a template file)', 'gutenberg' );
		}
		return;
	}
}
