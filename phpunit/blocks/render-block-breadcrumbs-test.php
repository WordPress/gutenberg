<?php
/**
 * Breadcrumbs block rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the Breadcrumbs block.
 *
 * @group blocks
 */
class Render_Block_Breadcrumbs_Test extends WP_UnitTestCase {
	private $post_id;
	private $term_id;

	public function set_up() {
		parent::set_up();

		// Create a post.
		$this->post_id = $this->factory->post->create(
			array(
				'post_title' => 'Test Post',
				'post_type'  => 'post',
			)
		);

		// Create a category term.
		$this->term_id = $this->factory->term->create(
			array(
				'name'     => 'Test Category',
				'taxonomy' => 'category',
			)
		);

		// Assign the term to the post.
		wp_set_object_terms( $this->post_id, array( $this->term_id ), 'category' );
	}

	public function tear_down() {
		wp_delete_post( $this->post_id, true );
		wp_delete_term( $this->term_id, 'category' );
		parent::tear_down();
	}

	/**
	 * @covers ::render_block_core_breadcrumbs
	 */
	public function test_render_block_core_breadcrumbs_shows_taxonomy_by_default() {
		$attributes = array(
			'showHomeItem'    => true,
			'showCurrentItem' => true,
			'showOnHomePage'  => false,
			'separator'       => '/',
		);

		$block_instance = new WP_Block(
			array(
				'blockName'    => 'core/breadcrumbs',
				'attrs'        => $attributes,
				'innerBlocks'  => array(),
				'innerHTML'    => '',
				'innerContent' => array(),
			),
			array(
				'postId'   => $this->post_id,
				'postType' => 'post',
			)
		);

		$output = render_block_core_breadcrumbs( $attributes, '', $block_instance );

		$this->assertStringContainsString( 'Test Category', $output );
	}

	/**
	 * @covers ::render_block_core_breadcrumbs
	 */
	public function test_render_block_core_breadcrumbs_hides_taxonomy_when_show_taxonomy_is_false() {
		$attributes = array(
			'showHomeItem'    => true,
			'showCurrentItem' => true,
			'showOnHomePage'  => false,
			'separator'       => '/',
			'showTaxonomy'    => false,
		);

		$block_instance = new WP_Block(
			array(
				'blockName'    => 'core/breadcrumbs',
				'attrs'        => $attributes,
				'innerBlocks'  => array(),
				'innerHTML'    => '',
				'innerContent' => array(),
			),
			array(
				'postId'   => $this->post_id,
				'postType' => 'post',
			)
		);

		$output = render_block_core_breadcrumbs( $attributes, '', $block_instance );

		$this->assertStringNotContainsString( 'Test Category', $output );
	}
}
