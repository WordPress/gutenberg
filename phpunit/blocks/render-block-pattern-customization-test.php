<?php
/**
 * Tests for the `core/pattern` block rendering a customized registered pattern.
 *
 * @package WordPress
 * @subpackage Blocks
 *
 * @covers ::gutenberg_render_block_core_pattern
 * @group blocks
 */
class Render_Block_Pattern_Customization_Test extends WP_UnitTestCase {

	public function set_up() {
		parent::set_up();
		register_block_pattern(
			'test/greeting',
			array(
				'title'   => 'Greeting',
				'content' => '<!-- wp:paragraph --><p>Hello from the registry</p><!-- /wp:paragraph -->',
			)
		);
	}

	public function tear_down() {
		unregister_block_pattern( 'test/greeting' );
		parent::tear_down();
	}

	/**
	 * @covers ::gutenberg_render_block_core_pattern
	 * @covers ::gutenberg_block_core_pattern_get_customization
	 */
	public function test_pattern_block_renders_customization() {
		$this->assertSame( '<p class="wp-block-paragraph">Hello from the registry</p>', do_blocks( '<!-- wp:pattern {"slug":"test/greeting"} /-->' ) );

		$customization_id = self::factory()->post->create(
			array(
				'post_type'    => 'wp_block',
				'post_status'  => 'publish',
				'post_title'   => 'Greeting',
				'post_content' => '<!-- wp:paragraph --><p>Hello from the customization</p><!-- /wp:paragraph -->',
				'meta_input'   => array( 'wp_pattern_slug' => 'test/greeting' ),
			)
		);
		$this->assertSame( '<p class="wp-block-paragraph">Hello from the customization</p>', do_blocks( '<!-- wp:pattern {"slug":"test/greeting"} /-->' ) );

		// Trashing the customization reverts to the registered version.
		wp_trash_post( $customization_id );
		$this->assertSame( '<p class="wp-block-paragraph">Hello from the registry</p>', do_blocks( '<!-- wp:pattern {"slug":"test/greeting"} /-->' ) );
		wp_delete_post( $customization_id, true );
	}
}
