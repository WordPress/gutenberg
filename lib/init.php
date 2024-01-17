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

if ( ! function_exists( 'html_contains_block' ) ) {
	/**
	 * Returns whether the given HTML contains a block
	 * of the given type and, if provided,
	 * a given attribute and attribute value.
	 *
	 * @param  string  $html The html to search in.
	 * @param  string  $block_name      Find this block type,
	 *                                  with an optional "core/" namespace,
	 *                                  e.g. "paragraph", "core/paragraph",
	 *                                  "my_plugin/my_block".
	 * @param  string  $attribute_name  If provided, the block must also
	 *                                  contain this attribute.
	 * @param  string  $attribute_value If provided, the given attribute's
	 *                                  value must also match this.
	 *
	 * @return bool                     True if block is found, false otherwise
	 */
	function html_contains_block( $html, $block_name, $attribute_name = null, $attribute_value = null ) {
		$at = 0;

		/**
		 * This is the same regex as the one used in the block parser.
		 * It is better to use this solution to look for a block's existence
		 * in a document compared to having to parsing the blocks in the
		 * document, avoiding all the performance drawbacks of achieving
		 * a full representation of block content just to check if one block
		 * is there.
		 *
		 * @see WP_Block_Parser.
		 */
		$pattern = sprintf(
			'~<!--\s+?wp:%s\s+(?P<attrs>{(?:(?:[^}]+|}+(?=})|(?!}\s+/?-->).)*+)?}\s+)?/?-->~s',
			preg_quote( $block_name, '~' )
		);

		while ( 1 === preg_match( $pattern, $html, $matches, PREG_OFFSET_CAPTURE, $at ) ) {
			$at = $matches[0][1] + strlen( $matches[0][0] );

			if ( ! isset( $attribute_name ) ) {
				return true;
			}

			$attrs = json_decode( $matches['attrs'][0], /* as-associative */ true );
			if ( ! array_key_exists( $attribute_name, $attrs ) ) {
				continue;
			}

			if ( ! isset( $attribute_value ) ) {
				return true;
			}

			if ( $attribute_value === $attrs[ $attribute_name ] ) {
				return true;
			}
		}

		return false;
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
			$found_avigation = html_contains_block(
				$wp_template_part_post->post_content,
				'navigation',
				'ref',
				$wp_navigation_id
			);
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
