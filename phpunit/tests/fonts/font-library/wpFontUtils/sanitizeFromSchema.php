<?php
/**
 * Test WP_Font_Utils::sanitize_from_schema().
 *
 * @package WordPress
 * @subpackage Font Library
 *
 * @group fonts
 * @group font-library
 *
 * @covers WP_Font_Utils::sanitize_from_schema
 */
class Tests_Fonts_WpFontUtils_SanitizeFromSchema extends WP_UnitTestCase {
	/**
	 * @dataProvider data_sanitize_from_schema
	 *
	 * @param array $data     Data to sanitize.
	 * @param array $schema   Schema to use for sanitization.
	 * @param array $expected Expected result.
	 */
	public function test_sanitize_from_schema( $data, $schema, $expected ) {
		$result = WP_Font_Utils::sanitize_from_schema( $data, $schema );

		$this->assertSame( $result, $expected );
	}

	public function data_sanitize_from_schema() {
		return array(
			'One level associative array'  => array(
				'data'     => array(
					'slug'       => 'open      -       sans</style><script>alert("xss")</script>',
					'fontFamily' => 'Open Sans, sans-serif</style><script>alert("xss")</script>',
					'src'        => 'https://wordpress.org/example.json</style><script>alert("xss")</script>',
				),
				'schema'   => array(
					'slug'       => 'sanitize_title',
					'fontFamily' => 'sanitize_text_field',
					'src'        => 'sanitize_url',
				),
				'expected' => array(
					'slug'       => 'open-sansalertxss',
					'fontFamily' => 'Open Sans, sans-serif',
					'src'        => 'https://wordpress.org/example.json/stylescriptalert(xss)/script',
				),
			),

			'Nested associative arrays'    => array(
				'data'     => array(
					'slug'       => 'open      -       sans</style><script>alert("xss")</script>',
					'fontFamily' => 'Open Sans, sans-serif</style><script>alert("xss")</script>',
					'src'        => 'https://wordpress.org/example.json</style><script>alert("xss")</script>',
					'nested'     => array(
						'key1'    => 'value1</style><script>alert("xss")</script>',
						'key2'    => 'value2</style><script>alert("xss")</script>',
						'nested2' => array(
							'key3' => 'value3</style><script>alert("xss")</script>',
							'key4' => 'value4</style><script>alert("xss")</script>',
						),
					),
				),
				'schema'   => array(
					'slug'       => 'sanitize_title',
					'fontFamily' => 'sanitize_text_field',
					'src'        => 'sanitize_url',
					'nested'     => array(
						'key1'    => 'sanitize_text_field',
						'key2'    => 'sanitize_text_field',
						'nested2' => array(
							'key3' => 'sanitize_text_field',
							'key4' => 'sanitize_text_field',
						),
					),
				),
				'expected' => array(
					'slug'       => 'open-sansalertxss',
					'fontFamily' => 'Open Sans, sans-serif',
					'src'        => 'https://wordpress.org/example.json/stylescriptalert(xss)/script',
					'nested'     => array(
						'key1'    => 'value1',
						'key2'    => 'value2',
						'nested2' => array(
							'key3' => 'value3',
							'key4' => 'value4',
						),
					),
				),
			),

			'Indexed arrays'               => array(
				'data'     => array(
					'slug' => 'oPeN SaNs',
					'enum' => array(
						'value1<script>alert("xss")</script>',
						'value2<script>alert("xss")</script>',
						'value3<script>alert("xss")</script>',
					),
				),
				'schema'   => array(
					'slug' => 'sanitize_title',
					'enum' => array( 'sanitize_text_field' ),
				),
				'expected' => array(
					'slug' => 'open-sans',
					'enum' => array( 'value1', 'value2', 'value3' ),
				),
			),

			'Nested indexed arrays'        => array(
				'data'     => array(
					'slug'     => 'OPEN-SANS',
					'name'     => 'Open Sans</style><script>alert("xss")</script>',
					'fontFace' => array(
						array(
							'fontFamily' => 'Open Sans, sans-serif</style><script>alert("xss")</script>',
							'src'        => 'https://wordpress.org/example.json/stylescriptalert(xss)/script',
						),
						array(
							'fontFamily' => 'Open Sans, sans-serif</style><script>alert("xss")</script>',
							'src'        => 'https://wordpress.org/example.json/stylescriptalert(xss)/script',
						),
					),
				),
				'schema'   => array(
					'slug'     => 'sanitize_title',
					'name'     => 'sanitize_text_field',
					'fontFace' => array(
						array(
							'fontFamily' => 'sanitize_text_field',
							'src'        => 'sanitize_url',
						),
					),
				),
				'expected' => array(
					'slug'     => 'open-sans',
					'name'     => 'Open Sans',
					'fontFace' => array(
						array(
							'fontFamily' => 'Open Sans, sans-serif',
							'src'        => 'https://wordpress.org/example.json/stylescriptalert(xss)/script',
						),
						array(
							'fontFamily' => 'Open Sans, sans-serif',
							'src'        => 'https://wordpress.org/example.json/stylescriptalert(xss)/script',
						),
					),
				),
			),

			'Custom sanitization function' => array(
				'data'     => array(
					'key1' => 'abc123edf456ghi789',
					'key2' => 'value2',
				),
				'schema'   => array(
					'key1' => function ( $value ) {
						// Remove the six first character.
						return substr( $value, 6 );
					},
					'key2' => function ( $value ) {
						// Capitalize the value.
						return strtoupper( $value );
					},
				),
				'expected' => array(
					'key1' => 'edf456ghi789',
					'key2' => 'VALUE2',
				),
			),

			'Null as schema value'         => array(
				'data'     => array(
					'key1'   => 'value1<script>alert("xss")</script>',
					'key2'   => 'value2',
					'nested' => array(
						'key3' => 'value3',
						'key4' => 'value4',
					),
				),
				'schema'   => array(
					'key1'   => null,
					'key2'   => 'sanitize_text_field',
					'nested' => null,
				),
				'expected' => array(
					'key1'   => 'value1<script>alert("xss")</script>',
					'key2'   => 'value2',
					'nested' => array(
						'key3' => 'value3',
						'key4' => 'value4',
					),
				),
			),

			'Keys to remove'               => array(
				'data'     => array(
					'key1'              => 'value1',
					'key2'              => 'value2',
					'unwanted1'         => 'value',
					'unwanted2'         => 'value',
					'nestedAssociative' => array(
						'key5'      => 'value5',
						'unwanted3' => 'value',
					),
					'nestedIndexed'     => array(
						array(
							'key6'      => 'value7',
							'unwanted4' => 'value',
						),
						array(
							'key6'      => 'value7',
							'unwanted5' => 'value',
						),
					),

				),
				'schema'   => array(
					'key1'              => 'sanitize_text_field',
					'key2'              => 'sanitize_text_field',
					'nestedAssociative' => array(
						'key5' => 'sanitize_text_field',
					),
					'nestedIndexed'     => array(
						array(
							'key6' => 'sanitize_text_field',
						),
					),
				),
				'expected' => array(
					'key1'              => 'value1',
					'key2'              => 'value2',
					'nestedAssociative' => array(
						'key5' => 'value5',
					),
					'nestedIndexed'     => array(
						array(
							'key6' => 'value7',
						),
						array(
							'key6' => 'value7',
						),
					),
				),
			),

			'With empty structure'         => array(
				'data'     => array(
					'slug'   => 'open-sans',
					'nested' => array(
						'key1'    => 'value</style><script>alert("xss")</script>',
						'nested2' => array(
							'key2'    => 'value</style><script>alert("xss")</script>',
							'nested3' => array(
								'nested4' => array(),
							),
						),
					),
				),
				'schema'   => array(
					'slug'   => 'sanitize_title',
					'nested' => array(
						'key1'    => 'sanitize_text_field',
						'nested2' => array(
							'key2'    => 'sanitize_text_field',
							'nested3' => array(
								'key3'    => 'sanitize_text_field',
								'nested4' => array(
									'key4' => 'sanitize_text_field',
								),
							),
						),
					),
				),
				'expected' => array(
					'slug'   => 'open-sans',
					'nested' => array(
						'key1'    => 'value',
						'nested2' => array(
							'key2' => 'value',
						),
					),
				),
			),
		);
	}

	public function test_sanitize_from_schema_with_invalid_data() {
		$data   = 'invalid data';
		$schema = array(
			'key1' => 'sanitize_text_field',
			'key2' => 'sanitize_text_field',
		);

		$result = WP_Font_Utils::sanitize_from_schema( $data, $schema );

		$this->assertSame( $result, array() );
	}


	public function test_sanitize_from_schema_with_invalid_schema() {
		$data   = array(
			'key1' => 'value1',
			'key2' => 'value2',
		);
		$schema = 'invalid schema';

		$result = WP_Font_Utils::sanitize_from_schema( $data, $schema );

		$this->assertSame( $result, array() );
	}
}
