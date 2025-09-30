<?php
/**
 * Server-side rendering of the `core/bookmark` block.
 *
 * @package WordPress
 */

/**
 * Renders the `bookmark` block on the server.
 *
 * @since 6.8.0
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 *
 * @return string The rendered block content.
 */
function render_block_core_bookmark( $attributes ) {
	$post               = get_post();
	$wrapper_attributes = get_block_wrapper_attributes();
	$context            = array( 'post' => array( 'id' => $post->ID ) );
	$icon_type          = $attributes['iconType'];
	$bookmark_icon      = 'M6 2H18C18.5523 2 19 2.44772 19 3V21C19 21.5523 18.5523 22 18 22C17.7348 22 17.4804 21.8946 17.2929 21.7071L12 16.4142L6.70711 21.7071C6.51957 21.8946 6.26522 22 6 22C5.44772 22 5 21.5523 5 21V3C5 2.44772 5.44772 2 6 2Z';
	$heart_icon         = 'M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.08C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z';
	$star_icon          = 'M12 3L14.4721 8.52786L21 9.23607L16 14.4721L17.4721 21L12 17.5279L6.52786 21L8 14.4721L3 9.23607L9.52786 8.52786L12 3Z';
	switch ( $icon_type ) {
		case 'bookmark':
			$icon = $bookmark_icon;
			break;
		case 'heart':
			$icon = $heart_icon;
			break;
		case 'star':
			$icon = $star_icon;
			break;
		default:
			$icon = $bookmark_icon;
			break;
	}

	wp_interactivity_state(
		'core/bookmark',
		array(
			'isBookmarked' => false,

		)
	);

	$context_data = wp_interactivity_data_wp_context( $context );
	wp_register_script_module( 'core-bookmark-view', '/wp-content/plugins/gutenberg/packages/block-library/src/bookmark/view.js' );
	wp_enqueue_script_module( 'core-bookmark-view' );

	if ( is_user_logged_in() ) {
		$current_user_id = get_current_user_id();
		$raw_liked_posts = get_user_meta( $current_user_id, 'liked_posts', true );
		$liked_posts     = ( ! is_array( $raw_liked_posts ) )
			? array()
			: array_map( 'intval', $raw_liked_posts );
		// Register a separate script to store user data.
		wp_register_script(
			'core-bookmark-user-data',
			'/wp-content/plugins/gutenberg/packages/block-library/src/bookmark/bookmark-user-data.js',
			array( 'wp-data', 'wp-core-data' ),
			filemtime( '/wp-content/plugins/gutenberg/packages/block-library/src/bookmark/bookmark-user-data.js' ),
			true
		);

		// Localize data to be available in `bookmark-user-data.js`
		wp_localize_script(
			'core-bookmark-user-data',
			'bookmarkUserData',
			array(
				'userId'         => $current_user_id,
				'userLikedPosts' => $liked_posts,
			)
		);

		wp_enqueue_script( 'core-bookmark-user-data' );
	}
	return sprintf(
		"<div
		data-wp-interactive='core/bookmark'
		%s
		%s
	>
		<div
			data-wp-on--click='actions.toggleBookmark'
			data-wp-class--bookmark-active='state.isBookmarked'
		>
		<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' aria-hidden='true' focusable='false' fill='none' stroke='currentColor' stroke-width='2'><path d='%s'></path></svg>
		</div>
	</div>
	",
		$wrapper_attributes,
		$context_data,
		$icon
	);
}

/**
 * Registers the `bookmark` block & new user meta.
 *
 * @since 6.8.0
 */
function register_block_core_bookmark() {
	register_meta(
		'user',
		'liked_posts',
		array(
			'type'              => 'array',
			'single'            => true,
			'show_in_rest'      => array(
				'schema' => array(
					'type'  => 'array',
					'items' => array( 'type' => 'integer' ),
				),
			),
			'sanitize_callback' => function ( $value ) {
				return is_array( $value ) ? array_map( 'sanitize_text_field', $value ) : array();
			},
			'auth_callback'     => function ( $allowed, $meta_key, $user_id ) {
				return get_current_user_id() === (int) $user_id;
			},
		)
	);

	register_block_type_from_metadata(
		__DIR__ . '/bookmark',
		array(
			'render_callback' => 'render_block_core_bookmark',
		)
	);
}

add_action( 'init', 'register_block_core_bookmark' );
