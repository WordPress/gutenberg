<?php
/**
 * Block registration functions.
 *
 * @package gutenberg
 */

/**
 * Substitutes the implementation of a core-registered block type, if exists,
 * with the built result from the plugin.
 */
function gutenberg_reregister_core_block_types() {
	// Blocks directory may not exist if working from a fresh clone.
	$blocks_dir = dirname( __FILE__ ) . '/../build/block-library/blocks/';
	if ( ! file_exists( $blocks_dir ) ) {
		return;
	}

	$block_names = array(
		'archives.php'        => 'core/archives',
		'block.php'           => 'core/block',
		'calendar.php'        => 'core/calendar',
		'categories.php'      => 'core/categories',
		'latest-comments.php' => 'core/latest-comments',
		'latest-posts.php'    => 'core/latest-posts',
		'legacy-widget.php'   => 'core/legacy-widget',
		'rss.php'             => 'core/rss',
		'shortcode.php'       => 'core/shortcode',
		'search.php'          => 'core/search',
		'tag-cloud.php'       => 'core/tag-cloud',
	);

	$registry = WP_Block_Type_Registry::get_instance();

	foreach ( $block_names as $file => $block_name ) {
		if ( ! file_exists( $blocks_dir . $file ) ) {
			return;
		}

		if ( $registry->is_registered( $block_name ) ) {
			$registry->unregister( $block_name );
		}

		require $blocks_dir . $file;
	}
}
add_action( 'init', 'gutenberg_reregister_core_block_types' );

function serialize_blocks( $blocks ) {
	return implode( array_map( 'serialize_block', $blocks ) );
}

function serialize_block( $block ) {
	$name = $block['blockName'];
	if ( 0 === strpos( $name, 'core/' ) ) {
		$name = substr( $name, strlen( 'core/' ) );
	}

	if ( empty( $block['attrs'] ) ) {
		$opening_tag_suffix = '';
	} else {
		$opening_tag_suffix = ' ' . json_encode( $block['attrs'] );
	}

	if ( empty( $block['innerHTML'] ) ) {
		return sprintf(
			'<!-- wp:%s%s /-->',
			$name,
			$opening_tag_suffix
		);
	} else {
		return sprintf(
			'<!-- wp:%1$s%2$s -->%3$s<!-- /wp:%1$s -->',
			$name,
			$opening_tag_suffix,
			$block['innerHTML']
		);
	}
}
