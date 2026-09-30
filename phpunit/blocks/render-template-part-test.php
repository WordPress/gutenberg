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

	public function test_renders_customized_template_part_from_post() {
		$this->create_template_part( 'test-customized' );

		$post_action = new MockAction();
		add_action( 'render_block_core_template_part_post', array( $post_action, 'action' ) );

		$output = do_blocks( '<!-- wp:template-part {"slug":"test-customized"} /-->' );

		$this->assertStringContainsString( 'Customized template part', $output );
		$this->assertSame( 1, $post_action->get_call_count(), 'The post action should fire once.' );
	}

	public function test_handles_error_when_theme_term_cache_is_empty() {
		$template_part_id = $this->create_template_part( 'test-empty-cache' );

		// The post has a `wp_theme` term in the database, but the cache says it has none.
		wp_cache_set( $template_part_id, array(), 'wp_theme_relationships' );

		$post_action = new MockAction();
		$file_action = new MockAction();
		add_action( 'render_block_core_template_part_post', array( $post_action, 'action' ) );
		add_action( 'render_block_core_template_part_file', array( $file_action, 'action' ) );

		$output = do_blocks( '<!-- wp:template-part {"slug":"test-empty-cache"} /-->' );

		$this->assert_error_output( 'test-empty-cache', $output );
		$this->assertSame( 0, $post_action->get_call_count(), 'The post action should not fire.' );
		$this->assertSame( $this->is_debug() ? 0 : 1, $file_action->get_call_count(), 'The file action should only fire outside debug mode.' );
	}

	public function test_handles_error_when_theme_terms_are_filtered_out() {
		$this->create_template_part( 'test-filtered-terms' );
		$this->filter_wp_theme_terms( false );

		$output = do_blocks( '<!-- wp:template-part {"slug":"test-filtered-terms"} /-->' );

		$this->assert_error_output( 'test-filtered-terms', $output );
	}

	public function test_handles_error_when_theme_terms_are_an_error() {
		$this->create_template_part( 'test-terms-error' );
		$this->filter_wp_theme_terms( new WP_Error( 'test_error', 'Test error' ) );

		$output = do_blocks( '<!-- wp:template-part {"slug":"test-terms-error"} /-->' );

		$this->assert_error_output( 'test-terms-error', $output );
	}

	public function test_renders_nothing_when_post_fails_to_load_and_there_is_no_theme_file() {
		$this->create_template_part( self::NO_FILE_SLUG );
		$this->filter_wp_theme_terms( false );

		$none_action = new MockAction();
		add_action( 'render_block_core_template_part_none', array( $none_action, 'action' ) );

		$output = do_blocks( '<!-- wp:template-part {"slug":"' . self::NO_FILE_SLUG . '"} /-->' );

		$expected = $this->is_debug() ? $this->get_unavailable_message( self::NO_FILE_SLUG ) : '';

		$this->assertSame( $expected, $output );
		$this->assertSame( $this->is_debug() ? 0 : 1, $none_action->get_call_count(), 'The none action should only fire outside debug mode.' );
	}

	/**
	 * Whether the block shows debug messages, matching the check in the block.
	 *
	 * @return bool
	 */
	private function is_debug() {
		return WP_DEBUG && WP_DEBUG_DISPLAY;
	}

	/**
	 * Gets the message the block shows in debug mode when a template part is unavailable.
	 *
	 * @param string $slug The template part slug.
	 * @return string
	 */
	private function get_unavailable_message( $slug ) {
		return sprintf( 'Template part has been deleted or is unavailable: %s', $slug );
	}

	/**
	 * Asserts the output when the customized template part fails to load: the unavailable
	 * message in debug mode, and the theme file otherwise.
	 *
	 * @param string $slug   The template part slug.
	 * @param string $output The rendered block.
	 */
	private function assert_error_output( $slug, $output ) {
		if ( $this->is_debug() ) {
			$this->assertSame( $this->get_unavailable_message( $slug ), $output );
		} else {
			$this->assertStringContainsString( 'Theme file template part', $output );
		}
		$this->assertStringNotContainsString( 'Customized template part', $output );
	}
}
