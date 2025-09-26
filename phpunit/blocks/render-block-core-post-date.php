<?php
/**
 * Tests for the gutenberg_render_block_core_post_date() function.
 *
 * @package WordPress
 * @subpackage Blocks
 *
 * @covers ::gutenberg_render_block_core_post_date
 * @group blocks
 */
class Test_Render_Block_Core_Post_Date extends WP_UnitTestCase {

	protected static $post_id;

	public static function wpSetUpBeforeClass( $factory ) {
		self::$post_id = $factory->post->create(
			array(
				'post_type'    => 'post',
				'post_status'  => 'publish',
				'post_name'    => 'tabby',
				'post_title'   => 'Tabby cats',
				'post_content' => 'Tabby cat content',
				'post_date'    => '2025-07-05 00:00:00',
			)
		);
	}

	public function set_up() {
		parent::set_up();

		$this->update_post_modified( self::$post_id, '2025-07-10 00:00:00' );
	}

	public function test_render_with_explicit_date_attribute() {
		$expected_date = '2025-03-02 00:00:00';

		$attributes = array(
			'datetime' => $expected_date,
		);

		$block = new WP_Block(
			array(
				'blockName' => 'core/post-date',
				'attrs'     => $attributes,
			),
			array(
				'postId' => self::$post_id,
			)
		);

		$output = $block->render();
		$this->assertStringContainsString( $expected_date, $output );
	}

	public function data_render_with_date_attribute_binding() {
		return array(
			'Publish date'  => array( 'date', 'get_the_date' ),
			'Modified date' => array( 'modified', 'get_the_modified_date' ),
		);
	}

	/**
	 * @dataProvider data_render_with_date_attribute_binding
	 */
	public function test_render_with_date_attribute_binding( $field, $expected_date_function ) {
		$expected_date = call_user_func( $expected_date_function, 'c', self::$post_id );

		$attributes = array(
			'metadata' => array(
				'bindings' => array(
					'datetime' => array(
						'source' => 'core/post-data',
						'args'   => array( 'key' => $field ),
					),
				),
			),
		);

		$block = new WP_Block(
			array(
				'blockName' => 'core/post-date',
				'attrs'     => $attributes,
			),
			array(
				'postId' => self::$post_id,
			)
		);

		$output = $block->render();
		$this->assertStringContainsString(
			$expected_date,
			$output,
			'The datetime attribute was not set correctly from the Block Bindings source.'
		);

		// Now verify that a fallback value is overridden by Block Bindings.
		$block->parsed_block['attrs']['datetime'] = '2025-01-01 00:00:00';

		$output = $block->render();
		$this->assertStringContainsString(
			$expected_date,
			$output,
			'The datetime attribute fallback value was not overridden by the Block Bindings source.'
		);
	}

	/**
	 * @dataProvider data_render_with_date_attribute_binding
	 */
	public function test_render_legacy_block( $field, $expected_date_function ) {
		$expected_date = call_user_func( $expected_date_function, 'c', self::$post_id );

		$attributes = array();

		if ( 'modified' === $field ) {
			$attributes['displayType'] = 'modified';
		}

		$block = new WP_Block(
			array(
				'blockName' => 'core/post-date',
				'attrs'     => $attributes,
			),
			array(
				'postId' => self::$post_id,
			)
		);

		$output = $block->render();
		$this->assertStringContainsString( $expected_date, $output );
	}

	public function test_render_modified_date_before_publish_date() {
		$this->update_post_modified( self::$post_id, '2025-07-01 00:00:00' );

		$attributes = array(
			'metadata' => array(
				'bindings' => array(
					'datetime' => array(
						'source' => 'core/post-data',
						'args'   => array( 'key' => 'modified' ),
					),
				),
			),
		);

		$block = new WP_Block(
			array(
				'blockName' => 'core/post-date',
				'attrs'     => $attributes,
			),
			array(
				'postId' => self::$post_id,
			)
		);

		$output = $block->render();
		$this->assertSame( '', $output );
	}
}
