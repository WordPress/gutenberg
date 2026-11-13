<?php
/**
 * Tests the transform block support.
 *
 * @package gutenberg
 */

class WP_Block_Supports_Transform_Test extends WP_UnitTestCase {
	/**
	 * @var string|null
	 */
	private $test_block_name;

	/**
	 * @var callable|null
	 */
	private $theme_json_filter;

	public function set_up() {
		parent::set_up();
		$this->test_block_name = null;
		WP_Style_Engine_CSS_Rules_Store_Gutenberg::remove_all_stores();
	}

	public function tear_down() {
		if ( $this->theme_json_filter ) {
			remove_filter( 'wp_theme_json_data_theme', $this->theme_json_filter );
			$this->theme_json_filter = null;
			WP_Theme_JSON_Resolver_Gutenberg::clean_cached_data();
		}
		if ( $this->test_block_name ) {
			unregister_block_type( $this->test_block_name );
		}
		$this->test_block_name = null;
		WP_Style_Engine_CSS_Rules_Store_Gutenberg::remove_all_stores();
		parent::tear_down();
	}

	/**
	 * Registers a block for testing transform support.
	 *
	 * @param array $supports  Transform block support configuration.
	 * @param array $selectors Optional block selectors.
	 */
	private function register_transform_block( $supports, $selectors = array() ) {
		$this->test_block_name = 'test/transform-block';
		register_block_type(
			$this->test_block_name,
			array(
				'api_version' => 3,
				'attributes'  => array(
					'style' => array(
						'type' => 'object',
					),
				),
				'supports'    => array( 'transform' => $supports ),
				'selectors'   => $selectors,
			)
		);
	}

	/**
	 * Sets the theme's Global Styles for the test block.
	 *
	 * @param array $block_styles Global Styles for the test block.
	 */
	private function set_global_block_styles( $block_styles ) {
		$block_name              = $this->test_block_name;
		$this->theme_json_filter = static function ( $theme_json ) use ( $block_name, $block_styles ) {
			return $theme_json->update_with(
				array(
					'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
					'styles'  => array(
						'blocks' => array( $block_name => $block_styles ),
					),
				)
			);
		};
		add_filter( 'wp_theme_json_data_theme', $this->theme_json_filter );
		WP_Theme_JSON_Resolver_Gutenberg::clean_cached_data();
	}

	/**
	 * Renders a test block with a rotation.
	 *
	 * @param mixed $rotate Rotation value.
	 * @return string Rendered block content.
	 */
	private function render_rotated_block( $rotate ) {
		return gutenberg_render_transform_support(
			'<div class="wp-block-test-transform-block" style="color:red"><img src="x.png" /></div>',
			array(
				'blockName' => $this->test_block_name,
				'attrs'     => array(
					'style' => array(
						'transform' => array( 'rotate' => $rotate ),
					),
				),
			)
		);
	}

	public function test_rotation_is_added_to_the_wrapper_inline_style() {
		$this->register_transform_block( array( 'rotate' => true ) );

		$this->assertSame(
			'<div class="wp-block-test-transform-block" style="color:red;rotate:15deg;"><img src="x.png" /></div>',
			$this->render_rotated_block( '15deg' )
		);
	}

	public function test_rotation_is_output_under_the_transform_feature_selector() {
		$this->register_transform_block(
			array( 'rotate' => true ),
			array( 'transform' => '.wp-block-test-transform-block img' )
		);

		$actual = $this->render_rotated_block( '0.25turn' );

		$this->assertMatchesRegularExpression(
			'/^<div class="wp-block-test-transform-block (wp-transform-[a-z0-9]+)" style="color:red"><img src="x.png" \/><\/div>$/',
			$actual
		);
		preg_match( '/wp-transform-[a-z0-9]+/', $actual, $matches );
		$this->assertSame(
			'.' . $matches[0] . ' img{rotate:0.25turn;}',
			gutenberg_style_engine_get_stylesheet_from_context( 'block-supports', array( 'prettify' => false ) )
		);
	}

	/**
	 * Renders a test block with transform styles.
	 *
	 * @param array $transform Transform styles.
	 * @return string Rendered block content.
	 */
	private function render_transformed_block( $transform ) {
		return gutenberg_render_transform_support(
			'<div class="wp-block-test-transform-block" style="color:red"><img src="x.png" /></div>',
			array(
				'blockName' => $this->test_block_name,
				'attrs'     => array(
					'style' => array( 'transform' => $transform ),
				),
			)
		);
	}

