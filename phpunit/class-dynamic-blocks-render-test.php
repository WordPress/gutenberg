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

	/**
	 * Successfull dynamic block rendering
	 */
	function test_register_block() {
		$settings = array(
			'render' => array(
				$this,
				'render_dummy_block',
			),
		);
		register_block( 'core/dummy', $settings );
		$post_content =
			'before' .
			'<!-- wp:core/dummy value:b1 --><!-- /wp:core/dummy -->' .
			'between' .
			'<!-- wp:core/dummy value:b2 --><!-- /wp:core/dummy -->' .
			'after';

		$updated_post_content = do_blocks( $post_content );
		unregister_block( 'core/dummy' );
		$this->assertEquals( $updated_post_content,
			'before' .
			'b1' .
			'between' .
			'b2' .
			'after'
		);
	}
}
