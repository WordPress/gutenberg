<?php
/**
 * Init hooks.
 *
 * @package gutenberg
 */

/**
 * Gutenberg's Menu.
 *
 * Adds a new wp-admin menu page for the Gutenberg editor.
 *
 * @since 0.1.0
 */
function gutenberg_menu() {
	add_menu_page(
		__( 'Gutenberg', 'gutenberg' ),
		__( 'Gutenberg', 'gutenberg' ),
		'edit_posts',
		'gutenberg',
		'',
		'dashicons-edit'
	);

	add_submenu_page(
		'gutenberg',
		__( 'Demo', 'gutenberg' ),
		__( 'Demo', 'gutenberg' ),
		'edit_posts',
		'gutenberg'
	);

	if ( current_user_can( 'edit_posts' ) ) {
		add_submenu_page(
			'gutenberg',
			__( 'Support', 'gutenberg' ),
			__( 'Support', 'gutenberg' ),
			'edit_posts',
			__( 'https://wordpress.org/support/plugin/gutenberg/', 'gutenberg' )
		);
		add_submenu_page(
			'gutenberg',
			__( 'Documentation', 'gutenberg' ),
			__( 'Documentation', 'gutenberg' ),
			'edit_posts',
			'https://developer.wordpress.org/block-editor/'
		);
	}

	add_submenu_page(
		'gutenberg',
		__( 'Experiments Settings', 'gutenberg' ),
		__( 'Experiments', 'gutenberg' ),
		'edit_posts',
		'gutenberg-experiments',
		'the_gutenberg_experiments'
	);
}
add_action( 'admin_menu', 'gutenberg_menu', 9 );

if ( ! function_exists( 'recursively_find_block_by_attribute' ) ) {
	/**
	 * Recursively find a block by attribute.
	 *
	 * @param array  $blocks The blocks to search in.
	 * @param string $block_name The block type to search for.
	 * @param mixed  $attribute_name The attribute name to search for.
	 * @param mixed  $attribute_value The attribute value to search for.
	 * @param array  $found_blocks The found blocks.
	 *
	 * @return array Found blocks
	 */
	function recursively_find_block_by_attribute( $blocks, $block_name, $attribute_name, $attribute_value, $found_blocks = array() ) {
		foreach ( $blocks as $block ) {
			if (
				$block['blockName'] === $block_name &&
				isset( $block['attrs'][ $attribute_name ] ) &&
				$attribute_value === $block['attrs'][ $attribute_name ]
			) {
				$found_blocks[] = $block;
			}
			if ( $block['innerBlocks'] ) {
				$found_blocks = array_merge(
					$found_blocks,
					recursively_find_block_by_attribute(
						$block['innerBlocks'],
						$block_name,
						$attribute_name,
						$attribute_value,
						$found_blocks
					)
				);
			}
		}
		return $found_blocks;
	}
}

if ( ! function_exists( 'get_template_parts_that_use_menu' ) ) {
	/**
	 * Get all template parts that use a menu.
	 *
	 * @param int $wp_navigation_id The menu id.
	 *
	 * @return array template parts that use the menu
	 */
	function get_template_parts_that_use_menu( $wp_navigation_id ) {
		// get all wp_template_part posts.
		$wp_template_part_posts = get_posts(
			array(
				'post_type'      => 'wp_template_part',
				'posts_per_page' => -1,
			)
		);
		// loop through them and find the ones that have a navigation block,
		// with the ref attribute set to $wp_navigation_id.
		$wp_template_part_posts_with_navigation = array();
		foreach ( $wp_template_part_posts as $wp_template_part_post ) {
			$wp_template_part_blocks = parse_blocks( $wp_template_part_post->post_content );
			$found_avigation = count(
				recursively_find_block_by_attribute(
					$wp_template_part_blocks,
					'core/navigation',
					'ref',
					$wp_navigation_id
				)
			) > 0;
			if ( $found_avigation ) {
				$wp_template_part_posts_with_navigation[] = $wp_template_part_post->ID;
			}
		}
		return $wp_template_part_posts_with_navigation;
	}
}

if ( ! function_exists( 'register_template_parts_that_use_menu_field' ) ) {
	/**
	 * Register a rest field for posts that returns the template parts that use the menu.
	 */
	function register_template_parts_that_use_menu_field() {
		register_rest_field(
			'wp_navigation',
			'template_parts_that_use_menu',
			array(
				'get_callback' => function ( $post ) {
					return get_template_parts_that_use_menu( $post['id'] );
				},
				'schema'       => array(
					'type'    => 'array',
					'context' => array( 'edit' ),
				),
			)
		);
	}
}
add_action( 'rest_api_init', 'register_template_parts_that_use_menu_field' );
