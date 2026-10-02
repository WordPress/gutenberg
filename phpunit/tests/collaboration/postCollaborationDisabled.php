<?php
/**
 * Tests disabling real-time collaboration for individual posts.
 *
 * @package gutenberg
 * @subpackage Collaboration
 *
 * @group collaboration
 */
class Tests_Collaboration_PostCollaborationDisabled extends WP_UnitTestCase {

	private static int $admin_id;
	private static int $draft_id;
	private static int $published_id;

	/**
	 * Arguments passed to the per-post filter.
	 *
	 * @var array
	 */
	private array $filter_args = array();

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$admin_id     = $factory->user->create( array( 'role' => 'administrator' ) );
		self::$draft_id     = $factory->post->create( array( 'post_status' => 'draft' ) );
		self::$published_id = $factory->post->create( array( 'post_status' => 'publish' ) );
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
		wp_delete_post( self::$draft_id, true );
		wp_delete_post( self::$published_id, true );
	}

	public function set_up() {
		global $wp_rest_server;

		parent::set_up();

		// Fire `rest_api_init` again so the REST field is registered for this test.
		$wp_rest_server = new Spy_REST_Server();
		do_action( 'rest_api_init', $wp_rest_server );
	}

	public function tear_down() {
		global $wp_rest_server;

		$wp_rest_server    = null;
		$this->filter_args = array();

		parent::tear_down();
	}

	public function test_collaboration_is_enabled_for_posts_by_default() {
		$this->assertFalse( wp_is_post_collaboration_disabled( self::$draft_id ) );
		$this->assertFalse( wp_is_post_collaboration_disabled( get_post( self::$published_id ) ) );
	}

	public function test_collaboration_is_disabled_for_missing_posts() {
		$this->assertTrue( wp_is_post_collaboration_disabled( PHP_INT_MAX ) );
	}

	public function test_filter_receives_post_object() {
		add_filter( 'wp_is_post_collaboration_disabled', array( $this, 'record_filter_args' ), 10, 2 );

		wp_is_post_collaboration_disabled( self::$draft_id );

		$this->assertFalse( $this->filter_args[0] );
		$this->assertInstanceOf( WP_Post::class, $this->filter_args[1] );
		$this->assertSame( self::$draft_id, $this->filter_args[1]->ID );
	}

	public function test_filter_can_disable_collaboration_by_post_status() {
		add_filter( 'wp_is_post_collaboration_disabled', array( $this, 'disable_published_posts' ), 10, 2 );

		$this->assertFalse( wp_is_post_collaboration_disabled( self::$draft_id ) );
		$this->assertTrue( wp_is_post_collaboration_disabled( self::$published_id ) );
	}

	public function test_disabled_post_type_skips_post_filter() {
		add_filter( 'wp_is_post_type_collaboration_disabled', '__return_true' );
		add_filter( 'wp_is_post_collaboration_disabled', array( $this, 'record_filter_args' ), 10, 2 );

		$this->assertTrue( wp_is_post_collaboration_disabled( self::$draft_id ) );
		$this->assertSame( array(), $this->filter_args );
	}

	public function test_rest_field_reflects_post_filter_in_edit_context() {
		wp_set_current_user( self::$admin_id );
		add_filter( 'wp_is_post_collaboration_disabled', array( $this, 'disable_published_posts' ), 10, 2 );

		$this->assertFalse( $this->get_rest_field( self::$draft_id, 'edit' ) );
		$this->assertTrue( $this->get_rest_field( self::$published_id, 'edit' ) );
	}

	public function test_rest_field_is_omitted_in_view_context() {
		$response = rest_do_request( new WP_REST_Request( 'GET', '/wp/v2/posts/' . self::$published_id ) );

		$this->assertArrayNotHasKey( 'collaboration_disabled', $response->get_data() );
	}

	public function test_post_list_row_actions_are_unchanged_for_disabled_post() {
		add_filter( 'wp_is_post_collaboration_disabled', array( $this, 'disable_published_posts' ), 10, 2 );

		$actions = array(
			'edit' => '<a href="#">Edit</a>',
		);

		$this->assertSame(
			$actions,
			gutenberg_post_list_collaboration_row_actions( $actions, get_post( self::$published_id ) )
		);
	}

	public function record_filter_args( $disabled, $post ) {
		$this->filter_args = array( $disabled, $post );
		return $disabled;
	}

	public function disable_published_posts( $disabled, $post ) {
		return 'publish' === $post->post_status ? true : $disabled;
	}

	private function get_rest_field( $post_id, $context ) {
		$request = new WP_REST_Request( 'GET', '/wp/v2/posts/' . $post_id );
		$request->set_param( 'context', $context );

		$data = rest_do_request( $request )->get_data();

		return $data['collaboration_disabled'] ?? null;
	}
}
