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

	public function set_up() {
		parent::set_up();
		$this->test_block_name = null;
		WP_Style_Engine_CSS_Rules_Store_Gutenberg::remove_all_stores();
	}

	public function tear_down() {
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
