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
 * @covers ::gutenberg_substitute_template_slot
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
			update_post_meta( $post_id, GUTENBERG_TEMPLATE_PARENT_META_KEY, $rendered_inside );
		}

		$this->template_post_ids[] = $post_id;

		return get_stylesheet() . '//' . $slug;
	}

	/**
	 * Creates a custom `wp_template_part` post for the active theme.
	 *
	 * @param string $slug    Template part slug.
	 * @param string $content Template part content.
	 * @return string The template part ID, as `theme//slug`.
	 */
	private function create_template_part( $slug, $content ) {
		$post_id = self::factory()->post->create(
			array(
				'post_type'    => 'wp_template_part',
				'post_name'    => $slug,
				'post_title'   => $slug,
				'post_content' => $content,
				'post_status'  => 'publish',
			)
		);
		wp_set_post_terms( $post_id, get_stylesheet(), 'wp_theme' );
		wp_set_post_terms( $post_id, WP_TEMPLATE_PART_AREA_UNCATEGORIZED, 'wp_template_part_area' );

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

	public function test_content_goes_in_the_slot_of_the_parent() {
		$this->create_template(
			'layout',
			'<!-- wp:template-part {"slug":"header"} /--><!-- wp:template-slot /--><!-- wp:template-part {"slug":"footer"} /-->'
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
			'<!-- wp:template-slot --><!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph --><!-- /wp:template-slot -->',
			$resolved,
			'The slot of the parent keeps its place around the blocks of the child, so that its wrapper still renders.'
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

	public function test_a_slot_nested_in_the_parent_is_found() {
		$this->create_template(
			'layout',
			'<!-- wp:group {"tagName":"main"} --><main class="wp-block-group"><!-- wp:template-slot /--></main><!-- /wp:group -->'
		);
		$child_id = $this->create_template(
			'page-404',
			'<!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph -->',
			'layout'
		);

		$child    = get_block_template( $child_id, 'wp_template' );
		$resolved = gutenberg_resolve_block_template_parents( $child->id, $child->content );

		$this->assertSame(
			'<!-- wp:group {"tagName":"main"} --><main class="wp-block-group"><!-- wp:template-slot --><!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph --><!-- /wp:template-slot --></main><!-- /wp:group -->',
			$resolved
		);
	}

	public function test_several_blocks_go_in_the_slot() {
		$this->create_template(
			'layout',
			'<!-- wp:group --><div class="wp-block-group"><!-- wp:template-slot /--><!-- wp:separator /--></div><!-- /wp:group -->'
		);
		$child_id = $this->create_template(
			'page-404',
			'<!-- wp:heading --><h2>Oops</h2><!-- /wp:heading --><!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph -->',
			'layout'
		);

		$child    = get_block_template( $child_id, 'wp_template' );
		$resolved = gutenberg_resolve_block_template_parents( $child->id, $child->content );

		$this->assertSame(
			'<!-- wp:group --><div class="wp-block-group"><!-- wp:template-slot --><!-- wp:heading --><h2>Oops</h2><!-- /wp:heading --><!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph --><!-- /wp:template-slot --><!-- wp:separator /--></div><!-- /wp:group -->',
			$resolved
		);
	}

	public function test_a_post_content_block_in_the_child_is_kept() {
		$this->create_template(
			'layout',
			'<!-- wp:template-part {"slug":"header"} /--><!-- wp:template-slot /-->'
		);
		$child_id = $this->create_template(
			'single',
			'<!-- wp:post-title /--><!-- wp:post-content /-->',
			'layout'
		);

		$child    = get_block_template( $child_id, 'wp_template' );
		$resolved = gutenberg_resolve_block_template_parents( $child->id, $child->content );

		$this->assertSame(
			$this->template_part_block( 'header' ) . '<!-- wp:template-slot --><!-- wp:post-title /--><!-- wp:post-content /--><!-- /wp:template-slot -->',
			$resolved,
			"The child's own post content block renders the queried post, so it must survive."
		);
	}

	public function test_only_the_template_named_is_rendered_around_it() {
		$this->create_template(
			'base',
			'<!-- wp:template-part {"slug":"header"} /--><!-- wp:template-slot /-->'
		);
		$this->create_template(
			'layout',
			'<!-- wp:group --><div class="wp-block-group"><!-- wp:template-slot /--></div><!-- /wp:group -->',
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
			'<!-- wp:group --><div class="wp-block-group"><!-- wp:template-slot --><!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph --><!-- /wp:template-slot --></div><!-- /wp:group -->',
			$resolved
		);
	}

	public function test_two_templates_naming_each_other_resolve_once() {
		$this->create_template(
			'layout',
			'<!-- wp:template-part {"slug":"header"} /--><!-- wp:template-slot /-->',
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
			$this->template_part_block( 'header' ) . '<!-- wp:template-slot --><!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph --><!-- /wp:template-slot -->',
			$resolved
		);
	}

	public function test_a_template_that_is_its_own_parent_is_not_resolved() {
		$child_id = $this->create_template(
			'page-404',
			'<!-- wp:template-slot /-->',
			'page-404'
		);

		$child = get_block_template( $child_id, 'wp_template' );

		$this->assertNull( gutenberg_resolve_block_template_parents( $child->id, $child->content ) );
	}

	public function test_a_slot_in_a_pattern_of_the_parent_is_found() {
		register_block_pattern(
			'gutenberg-test/slot',
			array(
				'title'   => 'Slot',
				'content' => '<!-- wp:group --><div class="wp-block-group"><!-- wp:template-slot /--></div><!-- /wp:group -->',
			)
		);
		$this->create_template( 'layout', '<!-- wp:pattern {"slug":"gutenberg-test/slot"} /-->' );
		$child_id = $this->create_template(
			'page-404',
			'<!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph -->',
			'layout'
		);

		$child    = get_block_template( $child_id, 'wp_template' );
		$resolved = gutenberg_resolve_block_template_parents( $child->id, $child->content );

		unregister_block_pattern( 'gutenberg-test/slot' );

		$this->assertNotNull( $resolved, 'Themes build templates out of patterns, so the slot is found in one, as the editor finds it.' );
		$this->assertStringContainsString(
			'<!-- wp:template-slot --><!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph --><!-- /wp:template-slot -->',
			$resolved
		);
		$this->assertStringNotContainsString( 'wp:pattern', $resolved, 'The pattern is resolved into its blocks.' );
	}

	public function test_a_content_block_in_the_parent_is_not_the_slot() {
		$this->create_template( 'layout', '<!-- wp:post-content /-->' );
		$child_id = $this->create_template(
			'page-404',
			'<!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph -->',
			'layout'
		);

		$child = get_block_template( $child_id, 'wp_template' );

		$this->assertNull(
			gutenberg_resolve_block_template_parents( $child->id, $child->content ),
			'The content block renders the post of the request, whatever template it is in.'
		);
	}

	public function test_the_child_takes_the_place_of_what_the_slot_holds() {
		$this->create_template(
			'layout',
			'<!-- wp:template-slot --><!-- wp:paragraph --><p>The latest posts</p><!-- /wp:paragraph --><!-- /wp:template-slot -->'
		);
		$child_id = $this->create_template(
			'page-404',
			'<!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph -->',
			'layout'
		);

		$child = get_block_template( $child_id, 'wp_template' );

		$this->assertSame(
			'<!-- wp:template-slot --><!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph --><!-- /wp:template-slot -->',
			gutenberg_resolve_block_template_parents( $child->id, $child->content ),
			'What the slot holds is for the requests of the template it is in, rendered on its own.'
		);
	}

	public function test_the_first_of_two_slots_is_the_slot() {
		$this->create_template(
			'layout',
			'<!-- wp:template-slot /--><!-- wp:template-slot /-->'
		);
		$child_id = $this->create_template(
			'page-404',
			'<!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph -->',
			'layout'
		);

		$child = get_block_template( $child_id, 'wp_template' );

		$this->assertSame(
			'<!-- wp:template-slot --><!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph --><!-- /wp:template-slot --><!-- wp:template-slot /-->',
			gutenberg_resolve_block_template_parents( $child->id, $child->content ),
			'The editor lets a template have one slot, and treats the first as the slot when it has more anyway.'
		);
	}

	public function test_a_template_has_a_slot() {
		$this->assertTrue(
			gutenberg_block_template_has_slot( '<!-- wp:group --><div><!-- wp:template-slot /--></div><!-- /wp:group -->' )
		);
		$this->assertFalse(
			gutenberg_block_template_has_slot( '<!-- wp:paragraph --><p>Hi</p><!-- /wp:paragraph -->' )
		);
		$this->assertFalse(
			gutenberg_block_template_has_slot( '<!-- wp:post-content /-->' ),
			'The content block is not a slot.'
		);
		$this->assertFalse( gutenberg_block_template_has_slot( '' ) );

		register_block_pattern(
			'gutenberg-test/slot',
			array(
				'title'   => 'Slot',
				'content' => '<!-- wp:template-slot /-->',
			)
		);
		$has_slot = gutenberg_block_template_has_slot( '<!-- wp:pattern {"slug":"gutenberg-test/slot"} /-->' );
		unregister_block_pattern( 'gutenberg-test/slot' );

		$this->assertTrue( $has_slot, 'A slot in a pattern of the template is one.' );
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
		$this->create_template( 'layout', '<!-- wp:template-slot /-->' );
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
				'post_content' => $this->template_part_block( 'header' ) . '<!-- wp:template-slot /-->',
			)
		);

		$this->assertSame(
			$this->template_part_block( 'header' ) . '<!-- wp:template-slot --><!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph --><!-- /wp:template-slot -->',
			gutenberg_resolve_block_template_parents( $child->id, $child->content ),
			'The templates remembered for the request are forgotten when one of them is saved.'
		);
	}

	public function test_the_rendered_template_content_is_resolved_on_template_include() {
		$this->assertSame(
			10,
			has_filter( 'template_include', 'gutenberg_render_block_template_inside_parent' ),
			'The template of the request is resolved as it is included, which is when its content is in the global the canvas renders.'
		);
	}

	public function test_the_rendered_template_content_is_resolved() {
		global $_wp_current_template_content, $_wp_current_template_id;

		$this->create_template(
			'layout',
			'<!-- wp:template-part {"slug":"header"} /--><!-- wp:template-slot /-->'
		);
		$child_id = $this->create_template(
			'page-404',
			'<!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph -->',
			'layout'
		);

		$child                        = get_block_template( $child_id, 'wp_template' );
		$_wp_current_template_id      = $child->id;
		$_wp_current_template_content = $child->content;

		gutenberg_render_block_template_inside_parent( ABSPATH . WPINC . '/template-canvas.php' );

		$this->assertSame(
			$this->template_part_block( 'header' ) . '<!-- wp:template-slot --><!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph --><!-- /wp:template-slot -->',
			$_wp_current_template_content
		);
	}

	public function test_an_empty_template_is_rendered_inside_the_one_it_names() {
		global $_wp_current_template_content, $_wp_current_template_id;

		$this->create_template(
			'layout',
			'<!-- wp:template-part {"slug":"header"} /--><!-- wp:template-slot /-->'
		);
		$child_id = $this->create_template( 'page-404', '', 'layout' );

		$child                        = get_block_template( $child_id, 'wp_template' );
		$_wp_current_template_id      = $child->id;
		$_wp_current_template_content = $child->content;

		gutenberg_render_block_template_inside_parent( ABSPATH . WPINC . '/template-canvas.php' );

		$this->assertSame(
			$this->template_part_block( 'header' ) . '<!-- wp:template-slot /-->',
			$_wp_current_template_content,
			'A template with no blocks of its own is still rendered inside the template it names, which is where its header and its footer are.'
		);
	}

	public function test_a_template_part_does_not_stand_in_for_the_template_of_the_same_slug() {
		$this->create_template_part( 'layout', '<!-- wp:paragraph --><p>The part</p><!-- /wp:paragraph --><!-- wp:template-slot /-->' );
		$this->create_template( 'layout', '<!-- wp:paragraph --><p>The template</p><!-- /wp:paragraph --><!-- wp:template-slot /-->' );
		$child_id = $this->create_template(
			'page-404',
			'<!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph -->',
			'layout'
		);

		// Reading the template parts of the site, as the editor does, is what
		// puts a part among the templates read while answering the request.
		get_block_templates( array(), 'wp_template_part' );

		$child = get_block_template( $child_id, 'wp_template' );

		$this->assertStringContainsString(
			'<p>The template</p>',
			gutenberg_resolve_block_template_parents( $child->id, $child->content ),
			'A template part that has the slug of a template, and so its id, is not a template to render one inside.'
		);
	}

	public function test_rest_response_reports_the_template_it_is_rendered_inside() {
		wp_set_current_user( self::$admin_id );
		$this->create_template( 'layout', '<!-- wp:template-slot /-->' );
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

	public function test_rest_response_reports_the_fields_a_request_names_without_the_id() {
		wp_set_current_user( self::$admin_id );
		$this->create_template( 'layout', '<!-- wp:template-slot /-->' );
		$this->create_template( 'page-404', '<!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph -->', 'layout' );

		$request = new WP_REST_Request( 'GET', '/wp/v2/templates/' . get_stylesheet() . '//page-404' );
		$request->set_param( '_fields', 'slug,template' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame(
			'layout',
			$response->get_data()['template'],
			'A request that names the fields it wants is answered with the template this one is rendered inside: core keeps the id in the prepared response for the fields registered on it.'
		);

		$request = new WP_REST_Request( 'GET', '/wp/v2/templates/' . get_stylesheet() . '//layout' );
		$request->set_param( '_fields', 'slug,has_template_slot' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertTrue(
			$response->get_data()['has_template_slot'],
			'A request that leaves out both the id and the content is still answered with whether the template can render one inside.'
		);
	}

	public function test_rest_request_stores_the_template_to_render_inside() {
		wp_set_current_user( self::$admin_id );
		$this->create_template( 'layout', '<!-- wp:template-slot /-->' );
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
		$this->create_template( 'layout', '<!-- wp:template-slot /-->' );
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
		$this->create_template( 'layout', '<!-- wp:template-slot /-->' );
		$this->create_template( 'page-404', '<!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph -->' );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/templates/' . get_stylesheet() . '//layout' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertTrue( $response->get_data()['has_template_slot'] );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/templates/' . get_stylesheet() . '//page-404' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertFalse( $response->get_data()['has_template_slot'] );
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
		$this->assertArrayNotHasKey( 'has_template_slot', $response->get_data() );
	}

	public function test_the_slot_keeps_its_attributes() {
		$this->create_template( 'layout', '<!-- wp:template-slot {"align":"wide"} /-->' );
		$child_id = $this->create_template(
			'page-404',
			'<!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph -->',
			'layout'
		);

		$child = get_block_template( $child_id, 'wp_template' );

		$this->assertSame(
			'<!-- wp:template-slot {"align":"wide"} --><!-- wp:paragraph --><p>Not found</p><!-- /wp:paragraph --><!-- /wp:template-slot -->',
			gutenberg_resolve_block_template_parents( $child->id, $child->content ),
			'The block supports of the slot are what its wrapper is built from, so its attributes have to survive.'
		);
	}

	public function test_the_rendered_slot_carries_its_wrapper() {
		$this->create_template( 'layout', '<!-- wp:template-slot {"align":"wide"} /-->' );
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
		$this->assertStringContainsString( 'wp-block-template-slot', $wrapper );
		$this->assertStringContainsString( 'alignwide', $wrapper, 'The alignment of the slot applies to the template rendered inside.' );
		$this->assertStringContainsString( 'is-layout-', $wrapper, 'The layout of the slot applies to the template rendered inside.' );
	}

	public function test_an_empty_template_renders_no_wrapper() {
		$this->create_template( 'layout', '<!-- wp:template-slot /-->' );
		$child_id = $this->create_template( 'page-404', '', 'layout' );

		$child = get_block_template( $child_id, 'wp_template' );

		$this->assertSame(
			'',
			do_blocks( gutenberg_resolve_block_template_parents( $child->id, $child->content ) ),
			'An empty slot renders nothing.'
		);
	}

	public function test_a_template_rendered_on_its_own_renders_what_its_slot_holds() {
		$rendered = do_blocks( '<!-- wp:template-slot --><!-- wp:paragraph --><p>The latest posts</p><!-- /wp:paragraph --><!-- /wp:template-slot -->' );

		$this->assertStringStartsWith( '<div ', $rendered );
		$this->assertStringContainsString( 'wp-block-template-slot', $rendered );
		$this->assertStringContainsString(
			'>The latest posts</p>',
			$rendered,
			'A template rendered on its own renders what its slot holds.'
		);
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
			'Any slug the request carries is stored; the resolver is what stops at a template it cannot render inside.'
		);
	}
}
