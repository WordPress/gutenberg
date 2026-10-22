<?php
/**
 * Tests for the Template Part block rendering.
 *
 * @package WordPress
 * @subpackage Blocks
 *
 * @group blocks
 */
class Tests_Blocks_RenderTemplatePartBlock extends WP_UnitTestCase {

	const POST_CONTENT = '<!-- wp:paragraph --><p>Customized template part</p><!-- /wp:paragraph -->';
	const FILE_CONTENT = '<!-- wp:paragraph --><p>Theme file template part</p><!-- /wp:paragraph -->';

	// Slug that has no theme file.
	const NO_FILE_SLUG = 'test-no-file';

	/**
	 * The `get_the_terms` filter added by a test, if any.
	 *
	 * @var callable|null
	 */
	private $get_the_terms_filter = null;

	public function set_up() {
		parent::set_up();

		// Stand in for the theme's `parts/` files so the tests don't depend on the active theme.
		add_filter( 'pre_get_block_file_template', array( $this, 'filter_pre_get_block_file_template' ), 10, 3 );
	}

	public function tear_down() {
		remove_filter( 'pre_get_block_file_template', array( $this, 'filter_pre_get_block_file_template' ), 10 );
		remove_filter( 'wp_trigger_error_trigger_error', '__return_false' );

		if ( $this->get_the_terms_filter ) {
			remove_filter( 'get_the_terms', $this->get_the_terms_filter, 10 );
			$this->get_the_terms_filter = null;
		}

		parent::tear_down();
	}

	public function filter_pre_get_block_file_template( $block_template, $id, $template_type ) {
		if ( 'wp_template_part' !== $template_type || get_stylesheet() . '//' . self::NO_FILE_SLUG === $id ) {
			return $block_template;
		}

		$template          = new WP_Block_Template();
		$template->id      = $id;
		$template->theme   = get_stylesheet();
		$template->type    = 'wp_template_part';
		$template->content = self::FILE_CONTENT;
		$template->area    = WP_TEMPLATE_PART_AREA_UNCATEGORIZED;

		return $template;
	}

	/**
	 * Creates a customized template part post for the active theme.
	 *
	 * @param string $slug The template part slug.
	 * @return int The template part post ID.
	 */
	private function create_template_part( $slug ) {
		$template_part_id = wp_insert_post(
			array(
				'post_type'    => 'wp_template_part',
				'post_status'  => 'publish',
				'post_title'   => 'Test Template Part',
				'post_name'    => $slug,
				'post_content' => self::POST_CONTENT,
			),
			true
		);
		$this->assertNotWPError( $template_part_id );

		wp_set_post_terms( $template_part_id, array( get_stylesheet() ), 'wp_theme' );

		return $template_part_id;
	}

	/**
	 * Makes `get_the_terms()` return the given value for the `wp_theme` taxonomy.
	 *
	 * @param mixed $value The value to return.
	 */
	private function filter_wp_theme_terms( $value ) {
		$this->get_the_terms_filter = static function ( $terms, $post_id, $taxonomy ) use ( $value ) {
			return 'wp_theme' === $taxonomy ? $value : $terms;
		};
		add_filter( 'get_the_terms', $this->get_the_terms_filter, 10, 3 );
	}

	/**
	 * Records errors reported with `wp_trigger_error()`, and stops them from being raised
	 * so the test can check the rendered output.
	 *
	 * @return MockAction The action that records each error.
	 */
	private function capture_errors() {
		$error_action = new MockAction();
		add_action( 'wp_trigger_error_always_run', array( $error_action, 'action' ), 10, 3 );
		add_filter( 'wp_trigger_error_trigger_error', '__return_false' );

		return $error_action;
	}

