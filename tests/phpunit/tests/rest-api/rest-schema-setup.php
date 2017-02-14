<?php
/**
 * Unit tests covering schema initialization.
 *
 * Also generates the fixture data used by the wp-api.js QUnit tests.
 *
 * @package WordPress
 * @subpackage REST API
 */

/**
 * @group restapi
 * @group restapi-jsclient
 */
class WP_Test_REST_Schema_Initialization extends WP_Test_REST_TestCase {

	public function setUp() {
		parent::setUp();

		/** @var WP_REST_Server $wp_rest_server */
		global $wp_rest_server;
		$this->server = $wp_rest_server = new Spy_REST_Server;
		do_action( 'rest_api_init' );
	}

	public function tearDown() {
		parent::tearDown();
		remove_filter( 'rest_url', array( $this, 'test_rest_url_for_leading_slash' ), 10, 2 );
		/** @var WP_REST_Server $wp_rest_server */
		global $wp_rest_server;
		$wp_rest_server = null;
	}

	public function test_expected_routes_in_schema() {
		$routes = $this->server->get_routes();

		$this->assertTrue( is_array( $routes ), '`get_routes` should return an array.' );
		$this->assertTrue( ! empty( $routes ), 'Routes should not be empty.' );

		$expected_routes = array(
			'/',
			'/oembed/1.0',
			'/oembed/1.0/embed',
			'/wp/v2',
			'/wp/v2/posts',
			'/wp/v2/posts/(?P<id>[\\d]+)',
			'/wp/v2/posts/(?P<parent>[\\d]+)/revisions',
			'/wp/v2/posts/(?P<parent>[\\d]+)/revisions/(?P<id>[\\d]+)',
			'/wp/v2/pages',
			'/wp/v2/pages/(?P<id>[\\d]+)',
			'/wp/v2/pages/(?P<parent>[\\d]+)/revisions',
			'/wp/v2/pages/(?P<parent>[\\d]+)/revisions/(?P<id>[\\d]+)',
			'/wp/v2/media',
			'/wp/v2/media/(?P<id>[\\d]+)',
			'/wp/v2/types',
			'/wp/v2/types/(?P<type>[\\w-]+)',
			'/wp/v2/statuses',
			'/wp/v2/statuses/(?P<status>[\\w-]+)',
			'/wp/v2/taxonomies',
			'/wp/v2/taxonomies/(?P<taxonomy>[\\w-]+)',
			'/wp/v2/categories',
			'/wp/v2/categories/(?P<id>[\\d]+)',
			'/wp/v2/tags',
			'/wp/v2/tags/(?P<id>[\\d]+)',
			'/wp/v2/users',
			'/wp/v2/users/(?P<id>[\\d]+)',
			'/wp/v2/users/me',
			'/wp/v2/comments',
			'/wp/v2/comments/(?P<id>[\\d]+)',
			'/wp/v2/settings',
		);

		$this->assertEquals( $expected_routes, array_keys( $routes ) );
	}

