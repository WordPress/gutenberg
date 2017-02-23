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

		$routes = array_filter( array_keys( $routes ), array( $this, 'is_builtin_route' ) );

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

		$this->assertEquals( $expected_routes, $routes );
	}

	private function is_builtin_route( $route ) {
		return (
			'/' === $route ||
			preg_match( '#^/oembed/1\.0(/.+)?$#', $route ) ||
			preg_match( '#^/wp/v2(/.+)?$#', $route )
		);
	}

	public function test_build_wp_api_client_fixtures() {
		// Set up data for individual endpoint responses.  We need to specify
		// lots of different fields on these objects, otherwise the generated
		// fixture file will be different between runs of PHPUnit tests, which
		// is not desirable.

		$administrator_id = $this->factory->user->create( array(
			'role'          => 'administrator',
			'display_name'  => 'REST API Client Fixture: User',
			'user_nicename' => 'restapiclientfixtureuser',
			'user_email'    => 'administrator@example.org',
		) );
		wp_set_current_user( $administrator_id );

		$post_id = $this->factory->post->create( array(
			'post_name'      => 'restapi-client-fixture-post',
			'post_title'     => 'REST API Client Fixture: Post',
			'post_content'   => 'REST API Client Fixture: Post',
			'post_excerpt'   => 'REST API Client Fixture: Post',
			'post_author'    => 0,
		) );
		wp_update_post( array(
			'ID'           => $post_id,
			'post_content' => 'Updated post content.',
		) );

		$page_id = $this->factory->post->create( array(
			'post_type'      => 'page',
			'post_name'      => 'restapi-client-fixture-page',
			'post_title'     => 'REST API Client Fixture: Page',
			'post_content'   => 'REST API Client Fixture: Page',
			'post_excerpt'   => 'REST API Client Fixture: Page',
			'post_date'      => '2017-02-14 00:00:00',
			'post_date_gmt'  => '2017-02-14 00:00:00',
			'post_author'    => 0,
		) );
		wp_update_post( array(
			'ID'           => $page_id,
			'post_content' => 'Updated page content.',
		) );

		$tag_id = $this->factory->tag->create( array(
			'name'        => 'REST API Client Fixture: Tag',
			'slug'        => 'restapi-client-fixture-tag',
			'description' => 'REST API Client Fixture: Tag',
		) );

		$media_id = $this->factory->attachment->create_object( '/tmp/canola.jpg', 0, array(
			'post_mime_type' => 'image/jpeg',
			'post_excerpt'   => 'A sample caption',
			'post_name'      => 'restapi-client-fixture-attachment',
			'post_title'     => 'REST API Client Fixture: Attachment',
			'post_date'      => '2017-02-14 00:00:00',
			'post_date_gmt'  => '2017-02-14 00:00:00',
			'post_author'    => 0,
		) );

		$comment_id = $this->factory->comment->create( array(
			'comment_approved'     => 1,
			'comment_post_ID'      => $post_id,
			'user_id'              => 0,
			'comment_date'         => '2017-02-14 00:00:00',
			'comment_date_gmt'     => '2017-02-14 00:00:00',
			'comment_author'       => 'Internet of something or other',
			'comment_author_email' => 'lights@example.org',
			'comment_author_url'   => 'http://lights.example.org/',
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
				'route' => '/wp/v2/users/' . $administrator_id,
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

		$mocked_responses = "/**\n";
		$mocked_responses .= " * DO NOT EDIT\n";
		$mocked_responses .= " * Auto-generated by test_build_wp_api_client_fixtures\n";
		$mocked_responses .= " */\n";
		$mocked_responses .= "var mockedApiResponse = {};\n";
		$mocked_responses .= "/* jshint -W109 */\n";

		foreach ( $routes_to_generate_data as $route ) {
			$request = new WP_REST_Request( 'GET', $route['route'] );
			$response = $this->server->dispatch( $request );
			$data = $response->get_data();

			$this->assertTrue( ! empty( $data ), $route['name'] . ' route should return data.' );

			if ( version_compare( PHP_VERSION, '5.4', '>=' ) ) {
				$fixture = $this->normalize_fixture( $data, $route['name'] );
				$mocked_responses .= "\nmockedApiResponse." . $route['name'] . ' = '
					. json_encode( $fixture, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES )
					. ";\n";
			}
		}

		if ( is_multisite() ) {
			echo "Skipping generation of API client fixtures in multisite mode.\n";
		} else if ( version_compare( PHP_VERSION, '5.4', '<' ) ) {
			echo "Skipping generation of API client fixtures due to unsupported JSON_* constants.\n";
		} else {
			// Save the route object for QUnit tests.
			$file = './tests/qunit/fixtures/wp-api-generated.js';
			file_put_contents( $file, $mocked_responses );
		}

		// Clean up our test data.
		wp_delete_post( $post_id, true );
		wp_delete_post( $page_id, true );
		wp_delete_term( $tag_id, 'tags' );
		wp_delete_attachment( $media_id );
		wp_delete_comment( $comment_id );
	}

	/**
	 * This array contains normalized versions of object IDs and other values
	 * that can change depending on how PHPUnit is executed.  For details on
	 * how they were generated, see #39264.
	 */
	private static $fixture_replacements = array(
		'PostsCollection.0.id' => 3,
		'PostsCollection.0.guid.rendered' => 'http://example.org/?p=3',
		'PostsCollection.0.link' => 'http://example.org/?p=3',
		'PostsCollection.0._links.self.0.href' => 'http://example.org/?rest_route=/wp/v2/posts/3',
		'PostsCollection.0._links.replies.0.href' => 'http://example.org/?rest_route=%2Fwp%2Fv2%2Fcomments&post=3',
		'PostsCollection.0._links.version-history.0.href' => 'http://example.org/?rest_route=/wp/v2/posts/3/revisions',
		'PostsCollection.0._links.wp:attachment.0.href' => 'http://example.org/?rest_route=%2Fwp%2Fv2%2Fmedia&parent=3',
		'PostsCollection.0._links.wp:term.0.href' => 'http://example.org/?rest_route=%2Fwp%2Fv2%2Fcategories&post=3',
		'PostsCollection.0._links.wp:term.1.href' => 'http://example.org/?rest_route=%2Fwp%2Fv2%2Ftags&post=3',
		'PostModel.id' => 3,
		'PostModel.guid.rendered' => 'http://example.org/?p=3',
		'PostModel.link' => 'http://example.org/?p=3',
		'postRevisions.0.author' => '2',
		'postRevisions.0.id' => 4,
		'postRevisions.0.parent' => 3,
		'postRevisions.0.slug' => '3-revision-v1',
		'postRevisions.0.guid.rendered' => 'http://example.org/?p=4',
		'postRevisions.0._links.parent.0.href' => 'http://example.org/?rest_route=/wp/v2/posts/3',
		'PagesCollection.0.id' => 5,
		'PagesCollection.0.guid.rendered' => 'http://example.org/?page_id=5',
		'PagesCollection.0.link' => 'http://example.org/?page_id=5',
		'PagesCollection.0._links.self.0.href' => 'http://example.org/?rest_route=/wp/v2/pages/5',
		'PagesCollection.0._links.replies.0.href' => 'http://example.org/?rest_route=%2Fwp%2Fv2%2Fcomments&post=5',
		'PagesCollection.0._links.version-history.0.href' => 'http://example.org/?rest_route=/wp/v2/pages/5/revisions',
		'PagesCollection.0._links.wp:attachment.0.href' => 'http://example.org/?rest_route=%2Fwp%2Fv2%2Fmedia&parent=5',
		'PageModel.id' => 5,
		'PageModel.guid.rendered' => 'http://example.org/?page_id=5',
		'PageModel.link' => 'http://example.org/?page_id=5',
		'pageRevisions.0.author' => '2',
		'pageRevisions.0.id' => 6,
		'pageRevisions.0.parent' => 5,
		'pageRevisions.0.slug' => '5-revision-v1',
		'pageRevisions.0.guid.rendered' => 'http://example.org/?p=6',
		'pageRevisions.0._links.parent.0.href' => 'http://example.org/?rest_route=/wp/v2/pages/5',
		'MediaCollection.0.id' => 7,
		'MediaCollection.0.guid.rendered' => 'http://example.org/?attachment_id=7',
		'MediaCollection.0.link' => 'http://example.org/?attachment_id=7',
		'MediaCollection.0._links.self.0.href' => 'http://example.org/?rest_route=/wp/v2/media/7',
		'MediaCollection.0._links.replies.0.href' => 'http://example.org/?rest_route=%2Fwp%2Fv2%2Fcomments&post=7',
		'MediaModel.id' => 7,
		'MediaModel.guid.rendered' => 'http://example.org/?attachment_id=7',
		'MediaModel.link' => 'http://example.org/?attachment_id=7',
		'TagsCollection.0.id' => 2,
		'TagsCollection.0._links.self.0.href' => 'http://example.org/?rest_route=/wp/v2/tags/2',
		'TagsCollection.0._links.wp:post_type.0.href' => 'http://example.org/?rest_route=%2Fwp%2Fv2%2Fposts&tags=2',
		'TagModel.id' => 2,
		'UsersCollection.1.id' => 2,
		'UsersCollection.1.link' => 'http://example.org/?author=2',
		'UsersCollection.1._links.self.0.href' => 'http://example.org/?rest_route=/wp/v2/users/2',
		'UserModel.id' => 2,
		'UserModel.link' => 'http://example.org/?author=2',
		'me.id' => 2,
		'me.link' => 'http://example.org/?author=2',
		'CommentsCollection.0.id' => 2,
		'CommentsCollection.0.post' => 3,
		'CommentsCollection.0.link' => 'http://example.org/?p=3#comment-2',
		'CommentsCollection.0._links.self.0.href' => 'http://example.org/?rest_route=/wp/v2/comments/2',
		'CommentsCollection.0._links.up.0.href' => 'http://example.org/?rest_route=/wp/v2/posts/3',
	);

	private function normalize_fixture( $data, $path ) {
		if ( isset( self::$fixture_replacements[ $path ] ) ) {
			return self::$fixture_replacements[ $path ];
		}

		if ( ! is_array( $data ) ) {
			return $data;
		}

		foreach ( $data as $key => $value ) {
			if ( is_string( $value ) && (
				'date' === $key ||
				'date_gmt' === $key ||
				'modified' === $key ||
				'modified_gmt' === $key
			) ) {
				$data[ $key ] = '2017-02-14T00:00:00';
			} else {
				$data[ $key ] = $this->normalize_fixture( $value, "$path.$key" );
			}
		}

		return $data;
	}
}
