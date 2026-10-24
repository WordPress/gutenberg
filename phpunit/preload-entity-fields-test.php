<?php
/**
 * Tests for the preloading of the entity fields.
 *
 * @package gutenberg
 *
 * @covers ::_wp_add_entity_preload_paths
 * @covers ::_gutenberg_preload_entity_fields
 */
class Tests_Preload_Entity_Fields extends WP_UnitTestCase {

	public function tear_down() {
		unset( $_GET['p'] );
		parent::tear_down();
	}

	/**
	 * The post editor preloads the fields of the edited post type, which the
	 * post summary of its inspector reads, whatever its `p` query arg.
	 */
	public function test_the_post_editor_preloads_the_fields_of_the_post_type() {
		$_GET['p'] = '/wp_template';
		$post      = self::factory()->post->create_and_get( array( 'post_type' => 'page' ) );
		$context   = new WP_Block_Editor_Context(
			array(
				'name' => 'core/edit-post',
				'post' => $post,
			)
		);

		$paths = _gutenberg_preload_entity_fields( array(), $context );

		$this->assertSame( array( '/wp/v2/entity-fields?kind=postType&name=page' ), $paths );
	}

	/**
	 * The preloaded path serves the fields of the post type.
	 */
	public function test_the_preloaded_fields_path_serves_the_fields() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );
		$_GET['p'] = '/page';
		$context   = new WP_Block_Editor_Context( array( 'name' => 'core/edit-site' ) );
		$paths     = _gutenberg_preload_entity_fields( array(), $context );

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
			$expected[] = '/wp/v2/entity-fields?kind=postType&name=' . $post_type;
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

		$this->assertSame( array( '/wp/v2/entity-fields?kind=postType&name=page' ), $paths );
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

	/**
	 * An empty value that is not an array, left by an earlier callback,
	 * becomes an array so the fields are still preloaded.
	 *
	 * @dataProvider data_empty_paths
	 *
	 * @param mixed $paths The paths an earlier callback returned.
	 */
	public function test_empty_paths_that_are_not_an_array_become_an_array( $paths ) {
		$context = new WP_Block_Editor_Context( array( 'post' => self::factory()->post->create_and_get( array( 'post_type' => 'page' ) ) ) );

		$this->assertSame( array( '/wp/v2/entity-fields?kind=postType&name=page' ), _gutenberg_preload_entity_fields( $paths, $context ) );
	}

	/**
	 * Data provider for test_empty_paths_that_are_not_an_array_become_an_array().
	 *
	 * @return array[]
	 */
	public function data_empty_paths() {
		return array(
			'null'         => array( null ),
			'false'        => array( false ),
			'empty string' => array( '' ),
		);
	}

	/**
	 * Paths that are neither an array nor empty, or a context that is not a
	 * block editor context, are returned unchanged.
	 */
	public function test_unexpected_arguments_are_returned_unchanged() {
		$context = new WP_Block_Editor_Context( array( 'post' => self::factory()->post->create_and_get( array( 'post_type' => 'page' ) ) ) );
		$object  = new stdClass();

		$this->assertSame( 'not paths', _gutenberg_preload_entity_fields( 'not paths', $context ) );
		$this->assertSame( $object, _gutenberg_preload_entity_fields( $object, $context ) );
		$this->assertSame( array( '/wp/v2/types' ), _gutenberg_preload_entity_fields( array( '/wp/v2/types' ) ) );
		$this->assertSame( array(), _gutenberg_preload_entity_fields( null ) );
	}
}
