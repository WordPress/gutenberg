<?php
/**
 * Plugin Name: Gutenberg Test Server-Side Rendered Block
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-server-side-rendered-block
 */

add_action(
	'init',
	static function () {
		wp_register_script(
			'server-side-rendered-block',
			plugins_url( 'server-side-rendered-block/editor.js', __FILE__ ),
			array( 'wp-blocks', 'wp-element', 'wp-editor', 'wp-components', 'wp-server-side-render' ),
			filemtime( plugin_dir_path( __FILE__ ) . 'server-side-rendered-block/editor.js' ),
			true
		);

		register_block_type(
			'test/server-side-rendered-block',
			array(
				'attributes'            => array(
					'count' => array(
						'type'    => 'number',
						'default' => 0,
					),
				),
				'render_callback'       => static function ( $attributes ) {
					$count = isset( $attributes['count'] ) ? absint( $attributes['count'] ) : 0;

					// Simulate an empty response when count is over maximum value = 10.
					if ( $count > 10 ) {
						return '';
					}

					return sprintf(
						'<p>Coffee count: %d</p>',
						$count
					);
				},
				'editor_script_handles' => array( 'server-side-rendered-block' ),
			)
		);

		// PHP-only block with auto_register flag, will be auto-registered without JS code
		register_block_type(
			'test/auto-register-block',
			array(
				'title'           => 'Auto Register Test Block',
				'icon'            => 'admin-generic',
				'category'        => 'widgets',
				'description'     => 'A test block for auto-registration',
				'keywords'        => array( 'serverblock', 'autotest' ),
				'render_callback' => static function ( $attributes ) {
					$wrapper_attributes = get_block_wrapper_attributes(
						array(
							'class' => 'auto-register-example',
						)
					);

					return sprintf(
						'<div %1$s><p>Auto-register block content</p><p>Background: %2$s</p></div>',
						$wrapper_attributes,
						isset( $attributes['backgroundColor'] ) ? esc_html( $attributes['backgroundColor'] ) : 'default'
					);
				},
				'supports'        => array(
					'auto_register' => true,
					'color'         => array(
						'background' => true,
						'text'       => false,
					),
				),
			)
		);

		// PHP-only block WITHOUT auto_register flag, will NOT be auto-registered without JS code
		register_block_type(
			'test/php-only-no-auto-register',
			array(
				'api_version'     => 3,
				'render_callback' => static function () {
					return '<div>PHP-only block content</div>';
				},
			)
		);
	}
);
