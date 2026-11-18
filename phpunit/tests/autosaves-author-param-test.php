<?php
/**
 * Tests for the `author` parameter on autosave collection routes.
 *
 * @package gutenberg
 *
 * @group restapi
 */
class Tests_Autosaves_Author_Param extends WP_UnitTestCase {

	protected static int $post_id;

	/**
	 * @var list<int>
	 */
	protected static array $editor_ids = array();

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ): void {
		for ( $i = 0; $i < 3; $i++ ) {
			$user_id = $factory->user->create( array( 'role' => 'editor' ) );
			self::assertIsInt( $user_id );
			self::$editor_ids[] = $user_id;
		}

		$post_id = $factory->post->create( array( 'post_author' => self::$editor_ids[0] ) );
		self::assertIsInt( $post_id );
		self::$post_id = $post_id;
	}

	public static function wpTearDownAfterClass(): void {
		wp_delete_post( self::$post_id, true );

		foreach ( self::$editor_ids as $user_id ) {
			self::delete_user( $user_id );
		}
	}

	/**
	 * Creates an autosave on the shared post for each editor.
	 *
	 * @return array<int, int> Autosave ID keyed by the ID of its author.
	 */
	private function create_autosaves(): array {
		$autosave_ids = array();

		foreach ( self::$editor_ids as $i => $user_id ) {
			wp_set_current_user( $user_id );
			$autosave_id = wp_create_post_autosave(
				array(
					'post_content' => "Autosave content {$i}",
					'post_ID'      => self::$post_id,
					'post_type'    => 'post',
				)
			);
			$this->assertIsInt( $autosave_id );

			$autosave_ids[ $user_id ] = $autosave_id;
		}

		return $autosave_ids;
	}

	/**
	 * Requests the autosave collection of the shared post.
	 *
	 * @param mixed $author Optional. Value of the `author` parameter.
	 * @return WP_REST_Response The response.
	 */
	private function get_autosaves( $author = null ): WP_REST_Response {
		wp_set_current_user( self::$editor_ids[0] );

		$request = new WP_REST_Request( 'GET', '/wp/v2/posts/' . self::$post_id . '/autosaves' );
		if ( null !== $author ) {
			$request->set_param( 'author', $author );
		}

		return rest_get_server()->dispatch( $request );
	}

	/**
	 * Returns one field from each item of a collection response.
	 *
	 * @param WP_REST_Response $response Collection response.
	 * @param string           $field    Field to collect.
	 * @return list<mixed> The field's value for each item, in response order.
	 */
	private function pluck( WP_REST_Response $response, string $field = 'id' ): array {
		$data = $response->get_data();
		$this->assertIsArray( $data );

		return array_values( wp_list_pluck( $data, $field ) );
	}

	public function test_author_param_is_registered(): void {
		$routes = rest_get_server()->get_routes();
		$route  = '/wp/v2/posts/(?P<id>[\d]+)/autosaves';

		$this->assertArrayHasKey( $route, $routes );
		$this->assertArrayHasKey( 'author', $routes[ $route ][0]['args'] );
	}

	public function test_returns_every_author_without_the_param(): void {
		$autosave_ids = $this->create_autosaves();

		$response = $this->get_autosaves();

		$this->assertSame( 200, $response->get_status() );
		$this->assertSameSets( array_values( $autosave_ids ), $this->pluck( $response ) );
	}

	public function test_returns_only_the_requested_author(): void {
		$autosave_ids = $this->create_autosaves();
		$author_id    = self::$editor_ids[1];

		$response = $this->get_autosaves( $author_id );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( array( $autosave_ids[ $author_id ] ), $this->pluck( $response ) );
		$this->assertSame( array( $author_id ), $this->pluck( $response, 'author' ) );
	}

	public function test_returns_several_requested_authors(): void {
		$autosave_ids = $this->create_autosaves();
		$author_ids   = array( self::$editor_ids[0], self::$editor_ids[2] );

		$response = $this->get_autosaves( $author_ids );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSameSets(
			array( $autosave_ids[ $author_ids[0] ], $autosave_ids[ $author_ids[1] ] ),
			$this->pluck( $response )
		);
	}

	public function test_returns_nothing_for_an_author_without_an_autosave(): void {
		$this->create_autosaves();
		$other_user_id = self::factory()->user->create( array( 'role' => 'editor' ) );

		$response = $this->get_autosaves( $other_user_id );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( array(), $response->get_data() );
	}

	/**
	 * A newer revision must not displace the author's autosave.
	 */
	public function test_returns_the_autosave_past_newer_revisions(): void {
		$autosave_ids = $this->create_autosaves();
		$author_id    = self::$editor_ids[1];

		wp_set_current_user( self::$editor_ids[0] );
		wp_update_post(
			array(
				'ID'           => self::$post_id,
				'post_content' => 'A revision made after every autosave.',
			)
		);

		$response = $this->get_autosaves( $author_id );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( array( $autosave_ids[ $author_id ] ), $this->pluck( $response ) );
	}

	/**
	 * A controller that overrides `get_items()` must keep answering requests.
	 */
	public function test_leaves_a_controller_with_its_own_get_items_alone(): void {
		register_post_type(
			'autosave_cpt',
			array(
				'show_in_rest'                   => true,
				'autosave_rest_controller_class' => Autosaves_Author_Param_Test_Controller::class,
			)
		);
		$GLOBALS['wp_rest_server'] = null;

		$post_id = self::factory()->post->create(
			array(
				'post_type'   => 'autosave_cpt',
				'post_author' => self::$editor_ids[0],
			)
		);
		$this->assertIsInt( $post_id );
		wp_set_current_user( self::$editor_ids[0] );

		$request = new WP_REST_Request( 'GET', '/wp/v2/autosave_cpt/' . $post_id . '/autosaves' );
		$request->set_param( 'author', self::$editor_ids[0] );
		$response = rest_get_server()->dispatch( $request );

		unregister_post_type( 'autosave_cpt' );
		$GLOBALS['wp_rest_server'] = null;

		$data = $response->get_data();
		$this->assertIsArray( $data );
		$this->assertArrayHasKey( 'custom', $data );
	}

	/**
	 * @dataProvider data_invalid_author
	 *
	 * @param mixed $author Value passed as the author parameter.
	 */
	public function test_rejects_an_invalid_author( $author ): void {
		$response = $this->get_autosaves( $author );

		$data = $response->get_data();

		$this->assertSame( 400, $response->get_status() );
		$this->assertIsArray( $data );
		$this->assertSame( 'rest_invalid_param', $data['code'] );
	}

	/**
	 * Data provider for test_rejects_an_invalid_author().
	 *
	 * @return array<string, array<mixed>>
	 */
	public function data_invalid_author(): array {
		return array(
			'zero'               => array( 0 ),
			'negative'           => array( -1 ),
			'not a number'       => array( 'abc' ),
			'negative in a list' => array( array( 1, -1 ) ),
		);
	}
}

/**
 * Autosaves controller that answers collection requests itself.
 */
// phpcs:ignore Generic.Files.OneObjectStructurePerFile.MultipleFound
class Autosaves_Author_Param_Test_Controller extends WP_REST_Autosaves_Controller {

	/**
	 * @param WP_REST_Request<array<string, mixed>> $request Full details about the request.
	 * @return WP_REST_Response The response.
	 */
	public function get_items( $request ) {
		return new WP_REST_Response( array( 'custom' => $request['author'] ) );
	}
}
