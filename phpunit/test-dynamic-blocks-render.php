<?php

class DynamicBlocksRenderTest extends WP_UnitTestCase {
	/**
	 * @expectedIncorrectUsage register_block
	 */
	function test_invalid_non_string_slugs() {
		register_block( 1, array() );
	}

	/**
	 * @expectedIncorrectUsage register_block
	 */
	function test_invalid_slugs_without_namespace() {
		register_block( 'text', array() );
	}

	function render_dummy_block( $attributes ) {
		return $attributes[ 'value' ];
	}

	function test_register_block() {
		$settings = array( 'render' => [ $this, 'render_dummy_block' ] );
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
