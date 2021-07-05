<?php

$i18n_strings_file = get_stylesheet_directory() . '/i18n.php';
if ( file_exists ( $i18n_strings_file ) ) {
	require_once $i18n_strings_file;
}

/**
 * Registers the block using the metadata loaded from the `block.json` file.
 *
 * @see https://developer.wordpress.org/block-editor/tutorials/block-tutorial/writing-your-first-block-type/
 */
function register_block_core_i18n() {
	register_block_type_from_metadata(
		__DIR__ . '/i18n',
		array(
			'render_callback' => 'render_block_i18n',
		)
	);
}

function render_block_i18n( $attributes ) {
	if ( defined( 'i18n' ) && ! empty ( i18n[ $attributes['text'] ] ) ) {
		return i18n[ $attributes['text'] ];
	};

	return $attributes['text'];
}

add_action( 'init', 'register_block_core_i18n' );
