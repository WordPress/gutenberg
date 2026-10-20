<?php
/**
 * Tests for gutenberg_prepare_json_value_for_client().
 *
 * @package gutenberg
 */

/**
 * @covers ::gutenberg_prepare_json_value_for_client
 */
class Gutenberg_Prepare_JSON_Value_For_Client_Test extends WP_UnitTestCase {

	/**
	 * Data provider.
	 *
	 * @return array<string, array{0: mixed, 1: array<string, mixed>, 2: string}>
	 */
	public static function data_gutenberg_prepare_json_value_for_client() {
		return array(
			'scalar without schema'        => array(
				'value',
				array(),
				'"value"',
			),
			'null nullable object'         => array(
				null,
				array( 'type' => array( 'object', 'null' ) ),
				'null',
			),
			'no matching anyOf branch'     => array(
				array(),
				array(
					'anyOf' => array(
						array( 'type' => 'null' ),
					),
				),
				'[]',
			),
			'no matching oneOf branch'     => array(
				array(),
				array(
					'oneOf' => array(
						array( 'type' => 'null' ),
					),
				),
				'[]',
			),
			'empty object'                 => array(
				array(),
				array( 'type' => 'object' ),
				'{}',
			),
			'empty nullable object'        => array(
				array(),
				array( 'type' => array( 'object', 'null' ) ),
				'{}',
			),
			'empty object via anyOf'       => array(
				array(),
				array(
					'anyOf' => array(
						array( 'type' => 'object' ),
						array( 'type' => 'null' ),
					),
				),
				'{}',
			),
			'empty object via oneOf'       => array(
				array(),
				array(
					'oneOf' => array(
						array( 'type' => 'object' ),
						array( 'type' => 'null' ),
					),
				),
				'{}',
			),
			'empty anyOf object or array'  => array(
				array(),
				array(
					'anyOf' => array(
						array( 'type' => 'object' ),
						array( 'type' => 'array' ),
					),
				),
				'[]',
			),
			'empty oneOf object or array'  => array(
				array(),
				array(
					'oneOf' => array(
						array( 'type' => 'object' ),
						array( 'type' => 'array' ),
					),
				),
				'[]',
			),
			'empty mixed object via oneOf' => array(
				array(),
				array(
					'type'  => array( 'object', 'array' ),
					'oneOf' => array(
						array( 'type' => 'object' ),
						array( 'type' => 'null' ),
					),
				),
				'{}',
			),
			'nested anyOf array match'     => array(
				array(),
				array(
					'anyOf' => array(
						array( 'type' => 'object' ),
						array(
							'anyOf' => array(
								array( 'type' => 'array' ),
								array( 'type' => 'null' ),
							),
						),
					),
				),
				'[]',
			),
			'nested oneOf array match'     => array(
				array(),
				array(
					'anyOf' => array(
						array( 'type' => 'object' ),
						array(
							'oneOf' => array(
								array( 'type' => 'array' ),
								array( 'type' => 'null' ),
							),
						),
					),
				),
				'[]',
			),
			'untyped branch array match'   => array(
				array(),
				array(
					'anyOf' => array(
						array( 'type' => 'object' ),
						array(
							'type'  => 'array',
							'oneOf' => array(
								array( 'maxItems' => 10 ),
							),
						),
					),
				),
				'[]',
			),
			'parent rejects array branch'  => array(
				array(),
				array(
					'anyOf' => array(
						array( 'type' => 'object' ),
						array(
							'type'     => 'array',
							'minItems' => 1,
							'anyOf'    => array(
								array( 'maxItems' => 10 ),
							),
						),
					),
				),
				'{}',
			),
			'mixed branch rejects array'   => array(
				array(),
				array(
					'anyOf' => array(
						array( 'type' => 'object' ),
						array(
							'type'     => array( 'object', 'array' ),
							'minItems' => 1,
						),
					),
				),
				'{}',
			),
			'inferred type rejects array'  => array(
				array(),
				array(
					'anyOf' => array(
						array( 'type' => 'object' ),
						array(
							'anyOf'    => array(
								array( 'type' => 'object' ),
								array( 'type' => 'array' ),
							),
							'minItems' => 1,
						),
					),
				),
				'{}',
			),
			'list via anyOf array branch'  => array(
				array( array() ),
				array(
					'anyOf' => array(
						array(
							'type'                 => 'object',
							'additionalProperties' => array( 'type' => 'object' ),
						),
						array(
							'type'  => 'array',
							'items' => array( 'type' => 'array' ),
						),
					),
				),
				'[[]]',
			),
			'empty object or array'        => array(
				array(),
				array( 'type' => array( 'object', 'array' ) ),
				'[]',
			),
			'empty array or object'        => array(
				array(),
				array( 'type' => array( 'array', 'object' ) ),
				'[]',
			),
			'non-empty object'             => array(
				array( 'key' => 'value' ),
				array( 'type' => 'object' ),
				'{"key":"value"}',
			),
			'nested object via anyOf'      => array(
				array( 'nested' => array() ),
				array(
					'anyOf' => array(
						array(
							'type'       => 'object',
							'properties' => array(
								'nested' => array( 'type' => 'object' ),
							),
						),
						array( 'type' => 'null' ),
					),
				),
				'{"nested":{}}',
			),
			'nested object via oneOf'      => array(
				array( 'nested' => array() ),
				array(
					'oneOf' => array(
						array(
							'type'       => 'object',
							'properties' => array(
								'nested' => array( 'type' => 'object' ),
							),
						),
						array( 'type' => 'null' ),
					),
				),
				'{"nested":{}}',
			),
			'sparse mixed object or array' => array(
				array( 2 => array() ),
				array(
					'type'       => array( 'object', 'array' ),
					'properties' => array(
						2 => array( 'type' => 'object' ),
					),
					'items'      => array( 'type' => 'array' ),
				),
				'{"2":{}}',
			),
			'list mixed object or array'   => array(
				array( array() ),
				array(
					'type'       => array( 'object', 'array' ),
					'properties' => array(
						0 => array( 'type' => 'array' ),
					),
					'items'      => array( 'type' => 'object' ),
				),
				'[{}]',
			),
		);
	}

