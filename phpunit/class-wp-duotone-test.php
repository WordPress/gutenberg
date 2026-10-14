<?php

/**
 * Test the block WP_Duotone_Gutenberg class.
 *
 * @package gutenberg
 */

class WP_Duotone_Gutenberg_Test extends WP_UnitTestCase {
	/**
	 * Cleans up CSS added to block-supports from duotone styles. We need to do this
	 * in order to avoid impacting other tests.
	 */
	public static function wpTearDownAfterClass() {
		WP_Style_Engine_CSS_Rules_Store_Gutenberg::remove_all_stores();
	}

	public function test_gutenberg_render_duotone_support_preset() {
		$block         = array(
			'blockName' => 'core/image',
			'attrs'     => array( 'style' => array( 'color' => array( 'duotone' => 'var:preset|duotone|blue-orange' ) ) ),
		);
		$wp_block      = new WP_Block( $block );
		$block_content = '<figure class="wp-block-image size-full"><img src="/my-image.jpg" /></figure>';
		$expected      = '<figure class="wp-block-image size-full wp-duotone-blue-orange"><img src="/my-image.jpg" /></figure>';
		$this->assertSame( $expected, WP_Duotone_Gutenberg::render_duotone_support( $block_content, $block, $wp_block ) );
	}

	public function test_gutenberg_render_duotone_support_css() {
		$block         = array(
			'blockName' => 'core/image',
			'attrs'     => array( 'style' => array( 'color' => array( 'duotone' => 'unset' ) ) ),
		);
		$wp_block      = new WP_Block( $block );
		$block_content = '<figure class="wp-block-image size-full"><img src="/my-image.jpg" /></figure>';
		$expected      = '/<figure class="wp-block-image size-full wp-duotone-unset-\d+"><img src="\\/my-image.jpg" \\/><\\/figure>/';
		$this->assertMatchesRegularExpression( $expected, WP_Duotone_Gutenberg::render_duotone_support( $block_content, $block, $wp_block ) );
	}

	public function test_gutenberg_render_duotone_support_custom() {
		$block         = array(
			'blockName' => 'core/image',
			'attrs'     => array( 'style' => array( 'color' => array( 'duotone' => array( '#FFFFFF', '#000000' ) ) ) ),
		);
		$wp_block      = new WP_Block( $block );
		$block_content = '<figure class="wp-block-image size-full"><img src="/my-image.jpg" /></figure>';
		$expected      = '/<figure class="wp-block-image size-full wp-duotone-ffffff-000000-\d+"><img src="\\/my-image.jpg" \\/><\\/figure>/';
		$this->assertMatchesRegularExpression( $expected, WP_Duotone_Gutenberg::render_duotone_support( $block_content, $block, $wp_block ) );
	}

	public function test_gutenberg_restore_image_outer_container_moves_duotone_class_to_wrapper_in_classic_theme() {
		switch_theme( 'default' );

		$block_content = '<div class="wp-block-image"><figure class="alignright wp-duotone-blue-orange size-full"><img src="/my-image.jpg"></figure></div>';
		$expected      = '<div class="wp-block-image wp-duotone-blue-orange"><figure class="alignright size-full"><img src="/my-image.jpg"></figure></div>';

		$this->assertEqualHTML( $expected, WP_Duotone_Gutenberg::restore_image_outer_container( $block_content ) );
	}

	/**
	 * Tests whether the CSS declarations are generated even if the block content is
	 * empty. This is needed to make the CSS output stable across paginations for
	 * features like the enhanced pagination of the Query block.
	 *
	 * @covers ::render_duotone_support
	 */
	public function test_gutenberg_css_declarations_are_generated_even_with_empty_block_content() {
		$block    = array(
			'blockName' => 'core/image',
			'attrs'     => array( 'style' => array( 'color' => array( 'duotone' => 'var:preset|duotone|blue-orange' ) ) ),
		);
		$wp_block = new WP_Block( $block );

		/*
		 * Handling to access the static WP_Duotone::$block_css_declarations property.
		 *
		 * Why is an instance needed?
		 * WP_Duotone is a static class by design, meaning it only contains static properties and methods.
		 * In production, it should not be instantiated. However, as of PHP 8.3, ReflectionProperty::setValue()
		 * needs an object.
		 */
		$wp_duotone                      = new WP_Duotone_Gutenberg();
		$block_css_declarations_property = new ReflectionProperty( 'WP_Duotone_Gutenberg', 'block_css_declarations' );
		if ( PHP_VERSION_ID < 80100 ) {
			$block_css_declarations_property->setAccessible( true );
		}
		$previous_value = $block_css_declarations_property->getValue();
		$block_css_declarations_property->setValue( $wp_duotone, array() );
		WP_Duotone_Gutenberg::render_duotone_support( '', $block, $wp_block );
		$actual = $block_css_declarations_property->getValue();

		// Reset the property.
		$block_css_declarations_property->setValue( $wp_duotone, $previous_value );
		if ( PHP_VERSION_ID < 80100 ) {
			$block_css_declarations_property->setAccessible( false );
		}

		$this->assertNotEmpty( $actual );
	}

