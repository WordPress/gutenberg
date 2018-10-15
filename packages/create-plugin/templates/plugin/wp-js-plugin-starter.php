<?php
/**
 * Plugin Name: {{pluginName}}
 * Plugin URI: {{pluginUri}}
 * Description: {{pluginDescription}}
 * Version: {{pluginVersion}}
 * Author: {{pluginAuthor}}
 *
 * @package {{pluginSlug}}
 */

/**
 * Retrieves a URL to a file in the plugin's directory.
 *
 * @param  string $path Relative path of the desired file.
 *
 * @return string Fully qualified URL pointing to the desired file.
 *
 * @since {{pluginVersion}}
 */
function {{pluginMachineName}}_url( $path ) {
	return plugins_url( $path, __FILE__ );
}

/**
 * Registers the plugin's block.
 *
 * @since {{pluginVersion}}
 */
function {{pluginMachineName}}_register_block() {
	wp_register_script(
		'{{pluginSlug}}',
		{{pluginMachineName}}_url( 'dist/index.js' ),
		array( 'wp-element' )
	);

	register_block_type( '{{blockNamespace}}', array(
			'editor_script' => '{{pluginSlug}}',
	) );
}

/**
 * Trigger the block registration on init.
 */
add_action( 'init', '{{pluginMachineName}}_register_block' );