	/**
	 * Tests that JSON values are prepared according to their schema type.
	 *
	 * @dataProvider data_gutenberg_prepare_json_value_for_client
	 *
	 * @param mixed                $value    The value to prepare.
	 * @param array<string, mixed> $schema   The schema describing the value.
	 * @param string               $expected The expected encoded value.
	 */
	public function test_gutenberg_prepare_json_value_for_client( $value, $schema, $expected ) {
		$prepared = gutenberg_prepare_json_value_for_client( $value, $schema );

		$this->assertSame( $expected, wp_json_encode( $prepared ) );
	}

	/**
	 * Data provider for test_nested_array_branch_preference().
	 *
	 * @return array<string, array{0: string, 1: string, 2: array}>
	 */
	public static function data_nested_array_branch_preference() {
		return array(
			'anyOf within anyOf, empty' => array( 'anyOf', 'anyOf', array() ),
			'oneOf within oneOf, empty' => array( 'oneOf', 'oneOf', array() ),
			'oneOf within anyOf, list'  => array( 'anyOf', 'oneOf', array( array() ) ),
			'anyOf within oneOf, list'  => array( 'oneOf', 'anyOf', array( array() ) ),
		);
	}

	/**
	 * Tests that array preference requires a matching nested array branch.
	 *
	 * @dataProvider data_nested_array_branch_preference
	 *
	 * @param string $outer_keyword The outer combining keyword.
	 * @param string $inner_keyword The nested combining keyword.
	 * @param array  $value         The value to prepare.
	 */
	public function test_nested_array_branch_preference( $outer_keyword, $inner_keyword, $value ) {
		$schema = array(
			'type'         => array( 'object', 'array' ),
			$outer_keyword => array(
				array(
					$inner_keyword => array(
						array(
							'type'                 => 'object',
							'additionalProperties' => array( 'type' => 'object' ),
						),
						array(
							'type'     => 'array',
							'minItems' => 2,
						),
					),
				),
				array( 'type' => 'array' ),
			),
		);

		$this->assertSame(
			wp_json_encode( $value ),
			wp_json_encode( gutenberg_prepare_json_value_for_client( $value, $schema ) ),
			'A nested array branch that rejects the value must not take precedence over a matching array branch.'
		);

		// Without a matching array alternative, prepare the matching object branch.
		array_pop( $schema[ $outer_keyword ] );
		$this->assertSame(
			empty( $value ) ? '{}' : '[{}]',
			wp_json_encode( gutenberg_prepare_json_value_for_client( $value, $schema ) )
		);
	}

	/**
	 * Tests that nested JSON values are prepared using their sub-schemas.
	 *
	 */
	public function test_gutenberg_prepare_json_value_for_client_prepares_nested_values() {
		$object = (object) array( 'nested' => array() );
		$value  = array(
			'known'      => array(),
			'list'       => array( array() ),
			'empty_list' => array(),
			'container'  => $object,
			'extra'      => array(),
		);
		$schema = array(
			'type'                 => 'object',
			'properties'           => array(
				'known'      => array( 'type' => 'object' ),
				'list'       => array(
					'type'  => 'array',
					'items' => array( 'type' => 'object' ),
				),
				'empty_list' => array( 'type' => 'array' ),
				'container'  => array(
					'type'       => 'object',
					'properties' => array(
						'nested' => array( 'type' => 'object' ),
					),
				),
			),
			'additionalProperties' => array( 'type' => 'object' ),
		);

		$prepared = gutenberg_prepare_json_value_for_client( $value, $schema );

		$this->assertSame(
			'{"known":{},"list":[{}],"empty_list":[],"container":{"nested":{}},"extra":{}}',
			wp_json_encode( $prepared )
		);
		$this->assertSame( '[]', wp_json_encode( $object->nested ), 'The original object should not be modified.' );
	}

	/**
	 * Tests that values from JsonSerializable objects are prepared.
	 *
	 */
	public function test_gutenberg_prepare_json_value_for_client_prepares_json_serializable_values() {
		$value  = new class() implements JsonSerializable {
			/**
			 * Returns the value for JSON serialization.
			 *
			 * @return array<string, array<mixed>>
			 */
			#[\ReturnTypeWillChange]
			public function jsonSerialize() {
				return array( 'nested' => array() );
			}
		};
		$schema = array(
			'type'       => 'object',
			'properties' => array(
				'nested' => array( 'type' => 'object' ),
			),
		);

		$prepared = gutenberg_prepare_json_value_for_client( $value, $schema );

		$this->assertSame( '{"nested":{}}', wp_json_encode( $prepared ) );
	}

	/**
	 * Tests that pattern properties take precedence over additional properties.
	 *
	 */
	public function test_gutenberg_prepare_json_value_for_client_uses_pattern_properties() {
		$value  = array( 'item-1' => array() );
		$schema = array(
			'type'                 => 'object',
			'patternProperties'    => array(
				'^item-' => array( 'type' => 'object' ),
			),
			'additionalProperties' => array( 'type' => 'array' ),
		);

		$prepared = gutenberg_prepare_json_value_for_client( $value, $schema );

		$this->assertSame( '{"item-1":{}}', wp_json_encode( $prepared ) );
	}
}
