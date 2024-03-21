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

	public function test_shadow_object_with_no_styles() {
		$block_type  = self::register_shadow_block_with_support(
			'test/shadow-object-with-no-styles',
			array(
				'shadow' => true,
			)
		);
		$block_attrs = array( 'style' => array( 'shadow' => '' ) );
		$actual      = gutenberg_apply_shadow_support( $block_type, $block_attrs );
		$expected    = array();

		$this->assertSame( $expected, $actual );
	}

	public function test_shadow_without_support() {
		$block_type = self::register_shadow_block_with_support(
			'test/shadow-without-support',
			array(
				'shadow' => false,
			)
		);
		$block_atts = array(
			'style' => array(
				'shadow' => '1px 1px 1px #000',
			),
		);

		$actual   = gutenberg_apply_shadow_support( $block_type, $block_atts );
		$expected = array();

		$this->assertSame( $expected, $actual );
	}

	public function test_shadow_with_single_shadow() {
		$block_type = self::register_shadow_block_with_support(
			'test/shadow-with-single-shadow',
			array(
				'shadow' => true,
			)
		);
		$block_atts = array(
			'style' => array(
				'shadow' => '1px 1px 1px #000',
			),
		);

		$actual   = gutenberg_apply_shadow_support( $block_type, $block_atts );
		$expected = array(
			'style' => 'box-shadow:1px 1px 1px #000;',
		);

		$this->assertSame( $expected, $actual );
	}

	public function test_shadow_with_comma_separated_shadows() {
		$block_type = self::register_shadow_block_with_support(
			'test/shadow-with-comma-separated-shadows',
			array(
				'shadow' => true,
			)
		);
		$block_atts = array(
			'style' => array(
				'shadow' => '1px 1px 1px #000, 2px 2px 2px #fff',
			),
		);

		$actual   = gutenberg_apply_shadow_support( $block_type, $block_atts );
		$expected = array(
			'style' => 'box-shadow:1px 1px 1px #000, 2px 2px 2px #fff;',
		);

		$this->assertSame( $expected, $actual );
	}

	public function test_shadow_with_named_shadow() {
		$block_type  = self::register_shadow_block_with_support(
			'test/shadow-with-named-shadow',
			array(
				'shadow' => true,
			)
		);
		$block_attrs = array(
			'style' => array(
				'shadow' => 'var:preset|shadow|natural',
			),
		);
		$actual      = gutenberg_apply_shadow_support( $block_type, $block_attrs );
		$expected    = array(
			'style' => 'box-shadow:var(--wp--preset--shadow--natural);',
		);

		$this->assertSame( $expected, $actual );
	}

	public function test_shadow_with_skipped_serialization() {
		$block_type = self::register_shadow_block_with_support(
			'test/shadow-with-skipped-serialization',
			array(
				'shadow' => array(
					'__experimentalSkipSerialization' => true,
				),
			)
		);
		$block_atts = array(
			'style' => array(
				'shadow' => '1px 1px 1px #000',
			),
		);

		$actual   = gutenberg_apply_shadow_support( $block_type, $block_atts );
		$expected = array();

		$this->assertSame( $expected, $actual );
	}
}
