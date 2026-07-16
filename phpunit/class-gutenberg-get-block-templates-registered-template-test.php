<?php
/**
 * Tests that gutenberg_get_block_templates() returns a zero-indexed array
 * when a plugin-registered template is the only match for a query.
 *
 * @package gutenberg
 *
 * @covers ::gutenberg_get_block_templates
 */
class Tests_Gutenberg_Get_Block_Templates_Registered_Template extends WP_UnitTestCase {

	/**
	 * Set up before each test.
	 */
	public function set_up() {
		parent::set_up();

		// Enable the active_templates experiment so gutenberg_get_block_templates()
		// short-circuits get_block_templates() via the pre_get_block_templates filter.
		update_option( 'active_templates', array() );

		switch_theme( 'emptytheme' );
	}

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		delete_option( 'active_templates' );

		parent::tear_down();
	}

	/**
	 * When a plugin-registered template is the only result for a slug__in query,
	 * the returned array must still be keyed from 0, not by the registered
	 * template name (e.g. "test-plugin//test-template"). Consumers such as
	 * wp_get_post_content_block_attributes() rely on $templates[0] to read the
	 * match, and a string-keyed result causes an "Undefined array key 0" warning.
	 */
	public function test_returns_zero_indexed_array_for_single_registered_template() {
		$template_name = 'test-plugin//test-template';

		register_block_template(
			$template_name,
			array(
				'title'   => 'Test Template',
				'content' => '<!-- wp:paragraph -->Hello<!-- /wp:paragraph -->',
			)
		);

		$templates = get_block_templates( array( 'slug__in' => array( 'test-template' ) ) );

		$this->assertCount( 1, $templates );
		$this->assertArrayHasKey(
			0,
			$templates,
			'get_block_templates() should return a zero-indexed array so callers can safely read $templates[0].'
		);
		$this->assertSame( 'test-template', $templates[0]->slug );

		unregister_block_template( $template_name );
	}

	/**
	 * A mix of a theme-provided/DB template and a registered template should
	 * also come back zero-indexed and in a stable, iterable order.
	 */
	public function test_returns_zero_indexed_array_with_mixed_sources() {
		$template_name = 'test-plugin//test-template-mixed';

		register_block_template(
			$template_name,
			array(
				'title'   => 'Test Template Mixed',
				'content' => '<!-- wp:paragraph -->Hello<!-- /wp:paragraph -->',
			)
		);

		$post_id = self::factory()->post->create(
			array(
				'post_type'    => 'wp_template',
				'post_name'    => 'other-template',
				'post_status'  => 'publish',
				'post_content' => '<!-- wp:paragraph -->Other<!-- /wp:paragraph -->',
			)
		);
		wp_set_post_terms( $post_id, array( get_stylesheet() ), 'wp_theme' );

		$templates = get_block_templates(
			array( 'slug__in' => array( 'test-template-mixed', 'other-template' ) )
		);

		$this->assertCount( 2, $templates );
		$this->assertArrayHasKey( 0, $templates );
		$this->assertArrayHasKey( 1, $templates );

		$slugs = wp_list_pluck( $templates, 'slug' );
		$this->assertContains( 'test-template-mixed', $slugs );
		$this->assertContains( 'other-template', $slugs );

		unregister_block_template( $template_name );
		wp_delete_post( $post_id, true );
	}
}
