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
	$columns['description'] = __( 'Description', 'gutenberg' );
	$columns['status']      = __( 'Status', 'gutenberg' );
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
	if ( 'description' === $column_name && has_excerpt( $post_id ) ) {
		the_excerpt( $post_id );
		return;
	}

	if ( 'status' === $column_name ) {
		echo in_array(
			$post_id,
			array_values(
				get_theme_mod(
					get_post_type( $post_id ),
					array()
				)
			),
			true
		) ? 'Active' : '';
		return;
	}
}
