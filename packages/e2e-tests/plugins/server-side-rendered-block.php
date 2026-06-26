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

		// Add binding support for the auto-register-with-controls block.
		add_filter(
			'block_bindings_supported_attributes_test/auto-register-with-controls',
			static function () {
				return array( 'title', 'count', 'spacing', 'showEmojis', 'emoji' );
			}
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

		// The three pattern blocks below share content/attributes/render_callback
		// and differ only in how the editor locks and previews the structure.
		$pattern_markup = '<!-- wp:group {"layout":{"type":"constrained"}} --><div class="wp-block-group">'
			. '<!-- wp:heading --><h2 class="wp-block-heading">Title</h2><!-- /wp:heading -->'
			. '<!-- wp:paragraph --><p>Body text.</p><!-- /wp:paragraph -->'
			. '</div><!-- /wp:group -->';

		$pattern_attributes = array(
			'variant'  => array(
				'type'    => 'string',
				'enum'    => array( 'default', 'highlight' ),
				'default' => 'default',
				'label'   => 'Variant',
			),
			'featured' => array(
				'type'    => 'boolean',
				'default' => false,
				'label'   => 'Featured',
			),
		);

		// $content is the rendered inner blocks (empty for the SSR preview, which
		// falls back to the pattern). `variant` sets a class, `featured` a ribbon.
		$render_pattern_block = static function ( $attributes, $content ) use ( $pattern_markup ) {
			$body     = ( '' !== trim( (string) $content ) ) ? $content : do_blocks( $pattern_markup );
			$variant  = isset( $attributes['variant'] ) ? sanitize_html_class( $attributes['variant'] ) : 'default';
			$featured = ! empty( $attributes['featured'] );
			$classes  = 'pattern-block-demo is-variant-' . $variant . ( $featured ? ' is-featured' : '' );
			$wrapper  = get_block_wrapper_attributes( array( 'class' => $classes ) );
			$ribbon   = $featured ? '<p class="pattern-block-demo__ribbon"><strong>Featured</strong></p>' : '';

			return sprintf( '<div %1$s>%2$s%3$s</div>', $wrapper, $ribbon, $body );
		};

		// Block 1 - content-only: structure locked tight, but the content-only
		// section UI hides the generated controls.
		register_block_type(
			'test/php-only-pattern-content-only',
			array(
				'title'           => 'PHP-only pattern: content-only (controls hidden)',
				'icon'            => 'layout',
				'category'        => 'widgets',
				'description'     => 'Uses a canvas-editable pattern with contentOnly locking. The structure is tightly locked, but the content-only section UI hides the generated Inspector controls.',
				'keywords'        => array( 'pattern', 'autotest' ),
				'attributes'      => $pattern_attributes,
				'supports'        => array(
					'autoRegister' => true,
					'color'        => array(
						'background' => true,
						'text'       => true,
					),
				),
				'pattern'         => $pattern_markup,
				'render_callback' => $render_pattern_block,
			)
		);

		// Block 2 - no content-only (`patternLock => false`): the controls stay
		// visible, at the cost of a softer structural lock (#73845).
		register_block_type(
			'test/php-only-pattern-no-content-only',
			array(
				'title'           => 'PHP-only pattern: no content-only (controls shown)',
				'icon'            => 'layout',
				'category'        => 'widgets',
				'description'     => 'Uses a canvas-editable pattern without contentOnly locking. Inspector controls stay visible, but the structure is less strictly locked.',
				'keywords'        => array( 'pattern', 'autotest' ),
				'attributes'      => $pattern_attributes,
				'supports'        => array(
					'autoRegister' => true,
					'color'        => array(
						'background' => true,
						'text'       => true,
					),
				),
				'pattern'         => $pattern_markup,
				'patternLock'     => false,
				'render_callback' => $render_pattern_block,
			)
		);

		// Block 3 - SSR (`patternEditorPreview => 'ssr'`): control changes preview
		// live in the editor, but the content is not editable in the canvas.
		register_block_type(
			'test/php-only-pattern-ssr',
			array(
				'title'                => 'PHP-only pattern: SSR (controls live, no inline edit)',
				'icon'                 => 'layout',
				'category'             => 'widgets',
				'description'          => 'Pattern content previewed with ServerSideRender. Controls update the rendered output in the editor, but there is no in-canvas editing.',
				'keywords'             => array( 'pattern', 'autotest' ),
				'attributes'           => $pattern_attributes,
				'supports'             => array(
					'autoRegister' => true,
					'color'        => array(
						'background' => true,
						'text'       => true,
					),
				),
				'pattern'              => $pattern_markup,
				'patternEditorPreview' => 'ssr',
				'render_callback'      => $render_pattern_block,
			)
		);

		// Demo styles for the `variant`/`featured` output, in editor and frontend.
		add_action(
			'enqueue_block_assets',
			static function () {
				wp_register_style( 'pattern-block-demo', false );
				wp_enqueue_style( 'pattern-block-demo' );
				wp_add_inline_style(
					'pattern-block-demo',
					'.pattern-block-demo.is-variant-highlight{background:#fffbe6;border:2px solid #f0b849;padding:1em;}'
					. '.pattern-block-demo.is-featured{box-shadow:0 0 0 3px #3858e9;}'
					. '.pattern-block-demo__ribbon{margin:0 0 .5em;color:#3858e9;}'
				);
			}
		);
	}
);
