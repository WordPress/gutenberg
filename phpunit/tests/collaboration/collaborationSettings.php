<?php
/**
 * Tests the collaboration experiment.
 *
 * @package Gutenberg
 * @subpackage Collaboration
 *
 * @group collaboration
 */

class Tests_Collaboration_Settings extends WP_UnitTestCase {
	private $block_editor_was_registered;
	private $original_block_editor_inline_scripts;
	private $original_pagenow;

	public function set_up() {
		global $pagenow;

		parent::set_up();

		$wp_scripts                        = wp_scripts();
		$this->block_editor_was_registered = isset( $wp_scripts->registered['wp-block-editor'] );
		if ( ! $this->block_editor_was_registered ) {
			wp_register_script( 'wp-block-editor', '' );
		}

		$block_editor_script                        = $wp_scripts->registered['wp-block-editor'];
		$this->original_block_editor_inline_scripts = $block_editor_script->extra['before'] ?? null;
		$block_editor_script->extra['before']       = array();
		$this->original_pagenow                     = $pagenow;
		$pagenow                                    = 'post.php';
	}

	public function tear_down() {
		global $pagenow;

		remove_filter( 'pre_option_gutenberg-experiments', '__return_empty_array', 11 );

		$wp_scripts = wp_scripts();
		if ( $this->block_editor_was_registered ) {
			$block_editor_script = $wp_scripts->registered['wp-block-editor'];
			if ( null === $this->original_block_editor_inline_scripts ) {
				unset( $block_editor_script->extra['before'] );
			} else {
				$block_editor_script->extra['before'] = $this->original_block_editor_inline_scripts;
			}
		} else {
			wp_deregister_script( 'wp-block-editor' );
		}

		$pagenow = $this->original_pagenow;
		parent::tear_down();
	}

	private function get_block_editor_inline_scripts() {
		$inline_scripts = wp_scripts()->get_data( 'wp-block-editor', 'before' );
		return is_array( $inline_scripts ) ? $inline_scripts : array();
	}

	public function test_collaboration_is_enabled_when_experiment_is_enabled() {
		$this->assertTrue( wp_is_collaboration_enabled() );
	}

	public function test_collaboration_is_disabled_when_experiment_is_disabled() {
		add_filter( 'pre_option_gutenberg-experiments', '__return_empty_array', 11 );

		$this->assertFalse( wp_is_collaboration_enabled() );
	}

	public function test_experiment_injects_collaboration_flag() {
		gutenberg_enable_experiments();

		$this->assertContains(
			'window.__experimentalEnableRealTimeCollaboration = true;',
			$this->get_block_editor_inline_scripts()
		);
	}

	public function test_disabled_experiment_does_not_inject_collaboration_flag() {
		add_filter( 'pre_option_gutenberg-experiments', '__return_empty_array', 11 );

		gutenberg_enable_experiments();

		$this->assertStringNotContainsString(
			'window.__experimentalEnableRealTimeCollaboration',
			implode( "\n", $this->get_block_editor_inline_scripts() )
		);
	}

	public function test_experiment_disables_collaboration_in_site_editor() {
		global $pagenow;

		$pagenow = 'site-editor.php';
		gutenberg_enable_experiments();

		$this->assertContains(
			'window.__experimentalEnableRealTimeCollaboration = false;',
			$this->get_block_editor_inline_scripts()
		);
	}
}
