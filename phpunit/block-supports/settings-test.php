<?php
/**
 * Test the block-level presets support.
 *
 * @package gutenberg
 */

class WP_Block_Supports_Settings_Test extends WP_UnitTestCase {
	/**
	 * @var string
	 */
	private $test_block_name = 'test/block-level-presets';

	public function set_up() {
		parent::set_up();
		register_block_type(
			$this->test_block_name,
			array(
				'api_version' => 3,
				'attributes'  => array(
					'settings' => array( 'type' => 'object' ),
					'style'    => array( 'type' => 'object' ),
				),
				'supports'    => array(
					'__experimentalSettings' => true,
					'color'                  => array( 'link' => true ),
				),
			)
		);
	}

	public function tear_down() {
		unregister_block_type( $this->test_block_name );
		WP_Style_Engine_CSS_Rules_Store_Gutenberg::remove_all_stores();
		parent::tear_down();
	}

	/**
	 * Tests that the class name only depends on the block's settings.
	 *
	 * @covers ::_gutenberg_get_presets_class_name
	 */
	public function test_presets_class_name_ignores_attributes_added_later() {
		$block = array(
			'blockName' => $this->test_block_name,
			'attrs'     => array(
				'settings' => array( 'color' => array( 'palette' => array( 'custom' => array() ) ) ),
			),
		);

		$filtered_block                          = $block;
		$filtered_block['attrs']['className']    = 'wp-elements-1';
		$filtered_block['attrs']['parentLayout'] = array( 'type' => 'constrained' );

		$this->assertSame(
			_gutenberg_get_presets_class_name( $block ),
			_gutenberg_get_presets_class_name( $filtered_block )
		);
	}

	/**
	 * Tests that the class added to the block matches the selector in its
	 * stylesheet when `render_block_data` changes the block.
	 *
	 * @covers ::_gutenberg_add_block_level_presets_class
	 * @covers ::_gutenberg_add_block_level_preset_styles
	 */
	public function test_presets_class_matches_stylesheet_selector() {
		// Elements support adds a `className` attribute in `render_block_data`.
		$attributes = array(
			'settings' => array(
				'color' => array(
					'palette' => array(
						'custom' => array(
							array(
								'slug'  => 'scratch',
								'name'  => 'Scratch',
								'color' => '#123456',
							),
						),
					),
				),
			),
			'style'    => array(
				'elements' => array(
					'link' => array( 'color' => array( 'text' => 'red' ) ),
				),
			),
		);
		$markup     = '<!-- wp:' . $this->test_block_name . ' ' . wp_json_encode( $attributes ) . ' --><div>Content</div><!-- /wp:' . $this->test_block_name . ' -->';

		// Only print the styles enqueued while rendering the block.
		remove_all_actions( 'wp_head' );
		remove_all_actions( 'wp_footer' );

		$html = do_blocks( $markup );

		$this->assertMatchesRegularExpression( '/wp-settings-[a-f0-9]{32}/', $html, 'The block should have a presets class.' );
		preg_match( '/wp-settings-[a-f0-9]{32}/', $html, $matches );

		$styles = get_echo( 'do_action', array( 'wp_head' ) ) . get_echo( 'do_action', array( 'wp_footer' ) );
		preg_match_all( '/\.(wp-settings-[a-f0-9]{32})/', $styles, $selectors );

		$this->assertNotEmpty( $selectors[1], 'The block-level presets stylesheet should be printed.' );
		$this->assertContains( $matches[0], $selectors[1], 'The stylesheet selector should use the same class as the block.' );
		$this->assertStringNotContainsString( ':root', $styles, 'Scoped presets should not target `:root`.' );
		$this->assertStringContainsString( ':where(.' . $matches[0] . ',.' . $matches[0] . ' *).has-scratch-background-color', $styles, 'Preset classes should apply inside the block.' );
	}
}
