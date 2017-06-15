<?php
/**
 * Dynamic blocks rendering Test
 *
 * @package Gutenberg
 */

/**
 * Test do_blocks
 */
class Dynamic_Blocks_Render_Test extends WP_UnitTestCase {
	/**
	 * Dummy block rendering function.
	 *
	 * @param  array $attributes Block attributes.
	 *
	 * @return string             Block output.
	 */
	function render_dummy_block( $attributes ) {
		return $attributes['value'];
	}

	function tearDown() {
		$GLOBALS['wp_registered_blocks'] = array();
	}

	function test_dynamic_block_rendering() {
		$settings = array(
			'render' => array(
				$this,
				'render_dummy_block',
			),
		);
		register_block_type( 'core/dummy', $settings );
		$post_content =
			'before' .
			'<!-- wp:core/dummy value="b1" --><!-- /wp:core/dummy -->' .
			'between' .
			'<!-- wp:core/dummy value="b2" --><!-- /wp:core/dummy -->' .
			'after';

		$updated_post_content = do_blocks( $post_content );
		$this->assertEquals( $updated_post_content,
			'before' .
			'b1' .
			'between' .
			'b2' .
			'after'
		);
	}

	function test_dynamic_block_rendering_with_content() {
		$settings = array(
			'render' => array(
				$this,
				'render_dummy_block',
			),
		);
		register_block_type( 'core/dummy', $settings );
		$post_content =
			'before' .
			'<!-- wp:core/dummy value="b1" -->this should be ignored<!-- /wp:core/dummy -->' .
			'between' .
			'<!-- wp:core/dummy value="b2" -->this should also be ignored<!-- /wp:core/dummy -->' .
			'after';

		$updated_post_content = do_blocks( $post_content );
		$this->assertEquals( $updated_post_content,
			'before' .
			'b1' .
			'between' .
			'b2' .
			'after'
		);
	}
}
