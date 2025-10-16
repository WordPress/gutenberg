<?php
/**
 * Server-side rendering of the `core/revision` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/revision` block on the server.
 *
 * @since 6.8.0
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 *
 * @return string The rendered block content.
 */
function render_block_core_revision( $attributes, $content, $block ) {
	if ( ! post_type_supports( $block->context['postType'], 'revisions' ) ) {
		return '';
	}
	if ( ! is_single() ) {
		return '';
	}

	$wrapper_attributes = get_block_wrapper_attributes();
	$post_id            = get_the_ID();
	$revisions          = array_slice( wp_get_post_revisions( $post_id ), 0, $attributes['revisionLimit'] );

	if ( empty( $revisions ) ) {
		return '<p>' . esc_html__( 'No revisions yet.' ) . '</p>';
	}

	$output = '';

	if ( ! empty( $attributes['showTotalCount'] ) ) {
		$revision_count = count( $revisions );
		$output        .= '<p>' . sprintf(
			// translators: %s: total number of revisions.
			esc_html__( 'Total Revisions: %d' ),
			$revision_count
		) . '</p>';
	}

	if ( ! empty( $attributes['showRevisionHistory'] ) ) {
		$output .= '<p>' . esc_html__( 'Revision logs:' ) . '</p>';
		$output .= '<ul class="wp-block-revisions-list">';
		foreach ( $revisions as $revision ) {
			$author = get_the_author_meta( 'display_name', $revision->post_author );
			$date   = date_i18n( get_option( 'date_format' ) . ' ' . get_option( 'time_format' ), strtotime( $revision->post_date ) );

			$output .= '<li><strong>' . esc_html( $author ) . '</strong> - ' . esc_html( $date ) . '</li>';
		}
		$output .= '</ul>';
	}

	return sprintf(
		'<div %1$s>%2$s</div>',
		$wrapper_attributes,
		$output
	);
}

/**
 * Registers the `core/revision` block.
 *
 * @since 6.8.0
 */
function register_block_core_revision() {
	register_block_type_from_metadata(
		__DIR__ . '/revision',
		array(
			'render_callback' => 'render_block_core_revision',
		)
	);
}
add_action( 'init', 'register_block_core_revision' );
