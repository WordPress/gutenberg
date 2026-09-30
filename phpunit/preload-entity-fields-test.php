<?php
/**
 * Tests for the preloading of the entity fields.
 *
 * @package gutenberg
 *
 * @covers ::_gutenberg_get_site_editor_screen_post_types
 * @covers ::_gutenberg_preload_entity_fields
 */
class Tests_Preload_Entity_Fields extends WP_UnitTestCase {

	/**
	 * The post editor preloads the fields of the edited post type, with the
	 * path the `getFieldsConfig` core data resolver requests.
	 */
	public function test_the_post_editor_preloads_the_fields_of_the_post_type() {
		$post    = self::factory()->post->create_and_get( array( 'post_type' => 'page' ) );
		$context = new WP_Block_Editor_Context( array( 'post' => $post ) );

		$paths = apply_filters( 'block_editor_rest_api_preload_paths', array(), $context );

		$this->assertContains( '/wp/v2/fields?kind=postType&name=page', $paths );
	}

	/**
	 * The preloaded path serves the fields of the post type.
	 */
	public function test_the_preloaded_fields_path_serves_the_fields() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );
		$post    = self::factory()->post->create_and_get( array( 'post_type' => 'page' ) );
		$context = new WP_Block_Editor_Context( array( 'post' => $post ) );
		$paths   = _gutenberg_preload_entity_fields( array(), $context );

		$preloaded = array_reduce( $paths, 'rest_preload_api_request', array() );

		$this->assertSame( 'page', $preloaded[ $paths[0] ]['body']['name'] );
		$this->assertContains( 'author', wp_list_pluck( $preloaded[ $paths[0] ]['body']['fields'], 'id' ) );
	}

	/**
	 * The site editor preloads the fields of the post types its screen lists,
	 * from the `p` query arg.
	 *
	 * @dataProvider data_site_editor_screens
	 *
	 * @param string   $path       The `p` query arg.
	 * @param string[] $post_types The post types whose fields are preloaded.
	 */
	public function test_the_site_editor_preloads_the_fields_of_its_screen( $path, $post_types ) {
		$_GET['p'] = $path;
		$context   = new WP_Block_Editor_Context( array( 'name' => 'core/edit-site' ) );

		$paths = _gutenberg_preload_entity_fields( array(), $context );
		unset( $_GET['p'] );

		$expected = array();
		foreach ( $post_types as $post_type ) {
			$expected[] = '/wp/v2/fields?kind=postType&name=' . $post_type;
		}
		$this->assertSame( $expected, $paths );
	}

	/**
	 * Data provider for test_the_site_editor_preloads_the_fields_of_its_screen().
	 *
	 * @return array[]
	 */
	public function data_site_editor_screens() {
		return array(
			'pages'         => array( '/page', array( 'page' ) ),
			'page'          => array( '/page/12', array( 'page' ) ),
			'templates'     => array( '/template', array( 'wp_template' ) ),
			'template'      => array( '/wp_template/emptytheme//index', array( 'wp_template' ) ),
			'patterns'      => array( '/pattern', array( 'wp_block', 'wp_template_part' ) ),
			'pattern'       => array( '/wp_block/12', array( 'wp_block' ) ),
			'template part' => array( '/wp_template_part/emptytheme//header', array( 'wp_template_part' ) ),
			'root'          => array( '/', array() ),
			'styles'        => array( '/styles', array() ),
			'navigation'    => array( '/navigation', array() ),
		);
	}

	/**
	 * The site editor preloads the fields of the edited post, once, next to
	 * those of its screen.
	 */
	public function test_the_site_editor_preloads_the_fields_of_the_edited_post() {
		$post      = self::factory()->post->create_and_get( array( 'post_type' => 'page' ) );
		$_GET['p'] = '/page';
		$context   = new WP_Block_Editor_Context(
			array(
				'name' => 'core/edit-site',
				'post' => $post,
			)
		);

		$paths = _gutenberg_preload_entity_fields( array(), $context );
		unset( $_GET['p'] );

		$this->assertSame( array( '/wp/v2/fields?kind=postType&name=page' ), $paths );
	}

	/**
	 * Other editors, a post editor context without a post, and a site editor
	 * screen that lists no post fields are left untouched.
	 */
	public function test_other_editors_do_not_preload_the_fields() {
		$site_editor = new WP_Block_Editor_Context( array( 'name' => 'core/edit-site' ) );
		$no_post     = new WP_Block_Editor_Context( array( 'name' => 'core/edit-post' ) );
		$widgets     = new WP_Block_Editor_Context( array( 'name' => 'core/edit-widgets' ) );

		$this->assertSame( array(), _gutenberg_preload_entity_fields( array(), $site_editor ) );
		$this->assertSame( array(), _gutenberg_preload_entity_fields( array(), $no_post ) );
		$this->assertSame( array(), _gutenberg_preload_entity_fields( array(), $widgets ) );
	}
}
