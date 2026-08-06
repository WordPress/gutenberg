<?php
/**
 * Tests for gutenberg_rest_cast_empty_objects_from_schema().
 *
 * @package gutenberg
 */

/**
 * @covers ::gutenberg_rest_cast_empty_objects_from_schema
 */
class Gutenberg_REST_Cast_Empty_Objects_From_Schema_Test extends WP_UnitTestCase {

	/**
	 * Casts the value and encodes it, since `{}` versus `[]` is only visible
	 * once serialized.
	 *
	 * @param mixed $value  The value to normalize.
	 * @param array $schema The schema node describing the value.
	 * @return string The JSON encoded, normalized value.
	 */
	private function cast_and_encode( $value, $schema ) {
		return wp_json_encode( gutenberg_rest_cast_empty_objects_from_schema( $value, $schema ) );
	}

	public function test_empty_object_encodes_as_object() {
		$this->assertSame( '{}', $this->cast_and_encode( array(), array( 'type' => 'object' ) ) );
	}

	public function test_empty_array_encodes_as_array() {
		$this->assertSame( '[]', $this->cast_and_encode( array(), array( 'type' => 'array' ) ) );
	}

	public function test_empty_value_with_object_in_type_list_encodes_as_object() {
		$this->assertSame( '{}', $this->cast_and_encode( array(), array( 'type' => array( 'object', 'boolean' ) ) ) );
	}

	public function test_non_array_values_are_returned_unchanged() {
		$this->assertFalse( gutenberg_rest_cast_empty_objects_from_schema( false, array( 'type' => array( 'object', 'boolean' ) ) ) );
		$this->assertSame( 'text', gutenberg_rest_cast_empty_objects_from_schema( 'text', array( 'type' => 'string' ) ) );
	}

	public function test_value_without_schema_is_returned_unchanged() {
		$this->assertSame( array(), gutenberg_rest_cast_empty_objects_from_schema( array(), array() ) );
	}

	public function test_nested_properties_are_cast() {
		$schema = array(
			'type'       => 'object',
			'properties' => array(
				'layout' => array(
					'type'       => 'object',
					'properties' => array(
						'styles' => array( 'type' => 'object' ),
					),
				),
				'fields' => array( 'type' => 'array' ),
			),
		);

		$this->assertSame(
			'{"layout":{"styles":{}},"fields":[]}',
			$this->cast_and_encode(
				array(
					'layout' => array( 'styles' => array() ),
					'fields' => array(),
				),
				$schema
			)
		);
	}

	public function test_object_emptied_of_known_properties_is_still_cast() {
		$schema = array(
			'type'       => 'object',
			'properties' => array(
				'layout' => array( 'type' => 'object' ),
			),
		);

		$this->assertSame( '{}', $this->cast_and_encode( array(), $schema ) );
	}

	public function test_array_items_are_cast() {
		$schema = array(
			'type'  => 'array',
			'items' => array( 'type' => 'object' ),
		);

		$this->assertSame( '[{},{}]', $this->cast_and_encode( array( array(), array() ), $schema ) );
	}

	public function test_additional_properties_are_cast() {
		$schema = array(
			'type'                 => 'object',
			'properties'           => array(
				'known' => array( 'type' => 'array' ),
			),
			'additionalProperties' => array( 'type' => 'object' ),
		);

		$this->assertSame(
			'{"known":[],"title":{}}',
			$this->cast_and_encode(
				array(
					'known' => array(),
					'title' => array(),
				),
				$schema
			)
		);
	}

	public function test_boolean_additional_properties_are_left_alone() {
		$schema = array(
			'type'                 => 'object',
			'additionalProperties' => true,
		);

		$this->assertSame( '{"extra":[]}', $this->cast_and_encode( array( 'extra' => array() ), $schema ) );
	}

	/**
	 * @dataProvider data_union_keywords
	 *
	 * @param string $keyword The union keyword, `oneOf` or `anyOf`.
	 */
	public function test_empty_value_is_cast_when_a_union_branch_allows_an_object( $keyword ) {
		$schema = array(
			$keyword => array(
				array( 'type' => 'string' ),
				array( 'type' => 'object' ),
			),
		);

		$this->assertSame( '{}', $this->cast_and_encode( array(), $schema ) );
	}

	/**
	 * @dataProvider data_union_keywords
	 *
	 * @param string $keyword The union keyword, `oneOf` or `anyOf`.
	 */
	public function test_empty_value_is_not_cast_when_no_union_branch_allows_an_object( $keyword ) {
		$schema = array(
			$keyword => array(
				array( 'type' => 'string' ),
				array( 'type' => 'array' ),
			),
		);

		$this->assertSame( '[]', $this->cast_and_encode( array(), $schema ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_union_keywords() {
		return array(
			'oneOf' => array( 'oneOf' ),
			'anyOf' => array( 'anyOf' ),
		);
	}
}
