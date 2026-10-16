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

	/**
	 * Regression test for https://github.com/WordPress/gutenberg/issues/81084.
	 *
	 * A timezone-naive datetime string set manually via the date picker must be
	 * interpreted as site-local time. Previously, strtotime() assumed UTC and
	 * wp_date() then applied the site offset again — shifting the displayed time
	 * by the full UTC offset.
	 *
	 * @covers ::render_block_core_post_date
	 */
	public function test_render_with_explicit_date_does_not_double_apply_timezone_offset() {
		$original_timezone = get_option( 'timezone_string' );
		$original_offset   = get_option( 'gmt_offset' );

		// Use UTC+5:30 — a clearly non-UTC offset where the double-shift is obvious.
		update_option( 'timezone_string', 'Asia/Kolkata' );
		update_option( 'gmt_offset', '' );

		try {
			$attributes = array(
				// Timezone-naive string, exactly as emitted by DateTimePicker.
				'datetime' => '2026-07-30T04:30:00',
				'format'   => 'H:i',
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

			// The rendered time must match the manually-set site-local time.
			$this->assertStringContainsString(
				'04:30',
				$output,
				'The time should render in site-local time, not UTC.'
			);

			// Confirm the double-offset value (04:30 + 5:30 = 10:00) is absent.
			$this->assertStringNotContainsString(
				'10:00',
				$output,
				'The site timezone offset must not be applied twice.'
			);
		} finally {
			update_option( 'timezone_string', $original_timezone );
			update_option( 'gmt_offset', $original_offset );
		}
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
