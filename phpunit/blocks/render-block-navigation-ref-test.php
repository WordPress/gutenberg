<?php
/**
 * Tests that the Navigation block only renders a `ref` that points to a
 * published `wp_navigation` post.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * @group blocks
 * @group navigation
 */
class Render_Block_Navigation_Ref_Test extends WP_UnitTestCase {

	/**
	 * A `ref` that points to a published `wp_navigation` post renders its inner blocks.
	 */
	public function test_ref_to_published_navigation_renders_inner_blocks() {
		$navigation_id = wp_insert_post(
			array(
				'post_type'    => 'wp_navigation',
				'post_status'  => 'publish',
				'post_title'   => 'Primary',
				'post_content' => '<!-- wp:navigation-link {"label":"RefMenuLabelXYZ","url":"https://example.com","kind":"custom"} /-->',
			),
			true
		);
		$this->assertNotWPError( $navigation_id );

		$output = do_blocks( '<!-- wp:navigation {"ref":' . $navigation_id . '} /-->' );

		$this->assertStringContainsString( 'RefMenuLabelXYZ', $output, 'A ref to a published wp_navigation post should render its inner blocks.' );
	}

	/**
	 * A `ref` that points to a post which is not a `wp_navigation` renders nothing
	 * from that post, instead of rendering its content as a menu.
	 */
	public function test_ref_to_non_navigation_post_does_not_render_its_content() {
		$page_id = wp_insert_post(
			array(
				'post_type'    => 'page',
				'post_status'  => 'publish',
				'post_title'   => 'A Page',
				'post_content' => '<!-- wp:paragraph --><p>NonNavLeakMarker</p><!-- /wp:paragraph -->',
			),
			true
		);
		$this->assertNotWPError( $page_id );

		$output = do_blocks( '<!-- wp:navigation {"ref":' . $page_id . '} /-->' );

		$this->assertStringNotContainsString( 'NonNavLeakMarker', $output, 'A ref to a non-navigation post should not render that post content.' );
	}
}
