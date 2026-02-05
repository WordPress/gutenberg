<?php
/**
 * Test the aria-label block support.
 *
 * @package gutenberg
 */
class WP_Block_Supports_Aria_Label_Test extends WP_UnitTestCase {
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
	 * Registers a new block for testing aria-label support.
	 *
	 * @param string $block_name Name for the test block.
	 * @param array  $supports   Array defining block support configuration.
	 *
	 * @return WP_Block_Type The block type for the newly registered test block.
	 */
	private function register_aria_label_block_with_support( $block_name, $supports = array() ) {
		$this->test_block_name = $block_name;
		register_block_type(
			$this->test_block_name,
			array(
				'api_version' => 3,
				'supports'    => $supports,
			)
		);
		$registry = WP_Block_Type_Registry::get_instance();

		return $registry->get_registered( $this->test_block_name );
	}

	/**
	 * Tests that aria-label block support works as expected.
	 *
	 * @dataProvider data_aria_label_block_support
	 *
	 * @param boolean|array $support Aria label block support configuration.
	 * @param string        $value   Aria label value for attribute object.
	 * @param array         $expected Expected aria-label attributes.
	 */
	public function test_gutenberg_apply_aria_label_support( $support, $value, $expected ) {
		$block_type  = self::register_aria_label_block_with_support(
			'test/aria-label-block',
			array( 'ariaLabel' => $support )
		);
		$block_attrs = array( 'ariaLabel' => $value );
		$actual      = gutenberg_apply_aria_label_support( $block_type, $block_attrs );

		$this->assertSame( $expected, $actual );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_aria_label_block_support() {
		return array(
			'aria-label attribute is applied' => array(
				'support'  => true,
				'value'    => 'Label',
				'expected' => array( 'aria-label' => 'Label' ),
			),
			'aria-label attribute is not applied if block does not support it' => array(
				'support'  => false,
				'value'    => 'Label',
				'expected' => array(),
			),
			'aria-label attribute is not applied when serialization is skipped' => array(
				'support'  => array(
					'__experimentalSkipSerialization' => true,
				),
				'value'    => 'Label',
				'expected' => array(),
			),
		);
	}
}
