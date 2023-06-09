<?php
/**
 * Plugin Name: Gutenberg
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Description: Printing since 1440. This is the development plugin for the block editor, site editor, and other future WordPress core functionality.
 * Requires at least: 6.1
 * Requires PHP: 5.6
 * Version: 16.0.0-rc.1
 * Author: Gutenberg Team
 * Text Domain: gutenberg
 *
 * @package gutenberg
 */

### BEGIN AUTO-GENERATED DEFINES
defined( 'GUTENBERG_DEVELOPMENT_MODE' ) or define( 'GUTENBERG_DEVELOPMENT_MODE', true );
### END AUTO-GENERATED DEFINES

gutenberg_pre_init();

/**
 * Display a version notice and deactivate the Gutenberg plugin.
 *
 * @since 0.1.0
 */
function gutenberg_wordpress_version_notice() {
	echo '<div class="error"><p>';
	/* translators: %s: Minimum required version */
	printf( __( 'Gutenberg requires WordPress %s or later to function properly. Please upgrade WordPress before activating Gutenberg.', 'gutenberg' ), '5.9' );
	echo '</p></div>';

	deactivate_plugins( array( 'gutenberg/gutenberg.php' ) );
}

/**
 * Display a build notice.
 *
 * @since 0.1.0
 */
function gutenberg_build_files_notice() {
	echo '<div class="error"><p>';
	_e( 'Gutenberg development mode requires files to be built. Run <code>npm install</code> to install dependencies, <code>npm run build</code> to build the files or <code>npm run dev</code> to build the files and watch for changes. Read the <a href="https://github.com/WordPress/gutenberg/blob/HEAD/docs/contributors/code/getting-started-with-code-contribution.md">contributing</a> file for more information.', 'gutenberg' );
	echo '</p></div>';
}

/**
 * Verify that we can initialize the Gutenberg editor , then load it.
 *
 * @since 1.5.0
 */
function gutenberg_pre_init() {
	global $wp_version;
	if ( defined( 'GUTENBERG_DEVELOPMENT_MODE' ) && GUTENBERG_DEVELOPMENT_MODE && ! file_exists( __DIR__ . '/build/blocks' ) ) {
		add_action( 'admin_notices', 'gutenberg_build_files_notice' );
		return;
	}

	// Get unmodified $wp_version.
	include ABSPATH . WPINC . '/version.php';

	// Strip '-src' from the version string. Messes up version_compare().
	$version = str_replace( '-src', '', $wp_version );

	// Compare against major release versions (X.Y) rather than minor (X.Y.Z)
	// unless a minor release is the actual minimum requirement. WordPress reports
	// X.Y for its major releases.
	if ( version_compare( $version, '5.9', '<' ) ) {
		add_action( 'admin_notices', 'gutenberg_wordpress_version_notice' );
		return;
	}

	require_once __DIR__ . '/lib/load.php';
}

/**
 * Renders the block meta attributes.
 *
 * @param string $block_content Block Content.
 * @param array  $block Block attributes.
 * @param string $block_instance The block instance.
 */
function render_custom_sources( $block_content, $block, $block_instance ) {
	$block_type = WP_Block_Type_Registry::get_instance()->get_registered( $block['blockName'] );
	if ( null === $block_type ) {
		return $block_content;
	}


	$custom_sources = _wp_array_get( $block_type->supports, 'customSources', false );
	if ( ! $custom_sources ) {
		// TODO: for some reason the "customSources" support is not being registered as it should.
		//	return $block_content;
	}

	$attribute_sources = _wp_array_get( $block['attrs'], array( 'source' ), array() );
	foreach ( $attribute_sources as $attribute_name => $attribute_source ) {
		$attribute_config = _wp_array_get( $block_type->attributes, array( $attribute_name ), false );
		if ( ! $attribute_config || ! $attribute_source || 'meta' !== $attribute_source['type'] ) {
			continue;
		}
		$meta_field = $attribute_source['name'];
		$meta_value = get_post_meta( $block_instance->context['postId'], $meta_field, true );
		$p          = new WP_HTML_Tag_Processor( $block_content );
		$found      = $p->next_tag(
			array(
				// TODO: build the query from CSS selector.
				'tag_name' => $attribute_config['selector'],
			)
		);
		if ( ! $found ) {
			continue;
		}
		$tag_name = $p->get_tag();
		$markup   = "<$tag_name>$meta_value</$tag_name>";
		$p2       = new WP_HTML_Tag_Processor( $markup );
		$p2->next_tag();
		$names = $p->get_attribute_names_with_prefix( '' );
		foreach ( $names as $name ) {
			$p2->set_attribute( $name, $p->get_attribute( $name ) );
		}

		$block_content = $p2 . '';
	}

	return $block_content;
}

add_filter( 'render_block', 'render_custom_sources', 10, 3 );

// ----- what follows is just random test code.

/**
 * Registers a custom meta for use by the test paragraph variation.
 */
function init_test_summary_meta_field() {
	register_meta(
		'post',
		'summary',
		array(
			'show_in_rest' => true,
			'single'       => true,
			'type'         => 'string',
		)
	);
}

add_action( 'init', 'init_test_summary_meta_field' );
