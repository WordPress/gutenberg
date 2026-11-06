<?php
/**
 * Tests for block level preset settings.
 *
 * @package gutenberg
 */

class WP_Block_Supports_Settings_Test extends WP_UnitTestCase {

	/**
	 * @var string|null
	 */
	private $test_block_name;

	public function tear_down() {
		if ( null !== $this->test_block_name ) {
			unregister_block_type( $this->test_block_name );
		}
		$this->test_block_name = null;
		parent::tear_down();
	}

	/**
	 * Preserves earlier render results without losing the block's preset styles.
	 *
	 * @covers ::_gutenberg_add_block_level_preset_styles
	 * @dataProvider data_preserve_pre_rendered_content
	 *
	 * @param bool        $supports_settings Whether the block supports preset settings.
	 * @param array       $settings          The block's preset settings.
	 * @param string|null $pre_render        The earlier filter's render result.
	 */
	public function test_preserve_pre_rendered_content( $supports_settings, $settings, $pre_render ) {
		$this->test_block_name = 'test/settings-pre-render';
		$render_calls          = 0;
		$filter_calls          = 0;

		register_block_type(
			$this->test_block_name,
			array(
				'api_version'     => 3,
				'attributes'      => array( 'settings' => array( 'type' => 'object' ) ),
				'supports'        => array( '__experimentalSettings' => $supports_settings ),
				'render_callback' => static function () use ( &$render_calls ) {
					++$render_calls;
					return '<div>Rendered settings block</div>';
				},
			)
		);

		$block = array(
			'blockName'    => $this->test_block_name,
			'attrs'        => $settings ? array( 'settings' => $settings ) : array(),
			'innerBlocks'  => array(),
			'innerHTML'    => '',
			'innerContent' => array(),
		);

		$pre_render_filter = function ( $content, $parsed_block ) use ( $pre_render, &$filter_calls ) {
			if ( $this->test_block_name !== $parsed_block['blockName'] ) {
				return $content;
			}
			++$filter_calls;
			$this->assertNull( $content );
			return $pre_render;
		};
		add_filter( 'pre_render_block', $pre_render_filter, 9, 2 );

		// Resolve the theme before measuring the block's newly enqueued styles.
		wp_is_block_theme();
		$style_hooks = array();
		foreach ( array( 'wp_head', 'wp_footer' ) as $hook_name ) {
			$style_hooks[ $hook_name ] = isset( $GLOBALS['wp_filter'][ $hook_name ] )
				? clone $GLOBALS['wp_filter'][ $hook_name ]
				: null;
		}

		try {
			$actual = do_blocks( serialize_block( $block ) );

			if ( null === $pre_render ) {
				$this->assertSame( 1, $render_calls );
				$this->assertStringContainsString( 'Rendered settings block', $actual );
			} else {
				$this->assertSame( $pre_render, $actual );
				$this->assertSame( 0, $render_calls );
			}
			$this->assertSame( 1, $filter_calls );

			$styles = $this->get_added_style_output( $style_hooks );
			if ( $supports_settings && $settings ) {
				$this->assertStringContainsString( '--wp--preset--color--test-settings-pre-render', $styles );
				$this->assertStringContainsString( '#123abc', $styles );
				$this->assertStringContainsString( '.has-test-settings-pre-render-color', $styles );
			} else {
				$this->assertStringNotContainsString( 'test-settings-pre-render', $styles );
			}
		} finally {
			remove_filter( 'pre_render_block', $pre_render_filter, 9 );
			foreach ( $style_hooks as $hook_name => $original_hook ) {
				if ( null === $original_hook ) {
					unset( $GLOBALS['wp_filter'][ $hook_name ] );
				} else {
					$GLOBALS['wp_filter'][ $hook_name ] = $original_hook;
				}
			}
		}
	}

	/**
	 * Captures the real style callbacks added by the rendered block only.
	 *
	 * @param array $original_hooks Style hooks before rendering.
	 * @return string Newly enqueued stylesheet output.
	 */
	private function get_added_style_output( $original_hooks ) {
		ob_start();
		try {
			foreach ( $original_hooks as $hook_name => $original_hook ) {
				if ( ! isset( $GLOBALS['wp_filter'][ $hook_name ] ) ) {
					continue;
				}
				foreach ( $GLOBALS['wp_filter'][ $hook_name ]->callbacks as $priority => $callbacks ) {
					$original_callbacks = null === $original_hook ? array() : ( $original_hook->callbacks[ $priority ] ?? array() );
					foreach ( array_diff_key( $callbacks, $original_callbacks ) as $callback ) {
						call_user_func( $callback['function'] );
					}
				}
			}
			return ob_get_contents();
		} finally {
			ob_end_clean();
		}
	}

	/**
	 * @return array
	 */
	public static function data_preserve_pre_rendered_content() {
		$settings = array(
			'color' => array(
				'palette' => array(
					'custom' => array(
						array(
							'name'  => 'Test settings pre-render',
							'slug'  => 'test-settings-pre-render',
							'color' => '#123abc',
						),
					),
				),
			),
		);
		$branches = array(
			'unsupported block' => array( false, $settings ),
			'no settings'       => array( true, array() ),
			'preset settings'   => array( true, $settings ),
		);
		$results  = array(
			'empty string'  => '',
			'zero string'   => '0',
			'cached markup' => '<div>Cached settings block</div>',
			'normal render' => null,
		);
		$cases    = array();
		foreach ( $branches as $branch_name => $branch ) {
			foreach ( $results as $result_name => $pre_render ) {
				$cases[ $branch_name . ', ' . $result_name ] = array( $branch[0], $branch[1], $pre_render );
			}
		}
		return $cases;
	}
}
