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

register_meta(
	'post',
	'isbn',
	array(
		'object_subtype' => 'post',
		'show_in_rest' => true,
		'single'       => true,
		'type'         => 'string',
		'revisions_enabled' => true
	)
);

add_filter(
	'the_content',
	function ( $content ) {
		$sources = get_all_registered_block_bindings_sources();
		// To do: use HTML API.
		return preg_replace_callback(
			'/<\/\/([^>]*)>/',
			function ( $matches ) use ( $sources ) {
				$attributes = explode(' ', $matches[1]);
				$key = array_shift($attributes);
				if ( ! isset( $sources["core/$key"] ) ) {
					return '';
				}
				$attributes = array_reduce(
					$attributes,
					function ( $carry, $item ) {
						$parts = explode('=', $item);
						$carry[ $parts[0] ] = $parts[1];
						return $carry;
					},
					array()
				);
				// We need to change this function so it doesn't rely on a block
				// instance.
				return $sources["core/$key"]->get_value(
					$attributes,
					new WP_Block(
						array(
							'blockName' => 'core/paragraph',
						),
						array(
							'postId' => get_the_ID(),
							'postType' => get_post_type(),
						)
					),
					''
				);
			},
			$content
		);
	},
);
