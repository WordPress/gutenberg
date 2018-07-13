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
	const YOUTUBE_VIDEO_ID = 'i_cVJgIz_Cs';

	public function setUp() {
		parent::setUp();

		/** @var WP_REST_Server $wp_rest_server */
		global $wp_rest_server;
		$this->server = $wp_rest_server = new Spy_REST_Server;
		do_action( 'rest_api_init' );

		add_filter( 'pre_http_request', array( $this, 'mock_embed_request' ), 10, 3 );
	}

	public function tearDown() {
		parent::tearDown();

		/** @var WP_REST_Server $wp_rest_server */
		global $wp_rest_server;
		$wp_rest_server = null;

		remove_filter( 'pre_http_request', array( $this, 'mock_embed_request' ), 10, 3 );
	}

	public function mock_embed_request( $preempt, $r, $url ) {
		unset( $preempt, $r );

		// Mock request to YouTube Embed.
		if ( false !== strpos( $url, self::YOUTUBE_VIDEO_ID ) ) {
			return array(
				'response' => array(
					'code' => 200,
				),
				'body' => wp_json_encode(
					array(
						'version'          => '1.0',
						'type'             => 'video',
						'provider_name'    => 'YouTube',
						'provider_url'     => 'https://www.youtube.com',
						'thumbnail_width'  => 480,
						'width'            => 500,
						'thumbnail_height' => 360,
						'html'             => '<iframe width="500" height="375" src="https://www.youtube.com/embed/' . self::YOUTUBE_VIDEO_ID . '?feature=oembed" frameborder="0" allowfullscreen></iframe>',
						'author_name'      => 'Jorge Rubira Santos',
						'thumbnail_url'    => 'https://i.ytimg.com/vi/' . self::YOUTUBE_VIDEO_ID . '/hqdefault.jpg',
						'title'            => 'No te olvides de poner el Where en el Delete From. (Una cancion para programadores)',
						'height'           => 375,
					)
				),
			);
		} else {
			return array(
				'response' => array(
					'code' => 404,
				),
			);
		}
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
			'/oembed/1.0/proxy',
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
		$post_revisions = array_values( wp_get_post_revisions( $post_id ) );
		$post_revision_id = $post_revisions[ count( $post_revisions ) - 1 ]->ID;

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
		$page_revisions = array_values( wp_get_post_revisions( $page_id ) );
		$page_revision_id = $page_revisions[ count( $page_revisions ) - 1 ]->ID;

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
		$meta_args = array(
			'sanitize_callback' => 'sanitize_my_meta_key',
			'auth_callback'     => '__return_true',
			'type'              => 'string',
			'description'       => 'Test meta key',
			'single'            => true,
			'show_in_rest'      => true,
		);

		// Set up meta.
		register_meta( 'user', 'meta_key', $meta_args );
		update_user_meta( 1, 'meta_key', 'meta_value' ); // Always use the first user.
		register_meta( 'post', 'meta_key', $meta_args );
		update_post_meta( $post_id, 'meta_key', 'meta_value' );
		register_meta( 'comment', 'meta_key', $meta_args );
		update_comment_meta( $comment_id, 'meta_key', 'meta_value' );
		register_meta( 'term', 'meta_key', $meta_args );
		update_term_meta( $tag_id, 'meta_key', 'meta_value' );

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
				'args'  => array(
					'url' => '?p=' . $post_id,
				),
			),
			array(
				'route' => '/oembed/1.0/proxy',
				'name'  => 'oembedProxy',
				'args'  => array(
					'url' => 'https://www.youtube.com/watch?v=i_cVJgIz_Cs',
				),
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
				'route' => '/wp/v2/posts/' . $post_id . '/revisions/' . $post_revision_id,
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
				'route' => '/wp/v2/pages/'. $page_id . '/revisions/' . $page_revision_id,
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
				'route' => '/wp/v2/types/post',
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
				'route' => '/wp/v2/comments/' . $comment_id,
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
			if ( isset( $route['args'] ) ) {
				$request->set_query_params( $route['args'] );
			}
			$response = $this->server->dispatch( $request );
			$status = $response->get_status();
			$data = $response->get_data();

			$this->assertEquals(
				200,
				$response->get_status(),
				"HTTP $status from $route[route]: " . json_encode( $data )
			);
			$this->assertTrue( ! empty( $data ), $route['name'] . ' route should return data.' );

			if ( version_compare( PHP_VERSION, '5.4', '>=' ) ) {
				$fixture = $this->normalize_fixture( $data, $route['name'] );
				$mocked_responses .= "\nmockedApiResponse." . $route['name'] . ' = '
					. json_encode( $fixture, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES )
					. ";\n";
			}
		}

		// Only generate API client fixtures in single site and when required JSON_* constants are supported.
		if ( ! is_multisite() && version_compare( PHP_VERSION, '5.4', '>=' ) ) {
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
	 * how they were generated, see #41123.
	 */
	private static $fixture_replacements = array(
		'Schema.name' => 'Test Blog',
		'Schema.url' => 'http://example.org',
		'Schema.home' => 'http://example.org',
		'Schema.routes./._links.self' => 'http://example.org/index.php?rest_route=/',
		'Schema.routes./oembed/1.0._links.self' => 'http://example.org/index.php?rest_route=/oembed/1.0',
		'Schema.routes./oembed/1.0/embed._links.self' => 'http://example.org/index.php?rest_route=/oembed/1.0/embed',
		'Schema.routes./oembed/1.0/proxy._links.self' => 'http://example.org/index.php?rest_route=/oembed/1.0/proxy',
		'Schema.routes./wp/v2._links.self' => 'http://example.org/index.php?rest_route=/wp/v2',
		'Schema.routes./wp/v2/posts._links.self' => 'http://example.org/index.php?rest_route=/wp/v2/posts',
		'Schema.routes./wp/v2/pages._links.self' => 'http://example.org/index.php?rest_route=/wp/v2/pages',
		'Schema.routes./wp/v2/media._links.self' => 'http://example.org/index.php?rest_route=/wp/v2/media',
		'Schema.routes./wp/v2/types._links.self' => 'http://example.org/index.php?rest_route=/wp/v2/types',
		'Schema.routes./wp/v2/statuses._links.self' => 'http://example.org/index.php?rest_route=/wp/v2/statuses',
		'Schema.routes./wp/v2/taxonomies._links.self' => 'http://example.org/index.php?rest_route=/wp/v2/taxonomies',
		'Schema.routes./wp/v2/categories._links.self' => 'http://example.org/index.php?rest_route=/wp/v2/categories',
		'Schema.routes./wp/v2/tags._links.self' => 'http://example.org/index.php?rest_route=/wp/v2/tags',
		'Schema.routes./wp/v2/users._links.self' => 'http://example.org/index.php?rest_route=/wp/v2/users',
		'Schema.routes./wp/v2/users/me._links.self' => 'http://example.org/index.php?rest_route=/wp/v2/users/me',
		'Schema.routes./wp/v2/comments._links.self' => 'http://example.org/index.php?rest_route=/wp/v2/comments',
		'Schema.routes./wp/v2/settings._links.self' => 'http://example.org/index.php?rest_route=/wp/v2/settings',
		'oembed.routes./oembed/1.0._links.self' => 'http://example.org/index.php?rest_route=/oembed/1.0',
		'oembed.routes./oembed/1.0/embed._links.self' => 'http://example.org/index.php?rest_route=/oembed/1.0/embed',
		'oembed.routes./oembed/1.0/proxy._links.self' => 'http://example.org/index.php?rest_route=/oembed/1.0/proxy',
		'oembeds.provider_name' => 'Test Blog',
		'oembeds.provider_url' => 'http://example.org',
		'oembeds.author_name' => 'Test Blog',
		'oembeds.author_url' => 'http://example.org',
		'oembeds.html' => '<blockquote class="wp-embedded-content">...</blockquote>...',
		'PostsCollection.0.id' => 4,
		'PostsCollection.0.guid.rendered' => 'http://example.org/?p=4',
		'PostsCollection.0.link' => 'http://example.org/?p=4',
		'PostsCollection.0._links.self.0.href' => 'http://example.org/index.php?rest_route=/wp/v2/posts/4',
		'PostsCollection.0._links.collection.0.href' => 'http://example.org/index.php?rest_route=/wp/v2/posts',
		'PostsCollection.0._links.about.0.href' => 'http://example.org/index.php?rest_route=/wp/v2/types/post',
		'PostsCollection.0._links.replies.0.href' => 'http://example.org/index.php?rest_route=%2Fwp%2Fv2%2Fcomments&post=4',
		'PostsCollection.0._links.version-history.0.href' => 'http://example.org/index.php?rest_route=/wp/v2/posts/4/revisions',
		'PostsCollection.0._links.predecessor-version.0.id' => 5,
		'PostsCollection.0._links.predecessor-version.0.href' => 'http://example.org/index.php?rest_route=/wp/v2/posts/4/revisions/5',
		'PostsCollection.0._links.wp:attachment.0.href' => 'http://example.org/index.php?rest_route=%2Fwp%2Fv2%2Fmedia&parent=4',
		'PostsCollection.0._links.wp:term.0.href' => 'http://example.org/index.php?rest_route=%2Fwp%2Fv2%2Fcategories&post=4',
		'PostsCollection.0._links.wp:term.1.href' => 'http://example.org/index.php?rest_route=%2Fwp%2Fv2%2Ftags&post=4',
		'PostModel.id' => 4,
		'PostModel.guid.rendered' => 'http://example.org/?p=4',
		'PostModel.link' => 'http://example.org/?p=4',
		'postRevisions.0.author' => 2,
		'postRevisions.0.id' => 5,
		'postRevisions.0.parent' => 4,
		'postRevisions.0.slug' => '4-revision-v1',
		'postRevisions.0.guid.rendered' => 'http://example.org/?p=5',
		'postRevisions.0._links.parent.0.href' => 'http://example.org/index.php?rest_route=/wp/v2/posts/4',
		'revision.author' => 2,
		'revision.id' => 5,
		'revision.parent' => 4,
		'revision.slug' => '4-revision-v1',
		'revision.guid.rendered' => 'http://example.org/?p=5',
		'PagesCollection.0.id' => 6,
		'PagesCollection.0.guid.rendered' => 'http://example.org/?page_id=6',
		'PagesCollection.0.link' => 'http://example.org/?page_id=6',
		'PagesCollection.0._links.self.0.href' => 'http://example.org/index.php?rest_route=/wp/v2/pages/6',
		'PagesCollection.0._links.collection.0.href' => 'http://example.org/index.php?rest_route=/wp/v2/pages',
		'PagesCollection.0._links.about.0.href' => 'http://example.org/index.php?rest_route=/wp/v2/types/page',
		'PagesCollection.0._links.replies.0.href' => 'http://example.org/index.php?rest_route=%2Fwp%2Fv2%2Fcomments&post=6',
		'PagesCollection.0._links.version-history.0.href' => 'http://example.org/index.php?rest_route=/wp/v2/pages/6/revisions',
		'PagesCollection.0._links.predecessor-version.0.id' => 7,
		'PagesCollection.0._links.predecessor-version.0.href' => 'http://example.org/index.php?rest_route=/wp/v2/pages/6/revisions/7',
		'PagesCollection.0._links.wp:attachment.0.href' => 'http://example.org/index.php?rest_route=%2Fwp%2Fv2%2Fmedia&parent=6',
		'PageModel.id' => 6,
		'PageModel.guid.rendered' => 'http://example.org/?page_id=6',
		'PageModel.link' => 'http://example.org/?page_id=6',
		'pageRevisions.0.author' => 2,
		'pageRevisions.0.id' => 7,
		'pageRevisions.0.parent' => 6,
		'pageRevisions.0.slug' => '6-revision-v1',
		'pageRevisions.0.guid.rendered' => 'http://example.org/?p=7',
		'pageRevisions.0._links.parent.0.href' => 'http://example.org/index.php?rest_route=/wp/v2/pages/6',
		'pageRevision.author' => 2,
		'pageRevision.id' => 7,
		'pageRevision.parent' => 6,
		'pageRevision.slug' => '6-revision-v1',
		'pageRevision.guid.rendered' => 'http://example.org/?p=7',
		'MediaCollection.0.id' => 8,
		'MediaCollection.0.guid.rendered' => 'http://example.org/?attachment_id=8',
		'MediaCollection.0.link' => 'http://example.org/?attachment_id=8',
		'MediaCollection.0.description.rendered' => '<p class="attachment"><!-- <a...><img.../></a> --></p>',
		'MediaCollection.0.source_url' => 'http://example.org/wp-content/uploads//tmp/canola.jpg',
		'MediaCollection.0._links.self.0.href' => 'http://example.org/index.php?rest_route=/wp/v2/media/8',
		'MediaCollection.0._links.collection.0.href' => 'http://example.org/index.php?rest_route=/wp/v2/media',
		'MediaCollection.0._links.about.0.href' => 'http://example.org/index.php?rest_route=/wp/v2/types/attachment',
		'MediaCollection.0._links.replies.0.href' => 'http://example.org/index.php?rest_route=%2Fwp%2Fv2%2Fcomments&post=8',
		'MediaModel.id' => 8,
		'MediaModel.guid.rendered' => 'http://example.org/?attachment_id=8',
		'MediaModel.link' => 'http://example.org/?attachment_id=8',
		'MediaModel.description.rendered' => '<p class="attachment"><!-- <a...><img.../></a> --></p>',
		'MediaModel.source_url' => 'http://example.org/wp-content/uploads//tmp/canola.jpg',
		'TypesCollection.post._links.collection.0.href' => 'http://example.org/index.php?rest_route=/wp/v2/types',
		'TypesCollection.post._links.wp:items.0.href' => 'http://example.org/index.php?rest_route=/wp/v2/posts',
		'TypesCollection.page._links.collection.0.href' => 'http://example.org/index.php?rest_route=/wp/v2/types',
		'TypesCollection.page._links.wp:items.0.href' => 'http://example.org/index.php?rest_route=/wp/v2/pages',
		'TypesCollection.attachment._links.collection.0.href' => 'http://example.org/index.php?rest_route=/wp/v2/types',
		'TypesCollection.attachment._links.wp:items.0.href' => 'http://example.org/index.php?rest_route=/wp/v2/media',
		'StatusesCollection.publish._links.archives.0.href' => 'http://example.org/index.php?rest_route=/wp/v2/posts',
		'StatusesCollection.future._links.archives.0.href' => 'http://example.org/index.php?rest_route=%2Fwp%2Fv2%2Fposts&status=future',
		'StatusesCollection.draft._links.archives.0.href' => 'http://example.org/index.php?rest_route=%2Fwp%2Fv2%2Fposts&status=draft',
		'StatusesCollection.pending._links.archives.0.href' => 'http://example.org/index.php?rest_route=%2Fwp%2Fv2%2Fposts&status=pending',
		'StatusesCollection.private._links.archives.0.href' => 'http://example.org/index.php?rest_route=%2Fwp%2Fv2%2Fposts&status=private',
		'StatusesCollection.trash._links.archives.0.href' => 'http://example.org/index.php?rest_route=%2Fwp%2Fv2%2Fposts&status=trash',
		'TaxonomiesCollection.category._links.collection.0.href' => 'http://example.org/index.php?rest_route=/wp/v2/taxonomies',
		'TaxonomiesCollection.category._links.wp:items.0.href' => 'http://example.org/index.php?rest_route=/wp/v2/categories',
		'TaxonomiesCollection.post_tag._links.collection.0.href' => 'http://example.org/index.php?rest_route=/wp/v2/taxonomies',
		'TaxonomiesCollection.post_tag._links.wp:items.0.href' => 'http://example.org/index.php?rest_route=/wp/v2/tags',
		'CategoriesCollection.0.link' => 'http://example.org/?cat=1',
		'CategoriesCollection.0._links.self.0.href' => 'http://example.org/index.php?rest_route=/wp/v2/categories/1',
		'CategoriesCollection.0._links.collection.0.href' => 'http://example.org/index.php?rest_route=/wp/v2/categories',
		'CategoriesCollection.0._links.about.0.href' => 'http://example.org/index.php?rest_route=/wp/v2/taxonomies/category',
		'CategoriesCollection.0._links.wp:post_type.0.href' => 'http://example.org/index.php?rest_route=%2Fwp%2Fv2%2Fposts&categories=1',
		'CategoryModel.link' => 'http://example.org/?cat=1',
		'TagsCollection.0.id' => 2,
		'TagsCollection.0.link' => 'http://example.org/?tag=restapi-client-fixture-tag',
		'TagsCollection.0._links.self.0.href' => 'http://example.org/index.php?rest_route=/wp/v2/tags/2',
		'TagsCollection.0._links.collection.0.href' => 'http://example.org/index.php?rest_route=/wp/v2/tags',
		'TagsCollection.0._links.about.0.href' => 'http://example.org/index.php?rest_route=/wp/v2/taxonomies/post_tag',
		'TagsCollection.0._links.wp:post_type.0.href' => 'http://example.org/index.php?rest_route=%2Fwp%2Fv2%2Fposts&tags=2',
		'TagModel.id' => 2,
		'TagModel.link' => 'http://example.org/?tag=restapi-client-fixture-tag',
		'UsersCollection.0.link' => 'http://example.org/?author=1',
		'UsersCollection.0.avatar_urls.24' => 'http://0.gravatar.com/avatar/96614ec98aa0c0d2ee75796dced6df54?s=24&d=mm&r=g',
		'UsersCollection.0.avatar_urls.48' => 'http://0.gravatar.com/avatar/96614ec98aa0c0d2ee75796dced6df54?s=48&d=mm&r=g',
		'UsersCollection.0.avatar_urls.96' => 'http://0.gravatar.com/avatar/96614ec98aa0c0d2ee75796dced6df54?s=96&d=mm&r=g',
		'UsersCollection.0._links.self.0.href' => 'http://example.org/index.php?rest_route=/wp/v2/users/1',
		'UsersCollection.0._links.collection.0.href' => 'http://example.org/index.php?rest_route=/wp/v2/users',
		'UsersCollection.1.id' => 2,
		'UsersCollection.1.link' => 'http://example.org/?author=2',
		'UsersCollection.1._links.self.0.href' => 'http://example.org/index.php?rest_route=/wp/v2/users/2',
		'UsersCollection.1._links.collection.0.href' => 'http://example.org/index.php?rest_route=/wp/v2/users',
		'UserModel.id' => 2,
		'UserModel.link' => 'http://example.org/?author=2',
		'me.id' => 2,
		'me.link' => 'http://example.org/?author=2',
		'CommentsCollection.0.id' => 2,
		'CommentsCollection.0.post' => 4,
		'CommentsCollection.0.link' => 'http://example.org/?p=4#comment-2',
		'CommentsCollection.0._links.self.0.href' => 'http://example.org/index.php?rest_route=/wp/v2/comments/2',
		'CommentsCollection.0._links.collection.0.href' => 'http://example.org/index.php?rest_route=/wp/v2/comments',
		'CommentsCollection.0._links.up.0.href' => 'http://example.org/index.php?rest_route=/wp/v2/posts/4',
		'CommentModel.id' => 2,
		'CommentModel.post' => 4,
		'CommentModel.link' => 'http://example.org/?p=4#comment-2',
		'settings.title' => 'Test Blog',
		'settings.url' => 'http://example.org',
		'settings.email' => 'admin@example.org',
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
