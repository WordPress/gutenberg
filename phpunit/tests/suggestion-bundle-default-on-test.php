<?php
/**
 * Tests that this combined testing branch has the Suggestion mode experiment
 * on by default, and that the Experiments screen can still switch it off.
 *
 * @group suggestions
 */
class Tests_Suggestion_Bundle_Default_On extends WP_UnitTestCase {

	public function set_up(): void {
		parent::set_up();
		// The test bootstrap answers for the option before it is read.
		remove_all_filters( 'pre_option_gutenberg-experiments' );
	}

	public function tear_down(): void {
		unregister_setting( 'gutenberg-experiments', 'gutenberg-experiments' );
		parent::tear_down();
	}

	/**
	 * A REST request registers the option with an empty default.
	 */
	public function test_experiment_is_on_in_a_rest_request_without_a_saved_option(): void {
		delete_option( 'gutenberg-experiments' );
		gutenberg_initialize_experiments_settings();

		$this->assertTrue( gutenberg_is_experiment_enabled( 'gutenberg-suggestion-mode' ) );
	}

	public function test_experiment_is_on_when_the_saved_option_leaves_it_out(): void {
		update_option( 'gutenberg-experiments', array( 'gutenberg-media-editor' => true ) );
		gutenberg_initialize_experiments_settings();

		$this->assertTrue( gutenberg_is_experiment_enabled( 'gutenberg-suggestion-mode' ) );
		$this->assertTrue( gutenberg_is_experiment_enabled( 'gutenberg-media-editor' ) );
	}

	public function test_experiment_is_off_when_the_site_switched_it_off(): void {
		update_option( 'gutenberg-experiments', array( 'gutenberg-suggestion-mode' => false ) );
		gutenberg_initialize_experiments_settings();

		$this->assertFalse( gutenberg_is_experiment_enabled( 'gutenberg-suggestion-mode' ) );
	}
}
