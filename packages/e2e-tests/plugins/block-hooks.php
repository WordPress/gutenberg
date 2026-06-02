<?php
/**
 * Plugin Name: Gutenberg Test Block Hooks
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-block-hooks
 */

defined( 'ABSPATH' ) || exit;

function gutenberg_test_insert_hooked_blocks( $hooked_blocks, $position, $anchor_block, $context ) {
	if ( ! $context instanceof WP_Post ) {
		return $hooked_blocks;
	}

	if (
		( 'core/heading' === $anchor_block && 'after' === $position ) ||
		( 'core/post-content' === $anchor_block && 'last_child' === $position ) ||
		( 'core/block' === $anchor_block && 'last_child' === $position )
	) {
		$hooked_blocks[] = 'core/paragraph';
	}

	if ( 'core/navigation' === $anchor_block && 'first_child' === $position ) {
		$hooked_blocks[] = 'core/home-link';
	}

	if ( 'core/navigation-link' === $anchor_block && 'after' === $position ) {
		$hooked_blocks[] = 'core/page-list';
	}

	return $hooked_blocks;
}
add_filter( 'hooked_block_types', 'gutenberg_test_insert_hooked_blocks', 10, 4 );

function gutenberg_test_set_hooked_block_inner_html( $hooked_block, $hooked_block_type, $relative_position, $anchor_block ) {
	if (
		( 'core/heading' === $anchor_block['blockName'] && 'after' === $relative_position ) ||
		( 'core/post-content' === $anchor_block['blockName'] && 'last_child' === $relative_position ) ||
		( 'core/block' === $anchor_block['blockName'] && 'last_child' === $relative_position )
	) {
		$hooked_block['attrs']        = array(
			'className' => "hooked-block-{$relative_position}-" . str_replace( 'core/', '', $anchor_block['blockName'] ),
		);
		$hooked_block['innerContent'] = array(
			sprintf(
				'<p class="%1$s">This block was inserted by the Block Hooks API in the <code>%2$s</code> position next to the <code>%3$s</code> anchor block.</p>',
				$hooked_block['attrs']['className'],
				$relative_position,
				$anchor_block['blockName']
			),
		);
	}

	return $hooked_block;
}
add_filter( 'hooked_block_core/paragraph', 'gutenberg_test_set_hooked_block_inner_html', 10, 4 );

function gutenberg_register_wp_ignored_hooked_blocks_meta() {
	register_post_meta(
		'post',
		'_wp_ignored_hooked_blocks',
		array(
			'show_in_rest'  => true,
			'single'        => true,
			'type'          => 'string',
			'auth_callback' => function () {
				return current_user_can( 'edit_posts' );
			},
		)
	);
}
add_action( 'rest_api_init', 'gutenberg_register_wp_ignored_hooked_blocks_meta' );
