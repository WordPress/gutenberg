<?php
/**
 * Tests for the preloading of the entity actions in the site editor.
 *
 * @package gutenberg
 *
 * @covers ::_gutenberg_preload_site_editor_entity_actions
 */
class Tests_Preload_Site_Editor_Entity_Actions extends WP_UnitTestCase {

	public function tear_down() {
		unset( $_GET['p'] );
		parent::tear_down();
	}

	/**
	 * The preloading is hooked to the preload paths of the block editor.
	 */
	public function test_the_actions_are_preloaded_on_the_block_editor_preload_paths() {
		$this->assertSame( 10, has_filter( 'block_editor_rest_api_preload_paths', '_gutenberg_preload_site_editor_entity_actions' ) );
	}

	/**
	 * The site editor preloads the actions of the post types its screen lists,
	 * from the `p` query arg.
	 *
	 * @dataProvider data_site_editor_screens
	 *
	 * @param string   $path       The `p` query arg.
	 * @param string[] $post_types The post types whose actions are preloaded.
	 */
	public function test_the_site_editor_preloads_the_actions_of_its_screen( $path, $post_types ) {
		$_GET['p'] = $path;
		$context   = new WP_Block_Editor_Context( array( 'name' => 'core/edit-site' ) );

		$expected = array();
		foreach ( $post_types as $post_type ) {
			$expected[] = '/wp/v2/entity-actions?kind=postType&name=' . $post_type;
		}
		$this->assertSame( $expected, _gutenberg_preload_site_editor_entity_actions( array(), $context ) );
	}

	/**
	 * Data provider for test_the_site_editor_preloads_the_actions_of_its_screen().
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
	 * The site editor preloads the actions of the edited post, once, next to
	 * those of its screen.
	 */
	public function test_the_site_editor_preloads_the_actions_of_the_edited_post() {
		$_GET['p'] = '/page';
		$context   = new WP_Block_Editor_Context(
			array(
				'name' => 'core/edit-site',
				'post' => self::factory()->post->create_and_get( array( 'post_type' => 'page' ) ),
			)
		);

		$this->assertSame(
			array( '/wp/v2/entity-actions?kind=postType&name=page' ),
			_gutenberg_preload_site_editor_entity_actions( array(), $context )
		);
	}

	/**
	 * A path that is already preloaded, as WordPress does once it preloads the
	 * actions of the site editor too, is not added again.
	 */
	public function test_the_paths_already_preloaded_are_not_added_again() {
		$_GET['p'] = '/pattern';
		$context   = new WP_Block_Editor_Context( array( 'name' => 'core/edit-site' ) );

		$this->assertSame(
			array(
				'/wp/v2/entity-actions?kind=postType&name=wp_block',
				'/wp/v2/entity-actions?kind=postType&name=wp_template_part',
			),
			_gutenberg_preload_site_editor_entity_actions( array( '/wp/v2/entity-actions?kind=postType&name=wp_block' ), $context )
		);
	}

	/**
	 * The preloaded path serves the actions of the post type.
	 */
	public function test_the_preloaded_actions_path_serves_the_actions() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		$_GET['p'] = '/page';
		$context   = new WP_Block_Editor_Context( array( 'name' => 'core/edit-site' ) );

		$paths     = _gutenberg_preload_site_editor_entity_actions( array(), $context );
		$preloaded = array_reduce( $paths, 'rest_preload_api_request', array() );

		$this->assertContains( 'move-to-trash', array_column( $preloaded[ $paths[0] ]['body']['actions'], 'id' ) );
	}

	/**
	 * The other editors are left untouched: the post editor actions are
	 * preloaded by `_wp_preload_entity_actions()`.
	 */
	public function test_other_editors_are_left_untouched() {
		$_GET['p'] = '/page';
		$post      = self::factory()->post->create_and_get( array( 'post_type' => 'page' ) );
		$post_ed   = new WP_Block_Editor_Context(
			array(
				'name' => 'core/edit-post',
				'post' => $post,
			)
		);
		$widgets   = new WP_Block_Editor_Context( array( 'name' => 'core/edit-widgets' ) );

		$this->assertSame( array( '/wp/v2/types' ), _gutenberg_preload_site_editor_entity_actions( array( '/wp/v2/types' ), $post_ed ) );
		$this->assertSame( array( '/wp/v2/types' ), _gutenberg_preload_site_editor_entity_actions( array( '/wp/v2/types' ), $widgets ) );
	}
}
