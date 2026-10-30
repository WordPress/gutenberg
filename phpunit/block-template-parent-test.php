<?php
/**
 * Tests for rendering a template inside the template assigned to it.
 *
 * @package gutenberg
 */

/**
 * @group block-templates
 *
 * @covers ::gutenberg_get_block_template_parent_slug
 * @covers ::gutenberg_resolve_block_template_parents
 * @covers ::gutenberg_substitute_template_content_slot
 * @covers ::gutenberg_validate_block_template_parent_slug
 */
class Tests_Block_Template_Parent extends WP_UnitTestCase {

	/**
	 * An administrator, who may edit templates.
	 *
	 * @var int
	 */
	protected static $admin_id;

	/**
	 * Template posts created by a test, deleted on tear down.
	 *
	 * @var int[]
	 */
	private $template_post_ids = array();

	/**
	 * The theme directories of the site, restored on tear down.
	 *
	 * @var string[]|null
	 */
	private $original_theme_directories = null;

	/**
	 * The templates the `theme.json` of the active theme names, keyed by the
	 * slug of the template rendered inside each of them.
	 *
	 * @var array<string, string>
	 */
	private $theme_templates = array();

	public static function wpSetUpBeforeClass( $factory ) {
		self::$admin_id = $factory->user->create( array( 'role' => 'administrator' ) );
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
	}

	public function tear_down() {
		foreach ( $this->template_post_ids as $post_id ) {
			wp_delete_post( $post_id, true );
		}
		$this->template_post_ids = array();

		if ( null !== $this->original_theme_directories ) {
			$GLOBALS['wp_theme_directories']  = $this->original_theme_directories;
			$this->original_theme_directories = null;
			remove_filter( 'theme_root', array( $this, 'filter_test_theme_root' ) );
			remove_filter( 'stylesheet_root', array( $this, 'filter_test_theme_root' ) );
			remove_filter( 'template_root', array( $this, 'filter_test_theme_root' ) );
			remove_filter( 'wp_theme_json_data_theme', array( $this, 'filter_theme_json_templates' ) );
			$this->theme_templates = array();
			wp_clean_themes_cache();
			unset( $GLOBALS['wp_themes'] );
			_gutenberg_clean_theme_json_caches();
		}

		parent::tear_down();
	}

	/**
	 * The directory of the themes of the test data.
	 *
	 * @return string The path of the directory.
	 */
	public function filter_test_theme_root() {
		return __DIR__ . '/data/themedir1';
	}

	/**
	 * Adds the templates of a `theme.json` to the data of the active theme.
	 *
	 * @param WP_Theme_JSON_Data_Gutenberg $theme_json The data of the active theme.
	 * @return WP_Theme_JSON_Data_Gutenberg The data, with the templates added.
	 */
	public function filter_theme_json_templates( $theme_json ) {
		$templates = array();
		foreach ( $this->theme_templates as $slug => $rendered_inside ) {
			$templates[] = array(
				'name'     => $slug,
				'template' => $rendered_inside,
			);
		}

		return $theme_json->update_with(
			array(
				'version'   => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'templates' => $templates,
			)
		);
	}

	/**
	 * Activates the block theme of the test data and has its `theme.json` name
	 * the template each of its templates is rendered inside.
	 *
	 * The declaration is added to the data of the theme rather than written to
	 * a theme of its own, so that no fixture theme exists only to carry it.
	 *
	 * @param array<string, string> $templates Slug of the template each one is rendered inside, keyed by its own slug.
	 */
	private function switch_to_theme_declaring( $templates ) {
		$this->theme_templates            = $templates;
		$this->original_theme_directories = $GLOBALS['wp_theme_directories'];
		// `/themes` is necessary as the theme functions assume it is the root
		// when there is only one.
		$GLOBALS['wp_theme_directories'] = array( WP_CONTENT_DIR . '/themes', $this->filter_test_theme_root() );

		add_filter( 'theme_root', array( $this, 'filter_test_theme_root' ) );
		add_filter( 'stylesheet_root', array( $this, 'filter_test_theme_root' ) );
		add_filter( 'template_root', array( $this, 'filter_test_theme_root' ) );
		add_filter( 'wp_theme_json_data_theme', array( $this, 'filter_theme_json_templates' ) );

		wp_clean_themes_cache();
		unset( $GLOBALS['wp_themes'] );
		_gutenberg_clean_theme_json_caches();

		switch_theme( 'block-theme' );
	}

