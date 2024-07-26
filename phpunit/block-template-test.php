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
		$template_name = 'test-plugin//test-template';

		wp_register_template( $template_name );

		$templates = get_block_templates();

		$this->assertArrayHasKey( $template_name, $templates );

		wp_unregister_template( $template_name );
	}

	public function test_get_block_template_from_registry() {
		$template_name = 'test-plugin//test-template';
		$args          = array(
			'title' => 'Test Template',
		);

		wp_register_template( $template_name, $args );

		$template = get_block_template( 'block-theme//test-template' );

		$this->assertEquals( 'Test Template', $template->title );

		wp_unregister_template( $template_name );
	}
}
