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
	}

	public function tear_down() {
		if ( $this->test_block_name ) {
			unregister_block_type( $this->test_block_name );
		}
		$this->test_block_name = null;
		parent::tear_down();
	}

	/**
	 * Registers a block for testing transform support.
	 *
	 * @param array $supports Transform block support configuration.
	 * @return WP_Block_Type The registered block type.
	 */
	private function register_transform_block( $supports ) {
		$this->test_block_name = 'test/transform-block';
		return register_block_type(
			$this->test_block_name,
			array(
				'api_version' => 3,
				'attributes'  => array(
					'style' => array(
						'type' => 'object',
					),
				),
				'supports'    => array( 'transform' => $supports ),
			)
		);
	}

	public function test_rotation_is_returned_as_a_wrapper_class_and_inline_style() {
		$block_type = $this->register_transform_block( array( 'rotate' => true ) );

		$this->assertSame(
			array(
				'style' => 'rotate:15deg;',
				'class' => 'has-rotation',
			),
			gutenberg_apply_transform_support(
				$block_type,
				array( 'style' => array( 'transform' => array( 'rotate' => '15deg' ) ) )
			)
		);
	}

	/**
	 * @dataProvider data_no_wrapper_styles
	 *
	 * @param array $supports Transform block support configuration.
	 * @param mixed $rotate   Rotation value.
	 */
	public function test_no_wrapper_styles( $supports, $rotate ) {
		$block_type = $this->register_transform_block( $supports );

		$this->assertSame(
			array(),
			gutenberg_apply_transform_support(
				$block_type,
				array( 'style' => array( 'transform' => array( 'rotate' => $rotate ) ) )
			)
		);
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_no_wrapper_styles() {
		return array(
			'no rotate support'                  => array( array( 'scale' => true ), '15deg' ),
			'skip serialization'                 => array(
				array(
					'rotate'                          => true,
					'__experimentalSkipSerialization' => true,
				),
				'15deg',
			),
			'skip serialization of the rotation' => array(
				array(
					'rotate'                          => true,
					'__experimentalSkipSerialization' => array( 'rotate' ),
				),
				'15deg',
			),
			'no rotation'                        => array( array( 'rotate' => true ), null ),
			'invalid rotation'                   => array( array( 'rotate' => true ), 'calc(10deg + 5deg)' ),
		);
	}

	/**
	 * @dataProvider data_translate_styles
	 *
	 * @param array  $transform    Transform styles.
	 * @param string $expected_css Expected inline CSS.
	 */
	public function test_translation_is_returned_as_a_wrapper_inline_style( $transform, $expected_css ) {
		$block_type = $this->register_transform_block(
			array(
				'rotate'    => true,
				'translate' => true,
			)
		);

		$this->assertSame(
			array( 'style' => $expected_css ),
			gutenberg_apply_transform_support( $block_type, array( 'style' => array( 'transform' => $transform ) ) )
		);
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_translate_styles() {
		return array(
			'both axes'       => array(
				array(
					'translate' => array(
						'x' => '10px',
						'y' => '-50%',
					),
				),
				'--wp--style--translate-x:10px;--wp--style--translate-y:-50%;translate:var(--wp--style--translate-x, 0) var(--wp--style--translate-y, 0);',
			),
			'one axis'        => array( array( 'translate' => array( 'y' => '2rem' ) ), '--wp--style--translate-y:2rem;translate:var(--wp--style--translate-x, 0) var(--wp--style--translate-y, 0);' ),
			'unknown z axis'  => array(
				array(
					'translate' => array(
						'x' => '1px',
						'z' => '5px',
					),
				),
				'--wp--style--translate-x:1px;translate:var(--wp--style--translate-x, 0) var(--wp--style--translate-y, 0);',
			),
			'with a rotation' => array(
				array(
					'rotate'    => '15deg',
					'translate' => array( 'x' => '1em' ),
				),
				'rotate:15deg;--wp--style--translate-x:1em;translate:var(--wp--style--translate-x, 0) var(--wp--style--translate-y, 0);',
			),
		);
	}

	public function test_translation_skip_serialization_keeps_the_rotation() {
		$block_type = $this->register_transform_block(
			array(
				'rotate'                          => true,
				'translate'                       => true,
				'__experimentalSkipSerialization' => array( 'translate' ),
			)
		);

		$this->assertSame(
			array( 'style' => 'rotate:15deg;' ),
			gutenberg_apply_transform_support(
				$block_type,
				array(
					'style' => array(
						'transform' => array(
							'rotate'    => '15deg',
							'translate' => array( 'x' => '1em' ),
						),
					),
				)
			)
		);
	}

	public function test_classes_and_styles_ignore_block_support() {
		$this->assertSame(
			array(
				'style' => 'rotate:-0.25turn;',
				'class' => 'has-rotation',
			),
			gutenberg_get_transform_classes_and_styles(
				array( 'style' => array( 'transform' => array( 'rotate' => '-0.25turn' ) ) )
			)
		);
	}

	/**
	 * @dataProvider data_no_classes_and_styles
	 *
	 * @param mixed $block_attributes Block attributes.
	 */
	public function test_no_classes_and_styles( $block_attributes ) {
		$this->assertSame( array(), gutenberg_get_transform_classes_and_styles( $block_attributes ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_no_classes_and_styles() {
		return array(
			'non-array attributes' => array( null ),
			'no style'             => array( array() ),
			'non-array transform'  => array( array( 'style' => array( 'transform' => '15deg' ) ) ),
			'invalid rotation'     => array( array( 'style' => array( 'transform' => array( 'rotate' => '15' ) ) ) ),
		);
	}

	/**
	 * @dataProvider data_scale_styles
	 *
	 * @param array  $transform    Transform styles.
	 * @param string $expected_css Expected inline CSS.
	 */
	public function test_scale_is_returned_as_a_wrapper_inline_style( $transform, $expected_css ) {
		$block_type = $this->register_transform_block(
			array(
				'rotate'    => true,
				'translate' => true,
				'scale'     => true,
			)
		);

		$this->assertSame(
			array( 'style' => $expected_css ),
			gutenberg_apply_transform_support( $block_type, array( 'style' => array( 'transform' => $transform ) ) )
		);
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_scale_styles() {
		return array(
			'number'                     => array( array( 'scale' => 1.2 ), 'scale:1.2;' ),
			'zero'                       => array( array( 'scale' => 0 ), 'scale:0;' ),
			'percentage'                 => array( array( 'scale' => '120%' ), 'scale:120%;' ),
			'with a rotation and offset' => array(
				array(
					'rotate'    => '15deg',
					'translate' => array( 'x' => '1em' ),
					'scale'     => '0.5',
				),
				'rotate:15deg;--wp--style--translate-x:1em;translate:var(--wp--style--translate-x, 0) var(--wp--style--translate-y, 0);scale:0.5;',
			),
		);
	}

	/**
	 * @dataProvider data_no_scale_styles
	 *
	 * @param array $supports Transform block support configuration.
	 * @param mixed $scale    Scale value.
	 */
	public function test_no_scale_styles( $supports, $scale ) {
		$block_type = $this->register_transform_block( $supports );

		$this->assertSame(
			array(),
			gutenberg_apply_transform_support( $block_type, array( 'style' => array( 'transform' => array( 'scale' => $scale ) ) ) )
		);
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_no_scale_styles() {
		return array(
			'no scale support'   => array( array( 'rotate' => true ), 1.2 ),
			'skip serialization' => array(
				array(
					'scale'                           => true,
					'__experimentalSkipSerialization' => array( 'scale' ),
				),
				1.2,
			),
			'negative'           => array( array( 'scale' => true ), -1 ),
			'two values'         => array( array( 'scale' => true ), '1.2 1.5' ),
			'var()'              => array( array( 'scale' => true ), 'var(--scale)' ),
			'object'             => array( array( 'scale' => true ), array( 'x' => 1.2 ) ),
		);
	}
}