	/**
	 * Asserts that the theme file was rendered in place of the customized template part,
	 * and that one error was reported.
	 *
	 * @param string     $output          The rendered block.
	 * @param MockAction $error_action    The action that records errors.
	 * @param string     $slug            The template part slug.
	 * @param string     $expected_reason The error message expected in the report.
	 */
	private function assert_falls_back_with_error( $output, $error_action, $slug, $expected_reason ) {
		$this->assertStringContainsString( 'Theme file template part', $output );
		$this->assertStringNotContainsString( 'Customized template part', $output );
		$this->assertSame( 1, $error_action->get_call_count(), 'One error should be reported.' );

		$message = $error_action->get_args()[0][1];
		$this->assertStringContainsString( get_stylesheet() . '//' . $slug, $message );
		$this->assertStringContainsString( $expected_reason, $message );
	}

	public function test_renders_customized_template_part_from_post() {
		$this->create_template_part( 'test-customized' );

		$error_action = $this->capture_errors();
		$post_action  = new MockAction();
		add_action( 'render_block_core_template_part_post', array( $post_action, 'action' ) );

		$output = do_blocks( '<!-- wp:template-part {"slug":"test-customized"} /-->' );

		$this->assertStringContainsString( 'Customized template part', $output );
		$this->assertSame( 1, $post_action->get_call_count(), 'The post action should fire once.' );
		$this->assertSame( 0, $error_action->get_call_count(), 'No error should be reported.' );
	}

	public function test_falls_back_to_theme_file_when_theme_term_cache_is_empty() {
		$template_part_id = $this->create_template_part( 'test-empty-cache' );

		// The post has a `wp_theme` term in the database, but the cache says it has none.
		wp_cache_set( $template_part_id, array(), 'wp_theme_relationships' );

		$error_action = $this->capture_errors();
		$post_action  = new MockAction();
		$file_action  = new MockAction();
		add_action( 'render_block_core_template_part_post', array( $post_action, 'action' ) );
		add_action( 'render_block_core_template_part_file', array( $file_action, 'action' ) );

		$output = do_blocks( '<!-- wp:template-part {"slug":"test-empty-cache"} /-->' );

		$this->assert_falls_back_with_error( $output, $error_action, 'test-empty-cache', 'No theme is defined for this template.' );
		$this->assertSame( 0, $post_action->get_call_count(), 'The post action should not fire.' );
		$this->assertSame( 1, $file_action->get_call_count(), 'The file action should fire once.' );
	}

	public function test_falls_back_to_theme_file_when_theme_terms_are_filtered_out() {
		$this->create_template_part( 'test-filtered-terms' );
		$this->filter_wp_theme_terms( false );
		$error_action = $this->capture_errors();

		$output = do_blocks( '<!-- wp:template-part {"slug":"test-filtered-terms"} /-->' );

		$this->assert_falls_back_with_error( $output, $error_action, 'test-filtered-terms', 'No theme is defined for this template.' );
	}

	public function test_falls_back_to_theme_file_when_theme_terms_are_an_error() {
		$this->create_template_part( 'test-terms-error' );
		$this->filter_wp_theme_terms( new WP_Error( 'test_error', 'Test error' ) );
		$error_action = $this->capture_errors();

		$output = do_blocks( '<!-- wp:template-part {"slug":"test-terms-error"} /-->' );

		$this->assert_falls_back_with_error( $output, $error_action, 'test-terms-error', 'Test error' );
	}

	public function test_renders_nothing_when_post_fails_to_load_and_there_is_no_theme_file() {
		$this->create_template_part( self::NO_FILE_SLUG );
		$this->filter_wp_theme_terms( false );
		$error_action = $this->capture_errors();

		$none_action = new MockAction();
		add_action( 'render_block_core_template_part_none', array( $none_action, 'action' ) );

		$output = do_blocks( '<!-- wp:template-part {"slug":"' . self::NO_FILE_SLUG . '"} /-->' );

		// Matches the output of the block when the template part can't be found.
		$expected = WP_DEBUG && WP_DEBUG_DISPLAY
			? sprintf( 'Template part has been deleted or is unavailable: %s', self::NO_FILE_SLUG )
			: '';

		$this->assertSame( $expected, $output );
		$this->assertSame( 1, $none_action->get_call_count(), 'The none action should fire once.' );
		$this->assertSame( 1, $error_action->get_call_count(), 'One error should be reported.' );
	}
}