	/**
	 * Returns the markup `get_block_template()` answers for a template part reference.
	 *
	 * Core adds the theme to every template part block of a template it reads,
	 * so the serialized result carries it too.
	 *
	 * @param string $slug Template part slug.
	 * @return string The template part block, as the template is read.
	 */
	private function template_part_block( $slug ) {
		return sprintf(
			'<!-- wp:template-part {"slug":"%s","theme":"%s"} /-->',
			$slug,
			get_stylesheet()
		);
	}

	/**
	 * Creates a custom `wp_template` post for the active theme.
	 *
	 * @param string      $slug           Template slug.
	 * @param string      $content        Template content.
	 * @param string|null $rendered_inside Optional. Slug of the template this one is rendered inside.
	 * @return string The template ID, as `theme//slug`.
	 */
	private function create_template( $slug, $content, $rendered_inside = null ) {
		$post_id = self::factory()->post->create(
			array(
				'post_type'    => 'wp_template',
				'post_name'    => $slug,
				'post_title'   => $slug,
				'post_content' => $content,
				'post_status'  => 'publish',
			)
		);
		wp_set_post_terms( $post_id, get_stylesheet(), 'wp_theme' );

		if ( null !== $rendered_inside ) {
			update_post_meta( $post_id, '_wp_page_template', $rendered_inside );
		}

		$this->template_post_ids[] = $post_id;

		return get_stylesheet() . '//' . $slug;
	}

	public function test_parent_slug_is_read_from_the_template() {
		$child_id = $this->create_template( 'page-404', '<!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph -->', 'layout' );

		$this->assertSame(
			'layout',
			gutenberg_get_block_template_parent_slug( get_block_template( $child_id, 'wp_template' ) )
		);
	}

	public function test_parent_slug_is_empty_without_one() {
		$child_id = $this->create_template( 'page-404', '<!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph -->' );

		$this->assertSame(
			'',
			gutenberg_get_block_template_parent_slug( get_block_template( $child_id, 'wp_template' ) )
		);
	}

	public function test_content_goes_in_the_post_content_block_of_the_parent() {
		$this->create_template(
			'layout',
			'<!-- wp:template-part {"slug":"header"} /--><!-- wp:post-content /--><!-- wp:template-part {"slug":"footer"} /-->'
		);
		$child_id = $this->create_template(
			'page-404',
			'<!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph -->',
			'layout'
		);

		$child    = get_block_template( $child_id, 'wp_template' );
		$resolved = gutenberg_resolve_block_template_parents( $child->id, $child->content );

		$this->assertStringContainsString( '"slug":"header"', $resolved );
		$this->assertStringContainsString( '<p>Not found</p>', $resolved );
		$this->assertStringContainsString( '"slug":"footer"', $resolved );
		$this->assertStringContainsString(
			'<!-- wp:post-content {"templateSlot":true} --><!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph --><!-- /wp:post-content -->',
			$resolved,
			'The content block of the parent keeps its place around the blocks of the child, so that its wrapper still renders.'
		);
		$this->assertLessThan(
			strpos( $resolved, '<p>Not found</p>' ),
			strpos( $resolved, '"slug":"header"' ),
			'The header of the parent should come before the content of the child.'
		);
		$this->assertGreaterThan(
			strpos( $resolved, '<p>Not found</p>' ),
			strpos( $resolved, '"slug":"footer"' ),
			'The footer of the parent should come after the content of the child.'
		);
	}

