<?php
/**
 * Tests for the HTTP long-polling transport.
 *
 * @package Gutenberg
 *
 * @group collaboration
 */
class Tests_Collaboration_WpHttpLongPollingSyncServer extends WP_Test_REST_TestCase {
	/**
	 * Editor user ID.
	 *
	 * @var int
	 */
	protected static $editor_id;

	/**
	 * Post ID used for room targets.
	 *
	 * @var int
	 */
	protected static $post_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$editor_id = $factory->user->create( array( 'role' => 'editor' ) );
		self::$post_id   = $factory->post->create(
			array(
				'post_author'  => self::$editor_id,
				'post_content' => "<!-- wp:paragraph -->\n<p>Hello</p>\n<!-- /wp:paragraph -->",
			)
		);
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$editor_id );
		wp_delete_post( self::$post_id, true );
	}

	public function set_up() {
		parent::set_up();
		wp_set_current_user( self::$editor_id );
		update_option( 'wp_sync_engine', 'intent-log' );
		// Keep held requests short so the suite stays fast.
		add_filter( 'wp_sync_long_poll_max_wait_ms', static fn() => 60 );

		global $wp_rest_server;
		$wp_rest_server = new Spy_REST_Server();
		do_action( 'rest_api_init', $wp_rest_server );
	}

	public function tear_down() {
		delete_option( 'wp_sync_engine' );
		global $wp_rest_server;
		$wp_rest_server = null;
		parent::tear_down();
	}

	private function room(): string {
		return 'postType/post:' . self::$post_id;
	}

	/**
	 * Dispatches one long-poll request and returns the room response.
	 *
	 * @param array $updates   Typed updates.
	 * @param array $overrides Room overrides.
	 * @return array Room response.
	 */
	private function long_poll( array $updates = array(), array $overrides = array() ) {
		$room    = array_merge(
			array(
				'after'     => 0,
				'awareness' => array( 'user' => 'test' ),
				'client_id' => 101,
				'room'      => $this->room(),
				'updates'   => $updates,
			),
			$overrides
		);
		$request = new WP_REST_Request( 'POST', '/wp-sync/v1/long-poll' );
		$request->set_body_params( array( 'rooms' => array( $room ) ) );
		$response = rest_get_server()->dispatch( $request );
		return $response->get_data()['rooms'][0];
	}

	public function test_long_poll_route_is_registered() {
		$routes = rest_get_server()->get_routes();
		$this->assertArrayHasKey( '/wp-sync/v1/long-poll', $routes );
	}

	public function test_the_transport_is_announced_and_selectable() {
		add_filter( 'wp_collaboration_transport', static fn() => 'http-long-polling' );
		$registry = wp_get_collaboration_transport_registry();

		$this->assertSame( 'http-long-polling', $registry->get_active_slug() );
		$this->assertContains( 'http-long-polling', $registry->get_announced_slugs() );
		// Active is announced first.
		$this->assertSame( 'http-long-polling', $registry->get_announced_slugs()[0] );
	}

	public function test_first_poll_returns_genesis_immediately() {
		// A caught-up-from-zero client is NOT caught up (genesis is waiting),
		// so this returns at once without exhausting the wait budget.
		$started  = microtime( true );
		$response = $this->long_poll();
		$elapsed  = microtime( true ) - $started;

		$this->assertSame(
			WP_Intent_Log_Engine::UPDATE_TYPE_SNAPSHOT,
			$response['updates'][0]['type']
		);
		$this->assertLessThan( 0.5, $elapsed, 'genesis must not be held' );
	}

	public function test_a_request_carrying_updates_is_answered_immediately() {
		$insert  = array(
			'type' => WP_Intent_Log_Engine::UPDATE_TYPE_INTENT,
			'data' => wp_json_encode(
				array(
					'intentId' => 'lp-1',
					'baseSeq'  => 0,
					'txnId'    => null,
					'type'     => 'insert_text',
					'payload'  => array(
						'syncId' => WP_Intent_Log_Planner::genesis_sync_id( self::$post_id, 0, array( 0 ) ),
						'field'  => 'content',
						'offset' => 0,
						'text'   => 'x',
					),
				)
			),
		);
		$started  = microtime( true );
		$response = $this->long_poll( array( $insert ) );
		$elapsed  = microtime( true ) - $started;

		$this->assertSame( 'applied', $response['dispositions'][0]['status'] );
		$this->assertLessThan( 0.5, $elapsed, 'a sender must never be held' );
	}

	public function test_a_caught_up_client_is_held_until_the_budget_elapses() {
		// Catch the client up first.
		$primed = $this->long_poll();
		$cursor = (int) $primed['end_cursor'];

		// A now-caught-up empty poll has nothing to deliver: it is held for
		// roughly the (tiny) wait budget, then returns empty.
		$started  = microtime( true );
		$response = $this->long_poll( array(), array( 'after' => $cursor ) );
		$elapsed  = microtime( true ) - $started;

		$this->assertSame( array(), $response['updates'] );
		// Held at least a poll interval-ish, but bounded by the 60ms budget.
		$this->assertGreaterThan( 0.02, $elapsed, 'a caught-up client should be held' );
		$this->assertLessThan( 1.0, $elapsed, 'the wait budget bounds the hold' );
	}
}
