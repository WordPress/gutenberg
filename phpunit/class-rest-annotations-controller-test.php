<?php
/**
 * WP_REST_Annotations_Controller tests
 *
 * @package gutenberg
 */

/**
 * Tests for WP_REST_Annotations_Controller.
 */
class REST_Annotations_Controller_Test extends WP_Test_REST_Controller_Testcase {
	/**
	 * Fake user IDs.
	 *
	 * @var int[]
	 */
	protected static $user_id = array();

	/**
	 * Fake post IDs.
	 *
	 * @var int[]
	 */
	protected static $post_id = array();

	/**
	 * Fake annotation IDs.
	 *
	 * @var int[]
	 */
	protected static $anno_id = array();

	/**
	 * Roles used in test data.
	 *
	 * @var int[]
	 */
	protected static $roles = array(
		'administrator',
		'editor',
		'author',
		'contributor',
		'subscriber',
	);

	/**
	 * REST base URL for tests.
	 *
	 * @var int[]
	 */
	protected static $rest_ns_base = '/wp/v2/annotations';

	/**
	 * Create fake data before tests run.
	 *
	 * @param WP_UnitTest_Factory $factory Helper that creates fake data.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		/*
		 * A user for each role.
		 * 	 - self::$user_id['{role}']
		 *
		 * A post with 'publish' and 'draft' status for each user.
		 *   - self::$post_id['post_by_{role}']
		 *   - self::$post_id['draft_by_{role}']
		 *
		 * A front-end annotation by each user, in each post.
		 *   - self::$anno_id['{role}:in_post_by_{role}']
		 *
		 * ... plus front-end annotation replies.
		 *   - self::$anno_id['{role}:_reply_in_post_by_{role}']
		 *   - self::$anno_id['{role}:__reply_in_post_by_{role}']
		 *
		 * A back-end annotation by each user, in each post.
		 *   - self::$anno_id['{role}:in_post_backend_by_{role}']
		 *   - self::$anno_id['{role}:in_draft_backend_by_{role}']
		 *
		 * ... plus back-end annotation replies.
		 *   - self::$anno_id['{role}:_reply_in_post_backend_by_{role}']
		 *   - self::$anno_id['{role}:__reply_in_post_backend_by_{role}']
		 *   - self::$anno_id['{role}:_reply_in_draft_backend_by_{role}']
		 *   - self::$anno_id['{role}:__reply_in_draft_backend_by_{role}']
		 */

		foreach ( self::$roles as $r ) {
			self::$user_id[ $r ] = $factory->user->create( array( 'role' => $r ) );

			self::$post_id[ "post_by_{$r}" ] = $factory->post->create( array(
				'post_author'    => self::$user_id[ $r ],
				'post_type'      => 'post',
				'post_status'    => 'publish',
				'comment_status' => 'open',
				'post_title'     => 'Post by ' . $r,
				'post_content'   => '<p><strong>bold</strong> <em>italic</em> test post.</p>',
			) );

			self::$post_id[ "draft_by_{$r}" ] = $factory->post->create( array(
				'post_author'    => self::$user_id[ $r ],
				'post_type'      => 'post',
				'post_status'    => 'draft',
				'comment_status' => 'open',
				'post_title'     => 'Draft by ' . $r,
				'post_content'   => '<p><strong>bold</strong> <em>italic</em> test draft.</p>',
			) );
		}