	public function test_post_content_block_nested_in_the_parent_is_the_slot() {
		$this->create_template(
			'layout',
			'<!-- wp:group {"tagName":"main"} --><main class="wp-block-group"><!-- wp:post-content /--></main><!-- /wp:group -->'
		);
		$child_id = $this->create_template(
			'page-404',
			'<!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph -->',
			'layout'
		);

		$child    = get_block_template( $child_id, 'wp_template' );
		$resolved = gutenberg_resolve_block_template_parents( $child->id, $child->content );

		$this->assertSame(
			'<!-- wp:group {"tagName":"main"} --><main class="wp-block-group"><!-- wp:post-content {"templateSlot":true} --><!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph --><!-- /wp:post-content --></main><!-- /wp:group -->',
			$resolved
		);
	}

	public function test_several_blocks_go_in_the_slot() {
		$this->create_template(
			'layout',
			'<!-- wp:group --><div class="wp-block-group"><!-- wp:post-content /--><!-- wp:separator /--></div><!-- /wp:group -->'
		);
		$child_id = $this->create_template(
			'page-404',
			'<!-- wp:heading --><h2>Oops</h2><!-- /wp:heading --><!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph -->',
			'layout'
		);

		$child    = get_block_template( $child_id, 'wp_template' );
		$resolved = gutenberg_resolve_block_template_parents( $child->id, $child->content );

		$this->assertSame(
			'<!-- wp:group --><div class="wp-block-group"><!-- wp:post-content {"templateSlot":true} --><!-- wp:heading --><h2>Oops</h2><!-- /wp:heading --><!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph --><!-- /wp:post-content --><!-- wp:separator /--></div><!-- /wp:group -->',
			$resolved
		);
	}

	public function test_a_post_content_block_in_the_child_is_kept() {
		$this->create_template(
			'layout',
			'<!-- wp:template-part {"slug":"header"} /--><!-- wp:post-content /-->'
		);
		$child_id = $this->create_template(
			'single',
			'<!-- wp:post-title /--><!-- wp:post-content /-->',
			'layout'
		);

		$child    = get_block_template( $child_id, 'wp_template' );
		$resolved = gutenberg_resolve_block_template_parents( $child->id, $child->content );

		$this->assertSame(
			$this->template_part_block( 'header' ) . '<!-- wp:post-content {"templateSlot":true} --><!-- wp:post-title /--><!-- wp:post-content /--><!-- /wp:post-content -->',
			$resolved,
			"The child's own post content block renders the queried post, so it must survive."
		);
	}

	public function test_resolution_walks_every_level() {
		$this->create_template(
			'base',
			'<!-- wp:template-part {"slug":"header"} /--><!-- wp:post-content /-->'
		);
		$this->create_template(
			'layout',
			'<!-- wp:group --><div class="wp-block-group"><!-- wp:post-content /--></div><!-- /wp:group -->',
			'base'
		);
		$child_id = $this->create_template(
			'page-404',
			'<!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph -->',
			'layout'
		);

		$child    = get_block_template( $child_id, 'wp_template' );
		$resolved = gutenberg_resolve_block_template_parents( $child->id, $child->content );

		$this->assertSame(
			$this->template_part_block( 'header' ) . '<!-- wp:post-content {"templateSlot":true} --><!-- wp:group --><div class="wp-block-group"><!-- wp:post-content {"templateSlot":true} --><!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph --><!-- /wp:post-content --></div><!-- /wp:group --><!-- /wp:post-content -->',
			$resolved
		);
	}

	public function test_a_loop_between_two_templates_resolves_once() {
		$this->create_template(
			'layout',
			'<!-- wp:template-part {"slug":"header"} /--><!-- wp:post-content /-->',
			'page-404'
		);
		$child_id = $this->create_template(
			'page-404',
			'<!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph -->',
			'layout'
		);

		$child    = get_block_template( $child_id, 'wp_template' );
		$resolved = gutenberg_resolve_block_template_parents( $child->id, $child->content );

		$this->assertSame(
			$this->template_part_block( 'header' ) . '<!-- wp:post-content {"templateSlot":true} --><!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph --><!-- /wp:post-content -->',
			$resolved
		);
	}

