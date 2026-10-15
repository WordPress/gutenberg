<?php
/**
 * Tests for the preloading of the entity actions.
 *
 * @package gutenberg
 *
 * @covers ::_gutenberg_get_post_type_preload_paths
 * @covers ::_gutenberg_get_post_type_actions_preload_paths
 * @covers ::_gutenberg_preload_entity_actions
 */
class Tests_Preload_Entity_Actions extends WP_UnitTestCase {

	public function tear_down() {
		unset( $_GET['p'] );
		parent::tear_down();
	}

	/**
	 * The post editor preloads the actions of the edited post type, with the
	 * path the `getActionsConfig` core data resolver requests.
	 */
	public function test_the_post_editor_preloads_the_actions_of_the_post_type() {
		$post    = self::factory()->post->create_and_get( array( 'post_type' => 'page' ) );
		$context = new WP_Block_Editor_Context(
			array(
				'name' => 'core/edit-post',
				'post' => $post,
			)
		);

		$this->assertSame(
			array( '/wp/v2/entity-actions?kind=postType&name=page' ),
			_gutenberg_preload_entity_actions( array(), $context )
		);
	}

	/**
	 * The preloaded path serves the actions of the post type.
	 */
	public function test_the_preloaded_actions_path_serves_the_actions() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );
		$post    = self::factory()->post->create_and_get( array( 'post_type' => 'page' ) );
		$context = new WP_Block_Editor_Context(
			array(
				'name' => 'core/edit-post',
				'post' => $post,
			)
		);
		$paths   = _gutenberg_preload_entity_actions( array(), $context );

		$preloaded = array_reduce( $paths, 'rest_preload_api_request', array() );

		$this->assertSame( 'page', $preloaded[ $paths[0] ]['body']['name'] );
		$this->assertContains( 'rename-post', wp_list_pluck( $preloaded[ $paths[0] ]['body']['actions'], 'id' ) );
	}

	/**
	 * The site editor preloads the actions of the edited post and of the post
	 * types its screen lists, from the `p` query arg.
	 */
	public function test_the_site_editor_preloads_the_actions_of_its_screen_and_the_edited_post() {
		$_GET['p'] = '/pattern';
		$post      = self::factory()->post->create_and_get( array( 'post_type' => 'page' ) );
		$context   = new WP_Block_Editor_Context(
			array(
				'name' => 'core/edit-site',
				'post' => $post,
			)
		);

		$this->assertSame(
			array(
				'/wp/v2/entity-actions?kind=postType&name=page',
				'/wp/v2/entity-actions?kind=postType&name=wp_block',
				'/wp/v2/entity-actions?kind=postType&name=wp_template_part',
			),
			_gutenberg_preload_entity_actions( array(), $context )
		);
	}

	/**
	 * The post editor preloads nothing without an edited post, and the other
	 * editors preload no action.
	 */
	public function test_other_editors_do_not_preload_the_actions() {
		$_GET['p'] = '/page';

		$this->assertSame( array(), _gutenberg_preload_entity_actions( array(), new WP_Block_Editor_Context( array( 'name' => 'core/edit-post' ) ) ) );
		$this->assertSame( array( 'kept' ), _gutenberg_preload_entity_actions( array( 'kept' ), new WP_Block_Editor_Context( array( 'name' => 'core/edit-widgets' ) ) ) );
	}

	/**
	 * A post type that is not registered gets no path.
	 */
	public function test_an_unknown_post_type_gets_no_path() {
		$this->assertSame(
			array( '/wp/v2/entity-actions?kind=postType&name=post' ),
			_gutenberg_get_post_type_actions_preload_paths( array( 'post', 'unknown', 'post' ) )
		);
	}
}
