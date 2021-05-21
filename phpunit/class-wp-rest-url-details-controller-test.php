<?php
/**
 * WP_REST_URL_Details_Controller tests.
 *
 * @package WordPress
 * @subpackage REST_API
 * @since x.x.0
 */

/**
 * Tests for WP_REST_URL_Details_Controller.
 *
 * @since x.x.0
 *
 * @covers WP_REST_URL_Details_Controller
 * @group url-details
 * @group restapi
 */
class WP_REST_URL_Details_Controller_Test extends WP_Test_REST_Controller_Testcase {

	/**
	 * Admin user ID.
	 *
	 * @since x.x.0
	 *
	 * @var int $subscriber_id
	 */
	protected static $admin_id;

	/**
	 * Subscriber user ID.
	 *
	 * @since x.x.0
	 *
	 * @var int $subscriber_id
	 */
	protected static $subscriber_id;


	protected static $route = '/__experimental/url-details';


	protected static $url_placeholder = 'https://placeholder-site.com';

	protected static $request_args = array();

	/**
	 * Create fake data before our tests run.
	 *
	 * @since x.x.0
	 *
	 * @param WP_UnitTest_Factory $factory Helper that lets us create fake data.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		self::$admin_id      = $factory->user->create(
			array(
				'role' => 'administrator',
			)
		);
		self::$subscriber_id = $factory->user->create(
			array(
				'role' => 'subscriber',
			)
		);
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
		self::delete_user( self::$subscriber_id );
	}



	/**
	 * Setup.
	 */
	public function setUp() {
		parent::setUp();

		add_filter( 'pre_http_request', array( $this, 'mock_success_request_to_remote_url' ), 10, 3 );

		// Disables usage of cache during major of tests.
		$transient_name = 'g_url_details_response_' . md5( static::$url_placeholder );
		add_filter(
			"pre_transient_$transient_name",
			'__return_null'
		);
	}

	/**
	 * Tear down.
	 */
	public function tearDown() {
		remove_filter( 'pre_http_request', array( $this, 'mock_success_request_to_remote_url' ), 10 );
		$transient_name = 'g_url_details_response_' . md5( static::$url_placeholder );

		remove_filter(
			"pre_transient_$transient_name",
			'__return_null'
		);
		static::$request_args = array();
		parent::tearDown();
	}



	public function test_register_routes() {
		$routes = rest_get_server()->get_routes();
		$this->assertArrayHasKey( static::$route, $routes );
	}

	public function test_context_param() {
	}

