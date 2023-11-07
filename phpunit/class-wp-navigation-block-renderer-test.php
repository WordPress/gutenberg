<?php

/**
 * Test the block WP_Navigation_Block_Renderer class.
 *
 * @package Gutenberg
 */

class WP_Navigation_Block_Renderer_Test extends WP_UnitTestCase {

	public function test_gutenberg_get_markup_for_inner_block_navigation_link() {

		// if site title or site logo, we manually add list items

		$parsed_blocks         = parse_blocks(
			'<!-- wp:navigation-link {"label":"Sample Page","type":"page","kind":"post-type","url":"/hello-world"} /-->'
		);
		$parsed_block          = $parsed_blocks[0];
		$context               = array();
		$navigation_link_block = new WP_Block( $parsed_block, $context );

		// Setup an empty testing instance of `WP_Navigation_Block_Renderer` and save the original.
		$reflection = new ReflectionClass( 'WP_Navigation_Block_Renderer' );
		/**
		 * Returns the markup for a single inner block.
		 *
		 * @param WP_Block $inner_block The inner block.
		 * @return string Returns the markup for a single inner block.
		 */
		$method = $reflection->getMethod( 'get_markup_for_inner_block' );
		$method->setAccessible( true );
		// Invoke the private method
		$result = $method->invoke( $reflection, $navigation_link_block );

		$expected = '<li class=" wp-block-navigation-item wp-block-navigation-link"><a class="wp-block-navigation-item__content"  href="/hello-world"><span class="wp-block-navigation-item__label">Sample Page</span></a></li>';
		$this->assertSame( $expected, $result );
	}
}
