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

	// Namespace of a plugin that provides template parts through the block template filters.
	const PLUGIN_NAMESPACE = 'test-plugin';

	// A theme that isn't active (installed or deleted, the block renders the same way).
	const OTHER_THEME = 'test-other-theme';

	/**
	 * The `get_the_terms` filter added by a test, if any.
	 *
	 * @var callable|null
	 */
	private $get_the_terms_filter = null;

	public function set_up() {
		parent::set_up();

		// Stand in for the active theme's `parts/` files, so the tests don't depend on the
		// active theme, and for a plugin that provides template parts through this filter.
		add_filter( 'pre_get_block_file_template', array( $this, 'filter_pre_get_block_file_template' ), 10, 3 );
	}

	public function tear_down() {
		remove_filter( 'pre_get_block_file_template', array( $this, 'filter_pre_get_block_file_template' ), 10 );
		remove_filter( 'wp_trigger_error_trigger_error', '__return_false' );

		if ( $this->get_the_terms_filter ) {
			remove_filter( 'get_the_terms', $this->get_the_terms_filter, 10 );
			$this->get_the_terms_filter = null;
		}

		remove_theme_support( 'block-template-parts' );

		parent::tear_down();
	}

	public function filter_pre_get_block_file_template( $block_template, $id, $template_type ) {
		list( $namespace ) = explode( '//', $id, 2 );

		if (
			'wp_template_part' !== $template_type ||
			! in_array( $namespace, array( get_stylesheet(), self::PLUGIN_NAMESPACE ), true ) ||
			str_ends_with( $id, '//' . self::NO_FILE_SLUG )
		) {
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
	 * Creates a customized template part post.
	 *
	 * @param string      $slug   The template part slug.
	 * @param string|null $theme  The theme (or plugin namespace) the template part belongs to.
	 *                            Defaults to the active theme.
	 * @param string      $status The post status.
	 * @return int The template part post ID.
	 */
	private function create_template_part( $slug, $theme = null, $status = 'publish' ) {
		$template_part_id = wp_insert_post(
			array(
				'post_type'    => 'wp_template_part',
				'post_status'  => $status,
				'post_title'   => 'Test Template Part',
				'post_name'    => $slug,
				'post_content' => self::POST_CONTENT,
			),
			true
		);
		$this->assertNotWPError( $template_part_id );

		wp_set_post_terms( $template_part_id, array( $theme ?? get_stylesheet() ), 'wp_theme' );

		return $template_part_id;
	}

	/**
	 * Returns the markup of a template part block.
	 *
	 * @param string $slug  The template part slug.
	 * @param mixed  $theme The `theme` attribute.
	 * @return string The block markup.
	 */
	private function template_part_markup( $slug, $theme ) {
		return '<!-- wp:template-part ' . wp_json_encode(
			array(
				'slug'  => $slug,
				'theme' => $theme,
			)
		) . ' /-->';
	}

	/**
	 * Returns the output of the block when the template part can't be found.
	 *
	 * @param string $slug The template part slug.
	 * @return string The expected output.
	 */
	private function unavailable_output( $slug ) {
		return WP_DEBUG && WP_DEBUG_DISPLAY
			? sprintf( 'Template part has been deleted or is unavailable: %s', $slug )
			: '';
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

	public function test_renders_template_part_provided_by_plugin() {
		$file_action = new MockAction();
		add_action( 'render_block_core_template_part_file', array( $file_action, 'action' ) );

		$output = do_blocks( $this->template_part_markup( 'test-plugin-part', self::PLUGIN_NAMESPACE ) );

		$this->assertStringContainsString( 'Theme file template part', $output );
		$this->assertSame( 1, $file_action->get_call_count(), 'The file action should fire once.' );
		$this->assertSame( self::PLUGIN_NAMESPACE . '//test-plugin-part', $file_action->get_args()[0][0], 'The template part ID should use the plugin namespace.' );
	}

	public function test_renders_customized_template_part_provided_by_plugin() {
		$this->create_template_part( 'test-plugin-customized', self::PLUGIN_NAMESPACE );

		$output = do_blocks( $this->template_part_markup( 'test-plugin-customized', self::PLUGIN_NAMESPACE ) );

		$this->assertStringContainsString( 'Customized template part', $output );
		$this->assertStringNotContainsString( 'Theme file template part', $output );
	}

	public function test_does_not_render_unpublished_customized_template_part_provided_by_plugin() {
		$this->create_template_part( 'test-plugin-draft', self::PLUGIN_NAMESPACE, 'draft' );

		$output = do_blocks( $this->template_part_markup( 'test-plugin-draft', self::PLUGIN_NAMESPACE ) );

		$this->assertStringNotContainsString( 'Customized template part', $output );
		$this->assertStringContainsString( 'Theme file template part', $output, 'The default version should render in place of the draft.' );
	}

	public function test_renders_nothing_when_plugin_does_not_provide_the_template_part() {
		$output = do_blocks( $this->template_part_markup( self::NO_FILE_SLUG, self::PLUGIN_NAMESPACE ) );

		$this->assertSame( $this->unavailable_output( self::NO_FILE_SLUG ), $output );
	}

	public function test_renders_customized_template_part_of_other_theme() {
		$this->create_template_part( 'test-other-theme-customized', self::OTHER_THEME );

		$output = do_blocks( $this->template_part_markup( 'test-other-theme-customized', self::OTHER_THEME ) );

		$this->assertStringContainsString( 'Customized template part', $output, 'A saved template part should render, as it does in the editor.' );
	}

	public function test_does_not_render_file_template_part_of_other_theme() {
		$file_action = new MockAction();
		add_action( 'render_block_core_template_part_file', array( $file_action, 'action' ) );

		$output = do_blocks( $this->template_part_markup( 'test-other-theme-file', self::OTHER_THEME ) );

		$this->assertSame( $this->unavailable_output( 'test-other-theme-file' ), $output, 'Only the active theme\'s files can be read.' );
		$this->assertSame( 0, $file_action->get_call_count(), 'The file action should not fire.' );
	}

	public function test_does_not_render_registered_template_with_the_same_slug() {
		register_block_template(
			self::PLUGIN_NAMESPACE . '//test-registered-template',
			array(
				'title'   => 'Test registered template',
				'content' => '<!-- wp:paragraph --><p>Registered template</p><!-- /wp:paragraph -->',
			)
		);

		$output = do_blocks( $this->template_part_markup( 'test-registered-template', self::OTHER_THEME ) );

		unregister_block_template( self::PLUGIN_NAMESPACE . '//test-registered-template' );

		$this->assertSame( $this->unavailable_output( 'test-registered-template' ), $output, 'A template must not render as a template part.' );
	}

	/**
	 * The render callback can be called directly with attributes that were not validated
	 * against the block's schema, as `do_blocks()` does. A `theme` that isn't a string
	 * must not be used.
	 *
	 * @dataProvider data_non_string_theme_attribute
	 *
	 * @param mixed $theme The `theme` attribute.
	 */
	public function test_render_callback_renders_nothing_for_non_string_theme( $theme ) {
		$output = gutenberg_render_block_core_template_part(
			array(
				'slug'  => 'test-invalid-theme',
				'theme' => $theme,
			)
		);

		$this->assertSame( $this->unavailable_output( 'test-invalid-theme' ), $output );
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_non_string_theme_attribute() {
		return array(
			'array'  => array( array( 'test-plugin' ) ),
			'number' => array( 42 ),
		);
	}

	public function test_renders_nothing_for_path_like_theme() {
		$output = do_blocks( $this->template_part_markup( 'test-invalid-theme', '../test-plugin' ) );

		$this->assertSame( $this->unavailable_output( 'test-invalid-theme' ), $output );
	}

	/**
	 * Tests that template part variations preserve descriptions when set,
	 * and fall back to a non-breaking space when empty or whitespace-only.
	 *
	 * @covers ::gutenberg_build_template_part_block_instance_variations
	 */
	public function test_build_template_part_block_instance_variations_description() {
		add_theme_support( 'block-template-parts' );

		$with_desc_id = wp_insert_post(
			array(
				'post_type'    => 'wp_template_part',
				'post_status'  => 'publish',
				'post_title'   => 'Header with Description',
				'post_name'    => 'header-with-desc',
				'post_excerpt' => 'Site header navigation description',
				'post_content' => self::POST_CONTENT,
			),
			true
		);
		$this->assertNotWPError( $with_desc_id );
		wp_set_post_terms( $with_desc_id, array( get_stylesheet() ), 'wp_theme' );
		wp_set_post_terms( $with_desc_id, array( WP_TEMPLATE_PART_AREA_HEADER ), 'wp_template_part_area' );

		$empty_desc_id = wp_insert_post(
			array(
				'post_type'    => 'wp_template_part',
				'post_status'  => 'publish',
				'post_title'   => 'Header Empty Description',
				'post_name'    => 'header-empty-desc',
				'post_excerpt' => '',
				'post_content' => self::POST_CONTENT,
			),
			true
		);
		$this->assertNotWPError( $empty_desc_id );
		wp_set_post_terms( $empty_desc_id, array( get_stylesheet() ), 'wp_theme' );
		wp_set_post_terms( $empty_desc_id, array( WP_TEMPLATE_PART_AREA_HEADER ), 'wp_template_part_area' );

		$whitespace_desc_id = wp_insert_post(
			array(
				'post_type'    => 'wp_template_part',
				'post_status'  => 'publish',
				'post_title'   => 'Header Whitespace Description',
				'post_name'    => 'header-whitespace-desc',
				'post_excerpt' => "  \n\t ",
				'post_content' => self::POST_CONTENT,
			),
			true
		);
		$this->assertNotWPError( $whitespace_desc_id );
		$whitespace_desc_post = get_post( $whitespace_desc_id );
		$this->assertInstanceOf( WP_Post::class, $whitespace_desc_post );
		$this->assertSame( "  \n\t ", $whitespace_desc_post->post_excerpt, 'The whitespace-only excerpt should be stored unchanged.' );
		wp_set_post_terms( $whitespace_desc_id, array( get_stylesheet() ), 'wp_theme' );
		wp_set_post_terms( $whitespace_desc_id, array( WP_TEMPLATE_PART_AREA_HEADER ), 'wp_template_part_area' );

		$variations = gutenberg_build_template_part_block_instance_variations();

		$with_desc_variation       = null;
		$empty_desc_variation      = null;
		$whitespace_desc_variation = null;

		foreach ( $variations as $variation ) {
			if ( 'instance_header-with-desc' === $variation['name'] ) {
				$with_desc_variation = $variation;
			} elseif ( 'instance_header-empty-desc' === $variation['name'] ) {
				$empty_desc_variation = $variation;
			} elseif ( 'instance_header-whitespace-desc' === $variation['name'] ) {
				$whitespace_desc_variation = $variation;
			}
		}

		$this->assertNotNull( $with_desc_variation, 'Variation with description should exist.' );
		$this->assertSame(
			'Site header navigation description',
			$with_desc_variation['description'],
			'Template part with description should retain its description string.'
		);

		$this->assertNotNull( $empty_desc_variation, 'Variation with empty description should exist.' );
		$this->assertSame(
			"\u{00A0}",
			$empty_desc_variation['description'],
			'Template part with empty description should fall back to non-breaking space (U+00A0).'
		);

		$this->assertIsArray( $whitespace_desc_variation, 'Variation with whitespace-only description should exist.' );
		$this->assertSame(
			"\u{00A0}",
			$whitespace_desc_variation['description'],
			'Template part with whitespace-only description should fall back to non-breaking space (U+00A0).'
		);
	}
}