	/**
	 * @dataProvider data_inline_translate_styles
	 *
	 * @param array  $transform    Transform styles.
	 * @param string $expected_css Expected inline CSS after the existing style.
	 */
	public function test_translation_is_added_to_the_wrapper_inline_style( $transform, $expected_css ) {
		$this->register_transform_block(
			array(
				'rotate'    => true,
				'translate' => true,
			)
		);

		$this->assertSame(
			'<div class="wp-block-test-transform-block" style="color:red;' . $expected_css . '"><img src="x.png" /></div>',
			$this->render_transformed_block( $transform )
		);
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_inline_translate_styles() {
		return array(
			'both axes'       => array(
				array(
					'translate' => array(
						'x' => '10px',
						'y' => '-50%',
					),
				),
				'translate:10px -50%;',
			),
			'missing axis'    => array( array( 'translate' => array( 'y' => '2rem' ) ), 'translate:0 2rem;' ),
			'unknown z axis'  => array(
				array(
					'translate' => array(
						'x' => '1px',
						'z' => '5px',
					),
				),
				'translate:1px 0;',
			),
			'with a rotation' => array(
				array(
					'rotate'    => '15deg',
					'translate' => array( 'x' => '1em' ),
				),
				'rotate:15deg;translate:1em 0;',
			),
		);
	}

	public function test_translation_and_rotation_are_output_under_the_transform_feature_selector() {
		$this->register_transform_block(
			array(
				'rotate'    => true,
				'translate' => true,
			),
			array( 'transform' => '.wp-block-test-transform-block img' )
		);

		$actual = $this->render_transformed_block(
			array(
				'rotate'    => '0.25turn',
				'translate' => array( 'x' => '-4px' ),
			)
		);

		preg_match( '/wp-transform-[a-z0-9]+/', $actual, $matches );
		$this->assertStringContainsString( 'style="color:red"', $actual );
		$this->assertSame(
			'.' . $matches[0] . ' img{rotate:0.25turn;translate:-4px 0;}',
			gutenberg_style_engine_get_stylesheet_from_context( 'block-supports', array( 'prettify' => false ) )
		);
	}

	public function test_translation_skip_serialization_keeps_the_rotation() {
		$this->register_transform_block(
			array(
				'rotate'                          => true,
				'translate'                       => true,
				'__experimentalSkipSerialization' => array( 'translate' ),
			)
		);

		$this->assertSame(
			'<div class="wp-block-test-transform-block" style="color:red;rotate:15deg;"><img src="x.png" /></div>',
			$this->render_transformed_block(
				array(
					'rotate'    => '15deg',
					'translate' => array( 'x' => '10px' ),
				)
			)
		);
	}

	/**
	 * @dataProvider data_translate_axis_filled_from_global_styles
	 *
	 * @param array  $translate    Block offset.
	 * @param string $class_name   Block class name.
	 * @param string $expected_css Expected inline CSS after the existing style.
	 */
	public function test_translation_axis_is_filled_from_global_styles( $translate, $class_name, $expected_css ) {
		$this->register_transform_block( array( 'translate' => true ) );
		register_block_style(
			$this->test_block_name,
			array(
				'name'  => 'raised',
				'label' => 'Raised',
			)
		);
		$this->set_global_block_styles(
			array(
				'transform'  => array( 'translate' => array( 'x' => '3rem' ) ),
				'variations' => array(
					'raised' => array(
						'transform' => array( 'translate' => array( 'y' => '-1rem' ) ),
					),
				),
			)
		);

		$actual = gutenberg_render_transform_support(
			'<div class="wp-block-test-transform-block" style="color:red"></div>',
			array(
				'blockName' => $this->test_block_name,
				'attrs'     => array(
					'className' => $class_name,
					'style'     => array( 'transform' => array( 'translate' => $translate ) ),
				),
			)
		);
		unregister_block_style( $this->test_block_name, 'raised' );

		$this->assertSame(
			'<div class="wp-block-test-transform-block" style="color:red;' . $expected_css . '"></div>',
			$actual
		);
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_translate_axis_filled_from_global_styles() {
		return array(
			'missing x'                   => array( array( 'y' => '1rem' ), '', 'translate:3rem 1rem;' ),
			'missing y, none set'         => array( array( 'x' => '1rem' ), '', 'translate:1rem 0;' ),
			'both axes'                   => array(
				array(
					'x' => '1px',
					'y' => '2px',
				),
				'',
				'translate:1px 2px;',
			),
			'missing y, from a variation' => array( array( 'x' => '1rem' ), 'is-style-raised', 'translate:1rem -1rem;' ),
		);
	}

	public function test_translation_axis_is_not_filled_from_an_invalid_global_styles_axis() {
		$this->register_transform_block( array( 'translate' => true ) );
		$this->set_global_block_styles(
			array( 'transform' => array( 'translate' => array( 'x' => 'calc(1px + 2px)' ) ) )
		);

		$this->assertSame(
			'<div class="wp-block-test-transform-block" style="color:red;translate:0 1rem;"><img src="x.png" /></div>',
			$this->render_transformed_block( array( 'translate' => array( 'y' => '1rem' ) ) )
		);
	}

	/**
	 * @dataProvider data_state_translate_axis_fill
	 *
	 * @param array $style    Block style attribute.
	 * @param array $expected Expected style attribute.
	 */
	public function test_state_translation_axis_is_filled_from_the_block_then_global_styles( $style, $expected ) {
		$this->register_transform_block( array( 'translate' => true ) );
		$this->set_global_block_styles(
			array( 'transform' => array( 'translate' => array( 'x' => '3rem' ) ) )
		);

		$this->assertSame(
			$expected,
			gutenberg_get_block_style_with_filled_translate( $style, $this->test_block_name, null )
		);
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_state_translate_axis_fill() {
		$translate = static function ( $x, $y = null ) {
			return array(
				'transform' => array(
					'translate' => array_filter(
						array(
							'x' => $x,
							'y' => $y,
						)
					),
				),
			);
		};

		return array(
			'viewport from the block default'     => array(
				array_merge( $translate( '1px', '2px' ), array( '@mobile' => $translate( null, '1rem' ) ) ),
				array_merge(
					$translate( '1px', '2px' ),
					array(
						'@mobile' => array(
							'transform' => array(
								'translate' => array(
									'y' => '1rem',
									'x' => '1px',
								),
							),
						),
					)
				),
			),
			'viewport from Global Styles'         => array(
				array( '@mobile' => $translate( null, '1rem' ) ),
				array(
					'@mobile' => array(
						'transform' => array(
							'translate' => array(
								'y' => '1rem',
								'x' => '3rem',
							),
						),
					),
				),
			),
			'pseudo state from the block default' => array(
				array_merge( $translate( '1px', '2px' ), array( ':hover' => $translate( null, '1rem' ) ) ),
				array_merge(
					$translate( '1px', '2px' ),
					array(
						':hover' => array(
							'transform' => array(
								'translate' => array(
									'y' => '1rem',
									'x' => '1px',
								),
							),
						),
					)
				),
			),
			'viewport pseudo state order'         => array(
				array(
					':hover'  => $translate( null, '1px' ),
					'@mobile' => array_merge(
						$translate( '2px', '2px' ),
						array( ':hover' => $translate( null, '3px' ) )
					),
				),
				array(
					':hover'  => array(
						'transform' => array(
							'translate' => array(
								'y' => '1px',
								'x' => '3rem',
							),
						),
					),
					'@mobile' => array_merge(
						$translate( '2px', '2px' ),
						array(
							':hover' => array(
								'transform' => array(
									'translate' => array(
										'y' => '3px',
										'x' => '3rem',
									),
								),
							),
						)
					),
				),
			),
			'no offset'                           => array(
				array( '@mobile' => array( 'color' => array( 'text' => 'red' ) ) ),
				array( '@mobile' => array( 'color' => array( 'text' => 'red' ) ) ),
			),
		);
	}

	/**
	 * @dataProvider data_unchanged_translate_content
	 *
	 * @param array $supports  Transform block support configuration.
	 * @param mixed $translate Offset value.
	 */
	public function test_block_content_is_unchanged_for_translate( $supports, $translate ) {
		$this->register_transform_block( $supports );

		$this->assertSame(
			'<div class="wp-block-test-transform-block" style="color:red"><img src="x.png" /></div>',
			$this->render_transformed_block( array( 'translate' => $translate ) )
		);
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_unchanged_translate_content() {
		return array(
			'no translate support' => array( array( 'rotate' => true ), array( 'x' => '10px' ) ),
			'skip all'             => array(
				array(
					'translate'                       => true,
					'__experimentalSkipSerialization' => true,
				),
				array( 'x' => '10px' ),
			),
			'string value'         => array( array( 'translate' => true ), '10px 20px' ),
			'invalid axis'         => array( array( 'translate' => true ), array( 'x' => 'calc(1px + 2px)' ) ),
			'z only'               => array( array( 'translate' => true ), array( 'z' => '5px' ) ),
		);
	}

	/**
	 * @dataProvider data_unchanged_block_content
	 *
	 * @param array $supports Transform block support configuration.
	 * @param mixed $rotate   Rotation value.
	 */
	public function test_block_content_is_unchanged( $supports, $rotate ) {
		$this->register_transform_block( $supports, array( 'transform' => '.wp-block-test-transform-block img' ) );

		$this->assertSame(
			'<div class="wp-block-test-transform-block" style="color:red"><img src="x.png" /></div>',
			$this->render_rotated_block( $rotate )
		);
		$this->assertEmpty( gutenberg_style_engine_get_stylesheet_from_context( 'block-supports', array() ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_unchanged_block_content() {
		return array(
			'no rotate support'  => array( array( 'scale' => true ), '15deg' ),
			'skip serialization' => array(
				array(
					'rotate'                          => true,
					'__experimentalSkipSerialization' => array( 'rotate' ),
				),
				'15deg',
			),
			'no rotation'        => array( array( 'rotate' => true ), null ),
			'invalid rotation'   => array( array( 'rotate' => true ), 'calc(10deg + 5deg)' ),
		);
	}
}