		foreach ( self::$roles as $r ) {
			foreach ( self::$roles as $_r ) {
				foreach ( array(
					'annotation'       => array(
						'in_post_by' => self::$post_id[ "post_by_{$r}" ],
					),
					'admin_annotation' => array(
						'in_post_backend_by'  => self::$post_id[ "post_by_{$r}" ],
						'in_draft_backend_by' => self::$post_id[ "draft_by_{$r}" ],
					),
				) as $_comment_type => $_post_key_ids ) {
					foreach ( $_post_key_ids as $k => $_post_id ) {
						$_common_annotation_data = array(
							'user_id'          => self::$user_id[ $_r ],
							'comment_post_ID'  => $_post_id,
							'comment_type'     => $_comment_type,
							'comment_approved' => '1',
						);
						$_common_annotation_meta = array(
							'_via'      => 'gutenberg',
							'_selector' => array(
								'type'  => 'CssSelector',
								'value' => '#foo',
							),
						);

						self::$anno_id[ "{$_r}:{$k}_{$r}" ] = $factory->comment->create(
							array_merge( $_common_annotation_data, array(
								'comment_parent'  => 0,
								'comment_content' => '<p><strong>bold</strong> <em>italic</em> test annotation.</p>',
								'comment_meta'    => $_common_annotation_meta,
							) )
						);

						self::$anno_id[ "{$_r}:_reply_{$k}_{$r}" ] = $factory->comment->create(
							array_merge( $_common_annotation_data, array(
								'comment_parent'  => self::$anno_id[ "{$_r}:{$k}_{$r}" ],
								'comment_content' => '<p><strong>bold</strong> <em>italic</em> test annotation reply.</p>',
								'comment_meta'    => $_common_annotation_meta,
							) )
						);

						self::$anno_id[ "{$_r}:__reply_{$k}_{$r}" ] = $factory->comment->create(
							array_merge( $_common_annotation_data, array(
								'comment_parent'  => self::$anno_id[ "{$_r}:_reply_{$k}_{$r}" ],
								'comment_content' => '<p><strong>bold</strong> <em>italic</em> test annotation reply to reply.</p>',
								'comment_meta'    => $_common_annotation_meta,
							) )
						);
					}
				}
			}
		}
	}

	/**
	 * Delete fake data after our tests run.
	 */
	public static function wpTearDownAfterClass() {
		foreach ( self::$roles as $r ) {
			wp_delete_post( self::$post_id[ "post_by_{$r}" ], true );
			wp_delete_post( self::$post_id[ "draft_by_{$r}" ], true );

			foreach ( self::$roles as $_r ) {
				foreach ( array( 'in_post_by', 'in_post_backend_by', 'in_draft_backend_by' ) as $k ) {
					wp_delete_comment( self::$anno_id[ "{$_r}:{$k}_{$r}" ], true );
					wp_delete_comment( self::$anno_id[ "{$_r}:_reply_{$k}_{$r}" ], true );
					wp_delete_comment( self::$anno_id[ "{$_r}:__reply_{$k}_{$r}" ], true );
				}
			}
			self::delete_user( self::$user_id[ $r ] );
		}
	}

	/**
	 * On setup.
	 */
	public function setUp() {
		parent::setUp();

		add_filter( 'rest_allow_anonymous_comments', '__return_true' );
		add_filter( 'annotation_allow_types', array( $this, 'allowTypes' ) );
		remove_action( 'check_comment_flood', 'check_comment_flood_db', 10, 4 );
	}

	/**
	 * On teardown.
	 */
	public function tearDown() {
		remove_filter( 'rest_allow_anonymous_comments', '__return_true' );
		remove_filter( 'annotation_allow_types', array( $this, 'allowTypes' ) );
		add_action( 'check_comment_flood', 'check_comment_flood_db', 10, 4 );

		parent::tearDown();
	}

	/**
	 * Allows all of the annotation comment types being tested here.
	 *
	 * @return array Allowed annotation comment types.
	 */
	public function allowTypes() {
		return array( 'annotation', 'admin_annotation' );
	}

	/*
	 * Basic tests.
	 */

	/**
	 * Check that our routes got registered properly.
	 */
	public function test_register_routes() {
		$routes = $this->server->get_routes();

		$this->assertArrayHasKey( self::$rest_ns_base, $routes );
		$this->assertCount( 2, $routes[ self::$rest_ns_base ] );

		$this->assertArrayHasKey( self::$rest_ns_base . '/(?P<id>[\d]+)', $routes );
		$this->assertCount( 3, $routes[ self::$rest_ns_base . '/(?P<id>[\d]+)' ] );
	}

	/**
	 * Check that we've defined a JSON schema properly.
	 */
	public function test_get_item_schema() {
		$request = new WP_REST_Request( 'OPTIONS', self::$rest_ns_base );

		$response   = $this->server->dispatch( $request );
		$status     = $response->get_status();
		$data       = $response->get_data();
		$properties = $data['schema']['properties'];

		$this->assertArrayHasKey( 'id', $properties );
		$this->assertArrayHasKey( 'author', $properties );
		$this->assertArrayHasKey( 'author_avatar_urls', $properties );
		$this->assertArrayHasKey( 'author_email', $properties );
		$this->assertArrayHasKey( 'author_ip', $properties );
		$this->assertArrayHasKey( 'author_name', $properties );
		$this->assertArrayHasKey( 'author_url', $properties );
		$this->assertArrayHasKey( 'author_user_agent', $properties );
		$this->assertArrayHasKey( 'content', $properties );
		$this->assertArrayHasKey( 'date', $properties );
		$this->assertArrayHasKey( 'date_gmt', $properties );
		$this->assertArrayHasKey( 'link', $properties );
		$this->assertArrayHasKey( 'meta', $properties );
		$this->assertArrayHasKey( 'parent', $properties );
		$this->assertArrayHasKey( 'post', $properties );
		$this->assertArrayHasKey( 'status', $properties );
		$this->assertArrayHasKey( 'type', $properties );

		$this->assertArrayHasKey( 'via', $properties );
		$this->assertArrayHasKey( 'selector', $properties );
		$this->assertArrayHasKey( 'children', $properties );

		$this->assertSame( 17 + 3, count( $properties ) );
	}

	/**
	 * Check that our endpoints support the context param.
	 */
	public function test_context_param() {
		wp_set_current_user( self::$user_id['editor'] );

		$request = new WP_REST_Request( 'OPTIONS', self::$rest_ns_base );

		$response = $this->server->dispatch( $request );
		$status   = $response->get_status();
		$data     = $response->get_data();

		$this->assertSame( 'view', $data['endpoints'][0]['args']['context']['default'] );
		$this->assertSame( array( 'view', 'embed', 'edit' ), $data['endpoints'][0]['args']['context']['enum'] );

		$request = new WP_REST_Request( 'OPTIONS', self::$rest_ns_base . '/' . self::$anno_id['editor:in_post_by_editor'] );

		$response = $this->server->dispatch( $request );
		$status   = $response->get_status();
		$data     = $response->get_data();

		$this->assertSame( 'view', $data['endpoints'][0]['args']['context']['default'] );
		$this->assertSame( array( 'view', 'embed', 'edit' ), $data['endpoints'][0]['args']['context']['enum'] );
	}

	/*
	 * Collection tests.
	 */

	/**
	 * Check that we can GET a collection of annotations.
	 */
	public function test_get_items() {
		wp_set_current_user( self::$user_id['editor'] );

		foreach ( array( null, 'annotation', 'admin_annotation' ) as $type ) {
			$request = new WP_REST_Request( 'GET', self::$rest_ns_base );

			$request->set_param( 'post', self::$post_id['post_by_editor'] );
			if ( isset( $type ) ) {
				$request->set_param( 'type', $type );
			}
			$request->set_param( 'per_page', 100 );

			$response = $this->server->dispatch( $request );
			$status   = $response->get_status();
			$data     = $response->get_data();

			$this->assertSame( 200, $status );
			$this->assertSame( 15, count( $data ) );
			$this->check_collection( $response, 'view' );
		}
	}

	/**
	 * Check that we can GET a collection of front and back-end annotations that exist in
	 * multiple post IDs specified the 'post' collection param.
	 */
	public function test_get_multiple_post_items() {
		wp_set_current_user( self::$user_id['editor'] );

		foreach ( array( null, 'annotation', 'admin_annotation' ) as $type ) {
			$request = new WP_REST_Request( 'GET', self::$rest_ns_base );

			$request->set_param( 'post', array(
				self::$post_id['post_by_editor'],
				self::$post_id['post_by_author'],
				self::$post_id['post_by_contributor'],
			) );
			if ( isset( $type ) ) {
				$request->set_param( 'type', $type );
			}
			$request->set_param( 'per_page', 100 );

			$response = $this->server->dispatch( $request );
			$status   = $response->get_status();
			$data     = $response->get_data();

			$this->assertSame( 200, $status );
			$this->assertSame( 45, count( $data ) );
			$this->check_collection( $response, 'view' );
		}
	}

	/**
	 * Check that we can GET a collection of front and back-end annotations with specific
	 * post IDs and also with specific parent annotation IDs.
	 */
	public function test_get_multiple_post_parent_items() {
		wp_set_current_user( self::$user_id['editor'] );

		foreach ( array(
			''                 => array(
				self::$anno_id['editor:in_post_by_editor'],
				self::$anno_id['author:in_post_by_author'],
				self::$anno_id['contributor:in_post_by_contributor'],
			),
			'annotation'       => array(
				self::$anno_id['editor:in_post_by_editor'],
				self::$anno_id['author:in_post_by_author'],
				self::$anno_id['contributor:in_post_by_contributor'],
			),
			'admin_annotation' => array(
				self::$anno_id['editor:in_post_backend_by_editor'],
				self::$anno_id['author:in_post_backend_by_author'],
				self::$anno_id['contributor:in_post_backend_by_contributor'],
			),
		) as $type => $parent_ids ) {
			$request = new WP_REST_Request( 'GET', self::$rest_ns_base );

			$request->set_param( 'post', array(
				self::$post_id['post_by_editor'],
				self::$post_id['post_by_author'],
				self::$post_id['post_by_contributor'],
			) );
			if ( $type ) {
				$request->set_param( 'type', $type );
			}
			$request->set_param( 'parent', $parent_ids );
			$request->set_param( 'per_page', 100 );

			$response = $this->server->dispatch( $request );
			$status   = $response->get_status();
			$data     = $response->get_data();

			$this->assertSame( 200, $status );
			$this->assertSame( 3, count( $data ) );
			$this->check_collection( $response, 'view' );
		}
	}

	/**
	 * Check that a collection of front and back-end annotations are flat by default.
	 */
	public function test_get_flat_items() {
		wp_set_current_user( self::$user_id['editor'] );

		foreach ( array( null, 'annotation', 'admin_annotation' ) as $type ) {
			$request = new WP_REST_Request( 'GET', self::$rest_ns_base );

			$request->set_param( 'post', self::$post_id['post_by_editor'] );
			if ( isset( $type ) ) {
				$request->set_param( 'type', $type );
			}
			$request->set_param( 'parent', array( 0 ) );
			$request->set_param( 'per_page', 100 );

			$response = $this->server->dispatch( $request );
			$status   = $response->get_status();
			$data     = $response->get_data();

			$this->assertSame( 200, $status );
			$this->assertSame( 5, count( $data ) );

			foreach ( $data as $item ) {
				$this->assertArrayNotHasKey( 'children', $item );
			}
			$this->check_collection( $response, 'view' );
		}
	}

	/**
	 * Check that we can GET a collection of front and back-end annotations in
	 * hierarchical=flat format.
	 */
	public function test_get_hierarchical_flat_items() {
		wp_set_current_user( self::$user_id['editor'] );

		foreach ( array( null, 'annotation', 'admin_annotation' ) as $type ) {
			$request = new WP_REST_Request( 'GET', self::$rest_ns_base );

			$request->set_param( 'post', self::$post_id['post_by_editor'] );
			if ( isset( $type ) ) {
				$request->set_param( 'type', $type );
			}
			$request->set_param( 'parent', array( 0 ) );
			$request->set_param( 'hierarchical', 'flat' );
			$request->set_param( 'per_page', 100 );

			$response = $this->server->dispatch( $request );
			$status   = $response->get_status();
			$data     = $response->get_data();

			$this->assertSame( 200, $status );
			$this->assertSame( 15, count( $data ) );

			foreach ( $data as $item ) {
				$this->assertArrayNotHasKey( 'children', $item );
			}
			$this->check_collection( $response, 'view' );
		}
	}

	/**
	 * Check that we can GET a collection of front and back-end annotations in
	 * hierarchical=threaded format.
	 */
	public function test_get_hierarchical_threaded_items() {
		wp_set_current_user( self::$user_id['editor'] );

		foreach ( array( null, 'annotation', 'admin_annotation' ) as $type ) {
			$request = new WP_REST_Request( 'GET', self::$rest_ns_base );

			$request->set_param( 'post', self::$post_id['post_by_editor'] );
			if ( isset( $type ) ) {
				$request->set_param( 'type', $type );
			}
			$request->set_param( 'parent', array( 0 ) );
			$request->set_param( 'hierarchical', 'threaded' );
			$request->set_param( 'per_page', 100 );

			$response = $this->server->dispatch( $request );
			$status   = $response->get_status();
			$data     = $response->get_data();

			$this->assertSame( 200, $status );
			$this->assertSame( 5, count( $data ) );

			foreach ( $data as $level0 ) {
				$this->assertArrayHasKey( 'children', $level0 );
				$this->assertSame( 1, count( $level0['children'] ) );

				foreach ( $level0['children'] as $level1 ) {
					$this->assertArrayHasKey( 'children', $level1 );
					$this->assertSame( 1, count( $level1['children'] ) );

					foreach ( $level1['children'] as $level2 ) {
						$this->assertArrayHasKey( 'children', $level2 );
						$this->assertSame( 0, count( $level2['children'] ) );
					}
				}
			}
			$this->check_collection( $response, 'view' );
		}
	}

	/*
	 * Single item tests.
	 */

	/**
	 * Check that we get a 404 when we try to GET a non-numeric annotation ID.
	 */
	public function test_get_item_not_found() {
		wp_set_current_user( self::$user_id['editor'] );

		$request = new WP_REST_Request( 'GET', self::$rest_ns_base . '/xyz' );

		$response = $this->server->dispatch( $request );
		$status   = $response->get_status();
		$data     = $response->get_data();

		$this->assertSame( 404, $status );
		$this->assertSame( 'rest_no_route', $data['code'] );
	}

	/**
	 * Check that we get a 404 when we try to GET a nonexistent annotation ID.
	 */
	public function test_get_missing_item_not_found() {
		wp_set_current_user( self::$user_id['editor'] );

		$request = new WP_REST_Request( 'GET', self::$rest_ns_base . '/123456789' );

		$response = $this->server->dispatch( $request );
		$status   = $response->get_status();
		$data     = $response->get_data();

		$this->assertSame( 400, $status );
		$this->assertSame( 'rest_missing_annotation', $data['code'] );
	}

	/**
	 * Check that we can GET a single annotation.
	 */
	public function test_get_item() {
		wp_set_current_user( self::$user_id['author'] );

		$request  = new WP_REST_Request(
			'GET',
			self::$rest_ns_base .
			'/' . self::$anno_id['author:in_post_by_author']
		);
		$response = $this->server->dispatch( $request );
		$status   = $response->get_status();
		$data     = $response->get_data();

		$this->assertSame( 200, $status );
		$this->check_data( $data, 'view', $response->get_links() );
	}

	/**
	 * Check that we can GET a single annotation in edit context.
	 */
	public function test_prepare_item() {
		wp_set_current_user( self::$user_id['editor'] );

		$request = new WP_REST_Request(
			'GET',
			self::$rest_ns_base .
			'/' . self::$anno_id['editor:in_post_by_editor']
		);
		$request->set_param( 'context', 'edit' );

		$response = $this->server->dispatch( $request );
		$status   = $response->get_status();
		$data     = $response->get_data();

		$this->assertSame( 200, $status );
		$this->check_data( $data, 'edit', $response->get_links() );
	}

	/**
	 * Check that a user who can edit the posts of others can GET a single annotation by
	 * another user.
	 */
	public function test_get_item_by_other() {
		wp_set_current_user( self::$user_id['editor'] );

		$request = new WP_REST_Request(
			'GET',
			self::$rest_ns_base .
			'/' . self::$anno_id['contributor:in_post_by_contributor']
		);
		$request->set_param( 'context', 'edit' );

		$response = $this->server->dispatch( $request );
		$status   = $response->get_status();
		$data     = $response->get_data();

		$this->assertSame( 200, $status );
		$this->check_data( $data, 'edit', $response->get_links() );
	}

	/**
	 * Check that we can POST a single front and back-end annotation.
	 */
	public function test_create_item() {
		wp_set_current_user( self::$user_id['editor'] );

		foreach ( array( 'annotation', 'admin_annotation' ) as $type ) {
			$request = new WP_REST_Request( 'POST', self::$rest_ns_base );

			$request->set_body_params( array(
				'post'     => self::$post_id['post_by_editor'],
				'type'     => $type,
				'parent'   => 0,
				'status'   => 'approve',
				'author'   => self::$user_id['editor'],
				'content'  => '<p>content</p>',
				'via'      => 'gutenberg',
				'selector' => array(
					'type'  => 'CssSelector',
					'value' => '#foo',
				),
			) );

			$response = $this->server->dispatch( $request );
			$status   = $response->get_status();
			$data     = $response->get_data();

			$this->assertSame( 201, $status );
			$this->check_data( $data, 'edit', $response->get_links() );

			wp_delete_comment( $data['id'], true );
		}
	}

	/**
	 * Check that we can PUT a single annotation.
	 */
	public function test_update_item() {
		wp_set_current_user( self::$user_id['editor'] );

		$request = new WP_REST_Request(
			'PUT',
			self::$rest_ns_base .
			'/' . self::$anno_id['contributor:in_post_by_contributor']
		);
		$request->set_body_params( array(
			'content' => '<p>content</p>',
		) );

		$response = $this->server->dispatch( $request );
		$status   = $response->get_status();
		$data     = $response->get_data();

		$this->assertSame( 200, $status );
		$this->check_data( $data, 'edit', $response->get_links() );
	}

	/**
	 * Test that a user is unable to PUT invalid fields.
	 */
	public function test_update_item_with_invalid_fields() {
		wp_set_current_user( self::$user_id['editor'] );

		$request = new WP_REST_Request(
			'PUT',
			self::$rest_ns_base .
			'/' . self::$anno_id['editor:in_post_by_editor']
		);
		$request->set_body_params( array(
			'content' => '', // Cannot be empty.
		) );

		$response = $this->server->dispatch( $request );
		$status   = $response->get_status();
		$data     = $response->get_data();

		$this->assertSame( 400, $status );
		$this->assertSame( 'rest_comment_content_invalid', $data['code'] );
	}

	/**
	 * Check that we can DELETE a single annotation.
	 */
	public function test_delete_item() {
		wp_set_current_user( self::$user_id['author'] );

		$request = new WP_REST_Request( 'POST', self::$rest_ns_base );

		$request->set_body_params( array(
			'post'     => self::$post_id['post_by_author'],
			'type'     => 'admin_annotation',
			'parent'   => 0,
			'status'   => 'approve',
			'content'  => '<p>content</p>',
			'via'      => null,
			'selector' => null,
		) );

		$response = $this->server->dispatch( $request );
		$status   = $response->get_status();
		$data     = $response->get_data();

		$this->assertSame( 201, $response->get_status() );
		$this->check_data( $data, 'edit', $response->get_links() );

		$request = new WP_REST_Request( 'DELETE', self::$rest_ns_base . '/' . $data['id'] );

		$response = $this->server->dispatch( $request );
		$status   = $response->get_status();
		$data     = $response->get_data();

		$this->assertSame( 200, $status );
	}

	/*
	 * Test user permissions.
	 */

	/**
	 * Check that a post ID is required to list annotations.
	 */
	public function test_get_all_items_deny_permissions() {
		wp_set_current_user( 0 );

		$request = new WP_REST_Request( 'GET', self::$rest_ns_base );

		$response = $this->server->dispatch( $request );
		$status   = $response->get_status();
		$data     = $response->get_data();

		$this->assertSame( 400, $status );
		$this->assertSame( 'rest_missing_annotation_posts', $data['code'] );

		foreach ( self::$roles as $r ) {
			wp_set_current_user( self::$user_id[ $r ] );

			$request = new WP_REST_Request( 'GET', self::$rest_ns_base );

			$response = $this->server->dispatch( $request );
			$status   = $response->get_status();
			$data     = $response->get_data();

			$this->assertSame( 400, $status );
			$this->assertSame( 'rest_missing_annotation_posts', $data['code'] );
		}
	}

	/**
	 * Check that a valid post ID is required to list annotations.
	 */
	public function test_invalid_post_deny_permissions() {
		foreach ( array( null, 'annotation', 'admin_annotation' ) as $type ) {
			foreach ( array( 'administrator', 'editor' ) as $r ) {
				wp_set_current_user( self::$user_id[ $r ] );

				$request = new WP_REST_Request( 'GET', self::$rest_ns_base );

				$request->set_param( 'post', 0 );
				if ( isset( $type ) ) {
					$request->set_param( 'type', $type );
				}

				$response = $this->server->dispatch( $request );
				$status   = $response->get_status();
				$data     = $response->get_data();

				$this->assertSame( 400, $status );
				$this->assertSame( 'rest_missing_annotations_post', $data['code'] );
			}
		}

		foreach ( array( null, 'annotation', 'admin_annotation' ) as $type ) {
			foreach ( array( 'administrator', 'editor' ) as $r ) {
				wp_set_current_user( self::$user_id[ $r ] );

				$request = new WP_REST_Request( 'GET', self::$rest_ns_base );

				$request->set_param( 'post', 123456789 );
				if ( isset( $type ) ) {
					$request->set_param( 'type', $type );
				}

				$response = $this->server->dispatch( $request );
				$status   = $response->get_status();
				$data     = $response->get_data();

				$this->assertSame( rest_authorization_required_code(), $status );
				$this->assertSame( 'rest_cannot_read_annotations_post', $data['code'] );
			}
		}
	}

	/**
	 * Check that anonymous users can't GET a single back-end annotation, but they can
	 * gain read access to any single public front-end annotation.
	 */
	public function test_anonymous_get_item_allow_deny_permissions() {
		wp_set_current_user( 0 );

		foreach ( self::$roles as $r ) {
			foreach ( self::$roles as $_r ) {
				foreach ( array( 'in_post_by', 'in_post_backend_by', 'in_draft_backend_by' ) as $k ) {
					$request  = new WP_REST_Request(
						'GET',
						self::$rest_ns_base .
						'/' . self::$anno_id[ "{$r}:{$k}_{$_r}" ]
					);
					$response = $this->server->dispatch( $request );
					$status   = $response->get_status();
					$data     = $response->get_data();

					if ( 'in_post_by' === $k ) {
						$this->assertSame( 200, $status );
						$this->check_data( $data, 'view', $response->get_links() );
					} elseif ( 'in_draft_backend_by' === $k ) {
						$this->assertSame( rest_authorization_required_code(), $status );
						$this->assertSame( 'rest_cannot_read_annotation_post', $data['code'] );
					} else {
						$this->assertSame( rest_authorization_required_code(), $status );
						$this->assertSame( 'rest_cannot_read_annotation', $data['code'] );
					}
				}
			}
		}
	}

	/**
	 * Check that subscribers can't GET a single back-end annotation, but they can gain
	 * read access to any single public front-end annotation.
	 */
	public function test_subscriber_get_item_allow_deny_permissions() {
		wp_set_current_user( self::$user_id['subscriber'] );

		foreach ( self::$roles as $r ) {
			foreach ( self::$roles as $_r ) {
				foreach ( array( 'in_post_by', 'in_post_backend_by', 'in_draft_backend_by' ) as $k ) {
					$request  = new WP_REST_Request(
						'GET',
						self::$rest_ns_base .
						'/' . self::$anno_id[ "{$r}:{$k}_{$_r}" ]
					);
					$response = $this->server->dispatch( $request );
					$status   = $response->get_status();
					$data     = $response->get_data();

					if ( 'in_post_by' === $k ) {
						$this->assertSame( 200, $status );
						$this->check_data( $data, 'view', $response->get_links() );
					} elseif ( 'subscriber' !== $_r && 'in_draft_backend_by' === $k ) {
						$this->assertSame( rest_authorization_required_code(), $status );
						$this->assertSame( 'rest_cannot_read_annotation_post', $data['code'] );
					} else {
						$this->assertSame( rest_authorization_required_code(), $status );
						$this->assertSame( 'rest_cannot_read_annotation', $data['code'] );
					}
				}
			}
		}
	}

	/**
	 * Check that anonymous users can't GET back-end annotations, but they can gain read
	 * access to public front-end annotations.
	 */
	public function test_anonymous_get_items_allow_deny_permissions() {
		wp_set_current_user( 0 );

		foreach ( self::$roles as $_r ) {
			foreach ( array( 'post_by', 'draft_by' ) as $k ) {
				foreach ( array( 'annotation', 'admin_annotation' ) as $type ) {
					$request = new WP_REST_Request( 'GET', self::$rest_ns_base );

					$request->set_param( 'post', self::$post_id[ "{$k}_{$_r}" ] );
					$request->set_param( 'type', $type );
					$request->set_param( 'status', 'approve' );

					$response = $this->server->dispatch( $request );
					$status   = $response->get_status();
					$data     = $response->get_data();

					if ( 'post_by' === $k && 'annotation' === $type ) {
						$this->assertSame( 200, $status );
						$this->check_collection( $response, 'view' );
					} elseif ( 'draft_by' === $k ) {
						$this->assertSame( rest_authorization_required_code(), $status );
						$this->assertSame( 'rest_cannot_read_annotations_post', $data['code'] );
					} else {
						$this->assertSame( rest_authorization_required_code(), $status );
						$this->assertSame( 'rest_cannot_read_annotations', $data['code'] );
					}
				}
			}
		}
	}

	/**
	 * Check that subscribers can't GET back-end annotations, but they can gain read
	 * access to public front-end annotations.
	 */
	public function test_subscriber_get_items_allow_deny_permissions() {
		wp_set_current_user( self::$user_id['subscriber'] );

		foreach ( self::$roles as $_r ) {
			foreach ( array( 'post_by', 'draft_by' ) as $k ) {
				foreach ( array( 'annotation', 'admin_annotation' ) as $type ) {
					$request = new WP_REST_Request( 'GET', self::$rest_ns_base );

					$request->set_param( 'post', self::$post_id[ "{$k}_{$_r}" ] );
					$request->set_param( 'type', $type );

					$response = $this->server->dispatch( $request );
					$status   = $response->get_status();
					$data     = $response->get_data();

					if ( 'post_by' === $k && 'annotation' === $type ) {
						$this->assertSame( 200, $status );
						$this->check_collection( $response, 'view' );
					} elseif ( 'subscriber' !== $_r && 'draft_by' === $k ) {
						$this->assertSame( rest_authorization_required_code(), $status );
						$this->assertSame( 'rest_cannot_read_annotations_post', $data['code'] );
					} else {
						$this->assertSame( rest_authorization_required_code(), $status );
						$this->assertSame( 'rest_cannot_read_annotations', $data['code'] );
					}
				}
			}
		}
	}

	/**
	 * Check that anonymous users are unable to PUT an annotation.
	 */
	public function test_anonymous_update_item_deny_permissions() {
		wp_set_current_user( 0 );

		foreach ( self::$roles as $_r ) {
			foreach ( array( 'in_post_by', 'in_post_backend_by', 'in_draft_backend_by' ) as $k ) {
				$request = new WP_REST_Request(
					'PUT',
					self::$rest_ns_base .
					'/' . self::$anno_id[ "{$_r}:${k}_${_r}" ]
				);
				$request->set_param( 'content', '<p>content</p>' );

				$response = $this->server->dispatch( $request );
				$status   = $response->get_status();
				$data     = $response->get_data();

				if ( 'in_draft_backend_by' === $k ) {
					// see: <https://core.trac.wordpress.org/ticket/42828>.
					$this->assertTrue( in_array( $status, array( 401, 403 ), true ) );
					$this->assertSame( 'rest_cannot_read_annotation_post', $data['code'] );
				} else {
					// see: <https://core.trac.wordpress.org/ticket/42828>.
					$this->assertTrue( in_array( $status, array( 401, 403 ), true ) );
					$this->assertSame( 'rest_cannot_update_annotation', $data['code'] );
				}
			}
		}
	}

	/**
	 * Check that subscribers are unable to PUT an annotation.
	 */
	public function test_subscribers_update_item_deny_permissions() {
		foreach ( array( 'subscriber' ) as $r ) {
			wp_set_current_user( self::$user_id[ $r ] );

			foreach ( self::$roles as $_r ) {
				foreach ( array( 'in_post_by', 'in_post_backend_by', 'in_draft_backend_by' ) as $k ) {
					$request = new WP_REST_Request(
						'PUT',
						self::$rest_ns_base .
						'/' . self::$anno_id[ "{$r}:${k}_${_r}" ]
					);
					$request->set_param( 'content', '<p>content</p>' );

					$response = $this->server->dispatch( $request );
					$status   = $response->get_status();
					$data     = $response->get_data();

					if ( $r !== $_r && 'in_draft_backend_by' === $k ) {
						$this->assertSame( rest_authorization_required_code(), $status );
						$this->assertSame( 'rest_cannot_read_annotation_post', $data['code'] );
					} else {
						$this->assertSame( rest_authorization_required_code(), $status );
						$this->assertSame( 'rest_cannot_update_annotation', $data['code'] );
					}
				}
			}
		}
	}

	/**
	 * Check that authors and contributors can't GET back-end annotations in posts
	 * authored by others.
	 */
	public function test_author_contributor_get_others_deny_permissions() {
		foreach ( array( 'author', 'contributor' ) as $r ) {
			wp_set_current_user( self::$user_id[ $r ] );

			foreach ( self::$roles as $_r ) {
				if ( $_r === $r ) {
					continue; // Skip their own.
				}
				$request = new WP_REST_Request( 'GET', self::$rest_ns_base );

				$request->set_param( 'post', self::$post_id[ "post_by_{$_r}" ] );
				$request->set_param( 'type', 'admin_annotation' );

				$response = $this->server->dispatch( $request );
				$status   = $response->get_status();
				$data     = $response->get_data();

				$this->assertSame( rest_authorization_required_code(), $status );
				$this->assertSame( 'rest_cannot_read_annotations', $data['code'] );
			}
		}
	}

	/**
	 * Check that authors and contributors can't GET back-end annotations for an array of
	 * post IDs, when any single post ID is owned by others.
	 */
	public function test_author_contributor_get_items_by_post_deny_permissions() {
		foreach ( array( 'author', 'contributor' ) as $r ) {
			wp_set_current_user( self::$user_id[ $r ] );

			foreach ( self::$roles as $_r ) {
				if ( $r === $_r ) {
					continue; // Skip their own role.
				}
				foreach ( array( 'post_by', 'draft_by' ) as $k ) {
					$request = new WP_REST_Request( 'GET', self::$rest_ns_base );

					$request->set_param( 'post', array(
						self::$post_id[ "{$k}_{$r}" ],
						self::$post_id[ "{$k}_{$_r}" ],
					) );
					$request->set_param( 'type', 'admin_annotation' );

					$response = $this->server->dispatch( $request );
					$status   = $response->get_status();
					$data     = $response->get_data();

					if ( $r !== $_r && 'draft_by' === $k ) {
						$this->assertSame( rest_authorization_required_code(), $status );
						$this->assertSame( 'rest_cannot_read_annotations_post', $data['code'] );
					} else {
						$this->assertSame( rest_authorization_required_code(), $status );
						$this->assertSame( 'rest_cannot_read_annotations', $data['code'] );
					}
				}
			}
		}
	}

	/**
	 * Check that admins and editors are able to create an annotation with any status.
	 */
	public function test_admin_editor_create_item_any_status_allow_permissions() {
		foreach ( array( 'administrator', 'editor' ) as $r ) {
			wp_set_current_user( self::$user_id[ $r ] );

			foreach ( self::$roles as $_r ) {
				if ( $r !== $_r ) {
					continue; // Skip others.
				}
				foreach ( array( null, 'annotation', 'admin_annotation' ) as $type ) {
					foreach ( array( '1', 'approved', 'approve', 'archive', '0', 'hold', 'spam', 'trash' ) as $status ) {
						$request = new WP_REST_Request( 'POST', self::$rest_ns_base );

						if ( isset( $type ) ) {
							$_type = compact( 'type' );
						} else {
							$_type = array();
						}
						$request->set_body_params( $_type + array(
							'post'     => self::$post_id[ "post_by_{$_r}" ],
							'status'   => $status,
							'author'   => self::$user_id[ $r ],
							'content'  => '<p>content</p>',
							'via'      => 'gutenberg',
							'selector' => array(
								'type'  => 'CssSelector',
								'value' => '#foo',
							),
						) );

						$response = $this->server->dispatch( $request );
						$status   = $response->get_status();
						$data     = $response->get_data();

						$this->assertSame( 201, $status );
						$this->check_data( $data, 'edit', $response->get_links() );

						wp_delete_comment( $data['id'], true );
					}
				}
			}
		}
	}

	/**
	 * Check that authors and contributors are able to create an annotation with an
	 * unrestricted status.
	 */
	public function test_author_contributor_create_item_unrestricted_status_allow_permissions() {
		foreach ( array( 'author', 'contributor' ) as $r ) {
			wp_set_current_user( self::$user_id[ $r ] );

			foreach ( self::$roles as $_r ) {
				if ( $r !== $_r ) {
					continue; // Skip others.
				}
				foreach ( array( null, 'annotation', 'admin_annotation' ) as $type ) {
					foreach ( array( '1', 'approved', 'approve', 'archive' ) as $status ) {
						$request = new WP_REST_Request( 'POST', self::$rest_ns_base );

						if ( isset( $type ) ) {
							$_type = compact( 'type' );
						} else {
							$_type = array();
						}
						$request->set_body_params( $_type + array(
							'post'     => self::$post_id[ "post_by_{$_r}" ],
							'status'   => $status,
							'content'  => '<p>content</p>',
							'via'      => 'gutenberg',
							'selector' => array(
								'type'  => 'CssSelector',
								'value' => '#foo',
							),
						) );

						$response = $this->server->dispatch( $request );
						$status   = $response->get_status();
						$data     = $response->get_data();

						$this->assertSame( 201, $status );
						$context = current_user_can( 'edit_annotation', $data['id'] ) ? 'edit' : 'view';
						$this->check_data( $data, $context, $response->get_links() );

						wp_delete_comment( $data['id'], true );
					}
				}
			}
		}
	}

	/**
	 * Check that authors and contributors are unable to create an annotation with a
	 * restricted status.
	 */
	public function test_author_contributor_create_item_restricted_status_deny_permissions() {
		foreach ( array( 'author', 'contributor' ) as $r ) {
			wp_set_current_user( self::$user_id[ $r ] );

			foreach ( self::$roles as $_r ) {
				if ( $r !== $_r ) {
					continue; // Skip others.
				}
				foreach ( array( null, 'annotation', 'admin_annotation' ) as $type ) {
					foreach ( array( '0', 'hold', 'spam', 'trash' ) as $status ) {
						$request = new WP_REST_Request( 'POST', self::$rest_ns_base );

						if ( isset( $type ) ) {
							$_type = compact( 'type' );
						} else {
							$_type = array();
						}
						$request->set_body_params( $_type + array(
							'post'     => self::$post_id[ "post_by_{$_r}" ],
							'status'   => $status,
							'content'  => '<p>content</p>',
							'via'      => 'gutenberg',
							'selector' => array(
								'type'  => 'CssSelector',
								'value' => '#foo',
							),
						) );

						$response = $this->server->dispatch( $request );
						$status   = $response->get_status();
						$data     = $response->get_data();

						$this->assertSame( rest_authorization_required_code(), $status );
						$this->assertSame( 'rest_forbidden_annotation_param_status', $data['code'] );
					}
				}
			}
		}
	}

	/**
	 * Test that authors and contributors are unable to PUT annotations in others' posts.
	 */
	public function test_author_contributor_update_item_in_others_post_deny_permissions() {
		foreach ( array( 'author', 'contributor' ) as $r ) {
			wp_set_current_user( self::$user_id[ $r ] );

			foreach ( self::$roles as $_r ) {
				if ( $r === $_r ) {
					continue; // Skip their own.
				}
				foreach ( array( 'in_post_by', 'in_post_backend_by', 'in_draft_backend_by' ) as $k ) {
					$request = new WP_REST_Request(
						'PUT',
						self::$rest_ns_base .
						'/' . self::$anno_id[ "${r}:{$k}_{$_r}" ]
					);
					$request->set_param( 'content', '<p>content</p>' );

					$response = $this->server->dispatch( $request );
					$status   = $response->get_status();
					$data     = $response->get_data();

					if ( $r !== $_r && 'in_draft_backend_by' === $k ) {
						$this->assertSame( rest_authorization_required_code(), $status );
						$this->assertSame( 'rest_cannot_read_annotation_post', $data['code'] );
					} else {
						$this->assertSame( rest_authorization_required_code(), $status );
						$this->assertSame( 'rest_cannot_update_annotation', $data['code'] );
					}
				}
			}
		}
	}

	/**
	 * Test that authors and contributors are unable to DELETE annotations in others'
	 * posts.
	 */
	public function test_author_contributor_delete_item_in_others_post_deny_permissions() {
		foreach ( array( 'author', 'contributor' ) as $r ) {
			wp_set_current_user( self::$user_id[ $r ] );

			foreach ( self::$roles as $_r ) {
				if ( $r === $_r ) {
					continue; // Skip their own.
				}
				foreach ( array( 'in_post_by', 'in_post_backend_by', 'in_draft_backend_by' ) as $k ) {
					$request  = new WP_REST_Request(
						'DELETE',
						self::$rest_ns_base .
						'/' . self::$anno_id[ "${r}:{$k}_{$_r}" ]
					);
					$response = $this->server->dispatch( $request );
					$status   = $response->get_status();
					$data     = $response->get_data();

					if ( 'in_draft_backend_by' !== $k ) {
						$this->assertSame( rest_authorization_required_code(), $status );
						$this->assertSame( 'rest_cannot_delete_annotation', $data['code'] );
					} else {
						$this->assertSame( rest_authorization_required_code(), $status );
						$this->assertSame( 'rest_cannot_read_annotation_post', $data['code'] );
					}
				}
			}
		}
	}

	/**
	 * Test that authors and contributors are able to PUT annotations in their own posts.
	 *
	 * Exception: A contributor can't edit a public front-end annotation in a published
	 * post. i.e., Once their post has been published they're treated like any other
	 * front-end annotator.
	 */
	public function test_author_contributor_update_item_in_own_allow_deny_permissions() {
		foreach ( array( 'author', 'contributor' ) as $r ) {
			wp_set_current_user( self::$user_id[ $r ] );

			foreach ( self::$roles as $_r ) {
				if ( $r !== $_r ) {
					continue; // Skip others.
				}
				foreach ( array( 'in_post_by', 'in_post_backend_by', 'in_draft_backend_by' ) as $k ) {
					$request = new WP_REST_Request(
						'PUT',
						self::$rest_ns_base .
						'/' . self::$anno_id[ "${r}:{$k}_{$_r}" ]
					);
					$request->set_body_params( array(
						'content' => '<p>content</p>',
					) );
					$response = $this->server->dispatch( $request );
					$status   = $response->get_status();
					$data     = $response->get_data();

					if ( 'contributor' === $r && 'in_post_by' === $k ) {
						$this->assertSame( rest_authorization_required_code(), $status );
						$this->assertSame( 'rest_cannot_update_annotation', $data['code'] );
					} else {
						$this->assertSame( 200, $status );
						$this->check_data( $data, 'edit', $response->get_links() );
					}
				}
			}
		}
	}

	/**
	 * Test that authors and contributors are able to DELETE their own annotations in
	 * their own posts.
	 *
	 * Exception: A contributor can't delete a public front-end annotation in a published
	 * post. i.e., Once their post has been published they're treated like any other
	 * front-end annotator.
	 */
	public function test_author_contributor_delete_item_in_own_allow_deny_permissions() {
		foreach ( array( 'author', 'contributor' ) as $r ) {
			wp_set_current_user( self::$user_id[ $r ] );

			foreach ( self::$roles as $_r ) {
				if ( $r !== $_r ) {
					continue; // Skip others.
				}
				foreach ( array( 'in_post_by', 'in_post_backend_by', 'in_draft_backend_by' ) as $k ) {
					$request  = new WP_REST_Request(
						'DELETE',
						self::$rest_ns_base .
						'/' . self::$anno_id[ "${r}:{$k}_{$_r}" ]
					);
					$response = $this->server->dispatch( $request );
					$status   = $response->get_status();
					$data     = $response->get_data();

					if ( 'contributor' === $r && 'in_post_by' === $k ) {
						$this->assertSame( rest_authorization_required_code(), $status );
						$this->assertSame( 'rest_cannot_delete_annotation', $data['code'] );
					} else {
						$this->assertSame( 200, $status );
					}
				}
			}
		}
	}

	/**
	 * Test comment collection data.
	 *
	 * @param WP_REST_Response $response REST API response.
	 * @param string           $context  Exepcted response context.
	 */
	protected function check_collection( $response, $context ) {
		$this->assertNotInstanceOf( 'WP_Error', $response );

		$response = rest_ensure_response( $response );
		$this->assertEquals( 200, $response->get_status() );

		$headers = $response->get_headers();
		$this->assertArrayHasKey( 'X-WP-Total', $headers );
		$this->assertArrayHasKey( 'X-WP-TotalPages', $headers );

		foreach ( $response->get_data() as $data ) {
			$this->check_data( $data, $context, $data['_links'] );
		}
	}

	/**
	 * Test comment data.
	 *
	 * @param array  $data    Response data.
	 * @param string $context Response context.
	 * @param array  $links   Response links.
	 */
	protected function check_data( $data, $context, $links ) {
		$this->assertSame( true, ! empty( $data['id'] ) );
		$comment = get_comment( $data['id'] );

		$this->assertSame( (int) $comment->comment_ID, $data['id'] );
		$this->assertSame( (int) $comment->comment_post_ID, $data['post'] );
		$this->assertSame( (int) $comment->comment_parent, $data['parent'] );
		$this->assertSame( (int) $comment->user_id, $data['author'] );
		$this->assertSame( $comment->comment_author, $data['author_name'] );
		$this->assertSame( $comment->comment_author_url, $data['author_url'] );
		$this->assertSame( wpautop( $comment->comment_content ), $data['content']['rendered'] );

		// phpcs:ignore PHPCompatibility.PHP.RemovedExtensions.mysql_DeprecatedRemoved — function provided by core.
		$this->assertSame( mysql_to_rfc3339( $comment->comment_date ), $data['date'] ); // @codingStandardsIgnoreLine
		$this->assertSame( mysql_to_rfc3339( $comment->comment_date_gmt ), $data['date_gmt'] ); // @codingStandardsIgnoreLine

		$this->assertSame( get_comment_link( $comment ), $data['link'] );
		$this->assertArrayHasKey( 'author_avatar_urls', $data );

		$this->assertSame( get_comment_meta( $comment->comment_ID, '_via', true ), $data['via'] );
		$this->assertSame( get_comment_meta( $comment->comment_ID, '_selector', true ), $data['selector'] );

		$this->assertSame( rest_url( '/wp/v2/posts/' . $data['post'] ), $links['up'][0]['href'] );
		$this->assertSame( rest_url( '/wp/v2/users/' . $data['author'] ), $links['author'][0]['href'] );
		$this->assertSame( rest_url( self::$rest_ns_base . '/' . $data['id'] ), $links['self'][0]['href'] );
		$this->assertSame( rest_url( self::$rest_ns_base ), $links['collection'][0]['href'] );

		if ( 'edit' === $context ) {
			$this->assertSame( $comment->comment_author_email, $data['author_email'] );
			$this->assertSame( $comment->comment_author_IP, $data['author_ip'] );
			$this->assertSame( $comment->comment_agent, $data['author_user_agent'] );
			$this->assertSame( $comment->comment_content, $data['content']['raw'] );
		}

		if ( 'edit' !== $context ) {
			$this->assertArrayNotHasKey( 'author_email', $data );
			$this->assertArrayNotHasKey( 'author_ip', $data );
			$this->assertArrayNotHasKey( 'author_user_agent', $data );
			$this->assertArrayNotHasKey( 'raw', $data['content'] );
		}
	}
}