	public function data_get_slug_from_attribute() {
		return array(
			'pipe-slug'                       => array( 'var:preset|duotone|blue-orange', 'blue-orange' ),
			'css-var'                         => array( 'var(--wp--preset--duotone--blue-orange)', 'blue-orange' ),
			'css-var-invalid-slug-chars'      => array( 'var(--wp--preset--duotone--.)', '.' ),
			'css-var-missing-end-parenthesis' => array( 'var(--wp--preset--duotone--blue-orange', '' ),
			'invalid'                         => array( 'not a valid attribute', '' ),
			'css-var-no-value'                => array( 'var(--wp--preset--duotone--)', '' ),
			'pipe-slug-no-value'              => array( 'var:preset|duotone|', '' ),
			'css-var-spaces'                  => array( 'var(--wp--preset--duotone--    ', '' ),
			'pipe-slug-spaces'                => array( 'var:preset|duotone|  ', '' ),
			'array-of-colors'                 => array( array( '#000000', '#ffffff' ), '' ),
			'empty-array'                     => array( array(), '' ),
		);
	}

	/**
	 * @dataProvider data_get_slug_from_attribute
	 */
	public function test_get_slug_from_attribute( $data_attr, $expected ) {

		$reflection = new ReflectionMethod( 'WP_Duotone_Gutenberg', 'get_slug_from_attribute' );
		if ( PHP_VERSION_ID < 80100 ) {
			$reflection->setAccessible( true );
		}

		$this->assertSame( $expected, $reflection->invoke( null, $data_attr ) );
	}

	public function data_is_preset() {
		return array(
			'pipe-slug'                       => array( 'var:preset|duotone|blue-orange', true ),
			'css-var'                         => array( 'var(--wp--preset--duotone--blue-orange)', true ),
			'css-var-invalid-slug-chars'      => array( 'var(--wp--preset--duotone--.)', false ),
			'css-var-missing-end-parenthesis' => array( 'var(--wp--preset--duotone--blue-orange', false ),
			'invalid'                         => array( 'not a valid attribute', false ),
			'array-of-colors'                 => array( array( '#000000', '#ffffff' ), false ),
			'empty-array'                     => array( array(), false ),
		);
	}

	/**
	 * @dataProvider data_is_preset
	 */
	public function test_is_preset( $data_attr, $expected ) {
		$reflection = new ReflectionMethod( 'WP_Duotone_Gutenberg', 'is_preset' );
		if ( PHP_VERSION_ID < 80100 ) {
			$reflection->setAccessible( true );
		}

		$this->assertSame( $expected, $reflection->invoke( null, $data_attr ) );
	}

	public function data_get_custom_filter_id() {
		return array(
			'hex'               => array( array( '#000000', '#FFFFFF' ), 'wp-duotone-custom-000000-ffffff' ),
			'short-hex'         => array( array( '#000', '#fff' ), 'wp-duotone-custom-000000-ffffff' ),
			'rgb-and-hsl'       => array( array( 'rgb(255, 0, 0)', 'hsl(240, 100%, 50%)' ), 'wp-duotone-custom-ff0000-0000ff' ),
			'alpha'             => array( array( '#000000', 'rgba(255, 255, 255, 0.5)' ), 'wp-duotone-custom-000000-ffffff80' ),
			'three-colors'      => array( array( '#000', '#f00', '#fff' ), 'wp-duotone-custom-000000-ff0000-ffffff' ),
			'named-color'       => array( array( 'red', '#fff' ), null ),
			'markup'            => array( array( '#000', '<script>' ), null ),
			'nested-array'      => array( array( array( '#000' ), '#fff' ), null ),
			'single-color'      => array( array( '#000' ), null ),
			'associative-array' => array(
				array(
					'dark'  => '#000',
					'light' => '#fff',
				),
				null,
			),
			'string'            => array( 'var:preset|duotone|blue-orange', null ),
			'empty-array'       => array( array(), null ),
		);
	}

	/**
	 * @dataProvider data_get_custom_filter_id
	 *
	 * @covers ::get_custom_filter_id
	 */
	public function test_get_custom_filter_id( $colors, $expected ) {
		$this->assertSame( $expected, WP_Duotone_Gutenberg::get_custom_filter_id( $colors ) );
	}