	public function test_a_template_that_is_its_own_parent_is_not_resolved() {
		$child_id = $this->create_template(
			'page-404',
			'<!-- wp:post-content /-->',
			'page-404'
		);

		$child = get_block_template( $child_id, 'wp_template' );

		$this->assertNull( gutenberg_resolve_block_template_parents( $child->id, $child->content ) );
	}

	public function test_a_post_content_block_inside_a_query_loop_is_not_the_slot() {
		$this->create_template(
			'layout',
			'<!-- wp:query --><div class="wp-block-query"><!-- wp:post-template --><!-- wp:post-content /--><!-- /wp:post-template --></div><!-- /wp:query --><!-- wp:post-content /-->'
		);
		$child_id = $this->create_template(
			'page-404',
			'<!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph -->',
			'layout'
		);

		$child    = get_block_template( $child_id, 'wp_template' );
		$resolved = gutenberg_resolve_block_template_parents( $child->id, $child->content );

		$this->assertSame(
			'<!-- wp:query --><div class="wp-block-query"><!-- wp:post-template --><!-- wp:post-content /--><!-- /wp:post-template --></div><!-- /wp:query --><!-- wp:post-content {"templateSlot":true} --><!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph --><!-- /wp:post-content -->',
			$resolved,
			'A query loop renders its blocks once per post, so its post content block belongs to the post.'
		);
	}

	public function test_a_parent_whose_only_post_content_block_is_in_a_query_loop_is_not_resolved() {
		$this->create_template(
			'layout',
			'<!-- wp:query --><div class="wp-block-query"><!-- wp:post-template --><!-- wp:post-content /--><!-- /wp:post-template --></div><!-- /wp:query -->'
		);
		$child_id = $this->create_template(
			'page-404',
			'<!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph -->',
			'layout'
		);

		$child = get_block_template( $child_id, 'wp_template' );

		$this->assertNull( gutenberg_resolve_block_template_parents( $child->id, $child->content ) );
	}

	public function test_a_template_has_a_content_slot() {
		$this->assertTrue(
			gutenberg_block_template_has_content_slot( '<!-- wp:group --><div><!-- wp:post-content /--></div><!-- /wp:group -->' )
		);
		$this->assertFalse(
			gutenberg_block_template_has_content_slot( '<!-- wp:paragraph --><p>Hi</p><!-- /wp:paragraph -->' )
		);
		$this->assertFalse(
			gutenberg_block_template_has_content_slot( '<!-- wp:query --><div><!-- wp:post-template --><!-- wp:post-content /--><!-- /wp:post-template --></div><!-- /wp:query -->' )
		);
		$this->assertFalse( gutenberg_block_template_has_content_slot( '' ) );
	}

	public function test_a_parent_without_a_slot_is_not_resolved() {
		$this->create_template( 'layout', '<!-- wp:template-part {"slug":"header"} /-->' );
		$child_id = $this->create_template(
			'page-404',
			'<!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph -->',
			'layout'
		);

		$child = get_block_template( $child_id, 'wp_template' );

		$this->assertNull( gutenberg_resolve_block_template_parents( $child->id, $child->content ) );
	}

	public function test_a_missing_parent_is_not_resolved() {
		$child_id = $this->create_template(
			'page-404',
			'<!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph -->',
			'does-not-exist'
		);

		$child = get_block_template( $child_id, 'wp_template' );

		$this->assertNull( gutenberg_resolve_block_template_parents( $child->id, $child->content ) );
	}

	public function test_a_template_without_a_parent_is_not_resolved() {
		$child_id = $this->create_template( 'page-404', '<!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph -->' );

		$child = get_block_template( $child_id, 'wp_template' );

		$this->assertNull( gutenberg_resolve_block_template_parents( $child->id, $child->content ) );
	}

