<?php
/**
 * Tests for the preloading of the author of the post summary.
 *
 * @package gutenberg
 *
 * @covers ::gutenberg_block_editor_preload_paths_7_2
 * @covers ::gutenberg_silence_rest_deprecated_arguments
 * @covers ::gutenberg_restore_rest_deprecated_arguments
 */
class Tests_Preload_Post_Summary_Author extends WP_UnitTestCase {

	/**
	 * The post editor preloads the author request of the post summary.
	 */
	public function test_the_post_editor_preloads_the_author() {
		$author  = self::factory()->user->create( array( 'role' => 'author' ) );
		$context = new WP_Block_Editor_Context(
			array(
				'name' => 'core/edit-post',
				'post' => self::factory()->post->create_and_get( array( 'post_author' => $author ) ),
			)
		);

		$paths = gutenberg_block_editor_preload_paths_7_2( array(), $context );

		$this->assertContains( "/wp/v2/users?context=view&include[0]=$author&who=authors", $paths );
	}

	/**
	 * The site editor preloads the author request of the post summary of a page.
	 */
	public function test_the_site_editor_preloads_the_author_of_a_page() {
		$author  = self::factory()->user->create( array( 'role' => 'author' ) );
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

		$paths = gutenberg_block_editor_preload_paths_7_2( array(), $context );

		$this->assertSame( array( "/wp/v2/users?context=view&include[0]=$author&who=authors" ), $paths );
	}

	/**
	 * Preloading the author, which is queried with the deprecated `who`
	 * argument, doesn't print a deprecation notice into the page.
	 */
	public function test_preloading_the_author_prints_no_deprecation_notice() {
		$this->setExpectedDeprecated( 'WP_User_Query' );
		// The test case silences the notices too, see `expectDeprecated()`.
		remove_filter( 'deprecated_argument_trigger_error', '__return_false' );
		$triggers = array();
		add_action(
			'deprecated_argument_run',
			static function () use ( &$triggers ) {
				$triggers[] = apply_filters( 'deprecated_argument_trigger_error', true );
			}
		);
		$author = self::factory()->user->create( array( 'role' => 'author' ) );
		wp_set_current_user( $author );

		rest_preload_api_request( array(), "/wp/v2/users?context=view&include[0]=$author&who=authors" );

		$this->assertSame( array( false ), $triggers );
		$this->assertTrue( apply_filters( 'deprecated_argument_trigger_error', true ) );
	}
}
