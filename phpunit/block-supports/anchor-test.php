<?php
/**
 * Test the anchor block support.
 *
 * @package gutenberg
 */
class WP_Block_Supports_Anchor_Test extends WP_UnitTestCase {
	/**
	 * @var string
	 */
	const TEST_BLOCK_NAME = 'test/anchor-block';

	public function tear_down() {
		unregister_block_type( self::TEST_BLOCK_NAME );
		parent::tear_down();
	}

	/**
	 * Tests that anchor block support attribute registration works as expected.
	 *
	 * @covers ::gutenberg_register_anchor_support
	 *
	 * @dataProvider data_gutenberg_register_anchor_support
	 *
	 * @param bool                                      $support  Anchor block support configuration.
	 * @param array<string, array<string, string>>|null $value    Attributes array for the block.
	 * @param array<string, array<string, string>>      $expected Expected attributes for the block.
	 */
	public function test_gutenberg_register_anchor_support( bool $support, ?array $value, array $expected ) {
		register_block_type(
			self::TEST_BLOCK_NAME,
			array(
				'api_version' => 3,
				'supports'    => array( 'anchor' => $support ),
				'attributes'  => $value,
			)
		);
		$registry   = WP_Block_Type_Registry::get_instance();
		$block_type = $registry->get_registered( self::TEST_BLOCK_NAME );
		$this->assertInstanceOf( WP_Block_Type::class, $block_type );
		gutenberg_register_anchor_support( $block_type );
		$actual = $block_type->attributes;
		$this->assertIsArray( $actual );
		$expected = array_merge( WP_Block_Type::GLOBAL_ATTRIBUTES, $expected );
		$this->assertSameSetsWithIndex( $expected, $actual );
	}

	/**
	 * Tests that anchor block support is applied as expected.
	 *
	 * @covers ::gutenberg_apply_anchor_support
	 *
	 * @dataProvider data_gutenberg_apply_anchor_support
	 *
	 * @param bool                                 $support  Anchor block support configuration.
	 * @param mixed                                $value    Anchor value for attribute object.
	 * @param array<string, array<string, string>> $expected Expected anchor block support output.
	 */
	public function test_gutenberg_apply_anchor_support( bool $support, $value, array $expected ) {
		register_block_type(
			self::TEST_BLOCK_NAME,
			array(
				'api_version' => 3,
				'supports'    => array( 'anchor' => $support ),
			)
		);
		$registry   = WP_Block_Type_Registry::get_instance();
		$block_type = $registry->get_registered( self::TEST_BLOCK_NAME );
		$this->assertInstanceOf( WP_Block_Type::class, $block_type );
		$block_attrs = array( 'anchor' => $value );
		$actual      = gutenberg_apply_anchor_support( $block_type, $block_attrs );
		$this->assertSame( $expected, $actual );
	}

	/**
	 * Data provider for test_gutenberg_register_anchor_support().
	 *
	 * @return array<string, array<string, mixed>>
	 */
	public function data_gutenberg_register_anchor_support(): array {
		return array(
			'anchor attribute is registered when block supports anchor' => array(
				'support'  => true,
				'value'    => null,
				'expected' => array(
					'anchor' => array(
						'type' => 'string',
					),
				),
			),
			'anchor attribute is not registered when block does not support anchor' => array(
				'support'  => false,
				'value'    => null,
				'expected' => array(),
			),
			'anchor attribute is added to existing attributes' => array(
				'support'  => true,
				'value'    => array(
					'foo' => array(
						'type' => 'string',
					),
				),
				'expected' => array(
					'foo'    => array(
						'type' => 'string',
					),
					'anchor' => array(
						'type' => 'string',
					),
				),
			),
			'existing anchor attribute is not overwritten' => array(
				'support'  => true,
				'value'    => array(
					'anchor' => array(
						'type'    => 'string',
						'default' => 'default-anchor',
					),
				),
				'expected' => array(
					'anchor' => array(
						'type'    => 'string',
						'default' => 'default-anchor',
					),
				),
			),
		);
	}

	/**
	 * Data provider for test_gutenberg_apply_anchor_support().
	 *
	 * @return array<string, array<string, mixed>>
	 */
	public function data_gutenberg_apply_anchor_support(): array {
		return array(
			'anchor id attribute is applied'          => array(
				'support'  => true,
				'value'    => 'my-anchor',
				'expected' => array( 'id' => 'my-anchor' ),
			),
			'anchor id attribute is not applied if block does not support it' => array(
				'support'  => false,
				'value'    => 'my-anchor',
				'expected' => array(),
			),
			'empty anchor value returns empty array'  => array(
				'support'  => true,
				'value'    => '',
				'expected' => array(),
			),
			'null anchor value returns empty array'   => array(
				'support'  => true,
				'value'    => null,
				'expected' => array(),
			),
			'whitespace-only anchor value is applied' => array(
				'support'  => true,
				'value'    => '   ',
				'expected' => array( 'id' => '   ' ),
			),
			'anchor with hyphen and numbers'          => array(
				'support'  => true,
				'value'    => 'section-123',
				'expected' => array( 'id' => 'section-123' ),
			),
			'anchor with underscore'                  => array(
				'support'  => true,
				'value'    => 'my_anchor_id',
				'expected' => array( 'id' => 'my_anchor_id' ),
			),
			'anchor with colon (valid in HTML5)'      => array(
				'support'  => true,
				'value'    => 'my:anchor',
				'expected' => array( 'id' => 'my:anchor' ),
			),
			'anchor with period (valid in HTML5)'     => array(
				'support'  => true,
				'value'    => 'my.anchor',
				'expected' => array( 'id' => 'my.anchor' ),
			),
			'numeric anchor value'                    => array(
				'support'  => true,
				'value'    => '123',
				'expected' => array( 'id' => '123' ),
			),
			'zero string anchor value is applied'     => array(
				'support'  => true,
				'value'    => '0',
				'expected' => array( 'id' => '0' ),
			),
			'false value is treated as empty'         => array(
				'support'  => true,
				'value'    => false,
				'expected' => array(),
			),
		);
	}
}
