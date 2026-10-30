<?php
/**
 * Tests for the preloading of the author of the post summary.
 *
 * @package gutenberg
 *
 * @covers ::gutenberg_block_editor_preload_paths_7_2
 * @covers ::gutenberg_preload_post_summary_author
 */
class Tests_Preload_Post_Summary_Author extends WP_UnitTestCase {

	/**
	 * Whether `_deprecated_argument()` would print its notice, each time it runs.
	 *
	 * @var bool[]
	 */
	private $notice_triggers = array();

	public function set_up() {
		parent::set_up();
		wp_scripts()->add_data( 'wp-api-fetch', 'after', array() );
		// The test case silences the notices too, see `expectDeprecated()`.
		remove_filter( 'deprecated_argument_trigger_error', '__return_false' );
		add_action( 'deprecated_argument_run', array( $this, 'record_notice_trigger' ) );
	}

	/**
	 * Records whether `_deprecated_argument()` would print its notice.
	 */
	public function record_notice_trigger() {
		$this->notice_triggers[] = apply_filters( 'deprecated_argument_trigger_error', true );
	}

	/**
	 * The preload middlewares added to `wp-api-fetch`.
	 *
	 * @return string The inline scripts after `wp-api-fetch`.
	 */
	private function get_api_fetch_inline_scripts() {
		return implode( "\n", (array) wp_scripts()->get_data( 'wp-api-fetch', 'after' ) );
	}

	/**
	 * The post editor preloads the author request of the post summary, without
	 * printing the deprecation notice of `who`.
	 */
	public function test_the_post_editor_preloads_the_author() {
		$this->setExpectedDeprecated( 'WP_User_Query' );
		$author = self::factory()->user->create( array( 'role' => 'author' ) );
		wp_set_current_user( $author );
		$context = new WP_Block_Editor_Context(
			array(
				'name' => 'core/edit-post',
				'post' => self::factory()->post->create_and_get( array( 'post_author' => $author ) ),
			)
		);

		gutenberg_block_editor_preload_paths_7_2( array(), $context );

		$this->assertStringContainsString( "/wp/v2/users?context=view&include[0]=$author&who=authors", $this->get_api_fetch_inline_scripts() );
		$this->assertSame( array( false ), $this->notice_triggers );
		$this->assertTrue( apply_filters( 'deprecated_argument_trigger_error', true ) );
	}

	/**
	 * The site editor preloads the author request of the post summary of a page.
	 */
	public function test_the_site_editor_preloads_the_author_of_a_page() {
		$this->setExpectedDeprecated( 'WP_User_Query' );
		$author = self::factory()->user->create( array( 'role' => 'editor' ) );
		wp_set_current_user( $author );
		$context = new WP_Block_Editor_Context(
			array(
				'name' => 'core/edit-site',
				'post' => self::factory()->post->create_and_get(
					array(
						'post_type'   => 'page',
						'post_author' => $author,
					)
				),
			)
		);

		gutenberg_block_editor_preload_paths_7_2( array(), $context );

		$this->assertStringContainsString( "/wp/v2/users?context=view&include[0]=$author&who=authors", $this->get_api_fetch_inline_scripts() );
		$this->assertSame( array( false ), $this->notice_triggers );
	}
}
