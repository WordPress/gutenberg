<?php
/**
 * Overrides all core blocks.
 *
 * @package gutenberg
 */

/**
 * Registers block type from metadata file.
 *
 * @param string $file   Path to the translation file to load.
 */
function gutenberg_register_block_type_from_metadata( $file ) {
	$metadata = json_decode( file_get_contents( $file ), true );
	if ( empty( $metadata['name'] ) || empty( $metadata['title'] ) || empty( $metadata['category'] ) ) {
		$message = __( 'Required block types must be provided.' );
		_doing_it_wrong( __FUNCTION__, $message, '5.2.0' );
		return;
	}
	$block_name = $metadata['name'];
	$settings = array(
		'title' => $metadata['title'],
		'category' => $metadata['category'],
	);
	foreach( array( 'description', 'keywords', 'attributes', 'supports' ) as $field_name ) {
		if ( ! empty( $metadata[ $field_name ] ) ) {
			$settings[ $field_name ] = $metadata[ $field_name ];
		}
	}
	if ( ! empty( $metadata['renderCallback'] ) ) {
		$render_callback_file = dirname( $file ) . '/' . $metadata['renderCallback'];
		if ( file_exists( $render_callback_file ) ) {
			require $render_callback_file;
			$settings['render_callback'] = 'gutenberg_render_block_' . str_replace( array( '/', '-' ), '_', $block_name );
		}
	}
	$registry = WP_Block_Type_Registry::get_instance();
	if ( $registry->is_registered( $block_name ) ) {
		$registry->unregister( $block_name );
	}
	register_block_type( $block_name, $settings );
}

function gutenberg_override_core_blocks() {
	$block_types = array(
		'archives',
		'block',
		'calendar',
		'categories',
		'latest-comments',
		'latest-posts',
		'rss',
		'search',
		'shortcode',
		'tag-cloud'
	);

	$file_format = dirname( dirname( __FILE__ ) ) . '/packages/block-library/src/%s/block.json';
	foreach ( $block_types as $name ) {
		gutenberg_register_block_type_from_metadata( sprintf( $file_format, $name ) );
	}
}

add_action( 'init', 'gutenberg_override_core_blocks' );
