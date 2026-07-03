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

		// Content, attributes, and render callback for the editable PHP-only
		// demo block below.
		$pattern_markup = '<!-- wp:group {"layout":{"type":"constrained"}} --><div class="wp-block-group">'
			. '<!-- wp:heading --><h2 class="wp-block-heading">Title</h2><!-- /wp:heading -->'
			. '<!-- wp:paragraph --><p>Body text.</p><!-- /wp:paragraph -->'
			. '</div><!-- /wp:group -->';

		$pattern_attributes = array(
			'variant'     => array(
				'type'    => 'string',
				'enum'    => array( 'default', 'highlight' ),
				'default' => 'default',
				'label'   => 'Variant',
			),
			'featured'    => array(
				'type'    => 'boolean',
				'default' => false,
				'label'   => 'Featured',
			),
			'membersOnly' => array(
				'type'    => 'boolean',
				'default' => false,
				'label'   => 'Members only',
			),
		);

		// An ordinary dynamic-block callback that wraps $content, with no
		// editor-specific code and no empty check: the framework guarantees a
		// non-empty $content (saved blocks, editor slot placeholders, or the
		// pattern as fallback; see gutenberg_wrap_ssr_islands_render_callback).
		// `variant` sets a class, `featured` a ribbon, and `membersOnly` swaps
		// the content for a login notice when the visitor is logged out, the
		// job enclosing shortcodes used to do. The footer is computed on the
		// server on every render.
		$render_pattern_block = static function ( $attributes, $content ) {
			$variant  = isset( $attributes['variant'] ) ? sanitize_html_class( $attributes['variant'] ) : 'default';
			$featured = ! empty( $attributes['featured'] );
			$classes  = 'pattern-block-demo is-variant-' . $variant . ( $featured ? ' is-featured' : '' );
			$wrapper  = get_block_wrapper_attributes( array( 'class' => $classes ) );
			$ribbon   = $featured ? '<p class="pattern-block-demo__ribbon"><strong>Featured</strong></p>' : '';

			if ( ! empty( $attributes['membersOnly'] ) && ! is_user_logged_in() ) {
				$content = '<p class="pattern-block-demo__gate">This content is for members only. Please log in.</p>';
			}

			$viewer = is_user_logged_in() ? wp_get_current_user()->display_name : 'guest';
			$meta   = sprintf(
				'<p class="pattern-block-demo__meta">Rendered by PHP at %1$s for %2$s · %3$d published posts</p>',
				esc_html( wp_date( 'H:i:s' ) ),
				esc_html( $viewer ),
				(int) wp_count_posts()->publish
			);

			return sprintf( '<div %1$s>%2$s%3$s%4$s</div>', $wrapper, $ribbon, $content, $meta );
		};

		// SSR-islands: a pattern block with a render_callback renders its PHP shell
		// server-side in the editor and portals the editable pattern blocks into its
		// slots, so the editor matches the frontend (WYSIWYG) while the islands stay
		// editable in the canvas.
		register_block_type(
			'test/php-only-editable-block',
			array(
				'title'           => 'Editable PHP-only block (SSR-islands)',
				'icon'            => 'layout',
				'category'        => 'widgets',
				'description'     => 'The PHP wrapper is rendered server-side in the editor with the editable pattern blocks portalled into it, so the editor matches the frontend while the content stays editable in the canvas.',
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

		// Demo styles for the wrapper output, in editor and frontend.
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
					. '.pattern-block-demo__gate{background:#f6f7f7;border:1px dashed #949494;padding:1em;}'
					. '.pattern-block-demo__meta{margin:.5em 0 0;font-size:12px;color:#757575;}'
				);
			}
		);
	}
);
