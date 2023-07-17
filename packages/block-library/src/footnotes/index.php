<?php
/**
 * Server-side rendering of the `core/footnotes` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/footnotes` block on the server.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 *
 * @return string Returns the HTML representing the footnotes.
 */
function render_block_core_footnotes( $attributes, $content, $block ) {
	// Bail out early if the post ID is not set for some reason.
	if ( empty( $block->context['postId'] ) ) {
		return '';
	}

	if ( post_password_required( $block->context['postId'] ) ) {
		return;
	}

	$footnotes = get_post_meta( $block->context['postId'], 'footnotes', true );

	if ( ! $footnotes ) {
		return;
	}

	$footnotes = json_decode( $footnotes, true );

	if ( count( $footnotes ) === 0 ) {
		return '';
	}

	$wrapper_attributes = get_block_wrapper_attributes();

	$block_content = '';

	foreach ( $footnotes as $footnote ) {
		$block_content .= sprintf(
			'<li id="%1$s">%2$s <a href="#%1$s-link">↩︎</a></li>',
			$footnote['id'],
			$footnote['content']
		);
	}

	return sprintf(
		'<ol %1$s>%2$s</ol>',
		$wrapper_attributes,
		$block_content
	);
}

/**
 * Registers the `core/footnotes` block on the server.
 */
function register_block_core_footnotes() {
	foreach ( array( 'post', 'page', 'revision' ) as $post_type ) {
		register_post_meta(
			$post_type,
			'footnotes',
			array(
				'show_in_rest' => true,
				'single'       => true,
				'type'         => 'string',
			)
		);
	}
	register_block_type_from_metadata(
		__DIR__ . '/footnotes',
		array(
			'render_callback' => 'render_block_core_footnotes',
		)
	);
}
add_action( 'init', 'register_block_core_footnotes' );

// Revisions must be created after post meta is updated, otherwise we don't have
// access to the meta.
remove_action( 'post_updated', 'wp_save_post_revision', 10, 1 );
add_action( 'wp_after_insert_post', 'wp_save_post_revision', 10, 1 );

function gutenberg_save_footnotes_meta( $revision_id ) {
    $post_id = wp_is_post_revision( $revision_id );

    if ( $post_id ) {
        $footnotes = get_post_meta( $post_id, 'footnotes', true );

        if ( $footnotes ) {
			// Can't use update_post_meta() because it doesn't allow revisions.
            update_metadata( 'post', $revision_id, 'footnotes', $footnotes );
        }
    }
}
add_action( 'wp_after_insert_post', 'gutenberg_save_footnotes_meta' );

function gutenberg_restore_footnotes_meta( $post_id, $revision_id ) {
    $footnotes = get_post_meta( $revision_id, 'footnotes', true );

    if ( $footnotes ) {
        update_post_meta( $post_id, 'footnotes', $footnotes );
    } else {
        delete_post_meta( $post_id, 'footnotes' );
    }
}
add_action( 'wp_restore_post_revision', 'gutenberg_restore_footnotes_meta', 10, 2 );

function gutenberg_revision_fields( $fields ) {
    $fields['footnotes'] = __( 'Footnotes' );
    return $fields;
}
add_filter( '_wp_post_revision_fields', 'gutenberg_revision_fields' );

function gutenberg_revision_field_footnotes( $value, $field ) {
    global $revision;
    return get_metadata( 'post', $revision->ID, $field, true );
}
add_filter( 'wp_post_revision_field_footnotes', 'gutenberg_revision_field_footnotes', 10, 2 );