	/**
	 * Renders a block with the given user global styles, then resets the cached data.
	 *
	 * @param array $styles The user global styles.
	 * @param array $block  The parsed block.
	 * @return array The rendered block HTML, the footer assets and the used preset filter IDs.
	 */
	private function render_with_user_global_styles( $styles, $block ) {
		$set_user_styles = static function ( $theme_json ) use ( $styles ) {
			return $theme_json->update_with(
				array(
					'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
					'styles'  => $styles,
				)
			);
		};
		$wp_duotone      = new WP_Duotone_Gutenberg();
		$properties      = array();
		foreach ( array( 'global_styles_block_names', 'global_styles_variation_filters', 'used_svg_filter_data', 'used_global_styles_presets' ) as $name ) {
			$properties[ $name ] = new ReflectionProperty( 'WP_Duotone_Gutenberg', $name );
			if ( PHP_VERSION_ID < 80100 ) {
				$properties[ $name ]->setAccessible( true );
			}
		}
		$reset = static function () use ( $properties, $wp_duotone ) {
			foreach ( $properties as $name => $property ) {
				$property->setValue( $wp_duotone, str_starts_with( $name, 'used_' ) ? array() : null );
			}
		};

		add_filter( 'wp_theme_json_data_user', $set_user_styles );
		WP_Theme_JSON_Resolver_Gutenberg::clean_cached_data();
		$reset();

		$block_content = '<figure class="wp-block-image size-full"><img src="/my-image.jpg" /></figure>';
		$html          = WP_Duotone_Gutenberg::render_duotone_support( $block_content, $block, new WP_Block( $block ) );
		$used_presets  = array_keys( $properties['used_global_styles_presets']->getValue() );

		ob_start();
		WP_Duotone_Gutenberg::output_footer_assets();
		$footer = ob_get_clean();

		remove_filter( 'wp_theme_json_data_user', $set_user_styles );
		WP_Theme_JSON_Resolver_Gutenberg::clean_cached_data();
		$reset();

		return array( $html, $footer, $used_presets );
	}

	/**
	 * @covers ::render_duotone_support
	 */
	public function test_gutenberg_render_duotone_support_global_styles_custom_colors() {
		list( $html, $footer ) = $this->render_with_user_global_styles(
			array(
				'blocks' => array(
					'core/image' => array(
						'filter' => array( 'duotone' => array( '#000000', '#ff0000' ) ),
					),
				),
			),
			array(
				'blockName' => 'core/image',
				'attrs'     => array(),
			)
		);

		$this->assertSame( '<figure class="wp-block-image size-full wp-duotone-custom-000000-ff0000"><img src="/my-image.jpg" /></figure>', $html );
		$this->assertStringContainsString( '<filter id="wp-duotone-custom-000000-ff0000">', $footer );
		$this->assertStringContainsString( 'tableValues="0 1"', $footer );
	}

	/**
	 * @covers ::render_duotone_support
	 */
	public function test_gutenberg_render_duotone_support_global_styles_variations() {
		register_block_style(
			'core/group',
			array(
				'name'  => 'duotone-section',
				'label' => 'Duotone section',
			)
		);

		list( $html, $footer, $used_presets ) = $this->render_with_user_global_styles(
			array(
				'blocks' => array(
					'core/image' => array(
						'variations' => array(
							'rounded' => array(
								'filter' => array( 'duotone' => array( '#000000', '#ff0000' ) ),
							),
						),
					),
					'core/cover' => array(
						'variations' => array(
							'rounded' => array(
								'filter' => array( 'duotone' => array( '#0000ff', '#ffffff' ) ),
							),
						),
					),
					'core/group' => array(
						'variations' => array(
							'duotone-section' => array(
								'blocks' => array(
									'core/image' => array(
										'filter' => array( 'duotone' => 'var:preset|duotone|blue-orange' ),
									),
								),
							),
						),
					),
				),
			),
			array(
				'blockName' => 'core/image',
				'attrs'     => array( 'className' => 'is-style-rounded' ),
			)
		);

		unregister_block_style( 'core/group', 'duotone-section' );

		// The variation CSS comes from theme.json, so the block gets no class.
		$this->assertSame( '<figure class="wp-block-image size-full"><img src="/my-image.jpg" /></figure>', $html );
		$this->assertStringContainsString( '<filter id="wp-duotone-custom-000000-ff0000">', $footer );
		$this->assertStringContainsString( '<filter id="wp-duotone-blue-orange">', $footer );
		$this->assertSame( array( 'wp-duotone-blue-orange' ), $used_presets );
		$this->assertStringNotContainsString( 'wp-duotone-custom-0000ff-ffffff', $footer, 'A variation filter for another block type is not output.' );
	}
}