	public function test_build_wp_api_client_fixtures() {
		// Set up for testing the individual endpoints.
		// Set a current admin user.
		$administrator = $this->factory->user->create( array(
			'role' => 'administrator',
		) );
		wp_set_current_user( $administrator );

		// Set up data for endpoints.
		$post_id  = $this->factory->post->create();
		$page_id  = $this->factory->post->create( array( 'post_type' => 'page' ) );
		$tag_id   = $this->factory->tag->create( array( 'name' => 'test' ) );
		$media_id = $this->factory->attachment->create_object( '/tmp/canola.jpg', 0, array(
			'post_mime_type' => 'image/jpeg',
			'post_excerpt'   => 'A sample caption',
		) );
		wp_update_post( array( 'post_content' => 'Updated content.', 'ID' => $post_id ) );
		wp_update_post( array( 'post_content' => 'Updated content.', 'ID' => $page_id ) );
		$comment_id = $this->factory->comment->create( array(
			'comment_approved' => 1,
			'comment_post_ID'  => $post_id,
			'user_id'          => 0,
		) );

		// Generate route data for subsequent QUnit tests.
		$routes_to_generate_data = array(
			array(
				'route' => '/',
				'name'  => 'Schema',
			),
			array(
				'route' => '/oembed/1.0',
				'name'  => 'oembed',
			),
			array(
				'route' => '/oembed/1.0/embed',
				'name'  => 'oembeds',
			),
			array(
				'route' => '/wp/v2/posts',
				'name'  => 'PostsCollection',
			),
			array(
				'route' => '/wp/v2/posts/' . $post_id,
				'name'  => 'PostModel',
			),
			array(
				'route' => '/wp/v2/posts/' . $post_id . '/revisions',
				'name'  => 'postRevisions',
			),
			array(
				'route' => '/wp/v2/posts/' . $post_id . '/revisions/1',
				'name'  => 'revision',
			),
			array(
				'route' => '/wp/v2/pages',
				'name'  => 'PagesCollection',
			),
			array(
				'route' => '/wp/v2/pages/' . $page_id,
				'name'  => 'PageModel',
			),
			array(
				'route' => '/wp/v2/pages/'. $page_id . '/revisions',
				'name'  => 'pageRevisions',
			),
			array(
				'route' => '/wp/v2/pages/'. $page_id . '/revisions/1',
				'name'  => 'pageRevision',
			),
			array(
				'route' => '/wp/v2/media',
				'name'  => 'MediaCollection',
			),
			array(
				'route' => '/wp/v2/media/' . $media_id,
				'name'  => 'MediaModel',
			),
			array(
				'route' => '/wp/v2/types',
				'name'  => 'TypesCollection',
			),
			array(
				'route' => '/wp/v2/types/',
				'name'  => 'TypeModel',
			),
			array(
				'route' => '/wp/v2/statuses',
				'name'  => 'StatusesCollection',
			),
			array(
				'route' => '/wp/v2/statuses/publish',
				'name'  => 'StatusModel',
			),
			array(
				'route' => '/wp/v2/taxonomies',
				'name'  => 'TaxonomiesCollection',
			),
			array(
				'route' => '/wp/v2/taxonomies/category',
				'name'  => 'TaxonomyModel',
			),
			array(
				'route' => '/wp/v2/categories',
				'name'  => 'CategoriesCollection',
			),
			array(
				'route' => '/wp/v2/categories/1',
				'name'  => 'CategoryModel',
			),
			array(
				'route' => '/wp/v2/tags',
				'name'  => 'TagsCollection',
			),
			array(
				'route' => '/wp/v2/tags/' . $tag_id,
				'name'  => 'TagModel',
			),
			array(
				'route' => '/wp/v2/users',
				'name'  => 'UsersCollection',
			),
			array(
				'route' => '/wp/v2/users/1',
				'name'  => 'UserModel',
			),
			array(
				'route' => '/wp/v2/users/me',
				'name'  => 'me',
			),
			array(
				'route' => '/wp/v2/comments',
				'name'  => 'CommentsCollection',
			),
			array(
				'route' => '/wp/v2/comments/1',
				'name'  => 'CommentModel',
			),
			array(
				'route' => '/wp/v2/settings',
				'name'  => 'settings',
			),
		);

		// Set up the mocked response and tell jshint to ignore the single quote json objects
		$mocked_responses = "/*jshint -W109 */\n\nvar mockedApiResponse = {};\n\n";
		$mocked_responses .= "/**\n";
		$mocked_responses .= " * DO NOT EDIT\n";
		$mocked_responses .= " * Auto-generated by test_build_wp_api_client_fixtures\n";
		$mocked_responses .= " */\n";

		foreach ( $routes_to_generate_data as $route ) {
			$request = new WP_REST_Request( 'GET', $route['route'] );
			$response = $this->server->dispatch( $request );
			$data = $response->get_data();

			$this->assertTrue( ! empty( $data ), $route['name'] . ' route should return data.' );

			$mocked_responses .= 'mockedApiResponse.' . $route['name'] . ' = ' . wp_json_encode( $data ) . ";\n\n";
		}

		// Save the route object for QUnit tests.
		$file = './tests/qunit/fixtures/wp-api-generated.js';
		file_put_contents( $file, $mocked_responses );

		// Clean up our test data.
		wp_delete_post( $post_id, true );
		wp_delete_post( $page_id, true );
		wp_delete_term( $tag_id, 'tags' );
		wp_delete_attachment( $media_id );
		wp_delete_comment( $comment_id );
	}
}