	public function test_a_saved_change_to_the_parent_is_resolved() {
		$this->create_template( 'layout', '<!-- wp:post-content /-->' );
		$child_id = $this->create_template(
			'page-404',
			'<!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph -->',
			'layout'
		);

		// Fills the templates remembered for the request, the way
		// `locate_block_template()` does before a template is rendered.
		get_block_templates( array(), 'wp_template' );

		$child = get_block_template( $child_id, 'wp_template' );
		gutenberg_resolve_block_template_parents( $child->id, $child->content );

		$layout = get_block_template( get_stylesheet() . '//layout', 'wp_template' );
		wp_update_post(
			array(
				'ID'           => $layout->wp_id,
				'post_content' => $this->template_part_block( 'header' ) . '<!-- wp:post-content /-->',
			)
		);

		$this->assertSame(
			$this->template_part_block( 'header' ) . '<!-- wp:post-content {"templateSlot":true} --><!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph --><!-- /wp:post-content -->',
			gutenberg_resolve_block_template_parents( $child->id, $child->content ),
			'The templates remembered for the request are forgotten when one of them is saved.'
		);
	}

	public function test_the_rendered_template_content_is_resolved() {
		global $_wp_current_template_content, $_wp_current_template_id;

		$this->create_template(
			'layout',
			'<!-- wp:template-part {"slug":"header"} /--><!-- wp:post-content /-->'
		);
		$child_id = $this->create_template(
			'page-404',
			'<!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph -->',
			'layout'
		);

		$child                        = get_block_template( $child_id, 'wp_template' );
		$_wp_current_template_id      = $child->id;
		$_wp_current_template_content = $child->content;

		apply_filters( 'template_include', ABSPATH . WPINC . '/template-canvas.php' );

		$this->assertSame(
			$this->template_part_block( 'header' ) . '<!-- wp:post-content {"templateSlot":true} --><!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph --><!-- /wp:post-content -->',
			$_wp_current_template_content
		);
	}

	public function test_rest_response_reports_the_template_it_is_rendered_inside() {
		wp_set_current_user( self::$admin_id );
		$this->create_template( 'layout', '<!-- wp:post-content /-->' );
		$this->create_template( 'page-404', '<!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph -->', 'layout' );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/templates/' . get_stylesheet() . '//page-404' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 'layout', $response->get_data()['template'] );
	}

	public function test_rest_response_reports_an_empty_template_without_one() {
		wp_set_current_user( self::$admin_id );
		$this->create_template( 'page-404', '<!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph -->' );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/templates/' . get_stylesheet() . '//page-404' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( '', $response->get_data()['template'] );
	}

