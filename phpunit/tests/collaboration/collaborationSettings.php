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
	private const CRDT_DOC_META_KEY = '_crdt_document';

	private $core_data_was_registered;
	private $original_core_data_inline_scripts;
	private $original_pagenow;

	public function set_up() {
		global $pagenow;

		parent::set_up();

		$wp_scripts                     = wp_scripts();
		$this->core_data_was_registered = isset( $wp_scripts->registered['wp-core-data'] );
		if ( ! $this->core_data_was_registered ) {
			wp_register_script( 'wp-core-data', '' );
		}

		$core_data_script                        = $wp_scripts->registered['wp-core-data'];
		$this->original_core_data_inline_scripts = $core_data_script->extra['before'] ?? null;
		$core_data_script->extra['before']       = array();
		$this->original_pagenow                  = $pagenow;
		$pagenow                                 = 'post.php';
	}

	public function tear_down() {
		global $pagenow;

		remove_filter( 'pre_option_gutenberg-experiments', '__return_empty_array', 11 );

		$wp_scripts = wp_scripts();
		if ( $this->core_data_was_registered ) {
			$core_data_script = $wp_scripts->registered['wp-core-data'];
			if ( null === $this->original_core_data_inline_scripts ) {
				unset( $core_data_script->extra['before'] );
			} else {
				$core_data_script->extra['before'] = $this->original_core_data_inline_scripts;
			}
		} else {
			wp_deregister_script( 'wp-core-data' );
		}

		$pagenow = $this->original_pagenow;
		parent::tear_down();
	}

	private function get_core_data_inline_scripts() {
		$inline_scripts = wp_scripts()->get_data( 'wp-core-data', 'before' );
		return is_array( $inline_scripts ) ? $inline_scripts : array();
	}

	public function test_collaboration_is_enabled_when_experiment_is_enabled() {
		$this->assertTrue( wp_is_collaboration_enabled() );
	}

	public function test_collaboration_is_disabled_when_experiment_is_disabled() {
		add_filter( 'pre_option_gutenberg-experiments', '__return_empty_array', 11 );

		$this->assertFalse( wp_is_collaboration_enabled() );
	}

	public function test_disabled_experiment_does_not_register_sync_storage_post_type() {
		unregister_post_type( 'wp_sync_storage' );
		add_filter( 'pre_option_gutenberg-experiments', '__return_empty_array', 11 );

		try {
			gutenberg_register_sync_storage_post_type();

			$this->assertFalse( post_type_exists( 'wp_sync_storage' ) );
		} finally {
			remove_filter( 'pre_option_gutenberg-experiments', '__return_empty_array', 11 );
			gutenberg_register_sync_storage_post_type();
		}
	}

	public function test_disabled_experiment_does_not_register_crdt_post_meta() {
		unregister_meta_key( 'post', self::CRDT_DOC_META_KEY );
		add_filter( 'pre_option_gutenberg-experiments', '__return_empty_array', 11 );

		try {
			gutenberg_rest_api_crdt_post_meta();

			$this->assertFalse( registered_meta_key_exists( 'post', self::CRDT_DOC_META_KEY ) );
		} finally {
			remove_filter( 'pre_option_gutenberg-experiments', '__return_empty_array', 11 );
			gutenberg_rest_api_crdt_post_meta();
		}
	}

	public function test_experiment_injects_collaboration_flag() {
		gutenberg_enable_experiments();

		$this->assertContains(
			'window.__experimentalEnableRealTimeCollaboration = true;',
			$this->get_core_data_inline_scripts()
		);
	}

	public function test_disabled_experiment_does_not_inject_collaboration_flag() {
		add_filter( 'pre_option_gutenberg-experiments', '__return_empty_array', 11 );

		gutenberg_enable_experiments();

		$this->assertStringNotContainsString(
			'window.__experimentalEnableRealTimeCollaboration',
			implode( "\n", $this->get_core_data_inline_scripts() )
		);
	}

	public function test_collaboration_is_disabled_for_post_type_without_custom_fields() {
		register_post_type(
			'rtc_no_meta',
			array(
				'show_in_rest' => true,
				'supports'     => array( 'editor' ),
			)
		);

		try {
			$this->assertTrue( wp_is_post_type_collaboration_disabled( 'rtc_no_meta' ) );
		} finally {
			unregister_post_type( 'rtc_no_meta' );
		}
	}

	public function test_collaboration_is_enabled_for_post_type_with_custom_fields() {
		register_post_type(
			'rtc_with_meta',
			array(
				'show_in_rest' => true,
				'supports'     => array( 'editor', 'custom-fields' ),
			)
		);

		try {
			$this->assertFalse( wp_is_post_type_collaboration_disabled( 'rtc_with_meta' ) );
		} finally {
			unregister_post_type( 'rtc_with_meta' );
		}
	}

	public function test_collaboration_is_enabled_for_attachments() {
		$this->assertFalse( wp_is_post_type_collaboration_disabled( 'attachment' ) );
	}

	public function test_experiment_disables_collaboration_in_site_editor() {
		global $pagenow;

		$pagenow = 'site-editor.php';
		gutenberg_enable_experiments();

		$this->assertContains(
			'window.__experimentalEnableRealTimeCollaboration = false;',
			$this->get_core_data_inline_scripts()
		);
	}
}
