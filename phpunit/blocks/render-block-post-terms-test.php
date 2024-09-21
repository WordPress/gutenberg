<?php
/**
 * Post Terms block rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the Post Terms block.
 *
 * @group blocks
 */
class Tests_Blocks_Render_Post_Terms extends WP_UnitTestCase {

	/**
	 * @covers ::render_block_core_post_terms
	 */
	public function test_render_block_core_post_terms_works_with_invalid_post_terms() {
		global $post;

		$global_post = $post;
		$post        = $this->factory->post->create_and_get();

		wp_set_post_tags( $post->ID, array( 'foo', 'bar' ) );

		add_filter( 'get_the_terms', array( $this, 'add_invalid_post_term' ) );
		$post_content = '<!-- wp:paragraph --><p><!-- wp:post-terms {"term":"post_tag"} --></p><!-- /wp:paragraph -->';
		$new_content  = apply_filters( 'the_content', $post_content );
		$this->assertStringContainsString( '<p>', $new_content );
		$post = $global_post;
		remove_filter( 'get_the_terms', array( $this, 'filter_post_terms' ) );
	}

	public function add_invalid_post_term( $terms ) {
		$terms[0] = null;
		return $terms;
	}
}
