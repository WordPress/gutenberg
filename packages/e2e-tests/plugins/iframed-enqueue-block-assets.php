<?php
/**
 * Plugin Name: Gutenberg Test Iframed enqueue_block_assets
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-iframed-iframed-enqueue-block-assets
 */

add_action(
	'enqueue_block_assets',
	static function () {
		wp_enqueue_style(
			'iframed-enqueue-block-assets',
			plugin_dir_url( __FILE__ ) . 'iframed-enqueue-block-assets/style.css',
			array(),
			filemtime( plugin_dir_path( __FILE__ ) . 'iframed-enqueue-block-assets/style.css' )
		);
		wp_add_inline_style( 'iframed-enqueue-block-assets', 'body{padding:20px!important}' );
		wp_enqueue_script(
			'iframed-enqueue-block-assets-script',
			plugin_dir_url( __FILE__ ) . 'iframed-enqueue-block-assets/script.js',
			array(),
			filemtime( plugin_dir_path( __FILE__ ) . 'iframed-enqueue-block-assets/script.js' )
		);
		wp_localize_script(
			'iframed-enqueue-block-assets-script',
			'iframedEnqueueBlockAssetsL10n',
			array(
				'test' => 'Iframed Enqueue Block Assets!',
			)
		);
	}
);
