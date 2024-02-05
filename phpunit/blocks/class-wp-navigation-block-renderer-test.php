<?php

/**
 * Test the block WP_Navigation_Block_Renderer class.
 *
 * @package Gutenberg
 */

class WP_Navigation_Block_Renderer_Test extends WP_UnitTestCase {

	/**
	 * Test that navigation links are wrapped in list items to preserve accessible markup
	 *
	 * @group navigation-renderer
	 *
	 * @covers WP_Navigation_Block_Renderer::get_markup_for_inner_block
	 */
	public function test_gutenberg_default_block_is_enclosed_in_li_tags() {

		$parsed_blocks         = parse_blocks(
			'<!-- wp:navigation-link {"label":"Sample Page","type":"page","kind":"post-type","url":"/hello-world"} /-->'
		);
		$parsed_block          = $parsed_blocks[0];
		$context               = array();
		$navigation_link_block = new WP_Block( $parsed_block, $context );

		// Setup an empty testing instance of `WP_Navigation_Block_Renderer` and save the original.
		$reflection = new ReflectionClass( 'WP_Navigation_Block_Renderer_Gutenberg' );
		$method     = $reflection->getMethod( 'get_markup_for_inner_block' );
		$method->setAccessible( true );
		// Invoke the private method.
		$result = $method->invoke( $reflection, $navigation_link_block );

		$expected = '<li class=" wp-block-navigation-item wp-block-navigation-link"><a class="wp-block-navigation-item__content"  href="/hello-world"><span class="wp-block-navigation-item__label">Sample Page</span></a></li>';
		$this->assertEquals( $expected, $result );
	}

	/**
	 * Test that the site-title block is wrapped in a list item to preserve accessible markup
	 *
	 * @group navigation-renderer
	 *
	 * @covers WP_Navigation_Block_Renderer::get_markup_for_inner_block
	 */
	public function test_gutenberg_get_markup_for_inner_block_site_title() {

		// We are testing the site title block because we manually add list items around it.
		$parsed_blocks    = parse_blocks(
			'<!-- wp:site-title /-->'
		);
		$parsed_block     = $parsed_blocks[0];
		$context          = array();
		$site_title_block = new WP_Block( $parsed_block, $context );

		// Setup an empty testing instance of `WP_Navigation_Block_Renderer` and save the original.
		$reflection = new ReflectionClass( 'WP_Navigation_Block_Renderer_Gutenberg' );
		$method     = $reflection->getMethod( 'get_markup_for_inner_block' );
		$method->setAccessible( true );
		// Invoke the private method.
		$result = $method->invoke( $reflection, $site_title_block );

		$expected = '<li class="wp-block-navigation-item"><h1 class="wp-block-site-title"><a href="http://' . WP_TESTS_DOMAIN . '" target="_self" rel="home">Test Blog</a></h1></li>';
		$this->assertEquals( $expected, $result );
	}

	/**
	 * Test that the `get_inner_blocks_from_navigation_post` method returns an empty block list for a non-existent post.
	 *
	 * @group navigation-renderer
	 *
	 * @covers WP_Navigation_Block_Renderer::get_inner_blocks_from_navigation_post
	 */
	public function test_gutenberg_get_inner_blocks_from_navigation_post_returns_empty_block_list() {
		$reflection = new ReflectionClass( 'WP_Navigation_Block_Renderer_Gutenberg' );
		$method     = $reflection->getMethod( 'get_inner_blocks_from_navigation_post' );
		$method->setAccessible( true );
		$attributes = array( 'ref' => 0 );

		$actual   = $method->invoke( $reflection, $attributes );
		$expected = new WP_Block_List( array(), $attributes );
		$this->assertEquals( $actual, $expected );
		$this->assertCount( 0, $actual );
	}
}
