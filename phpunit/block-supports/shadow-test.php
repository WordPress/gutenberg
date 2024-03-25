<?php

/**
 * Test the shadow block supports.
 *
 * @package Gutenberg
 */

class WP_Block_Supports_Shadow_Test extends WP_UnitTestCase {
	/**
	 * @var string|null
	 */
	private $test_block_name;

	public function set_up() {
		parent::set_up();
		$this->test_block_name = null;
	}

	public function tear_down() {
		unregister_block_type( $this->test_block_name );
		$this->test_block_name = null;
		parent::tear_down();
	}

	/**
	 * Registers a new block for testing shadow support.
	 *
	 * @param string $block_name Name for the test block.
	 * @param array  $supports   Array defining block support configuration.
	 *
	 * @return WP_Block_Type The block type for the newly registered test block.
	 */
	private function register_shadow_block_with_support( $block_name, $supports = array() ) {
		$this->test_block_name = $block_name;
		register_block_type(
			$this->test_block_name,
			array(
				'api_version' => 3,
				'attributes'  => array(
					'style' => array(
						'type' => 'object',
					),
				),
				'supports'    => $supports,
			)
		);
		$registry = WP_Block_Type_Registry::get_instance();

		return $registry->get_registered( $this->test_block_name );
	}

	/**
	 * Tests the generation of shadow block support styles.
	 *
	 * @dataProvider data_generate_shadow_fixtures
	 *
	 * @param boolean|array $support Shadow block support configuration.
	 * @param string        $value   Shadow style value for style attribute object.
	 * @param array         $expected       Expected shadow block support styles.
	 */
	public function test_gutenberg_apply_shadow_support( $support, $value, $expected ) {
		$block_type  = self::register_shadow_block_with_support(
			'test/shadow-block',
			array( 'shadow' => $support )
		);
		$block_attrs = array( 'style' => array( 'shadow' => $value ) );
		$actual      = gutenberg_apply_shadow_support( $block_type, $block_attrs );

		$this->assertSame( $expected, $actual );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_generate_shadow_fixtures() {
		return array(
			'with no styles'               => array(
				'support'  => true,
				'value'    => '',
				'expected' => array(),
			),
			'without support'              => array(
				'support'  => false,
				'value'    => '1px 1px 1px #000',
				'expected' => array(),
			),
			'with single shadow'           => array(
				'support'  => true,
				'value'    => '1px 1px 1px #000',
				'expected' => array( 'style' => 'box-shadow:1px 1px 1px #000;' ),
			),
			'with comma separated shadows' => array(
				'support'  => true,
				'value'    => '1px 1px 1px #000, 2px 2px 2px #fff',
				'expected' => array( 'style' => 'box-shadow:1px 1px 1px #000, 2px 2px 2px #fff;' ),
			),
			'with preset shadow'           => array(
				'support'  => true,
				'value'    => 'var:preset|shadow|natural',
				'expected' => array( 'style' => 'box-shadow:var(--wp--preset--shadow--natural);' ),
			),
			'with serialization skipped'   => array(
				'support'  => array( '__experimentalSkipSerialization' => true ),
				'value'    => '1px 1px 1px #000',
				'expected' => array(),
			),
		);
	}
}
