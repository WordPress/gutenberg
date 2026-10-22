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

		parent::tear_down();
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

	public function test_content_replaces_the_post_content_block_of_the_parent() {
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
		$this->assertStringNotContainsString( 'wp:post-content', $resolved );
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
			'<!-- wp:group {"tagName":"main"} --><main class="wp-block-group"><!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph --></main><!-- /wp:group -->',
			$resolved
		);
	}

	public function test_several_blocks_are_substituted_for_the_slot() {
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
			'<!-- wp:group --><div class="wp-block-group"><!-- wp:heading --><h2>Oops</h2><!-- /wp:heading --><!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph --><!-- wp:separator /--></div><!-- /wp:group -->',
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
			$this->template_part_block( 'header' ) . '<!-- wp:post-title /--><!-- wp:post-content /-->',
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
			$this->template_part_block( 'header' ) . '<!-- wp:group --><div class="wp-block-group"><!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph --></div><!-- /wp:group -->',
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
			$this->template_part_block( 'header' ) . '<!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph -->',
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
			'<!-- wp:query --><div class="wp-block-query"><!-- wp:post-template --><!-- wp:post-content /--><!-- /wp:post-template --></div><!-- /wp:query --><!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph -->',
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
			$this->template_part_block( 'header' ) . '<!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph -->',
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
			$this->template_part_block( 'header' ) . '<!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph -->',
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
}
