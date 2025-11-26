<?php
/**
 * Tests for pattern block resolution in patterns via REST API.
 *
 * @package gutenberg
 *
 * @group rest-api
 * @covers Gutenberg_REST_Block_Patterns_Controller_7_0::prepare_item_for_response
 */
class Tests_Resolve_Patterns_In_Patterns extends WP_Test_REST_Controller_Testcase {

	/**
	 * @var int
	 */
	protected static $admin_id;

	/**
	 * Set up before class.
	 *
	 * @param WP_UnitTest_Factory $factory Helper that lets us create fake data.
	 */
	public static function wpSetupBeforeClass( $factory ) {
		self::$admin_id = $factory->user->create(
			array(
				'role' => 'administrator',
			)
		);
	}

	/**
	 * Set up before each test.
	 */
	public function set_up() {
		parent::set_up();

		// Register test patterns.
		register_block_pattern(
			'test/single-block-pattern-1',
			array(
				'title'       => 'Single Block Pattern 1',
				'content'     => '<!-- wp:paragraph -->Single block pattern 1 content<!-- /wp:paragraph -->',
				'description' => 'A single block pattern 1.',
				'categories'  => array( 'text' ),
			)
		);

		register_block_pattern(
			'test/single-block-pattern-2',
			array(
				'title'       => 'Single Block Pattern 2',
				'content'     => '<!-- wp:paragraph -->Single block pattern 2 content<!-- /wp:paragraph -->',
				'description' => 'A single block pattern 2.',
			)
		);

		register_block_pattern(
			'test/sibling-patterns',
			array(
				'title'       => 'Sibling Patterns Pattern',
				'content'     => '<!-- wp:pattern {"slug":"test/single-block-pattern-1"} /--><!-- wp:pattern {"slug":"test/single-block-pattern-2"} /-->',
				'description' => 'A sibling patterns pattern with two patterns at the root level.',
				'categories'  => array( 'text' ),
			)
		);
	}

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		unregister_block_pattern( 'test/sibling-patterns' );
		unregister_block_pattern( 'test/single-block-pattern-1' );
		unregister_block_pattern( 'test/single-block-pattern-2' );

		parent::tear_down();
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_register_routes() {
		// We are testing prepare_item_for_response, not controller routes.
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_context_param() {
		// We are testing prepare_item_for_response, not controller context.
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_get_items() {
		// We are testing prepare_item_for_response, not controller get_items().
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_get_item() {
		// We are testing prepare_item_for_response, not controller get_item().
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_create_item() {
		// We are testing prepare_item_for_response, not controller create_item().
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_update_item() {
		// We are testing prepare_item_for_response, not controller update_item().
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_delete_item() {
		// We are testing prepare_item_for_response, not controller delete_item().
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_prepare_item() {
		// We are testing prepare_item_for_response, not controller prepare_item().
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_get_item_schema() {
		// We are testing prepare_item_for_response, not controller schema.
	}

	/**
	 * Test that sibling patterns are fully resolved when fetching patterns via REST API.
	 */
	public function test_get_patterns_resolves_sibling_patterns() {
		wp_set_current_user( self::$admin_id );

		// Get patterns via REST API.
		$request  = new WP_REST_Request( 'GET', '/wp/v2/block-patterns/patterns' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertIsArray( $data );

		// Find the nested pattern.

		$nested_pattern = null;
		foreach ( $data as $pattern ) {
			if ( isset( $pattern['name'] ) && 'test/sibling-patterns' === $pattern['name'] ) {
				$nested_pattern = $pattern;
				break;
			}
		}

		$this->assertSame(
			'<!-- wp:paragraph {"metadata":{"patternName":"test/single-block-pattern-1","name":"Single Block Pattern 1","description":"A single block pattern 1.","categories":["text"]}} -->Single block pattern 1 content<!-- /wp:paragraph --><!-- wp:paragraph {"metadata":{"patternName":"test/single-block-pattern-2","name":"Single Block Pattern 2","description":"A single block pattern 2."}} -->Single block pattern 2 content<!-- /wp:paragraph -->',
			$nested_pattern['content'],
			'Sibling patterns pattern should contain the two resolved patterns.'
		);
	}
}
