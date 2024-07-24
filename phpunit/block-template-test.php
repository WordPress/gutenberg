<?php
/**
 * Tests block template registry via block-related functions.
 */
class Tests_Block_Template extends WP_UnitTestCase {
	public function set_up() {
		parent::set_up();
		switch_theme( 'block-theme' );
	}

	public function test_get_block_templates_from_registry() {
		$template_name = 'test-template';
		$args          = array(
			'plugin' => 'test-plugin',
		);

		gutenberg_register_template( $template_name, $args );

		$templates = get_block_templates();

		$this->assertArrayHasKey( 'test-plugin//test-template', $templates );

		gutenberg_unregister_template( 'test-plugin//' . $template_name );
	}

	public function test_get_block_template_from_registry() {
		$template_name = 'test-template';
		$args          = array(
			'plugin' => 'test-plugin',
			'title'  => 'Test Template',
		);

		gutenberg_register_template( $template_name, $args );

		$template = get_block_template( 'block-theme//test-template' );

		$this->assertEquals( 'Test Template', $template->title );

		gutenberg_unregister_template( 'test-plugin//' . $template_name );
	}
}
