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

		// PHP-only block with autoRegister flag, will be auto-registered without JS code
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
					'autoRegister' => true,
					'color'        => array(
						'background' => true,
						'text'       => false,
					),
				),
			)
		);

		// PHP-only block WITHOUT autoRegister flag, will NOT be auto-registered without JS code
		register_block_type(
			'test/php-only-no-auto-register',
			array(
				'api_version'     => 3,
				'render_callback' => static function () {
					return '<div>PHP-only block content</div>';
				},
			)
		);

		// PHP-only block with auto-generated controls from various attribute types
		register_block_type(
			'test/auto-register-with-controls',
			array(
				'title'           => 'Auto Register With Controls',
				'icon'            => 'admin-generic',
				'category'        => 'widgets',
				'description'     => 'A test block for auto-generated inspector controls',
				'keywords'        => array( 'autoregister', 'controls', 'dataform' ),
				// Labels are translatable via __() in real plugins.
				'attributes'      => array(
					'title'         => array(
						'type'    => 'string',
						'default' => 'My Emoji Collection',
						'label'   => 'Title',
					),
					'count'         => array(
						'type'    => 'integer',
						'default' => 5,
						'label'   => 'Count',
					),
					'spacing'       => array(
						'type'    => 'number',
						'default' => 0.1,
						'label'   => 'Spacing',
					),
					'showEmojis'    => array(
						'type'    => 'boolean',
						'default' => true,
						'label'   => 'Show Emojis',
					),
					'emoji'         => array(
						'type'    => 'string',
						'enum'    => array( '⭐', '❤️', '🎉', '🚀', '🌈' ),
						'default' => '⭐',
						'label'   => 'Emoji',
					),
					// Should NOT get a control (has source - HTML-derived)
					'content'       => array(
						'type'   => 'string',
						'source' => 'html',
					),
					// Should NOT get a control (role: local - internal state)
					'internalState' => array(
						'type'    => 'string',
						'role'    => 'local',
						'default' => 'internal',
					),
				),
				'render_callback' => static function ( $attributes ) {
					$wrapper_attributes = get_block_wrapper_attributes(
						array(
							'style' => 'padding: 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px;',
						)
					);
					$title       = esc_html( $attributes['title'] );
					$count       = min( 20, max( 0, absint( $attributes['count'] ) ) );
					$spacing     = floatval( $attributes['spacing'] );
					$show_emojis = $attributes['showEmojis'];
					$emoji       = $attributes['emoji'];

					$emoji_display = $show_emojis ? str_repeat( $emoji . ' ', $count ) : '<em>Emojis hidden</em>';

					return sprintf(
						'<div %s>
							<h2 style="color: white; margin: 0 0 10px 0;">%s</h2>
							<div style="font-size: 2em; line-height: 1.5; letter-spacing: %sem;">%s</div>
						</div>',
						$wrapper_attributes,
						$title,
						$spacing,
						$emoji_display
					);
				},
				'supports'        => array(
					'autoRegister' => true,
				),
			)
		);
	}
);
