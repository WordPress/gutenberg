<?php
/**
 * Tests that the `comment_form_defaults` filter reaches the block editor
 * settings, so the Post Comments Form placeholder matches the front end.
 *
 * @see https://github.com/WordPress/gutenberg/issues/49196
 *
 * @group comments
 */
class Gutenberg_Comment_Form_Defaults_Editor_Settings_Test extends WP_UnitTestCase {

	/**
	 * Reads the exposed strings straight from the callback.
	 *
	 * @return array
	 */
	private function get_exposed_defaults() {
		$settings = gutenberg_add_comment_form_defaults_to_editor_settings( array() );
		return $settings['__experimentalDiscussionSettings']['commentFormDefaults'];
	}

	public function test_exposes_core_defaults_when_unfiltered() {
		$defaults = $this->get_exposed_defaults();

		$this->assertSame( 'Leave a Reply', $defaults['titleReply'] );
		$this->assertSame( 'Post Comment', $defaults['labelSubmit'] );
	}

	/**
	 * The exact snippet from the issue report.
	 */
	public function test_title_reply_filter_reaches_editor_settings() {
		add_filter(
			'comment_form_defaults',
			static function ( $defaults ) {
				return array_merge( $defaults, array( 'title_reply' => 'New Title' ) );
			}
		);

		$defaults = $this->get_exposed_defaults();

		$this->assertSame( 'New Title', $defaults['titleReply'] );
		$this->assertSame( 'Post Comment', $defaults['labelSubmit'] );
	}

	public function test_label_submit_filter_reaches_editor_settings() {
		add_filter(
			'comment_form_defaults',
			static function ( $defaults ) {
				$defaults['label_submit'] = 'Send it';
				return $defaults;
			}
		);

		$this->assertSame( 'Send it', $this->get_exposed_defaults()['labelSubmit'] );
	}

	/**
	 * The defaults array is reconstructed rather than taken from comment_form(),
	 * so every key core defines must be present for filters that read before
	 * writing. Reading an absent key would raise a PHP warning.
	 */
	public function test_filter_reading_post_dependent_keys_does_not_warn() {
		add_filter(
			'comment_form_defaults',
			static function ( $defaults ) {
				$defaults['title_reply'] = str_replace(
					'Reply',
					'Comment',
					$defaults['title_reply']
				);
				// Keys core fills from the post/user; empty here, but present.
				$defaults['logged_in_as']         = strtoupper( $defaults['logged_in_as'] );
				$defaults['comment_notes_before'] = trim( $defaults['comment_notes_before'] );
				$defaults['must_log_in']          = trim( $defaults['must_log_in'] );
				$defaults['comment_field']        = str_replace(
					'textarea',
					'textarea',
					$defaults['comment_field']
				);
				$defaults['fields']['custom']     = '<p>Hi</p>';
				return $defaults;
			}
		);

		$this->assertSame( 'Leave a Comment', $this->get_exposed_defaults()['titleReply'] );
	}

	/**
	 * A filter returning a trimmed-down array must not drop the keys we read,
	 * matching comment_form()'s own array_merge guard.
	 */
	public function test_filter_dropping_keys_falls_back_to_defaults() {
		add_filter(
			'comment_form_defaults',
			static function () {
				return array( 'title_reply' => 'Only This' );
			}
		);

		$defaults = $this->get_exposed_defaults();

		$this->assertSame( 'Only This', $defaults['titleReply'] );
		$this->assertSame( 'Post Comment', $defaults['labelSubmit'] );
	}

	/**
	 * End to end: the callback is registered and runs late enough that
	 * `__experimentalDiscussionSettings` already exists.
	 */
	public function test_defaults_are_present_in_real_block_editor_settings() {
		add_filter(
			'comment_form_defaults',
			static function ( $defaults ) {
				return array_merge( $defaults, array( 'title_reply' => 'New Title' ) );
			}
		);

		// get_block_editor_settings() collects iframed assets, which needs the
		// script and style globals initialised.
		wp_scripts();
		wp_styles();

		$settings = get_block_editor_settings( array(), new WP_Block_Editor_Context() );

		$this->assertArrayHasKey( '__experimentalDiscussionSettings', $settings );
		$this->assertArrayHasKey(
			'commentFormDefaults',
			$settings['__experimentalDiscussionSettings']
		);
		$this->assertSame(
			'New Title',
			$settings['__experimentalDiscussionSettings']['commentFormDefaults']['titleReply']
		);
		// The pre-existing keys must survive.
		$this->assertArrayHasKey(
			'avatarURL',
			$settings['__experimentalDiscussionSettings']
		);
	}

	/**
	 * The front end must keep using comment_form()'s own defaults.
	 */
	public function test_front_end_comment_form_still_reflects_the_filter() {
		add_filter(
			'comment_form_defaults',
			static function ( $defaults ) {
				return array_merge( $defaults, array( 'title_reply' => 'New Title' ) );
			}
		);

		$post_id = self::factory()->post->create(
			array( 'comment_status' => 'open' )
		);

		ob_start();
		comment_form( array(), $post_id );
		$form = ob_get_clean();

		$this->assertStringContainsString( 'New Title', $form );
	}
}