	public function test_get_items() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'GET', static::$route );
		$request->set_query_params(
			array(
				'url' => static::$url_placeholder,
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		// Note the data in the subset comes from the fixture HTML returned by
		// the filter `pre_http_request` (see this class's `setUp` method).
		$this->assertArraySubset(
			array(
				'title'       => 'Example Website &mdash; - with encoded content.',
				'icon'        => 'https://placeholder-site.com/favicon.ico?querystringaddedfortesting',
				'description' => 'Example description text here. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore.',
				'image'       => 'https://placeholder-site.com/images/home/screen-themes.png?3',
			),
			$data
		);
	}


	public function test_get_items_fails_for_unauthenticated_user() {
		wp_set_current_user( 0 );

		$request = new WP_REST_Request( 'GET', static::$route );
		$request->set_query_params(
			array(
				'url' => static::$url_placeholder,
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( WP_Http::UNAUTHORIZED, $response->get_status() );

		$this->assertEquals(
			'rest_cannot_view_url_details',
			$data['code']
		);

		$this->assertContains(
			strtolower( 'you are not allowed to process remote urls' ),
			strtolower( $data['message'] )
		);
	}

	public function test_get_items_fails_for_user_with_insufficient_permissions() {
		wp_set_current_user( self::$subscriber_id );

		$request = new WP_REST_Request( 'GET', static::$route );
		$request->set_query_params(
			array(
				'url' => static::$url_placeholder,
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( WP_Http::FORBIDDEN, $response->get_status() );

		$this->assertEquals(
			'rest_cannot_view_url_details',
			$data['code']
		);

		$this->assertContains(
			strtolower( 'you are not allowed to process remote urls' ),
			strtolower( $data['message'] )
		);
	}

	/**
	 * @dataProvider provide_invalid_url_data
	 */
	public function test_get_items_fails_for_invalid_url( $expected, $invalid_url ) {

		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'GET', static::$route );
		$request->set_query_params(
			array(
				'url' => $invalid_url,
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( WP_Http::BAD_REQUEST, $response->get_status() );

		$this->assertEquals(
			'rest_invalid_param',
			$data['code']
		);

		$this->assertContains(
			strtolower( 'Invalid parameter(s): url' ),
			strtolower( $data['message'] )
		);
	}

	public function test_get_items_fails_for_url_which_returns_a_non_200_status_code() {
		// Force HTTP request to remote site to fail.
		remove_filter( 'pre_http_request', array( $this, 'mock_success_request_to_remote_url' ), 10 );
		add_filter( 'pre_http_request', array( $this, 'mock_failed_request_to_remote_url' ), 10, 3 );

		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'GET', static::$route );
		$request->set_query_params(
			array(
				'url' => static::$url_placeholder, // note: `pre_http_request` causes request to 404.
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 404, $response->get_status() );

		$this->assertEquals(
			'no_response',
			$data['code']
		);

		$this->assertContains(
			strtolower( 'Not found' ),
			strtolower( $data['message'] )
		);
	}

	public function test_get_items_fails_for_url_which_returns_empty_body_for_success() {
		// Force HTTP request to remote site to return an empty body in response.
		remove_filter( 'pre_http_request', array( $this, 'mock_success_request_to_remote_url' ), 10 );
		add_filter( 'pre_http_request', array( $this, 'mock_request_to_remote_url_with_empty_body_response' ), 10, 3 );

		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'GET', static::$route );
		$request->set_query_params(
			array(
				'url' => static::$url_placeholder, // note: `pre_http_request` causes request to 404.
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 404, $response->get_status() );

		$this->assertEquals(
			'no_content',
			$data['code']
		);

		$this->assertContains(
			strtolower( 'Unable to retrieve body from response at this URL' ),
			strtolower( $data['message'] )
		);
	}

	public function test_can_filter_http_request_args_via_filter() {
		wp_set_current_user( self::$admin_id );

		add_filter(
			'rest_url_details_http_request_args',
			function( $args, $url ) {
				return array_merge(
					$args,
					array(
						'timeout' => 27, // modify default timeout.
						'body'    => $url, // add new and allow to assert on $url arg passed.
					)
				);
			},
			10,
			2
		);

		$request = new WP_REST_Request( 'GET', static::$route );
		$request->set_query_params(
			array(
				'url' => static::$url_placeholder,
			)
		);

		rest_get_server()->dispatch( $request );

		// Check the args were filtered as expected.
		$this->assertArraySubset(
			array(
				'timeout'             => 27,
				'limit_response_size' => 153600,
				'body'                => static::$url_placeholder,
			),
			static::$request_args
		);

		remove_all_filters( 'rest_url_details_http_request_args' );
	}

	public function test_will_return_from_cache_if_populated() {
		$transient_name = 'g_url_details_response_' . md5( static::$url_placeholder );

		remove_filter(
			"pre_transient_$transient_name",
			'__return_null'
		);

		// Force cache to return a known value as the remote URL http response body.
		add_filter(
			"pre_transient_$transient_name",
			function() {
				return '<html><head><title>This value from cache.</title></head><body></body></html>';
			}
		);

		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'GET', static::$route );
		$request->set_query_params(
			array(
				'url' => static::$url_placeholder,
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		// Data should be that from cache not from mocked network response.
		$this->assertContains(
			'This value from cache',
			$data['title']
		);

		remove_all_filters(
			"pre_transient_$transient_name"
		);
	}

	public function test_allows_filtering_data_retrieved_for_a_given_url() {

		add_filter(
			'rest_prepare_url_details',
			function( $response ) {

				$data = $response->get_data();

				$response->set_data(
					array_merge(
						$data,
						array(
							'og_title' => 'This was manually added to the data via filter',
						)
					)
				);

				return $response;

			}
		);

		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'GET', static::$route );
		$request->set_query_params(
			array(
				'url' => static::$url_placeholder,
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		// Instead of the default data retrieved we expect to see the modified
		// data we provided via the filter.
		$this->assertArraySubset(
			array(
				'title'    => 'Example Website &mdash; - with encoded content.',
				'og_title' => 'This was manually added to the data via filter',
			),
			$data
		);

		remove_all_filters(
			'rest_prepare_url_details'
		);
	}




	public function test_allows_filtering_response() {

		// Filter the response to known set of values changing only
		// based on whether the response came from the cache or not.
		add_filter(
			'rest_prepare_url_details',
			function( $response, $url ) {
				return new WP_REST_Response(
					array(
						'status'        => 418,
						'response'      => "Response for URL $url altered via rest_prepare_url_details filter",
						'body_response' => array(),
					)
				);
			},
			10,
			3
		);

		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'GET', static::$route );
		$request->set_query_params(
			array(
				'url' => static::$url_placeholder,
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$data = $response->get_data();

		$this->assertEquals(
			'418',
			$data['status']
		);

		$this->assertEquals(
			'Response for URL https://placeholder-site.com altered via rest_prepare_url_details filter',
			$data['response']
		);

		remove_all_filters(
			'rest_prepare_url_details'
		);
	}



	public function test_get_item() {
	}

	public function test_create_item() {

	}

	public function test_update_item() {

	}

	public function test_delete_item() {

	}

	public function test_prepare_item() {

	}

	public function test_get_item_schema() {
		wp_set_current_user( self::$admin_id );

		$request  = new WP_REST_Request( 'OPTIONS', static::$route );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$endpoint = $data['endpoints'][0];

		$this->assertArrayHasKey( 'url', $endpoint['args'] );
		$this->assertArraySubset(
			array(
				'type'     => 'string',
				'required' => true,
				'format'   => 'uri',
			),
			$endpoint['args']['url']
		);
	}

	/**
	 * @dataProvider provide_get_title_data
	 */
	public function test_get_title( $html, $expected ) {
		$controller = new WP_REST_URL_Details_Controller();
		$method     = $this->get_reflective_method( 'get_title' );

		$actual = $method->invoke(
			$controller,
			$this->wrap_html_in_doc( $html )
		);
		$this->assertSame( $expected, $actual );
	}


	public function provide_get_title_data() {
		return array(
			'no attributes'                  => array(
				'<title>Testing &lt;title&gt;:</title>',
				'Testing &lt;title&gt;:',
			),
			'with attributes'                => array(
				'<title data-test-title-attr-one="test" data-test-title-attr-two="test2">Testing &lt;title&gt;:</title>',
				'Testing &lt;title&gt;:',
			),
			'with text whitespace'           => array(
				'<title data-test-title-attr-one="test" data-test-title-attr-two="test2">   Testing &lt;title&gt;:	</title>',
				'Testing &lt;title&gt;:',
			),
			'when opening tag is malformed'  => array(
				'< title>Testing &lt;title&gt;: when opening tag is invalid</title>',
				'',
			),
			'with whitespace in opening tag' => array(
				'<title >Testing &lt;title&gt;: with whitespace in opening tag</title>',
				'Testing &lt;title&gt;: with whitespace in opening tag',
			),
			'when whitepace in closing tag'  => array(
				'<title>Testing &lt;title&gt;: with whitespace in closing tag</ title>',
				'Testing &lt;title&gt;: with whitespace in closing tag',
			),
		);
	}

	/**
	 * @dataProvider data_get_icon
	 */
	public function test_get_icon( $html, $expected, $target_url = 'https://wordpress.org' ) {
		$controller = new WP_REST_URL_Details_Controller();
		$method     = $this->get_reflective_method( 'get_icon' );

		$actual = $method->invoke(
			$controller,
			$this->wrap_html_in_doc( $html ),
			$target_url
		);
		$this->assertSame( $expected, $actual );
	}

	public function data_get_icon() {
		return array(

			// Happy path for default.
			'default'                               => array(
				'<link rel="shortcut icon" href="https://wordpress.org/favicon.ico" />',
				'https://wordpress.org/favicon.ico',
			),
			'default with no closing whitespace'    => array(
				'<link rel="shortcut icon" href="https://wordpress.org/favicon.ico"/>',
				'https://wordpress.org/favicon.ico',
			),
			'default without self-closing'          => array(
				'<link rel="shortcut icon" href="https://wordpress.org/favicon.ico">',
				'https://wordpress.org/favicon.ico',
			),
			'default with href first'               => array(
				'<link href="https://wordpress.org/favicon.ico" rel="shortcut icon" />',
				'https://wordpress.org/favicon.ico',
			),
			'default with type last'                => array(
				'<link href="https://wordpress.org/favicon.png" rel="icon" type="image/png" />',
				'https://wordpress.org/favicon.png',
			),
			'default with type first'               => array(
				'<link type="image/png" href="https://wordpress.org/favicon.png" rel="icon" />',
				'https://wordpress.org/favicon.png',
			),
			'default with single quotes'            => array(
				'<link type="image/png" href=\'https://wordpress.org/favicon.png\' rel=\'icon\' />',
				'https://wordpress.org/favicon.png',
			),

			// Happy paths.
			'with query string'                     => array(
				'<link rel="shortcut icon" href="https://wordpress.org/favicon.ico?somequerystring=foo&another=bar" />',
				'https://wordpress.org/favicon.ico?somequerystring=foo&another=bar',
			),
			'with another link'                     => array(
				'<link rel="shortcut icon" href="https://wordpress.org/favicon.ico" /><link rel="canonical" href="https://example.com">',
				'https://wordpress.org/favicon.ico',
			),
			'with multiple links'                   => array(
				'<link rel="manifest" href="/manifest.56b1cedc.json">
				<link rel="shortcut icon" href="https://wordpress.org/favicon.ico" />
				<link rel="canonical" href="https://example.com">',
				'https://wordpress.org/favicon.ico',
			),
			'relative url'                          => array(
				'<link rel="shortcut icon" href="/favicon.ico" />',
				'https://wordpress.org/favicon.ico',
			),
			'relative url no slash'                 => array(
				'<link rel="shortcut icon" href="favicon.ico" />',
				'https://wordpress.org/favicon.ico',
			),
			'relative url with path'                => array(
				'<link rel="shortcut icon" href="favicon.ico" />',
				'https://wordpress.org/favicon.ico',
				'https://wordpress.org/my/path/here/',
			),
			'rel reverse order'                     => array(
				'<link rel="icon shortcut" href="https://wordpress.org/favicon.ico" />',
				'https://wordpress.org/favicon.ico',
			),
			'rel icon only'                         => array(
				'<link rel="icon" href="https://wordpress.org/favicon.ico" />',
				'https://wordpress.org/favicon.ico',
			),
			'rel icon only with whitespace'         => array(
				'<link rel=" icon " href="https://wordpress.org/favicon.ico" />',
				'https://wordpress.org/favicon.ico',
			),
			'multiline attributes'                  => array(
				'<link
					rel="icon"
					href="https://wordpress.org/favicon.ico" 
				/>',
				'https://wordpress.org/favicon.ico',
			),
			'multiline attributes in reverse order' => array(
				'<link
					rel="icon"
					href="https://wordpress.org/favicon.ico" 
				/>',
				'https://wordpress.org/favicon.ico',
			),
			'multiline attributes with type'        => array(
				'<link
					rel="icon"
					href="https://wordpress.org/favicon.ico"
					type="image/x-icon"
				/>',
				'https://wordpress.org/favicon.ico',
			),
			'multiline with type first'             => array(
				'<link
					type="image/x-icon"
					rel="icon"
					href="https://wordpress.org/favicon.ico"
				/>',
				'https://wordpress.org/favicon.ico',
			),

			// Unhappy paths.
			'empty rel'                             => array(
				'<link rel="" href="https://wordpress.org/favicon.ico" />',
				'',
			),
			'empty href'                            => array(
				'<link rel="icon" href="" />',
				'',
			),
			'no rel'                                => array(
				'<link href="https://wordpress.org/favicon.ico" />',
				'',
			),
			'link to external stylesheet'           => array(
				'<link rel="stylesheet" href="https://example.com/assets/style.css" />',
				'',
				'https://example.com',
			),
			'multiline with no href'                => array(
				'<link
					rel="icon"
					href="" 
				/>',
				'',
			),
			'multiline with no rel'                 => array(
				'<link
					rel=""
					href="https://wordpress.org/favicon.ico"
				/>',
				'',
			),
		);
	}

	/**
	 * @dataProvider data_get_description
	 */
	public function test_get_description( $html, $expected ) {
		$controller = new WP_REST_URL_Details_Controller();

		// Parse the meta elements from the given HTML.
		$method        = $this->get_reflective_method( 'get_meta_with_content_elements' );
		$meta_elements = $method->invoke(
			$controller,
			$this->wrap_html_in_doc( $html )
		);

		$method = $this->get_reflective_method( 'get_description' );
		$actual = $method->invoke( $controller, $meta_elements );
		$this->assertSame( $expected, $actual );
	}

	public function data_get_description() {
		return array(

			// Happy paths.
			'default'                                    => array(
				'<meta name="description" content="This is a description.">',
				'This is a description.',
			),
			'with whitespace'                            => array(
				'<meta  name=" description "   content=" This is a description.  "   >',
				'This is a description.',
			),
			'with self-closing'                          => array(
				'<meta name="description" content="This is a description."/>',
				'This is a description.',
			),
			'with self-closing and whitespace'           => array(
				'<meta  name=" description "   content=" This is a description.  "   />',
				'This is a description.',
			),
			'with content first'                         => array(
				'<meta content="Content is first" name="description">',
				'Content is first',
			),
			'with single quotes'                         => array(
				'<meta name=\'description\' content=\'with single quotes\'>',
				'with single quotes',
			),
			'with another element'                       => array(
				'<meta name="description" content="This is a description."><meta name="viewport" content="width=device-width, initial-scale=1">',
				'This is a description.',
			),
			'with multiple elements'                     => array(
				'<meta property="og:image" content="https://wordpress.org/images/myimage.jpg" />
				<link rel="stylesheet" href="https://example.com/assets/style.css" />
				<meta name="description" content="This is a description.">
				<meta name="viewport" content="width=device-width, initial-scale=1">',
				'This is a description.',
			),
			'with other attributes'                      => array(
				'<meta first="first" name="description" third="third" content="description with other attributes" fifth="fifth">',
				'description with other attributes',
			),

			// Happy paths with multiline attributes.
			'with multiline attributes'                  => array(
				'<meta
					name="description" 
					content="with multiline attributes"
				>',
				'with multiline attributes',
			),
			'with multiline attributes in reverse order' => array(
				'<meta 
					content="with multiline attributes in reverse order"
					name="description"
				>',
				'with multiline attributes in reverse order',
			),
			'with multiline attributes and another element' => array(
				'<meta 
					name="description" 
					content="with multiline attributes"
				>
				<meta name="viewport" content="width=device-width, initial-scale=1">',
				'with multiline attributes',
			),
			'with multiline and other attributes'        => array(
				'<meta 
					first="first" 
					name="description" 
					third="third" 
					content="description with multiline and other attributes" 
					fifth="fifth"
				>',
				'description with multiline and other attributes',
			),

			// Happy paths with HTML tags or entities in the description.
			'with HTML tags'                             => array(
				'<meta name="description" content="<strong>Description</strong>: has <em>HTML</em> tags">',
				'<strong>Description</strong>: has <em>HTML</em> tags',
			),
			'with content first and HTML tags'           => array(
				'<meta content="<strong>Description</strong>: has <em>HTML</em> tags" name="description">',
				'<strong>Description</strong>: has <em>HTML</em> tags',
			),
			'with HTML tags and other attributes'        => array(
				'<meta first="first" name="description" third="third" content="<strong>Description</strong>: has <em>HTML</em> tags" fifth="fifth>',
				'<strong>Description</strong>: has <em>HTML</em> tags',
			),
			'with HTML entities'                         => array(
				'<meta name="description" content="The &lt;strong&gt;description&lt;/strong&gt; meta &amp; its attribute value"',
				'The <strong>description</strong> meta & its attribute value',
			),

			// Unhappy paths.
			'with empty content'                         => array(
				'<meta name="description" content="">',
				'',
			),
			'with empty name'                            => array(
				'<meta name="" content="name is empty">',
				'',
			),
			'without a name attribute'                   => array(
				'<meta content="without a name attribute">',
				'',
			),
			'without a content attribute'                => array(
				'<meta name="description">',
				'',
			),
		);
	}

	/**
	 * @dataProvider data_get_image
	 */
	public function test_get_image( $html, $expected, $target_url = 'https://wordpress.org' ) {
		$controller = new WP_REST_URL_Details_Controller();

		// Parse the meta elements from the given HTML.
		$method        = $this->get_reflective_method( 'get_meta_with_content_elements' );
		$meta_elements = $method->invoke(
			$controller,
			$this->wrap_html_in_doc( $html )
		);

		$method = $this->get_reflective_method( 'get_image' );
		$actual = $method->invoke( $controller, $meta_elements, $target_url );
		$this->assertEquals( $expected, $actual );
	}

	public function data_get_image() {
		return array(

			// Happy paths.
			'default'                                      => array(
				'<meta property="og:image" content="https://wordpress.org/images/myimage.jpg">',
				'https://wordpress.org/images/myimage.jpg',
			),
			'with whitespace'                              => array(
				'<meta  property=" og:image "   content="  https://wordpress.org/images/myimage.jpg "  >',
				'https://wordpress.org/images/myimage.jpg',
			),
			'with self-closing'                            => array(
				'<meta property="og:image" content="https://wordpress.org/images/myimage.jpg"/>',
				'https://wordpress.org/images/myimage.jpg',
			),
			'with self-closing and whitespace'             => array(
				'<meta  property=" og:image "   content="  https://wordpress.org/images/myimage.jpg "  />',
				'https://wordpress.org/images/myimage.jpg',
			),
			'with single quotes'                           => array(
				"<meta property='og:image' content='https://wordpress.org/images/myimage.jpg'>",
				'https://wordpress.org/images/myimage.jpg',
			),
			'without quotes'                               => array(
				'<meta property=og:image content="https://wordpress.org/images/myimage.jpg">',
				'https://wordpress.org/images/myimage.jpg',
			),
			'with url modifier'                            => array(
				'<meta property="og:image:url" content="https://wordpress.org/images/url-modifier.jpg" />
				<meta property="og:image" content="https://wordpress.org/images/myimage.jpg">',
				'https://wordpress.org/images/url-modifier.jpg',
			),
			'with query string'                            => array(
				'<meta property="og:image" content="https://wordpress.org/images/withquerystring.jpg?foo=bar&bar=foo" />',
				'https://wordpress.org/images/withquerystring.jpg?foo=bar&bar=foo',
			),

			// Happy paths with changing attributes order or adding attributes.
			'with content first'                           => array(
				'<meta content="https://wordpress.org/images/myimage.jpg" property="og:image">',
				'https://wordpress.org/images/myimage.jpg',
			),
			'with other attributes'                        => array(
				'<meta first="first" property="og:image" third="third" content="https://wordpress.org/images/myimage.jpg" fifth="fifth">',
				'https://wordpress.org/images/myimage.jpg',
			),
			'with other og meta'                           => array(
				'<meta property="og:image:height" content="720" />
				<meta property="og:image:alt" content="Ignore this please" />
				<meta property="og:image" content="https://wordpress.org/images/myimage.jpg" />
				<link rel="stylesheet" href="https://example.com/assets/style.css" />',
				'https://wordpress.org/images/myimage.jpg',
			),

			// Happy paths with relative url.
			'with relative url'                            => array(
				'<meta property="og:image" content="/images/myimage.jpg" />',
				'https://wordpress.org/images/myimage.jpg',
			),
			'with relative url without starting slash'     => array(
				'<meta property="og:image" content="images/myimage.jpg" />',
				'https://wordpress.org/images/myimage.jpg',
			),
			'with relative url and path'                   => array(
				'<meta property="og:image" content="images/myimage.jpg" />',
				'https://wordpress.org/images/myimage.jpg',
				'https://wordpress.org/my/path/here/',
			),

			// Happy paths with multiline attributes.
			'with multiline attributes'                    => array(
				'<meta
					property="og:image"
					content="https://wordpress.org/images/myimage.jpg"
				>',
				'https://wordpress.org/images/myimage.jpg',
			),
			'with multiline attributes in reverse order'   => array(
				'<meta 
					content="https://wordpress.org/images/myimage.jpg"
					property="og:image"
				>',
				'https://wordpress.org/images/myimage.jpg',
			),
			'with multiline attributes and other elements' => array(
				'<meta 
					property="og:image:height" 
					content="720" 
				/>
				<meta 
					property="og:image:alt" 
					content="Ignore this please" 
				/>
				<meta 
					property="og:image"
					content="https://wordpress.org/images/myimage.jpg"
				>
				<link rel="stylesheet" href="https://example.com/assets/style.css" />',
				'https://wordpress.org/images/myimage.jpg',
			),
			'with multiline and other attributes'          => array(
				'<meta 
					first="first" 
					property="og:image:url" 
					third="third" 
					content="https://wordpress.org/images/myimage.jpg"
					fifth="fifth"
				>',
				'https://wordpress.org/images/myimage.jpg',
			),

			// Happy paths with HTML tags in the content.
			'with other og meta'                           => array(
				'<meta property="og:image:height" content="720" />
				<meta property="og:image:alt" content="<em>ignore this please</em>" />
				<meta property="og:image" content="https://wordpress.org/images/myimage.jpg" />
				<link rel="stylesheet" href="https://example.com/assets/style.css" />',
				'https://wordpress.org/images/myimage.jpg',
			),

			// Unhappy paths.
			'with empty content'                           => array(
				'<meta property="og:image" content="">',
				'',
			),
			'without a property attribute'                 => array(
				'<meta content="https://wordpress.org/images/myimage.jpg">',
				'',
			),
			'without a content attribute empty property'   => array(
				'<meta property="og:image" href="https://wordpress.org/images/myimage.jpg">',
				'',
			),
		);
	}





	public function provide_invalid_url_data() {
		return array(
			'empty_url'          => array(
				null,
				'',
			), // empty!
			'not_a_string'       => array(
				null,
				1234456,
			),
			'string_but_invalid' => array(
				null,
				'invalid.proto://wordpress.org',
			),
		);
	}

	public function provide_response_is_from_cache() {
		return array(
			'uncached_response' => array(
				null,
				false,
			), // empty!
			'cached_response'   => array(
				null,
				true,
			),
		);
	}



	/**
	 * Mocks the HTTP response for the the `wp_safe_remote_get()` which
	 * would otherwise make a call to a real website.
	 *
	 * @return array faux/mocked response.
	 */
	public function mock_success_request_to_remote_url( $response, $args ) {
		return $this->mock_request_to_remote_url( 'success', $args );
	}

	public function mock_failed_request_to_remote_url( $response, $args ) {
		return $this->mock_request_to_remote_url( 'failure', $args );
	}

	public function mock_request_to_remote_url_with_empty_body_response( $response, $args ) {
		return $this->mock_request_to_remote_url( 'empty_body', $args );
	}

	private function mock_request_to_remote_url( $result_type = 'success', $args ) {

		static::$request_args = $args;

		$types = array(
			'success',
			'failure',
			'empty_body',
		);

		// Default to success.
		if ( ! in_array( $result_type, $types, true ) ) {
			$result_type = $types[0];
		}

		// Both should return 200 for the HTTP response.
		$should_200 = 'success' === $result_type || 'empty_body' === $result_type;

		return array(
			'headers'     => array(),
			'cookies'     => array(),
			'filename'    => null,
			'response'    => array( 'code' => ( $should_200 ? 200 : 404 ) ),
			'status_code' => $should_200 ? 200 : 404,
			'success'     => $should_200 ? 1 : 0,
			'body'        => 'success' === $result_type ? file_get_contents( __DIR__ . '/fixtures/example-website.html' ) : '',
		);
	}

	private function wrap_html_in_doc( $html, $with_body = false ) {
		$doc = '<!DOCTYPE html>
				<html xmlns="http://www.w3.org/1999/xhtml" dir="ltr" lang="en-US">
				<head>
				<meta charset="utf-8" />' . $html . "\n" . '</head>';

		if ( $with_body ) {
			$doc .= '
				<body>
					<h1>Example Website</h1>
					<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
				</body>
			</html>';
		}

		return $doc;
	}

	/**
	 * Get reflective access to a private/protected method on
	 * the WP_REST_URL_Details_Controller class.
	 *
	 * @param string $method_name Method name for which to gain access.
	 *
	 * @return ReflectionMethod
	 * @throws ReflectionException Throws an exception if method does not exist.
	 */
	protected function get_reflective_method( $method_name ) {
		$class  = new ReflectionClass( WP_REST_URL_Details_Controller::class );
		$method = $class->getMethod( $method_name );
		$method->setAccessible( true );
		return $method;
	}
}