	public function test_rest_request_stores_the_template_to_render_inside() {
		wp_set_current_user( self::$admin_id );
		$this->create_template( 'layout', '<!-- wp:post-content /-->' );
		$child_id = $this->create_template( 'page-404', '<!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph -->' );

		$request = new WP_REST_Request( 'PUT', '/wp/v2/templates/' . get_stylesheet() . '//page-404' );
		$request->set_body_params( array( 'template' => 'layout' ) );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'layout', $response->get_data()['template'] );
		$this->assertSame(
			'layout',
			gutenberg_get_block_template_parent_slug( get_block_template( $child_id, 'wp_template' ) )
		);
	}

	public function test_rest_request_clears_the_template_to_render_inside() {
		wp_set_current_user( self::$admin_id );
		$this->create_template( 'layout', '<!-- wp:post-content /-->' );
		$child_id = $this->create_template( 'page-404', '<!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph -->', 'layout' );

		$request = new WP_REST_Request( 'PUT', '/wp/v2/templates/' . get_stylesheet() . '//page-404' );
		$request->set_body_params( array( 'template' => '' ) );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( '', $response->get_data()['template'] );
		$this->assertSame(
			'',
			gutenberg_get_block_template_parent_slug( get_block_template( $child_id, 'wp_template' ) )
		);
	}

	public function test_rest_response_reports_whether_a_template_can_render_one_inside() {
		wp_set_current_user( self::$admin_id );
		$this->create_template( 'layout', '<!-- wp:post-content /-->' );
		$this->create_template( 'page-404', '<!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph -->' );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/templates/' . get_stylesheet() . '//layout' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertTrue( $response->get_data()['has_content_slot'] );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/templates/' . get_stylesheet() . '//page-404' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertFalse( $response->get_data()['has_content_slot'] );
	}

	public function test_template_parts_do_not_carry_the_field() {
		wp_set_current_user( self::$admin_id );
		$post_id = self::factory()->post->create(
			array(
				'post_type'   => 'wp_template_part',
				'post_name'   => 'header',
				'post_title'  => 'Header',
				'post_status' => 'publish',
			)
		);
		wp_set_post_terms( $post_id, get_stylesheet(), 'wp_theme' );
		wp_set_post_terms( $post_id, WP_TEMPLATE_PART_AREA_HEADER, 'wp_template_part_area' );
		$this->template_post_ids[] = $post_id;

		$request  = new WP_REST_Request( 'GET', '/wp/v2/template-parts/' . get_stylesheet() . '//header' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertArrayNotHasKey( 'template', $response->get_data() );
		$this->assertArrayNotHasKey( 'has_content_slot', $response->get_data() );
	}

	public function test_a_theme_names_the_template_its_templates_are_rendered_inside() {
		$this->switch_to_theme_declaring( array( 'custom-hero-template' => 'index' ) );

		$this->assertSame(
			'index',
			gutenberg_get_block_template_parent_slug(
				get_block_template( 'block-theme//custom-hero-template', 'wp_template' )
			),
			'A template of the theme is rendered inside the one its theme.json names.'
		);
		$this->assertSame(
			'',
			gutenberg_get_block_template_parent_slug(
				get_block_template( 'block-theme//index', 'wp_template' )
			),
			'The template it names is rendered on its own.'
		);
	}

	public function test_a_theme_declaration_renders_the_template_inside_it() {
		$this->switch_to_theme_declaring( array( 'page-404' => 'layout' ) );
		$this->create_template(
			'layout',
			$this->template_part_block( 'header' ) . '<!-- wp:post-content /-->' . $this->template_part_block( 'footer' )
		);
		$child_id = $this->create_template(
			'page-404',
			'<!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph -->'
		);

		$child    = get_block_template( $child_id, 'wp_template' );
		$resolved = gutenberg_resolve_block_template_parents( $child->id, $child->content );

		$this->assertStringContainsString( '"slug":"header"', $resolved );
		$this->assertStringContainsString( 'Not found', $resolved );
		$this->assertStringContainsString( '"slug":"footer"', $resolved );
		$this->assertGreaterThan(
			strpos( $resolved, '<!-- wp:post-content {"templateSlot":true} -->' ),
			strpos( $resolved, 'Not found' ),
			'The blocks of the template go in the content block of the one its theme.json names.'
		);
		$this->assertLessThan(
			strpos( $resolved, '<!-- /wp:post-content -->' ),
			strpos( $resolved, 'Not found' ),
			'The blocks of the template go in the content block of the one its theme.json names.'
		);
	}

	public function test_the_template_of_the_post_wins_over_the_theme_declaration() {
		$this->switch_to_theme_declaring( array( 'page-404' => 'layout' ) );
		$this->create_template( 'other-layout', '<!-- wp:post-content /-->' );
		$child_id = $this->create_template(
			'page-404',
			'<!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph -->',
			'other-layout'
		);

		$this->assertSame(
			'other-layout',
			gutenberg_get_block_template_parent_slug( get_block_template( $child_id, 'wp_template' ) )
		);
	}

	public function test_a_template_can_be_rendered_on_its_own_against_the_theme_declaration() {
		$this->switch_to_theme_declaring( array( 'page-404' => 'layout' ) );
		$this->create_template( 'layout', '<!-- wp:post-content /-->' );
		$child_id = $this->create_template(
			'page-404',
			'<!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph -->',
			'default'
		);

		$template = get_block_template( $child_id, 'wp_template' );

		$this->assertSame(
			'',
			gutenberg_get_block_template_parent_slug( $template ),
			'The template of the post is the default one, so the theme declaration no longer applies.'
		);
		$this->assertNull( gutenberg_resolve_block_template_parents( $template->id, $template->content ) );
	}

	public function test_reverting_a_template_restores_the_theme_declaration() {
		wp_set_current_user( self::$admin_id );
		$this->switch_to_theme_declaring( array( 'custom-hero-template' => 'index' ) );

		$request = new WP_REST_Request( 'PUT', '/wp/v2/templates/block-theme//custom-hero-template' );
		$request->set_body_params( array( 'template' => '' ) );
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( '', $response->get_data()['template'], 'The site renders the template on its own.' );

		$request = new WP_REST_Request( 'PUT', '/wp/v2/templates/block-theme//custom-hero-template' );
		$request->set_body_params( array( 'source' => 'theme' ) );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame(
			'index',
			$response->get_data()['template'],
			'Reverting the template to the one of the theme drops the choice of the site with it.'
		);
	}

	public function test_the_declaration_of_another_theme_is_not_read() {
		$this->switch_to_theme_declaring( array( '404' => 'layout' ) );
		$post_id = self::factory()->post->create(
			array(
				'post_type'    => 'wp_template',
				'post_name'    => '404',
				'post_title'   => '404',
				'post_content' => '<!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph -->',
				'post_status'  => 'publish',
			)
		);
		wp_set_post_terms( $post_id, 'another-theme', 'wp_theme' );
		$this->template_post_ids[] = $post_id;

		$this->assertSame(
			'',
			gutenberg_get_block_template_parent_slug( get_block_template( 'another-theme//404', 'wp_template' ) ),
			'Only the theme.json of the active theme is read.'
		);
	}

	public function test_the_rest_response_reports_the_theme_declaration() {
		wp_set_current_user( self::$admin_id );
		$this->switch_to_theme_declaring( array( 'custom-hero-template' => 'index' ) );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/templates/block-theme//custom-hero-template' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 'index', $response->get_data()['template'] );
	}

	public function test_the_slot_keeps_the_attributes_of_the_content_block() {
		$this->create_template( 'layout', '<!-- wp:post-content {"tagName":"main","align":"wide"} /-->' );
		$child_id = $this->create_template(
			'page-404',
			'<!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph -->',
			'layout'
		);

		$child = get_block_template( $child_id, 'wp_template' );

		$this->assertSame(
			'<!-- wp:post-content {"tagName":"main","align":"wide","templateSlot":true} --><!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph --><!-- /wp:post-content -->',
			gutenberg_resolve_block_template_parents( $child->id, $child->content ),
			'The block supports of the content block are what its wrapper is built from, so its attributes have to survive.'
		);
	}

	public function test_the_rendered_slot_carries_the_wrapper_of_the_content_block() {
		$this->create_template( 'layout', '<!-- wp:post-content {"align":"wide"} /-->' );
		$child_id = $this->create_template(
			'page-404',
			'<!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph -->',
			'layout'
		);

		$child    = get_block_template( $child_id, 'wp_template' );
		$rendered = do_blocks( gutenberg_resolve_block_template_parents( $child->id, $child->content ) );

		$this->assertStringStartsWith( '<div ', $rendered );
		$this->assertStringEndsWith( '</div>', $rendered );
		$this->assertStringContainsString( '>Not found</p>', $rendered );

		$wrapper = substr( $rendered, 0, strpos( $rendered, '>' ) );
		$this->assertStringContainsString( 'wp-block-post-content', $wrapper );
		$this->assertStringContainsString( 'entry-content', $wrapper, 'A theme styling the content block reaches the template rendered inside.' );
		$this->assertStringContainsString( 'alignwide', $wrapper, 'The alignment of the content block applies to the template rendered inside.' );
		$this->assertStringContainsString( 'is-layout-', $wrapper, 'The layout of the content block applies to the template rendered inside.' );
	}

	public function test_the_rendered_slot_keeps_the_tag_name_of_the_content_block() {
		$this->create_template( 'layout', '<!-- wp:post-content {"tagName":"main"} /-->' );
		$child_id = $this->create_template(
			'page-404',
			'<!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph -->',
			'layout'
		);

		$child    = get_block_template( $child_id, 'wp_template' );
		$rendered = do_blocks( gutenberg_resolve_block_template_parents( $child->id, $child->content ) );

		$this->assertStringStartsWith( '<main ', $rendered );
		$this->assertStringEndsWith( '</main>', $rendered );
	}

	public function test_an_empty_template_renders_no_wrapper() {
		$this->create_template( 'layout', '<!-- wp:post-content /-->' );
		$child_id = $this->create_template( 'page-404', '', 'layout' );

		$child = get_block_template( $child_id, 'wp_template' );

		$this->assertSame(
			'',
			do_blocks( gutenberg_resolve_block_template_parents( $child->id, $child->content ) ),
			'An empty content block renders nothing, the way the content block of an empty post does.'
		);
	}

	public function test_a_content_block_that_is_not_a_slot_still_renders_the_post() {
		$post_id = self::factory()->post->create(
			array(
				'post_content' => '<!-- wp:paragraph --><p>The post</p><!-- /wp:paragraph -->',
			)
		);

		$GLOBALS['post'] = get_post( $post_id );
		setup_postdata( $GLOBALS['post'] );

		$rendered = do_blocks( '<!-- wp:post-content /-->' );

		$this->assertStringContainsString(
			'>The post</p>',
			$rendered,
			'A content block that is not the slot of a template renders the post of the request, as it always has.'
		);

		wp_reset_postdata();
	}

	public function test_rest_request_rejects_a_template_rendered_inside_itself() {
		wp_set_current_user( self::$admin_id );
		$this->create_template( 'page-404', '<!-- wp:post-content /-->' );

		$request = new WP_REST_Request( 'PUT', '/wp/v2/templates/' . get_stylesheet() . '//page-404' );
		$request->set_body_params( array( 'template' => 'page-404' ) );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'rest_template_parent_itself', $response->get_data()['code'] );
		$this->assertSame(
			'',
			gutenberg_get_block_template_parent_slug( get_block_template( get_stylesheet() . '//page-404', 'wp_template' ) ),
			'Nothing is stored when the request is rejected.'
		);
	}

	public function test_rest_request_rejects_a_template_that_does_not_exist() {
		wp_set_current_user( self::$admin_id );
		$this->create_template( 'page-404', '<!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph -->' );

		$request = new WP_REST_Request( 'PUT', '/wp/v2/templates/' . get_stylesheet() . '//page-404' );
		$request->set_body_params( array( 'template' => 'does-not-exist' ) );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'rest_template_parent_not_found', $response->get_data()['code'] );
	}

	public function test_rest_request_rejects_a_loop() {
		wp_set_current_user( self::$admin_id );
		$this->create_template( 'layout', '<!-- wp:post-content /-->', 'page-404' );
		$this->create_template( 'page-404', '<!-- wp:post-content /-->' );

		$request = new WP_REST_Request( 'PUT', '/wp/v2/templates/' . get_stylesheet() . '//page-404' );
		$request->set_body_params( array( 'template' => 'layout' ) );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'rest_template_parent_loop', $response->get_data()['code'] );
	}

	public function test_rest_request_rejects_a_loop_further_up_the_chain() {
		wp_set_current_user( self::$admin_id );
		$this->create_template( 'base', '<!-- wp:post-content /-->', 'page-404' );
		$this->create_template( 'layout', '<!-- wp:post-content /-->', 'base' );
		$this->create_template( 'page-404', '<!-- wp:post-content /-->' );

		$request = new WP_REST_Request( 'PUT', '/wp/v2/templates/' . get_stylesheet() . '//page-404' );
		$request->set_body_params( array( 'template' => 'layout' ) );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'rest_template_parent_loop', $response->get_data()['code'] );
	}

	public function test_rest_request_stores_a_template_that_has_no_slot_of_its_own() {
		wp_set_current_user( self::$admin_id );
		$this->create_template( 'layout', '<!-- wp:template-part {"slug":"header"} /-->' );
		$this->create_template( 'page-404', '<!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph -->' );

		$request = new WP_REST_Request( 'PUT', '/wp/v2/templates/' . get_stylesheet() . '//page-404' );
		$request->set_body_params( array( 'template' => 'layout' ) );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame(
			200,
			$response->get_status(),
			'A template that has lost its content block is a template to fix, not an assignment to reject.'
		);
	}
}
