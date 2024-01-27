<?php
/**
 * Server-side rendering of the `core/footnotes` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/footnotes` block on the server.
 *
 * @since 6.3.0
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

	if ( ! is_array( $footnotes ) || count( $footnotes ) === 0 ) {
		return '';
	}

	$wrapper_attributes = get_block_wrapper_attributes();
	$footnote_index     = 1;

	$block_content = '';

	foreach ( $footnotes as $footnote ) {
		// Translators: %d: Integer representing the number of return links on the page.
		$aria_label     = sprintf( __( 'Jump to footnote reference %1$d' ), $footnote_index );
		$block_content .= sprintf(
			'<li id="%1$s">%2$s <a href="#%1$s-link" aria-label="%3$s">↩︎</a></li>',
			$footnote['id'],
			$footnote['content'],
			$aria_label
		);
		++$footnote_index;
	}

	return sprintf(
		'<ol %1$s>%2$s</ol>',
		$wrapper_attributes,
		$block_content
	);
}

/**
 * Registers the `core/footnotes` block on the server.
 *
 * @since 6.3.0
 * @since 6.5.0 Added support for custom post types.
 */
function register_block_core_footnotes() {
	/*
	 * Backward compatibility support.
	 *
	 * This code was initially registered to run on the `init` hook at the default
	 * priority of 10. In WordPress 6.5 the code was modified to support custom
	 * post types and needs to run after the registration of custom post types
	 * by plugins and themes.
	 *
	 * Due to an order of operations issue this function was running before themes
	 * or plugins could register to CTPs to run on the default `init` hook. This
	 * shuffles the priority while allowing for extenders to deregister the block.
	 *
	 * As the REST API cancels operations prior to `init, 100` running, this now
	 * runs on `rest_api_init` too.
	 */
	if ( doing_action( 'init' ) && has_action( 'init', 'register_block_core_footnotes', 10 ) ) {
		remove_action( 'init', 'register_block_core_footnotes' );
		add_action( 'init', 'register_block_core_footnotes', 100 );
		add_action( 'rest_api_init', 'register_block_core_footnotes', 100 );
		return;
	}

	$post_types = get_post_types(
		array(
			'show_in_rest' => true,
			'public'       => true,
		)
	);
	foreach ( $post_types as $post_type ) {
		// Only register the meta field if the post type supports the editor, custom fields, and revisions.
		if ( post_type_supports( $post_type, 'editor' ) && post_type_supports( $post_type, 'custom-fields' ) && post_type_supports( $post_type, 'revisions' ) ) {
			register_post_meta(
				$post_type,
				'footnotes',
				array(
					'show_in_rest'      => true,
					'single'            => true,
					'type'              => 'string',
					'revisions_enabled' => true,
				)
			);
		}
	}
	register_block_type_from_metadata(
		__DIR__ . '/footnotes',
		array(
			'render_callback' => 'render_block_core_footnotes',
		)
	);
}
add_action( 'init', 'register_block_core_footnotes' );

/**
 * Adds the footnotes field to the revisions display.
 *
 * @since 6.3.0
 *
 * @param array $fields The revision fields.
 * @return array The revision fields.
 */
function wp_add_footnotes_to_revision( $fields ) {
	$fields['footnotes'] = __( 'Footnotes' );
	return $fields;
}
add_filter( '_wp_post_revision_fields', 'wp_add_footnotes_to_revision' );

/**
 * Gets the footnotes field from the revision for the revisions screen.
 *
 * @since 6.3.0
 *
 * @param string $revision_field The field value, but $revision->$field
 *                               (footnotes) does not exist.
 * @param string $field          The field name, in this case "footnotes".
 * @param object $revision       The revision object to compare against.
 * @return string The field value.
 */
function wp_get_footnotes_from_revision( $revision_field, $field, $revision ) {
	return get_metadata( 'post', $revision->ID, $field, true );
}
add_filter( '_wp_post_revision_field_footnotes', 'wp_get_footnotes_from_revision', 10, 3 );
