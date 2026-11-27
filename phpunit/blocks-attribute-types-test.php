<?php
/**
 * Tests for the `datetime` and `url` block attribute types on WordPress versions without them.
 *
 * @package gutenberg
 */

class Gutenberg_Blocks_Attribute_Types_Test extends WP_UnitTestCase {
	public function test_filter_is_only_added_without_core_mapping(): void {
		$this->assertSame(
			! function_exists( '_wp_get_block_attribute_json_schema' ),
			false !== has_filter( 'register_block_type_args', 'gutenberg_register_field_api_attribute_types_as_string' )
		);
	}

	public function test_datetime_and_url_are_registered_as_string(): void {
		$args = gutenberg_register_field_api_attribute_types_as_string(
			array(
				'attributes' => array(
					'date'  => array(
						'type' => 'datetime',
						'role' => 'content',
					),
					'link'  => array( 'type' => 'url' ),
					'title' => array( 'type' => 'string' ),
					'size'  => array( 'type' => array( 'string', 'null' ) ),
				),
			)
		);

		$this->assertSame(
			array(
				'date'  => array(
					'type' => 'string',
					'role' => 'content',
				),
				'link'  => array( 'type' => 'string' ),
				'title' => array( 'type' => 'string' ),
				'size'  => array( 'type' => array( 'string', 'null' ) ),
			),
			$args['attributes']
		);
	}

	public function test_args_without_attributes_are_unchanged(): void {
		$this->assertSame( array( 'title' => 'Fake' ), gutenberg_register_field_api_attribute_types_as_string( array( 'title' => 'Fake' ) ) );
	}

	public function test_post_date_renders_without_notice(): void {
		$this->assertStringContainsString(
			'<time datetime="2025-12-03T17:48:48.089Z">',
			do_blocks( '<!-- wp:post-date {"datetime":"2025-12-03T17:48:48.089Z"} /-->' )
		);
	}
}
