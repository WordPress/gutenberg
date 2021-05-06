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
		// The auto-draft status doesn't have localized labels.
		if ( 'auto-draft' === $post_status ) {
			echo esc_html_x( 'Auto-Draft', 'Post status', 'gutenberg' );
			return;
		}
		$post_status_object = get_post_status_object( $post_status );
		echo esc_html( $post_status_object->label );
		return;
	}

	if ( 'theme' === $column_name ) {
		$terms = get_the_terms( $post_id, 'wp_theme' );
		if ( empty( $terms ) || is_wp_error( $terms ) ) {
			return;
		}
		$themes = array();
		foreach ( $terms as $term ) {
			$themes[] = esc_html( wp_get_theme( $term->slug ) );
		}
		echo implode( '<br />', $themes );
		return;
	}
}

/**
 * Adds the auto-draft view to the templates and template parts admin lists.
 *
 * @param array $views The edit views to filter.
 */
function gutenberg_filter_templates_edit_views( $views ) {
	$post_type          = get_current_screen()->post_type;
	$url                = add_query_arg(
		array(
			'post_type'   => $post_type,
			'post_status' => 'auto-draft',
		),
		'edit.php'
	);
	$is_auto_draft_view = isset( $_REQUEST['post_status'] ) && 'auto-draft' === $_REQUEST['post_status'];
	$class_html         = $is_auto_draft_view ? ' class="current"' : '';
	$aria_current       = $is_auto_draft_view ? ' aria-current="page"' : '';
	$post_count         = wp_count_posts( $post_type, 'readable' );
	$label              = sprintf(
		// The auto-draft status doesn't have localized labels.
		translate_nooped_plural(
			/* translators: %s: Number of auto-draft posts. */
			_nx_noop(
				'Auto-Draft <span class="count">(%s)</span>',
				'Auto-Drafts <span class="count">(%s)</span>',
				'Post status',
				'gutenberg'
			),
			$post_count->{'auto-draft'}
		),
		number_format_i18n( $post_count->{'auto-draft'} )
	);

	$auto_draft_view = sprintf(
		'<a href="%s"%s%s>%s</a>',
		esc_url( $url ),
		$class_html,
		$aria_current,
		$label
	);

	array_splice( $views, 1, 0, array( 'auto-draft' => $auto_draft_view ) );

	return $views;
}
