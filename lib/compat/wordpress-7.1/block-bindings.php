<?php
/**
 * Block bindings additions for WordPress 7.1.
 *
 * @since 7.1.0
 * @package gutenberg
 * @subpackage Block Bindings
 */

// The following filter can be removed once the minimum required WordPress version is 7.1 or newer.
add_filter(
	'block_bindings_supported_attributes',
	function ( $attributes, $block_type ) {
		if ( 'core/list-item' === $block_type && ! in_array( 'content', $attributes, true ) ) {
			$attributes[] = 'content';
		}
		return $attributes;
	},
	10,
	2
);

/*
 * On WordPress versions before 7.1, `WP_Block::replace_html()` lacks the
 * inner-blocks fix (wordpress-develop#12113), so binding a List Item's content
 * replaces the whole `<li>` and drops the nested List rendered inside it. Core
 * still has the inner blocks on the instance, so re-append them after the
 * binding has been applied.
 *
 * This can be removed once the minimum required WordPress version is 7.1.
 */

/**
 * Returns whether the list item metadata declares a content binding.
 *
 * @since 7.1.0
 *
 * @param mixed $metadata Block metadata attribute.
 * @return bool Whether a content binding (direct or via pattern overrides) is present.
 */
function gutenberg_list_item_metadata_has_content_binding( $metadata ) {
	if ( empty( $metadata['bindings'] ) || ! is_array( $metadata['bindings'] ) ) {
		return false;
	}

	$bindings = $metadata['bindings'];
	return isset( $bindings['content'] ) ||
		(
			isset( $bindings['__default']['source'] ) &&
			'core/pattern-overrides' === $bindings['__default']['source']
		);
}

/**
 * Restores the nested inner blocks dropped when binding a List Item's content.
 *
 * Core replaces the whole `<li>` when it applies the rich-text binding, removing
 * the nested List. The inner blocks are still available on the instance, so they
 * are rendered again and re-appended before the closing `</li>`.
 *
 * @since 7.1.0
 *
 * @param string   $block_content The rendered block content.
 * @param array    $parsed_block  The parsed block.
 * @param WP_Block $instance      The block instance.
 * @return string The block content with the nested inner blocks restored.
 */
function gutenberg_restore_list_item_inner_blocks_after_binding( $block_content, $parsed_block, $instance ) {
	if ( 'core/list-item' !== ( $parsed_block['blockName'] ?? null ) ) {
		return $block_content;
	}

	if ( ! $instance instanceof WP_Block || empty( $instance->inner_blocks ) ) {
		return $block_content;
	}

	if ( ! gutenberg_list_item_metadata_has_content_binding( $instance->parsed_block['attrs']['metadata'] ?? null ) ) {
		return $block_content;
	}

	$inner_blocks_html = '';
	foreach ( $instance->inner_blocks as $inner_block ) {
		$inner_blocks_html .= $inner_block->render();
	}

	/*
	 * Nothing to restore when the inner blocks did not render, or when they are
	 * still present because Core already preserves them (the fix is in place).
	 */
	if ( '' === $inner_blocks_html || str_contains( $block_content, $inner_blocks_html ) ) {
		return $block_content;
	}

	$closer_position = strripos( $block_content, '</li>' );
	if ( false === $closer_position ) {
		return $block_content;
	}

	return substr( $block_content, 0, $closer_position ) . $inner_blocks_html . substr( $block_content, $closer_position );
}
add_filter( 'render_block', 'gutenberg_restore_list_item_inner_blocks_after_binding', 10, 3 );

/**
 * Callback to retrieve the post edit URL for the block binding.
 *
 * @since 7.2.0
 *
 * @param array    $source_args    Array containing source arguments.
 * @param WP_Block $block_instance The block instance.
 * @return string|null The post edit URL, or null if the user cannot edit.
 */
function gutenberg_block_bindings_post_edit_url_callback( $source_args, $block_instance ) {
	$post_id = $block_instance->context['postId'] ?? get_the_ID();

	if ( ! $post_id || ! current_user_can( 'edit_post', $post_id ) ) {
		return null;
	}

	return get_edit_post_link( $post_id, 'raw' );
}

/**
 * Registers the post edit URL block binding source.
 *
 * @since 7.2.0
 */
function gutenberg_register_block_bindings_post_edit_url() {
	register_block_bindings_source(
		'core/post-edit-url',
		array(
			'label'              => _x( 'Post Edit URL', 'block bindings source', 'gutenberg' ),
			'uses_context'       => array( 'postId' ),
			'get_value_callback' => 'gutenberg_block_bindings_post_edit_url_callback',
		)
	);
}
add_action( 'init', 'gutenberg_register_block_bindings_post_edit_url' );

/**
 * Conditionally hides blocks bound to the post edit url if the user lacks capabilities.
 *
 * The Block Bindings API falls back to static markup if the binding callback returns null.
 * This filter is load bearing, it ensures unauthorized users don't see a dead link
 * or an empty button shell on the frontend.
 *
 * @since 7.2.0
 *
 * @param string   $block_content The block content.
 * @param array    $block         The parsed block.
 * @param WP_Block $instance      The block instance.
 * @return string The block content, or empty string if unauthorized.
 */
function gutenberg_hide_post_edit_url_bound_blocks( $block_content, $block, $instance ) {
	$post_id = $instance->context['postId'] ?? get_the_ID();

	$bindings = $block['attrs']['metadata']['bindings'] ?? array();
	if ( is_array( $bindings ) ) {
		foreach ( $bindings as $binding ) {
			if ( is_array( $binding ) && isset( $binding['source'] ) && 'core/post-edit-url' === $binding['source'] ) {
				if ( ! $post_id || ! current_user_can( 'edit_post', $post_id ) ) {
					return '';
				}
			}
		}
	}

	if ( 'core/buttons' === $block['blockName'] ) {
		$classes = $block['attrs']['className'] ?? '';
		if ( str_contains( $classes, 'wp-block-post-edit-link-wrapper' ) ) {
			if ( ! preg_match( '/\bwp-block-button\b/', $block_content ) ) {
				return '';
			}
		}
	}

	return $block_content;
}
add_filter( 'render_block', 'gutenberg_hide_post_edit_url_bound_blocks', 10, 3 );
