<?php
/**
 * WP_REST_Annotations_Controller tests
 *
 * @package gutenberg
 */

/**
 * Tests for WP_REST_Annotations_Controller.
 */
class REST_Annotations_Controller_Test extends WP_Test_REST_Post_Type_Controller_Testcase {
	/**
	 * Our fake user IDs.
	 *
	 * @var int[]
	 */
	protected static $user_id = array();

	/**
	 * Our fake post IDs.
	 *
	 * @var int[]
	 */
	protected static $post_id = array();

	/**
	 * Our fake annotation IDs.
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
	protected static $rest_ns_base = '/gutenberg/v1/annotations';

	/**
	 * Create fake data before our tests run.
	 *
	 * @param WP_UnitTest_Factory $factory Helper that lets us create fake data.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		/*
		 * - A user for each role.
		 * 	 - self::$user_id['{role}']
		 *
		 * - A post with 'publish' and 'draft' status for each user.
		 *   - self::$post_id['by_{role}']
		 *   - self::$post_id['draft_by_{role}']
		 *
		 * - An annotation by each user as a child of each post (by each user).
		 *   - self::$anno_id['{role}:in_post_by_{role}']
		 *   - ...etc. for every post status & role combo.
		 *
		 * - Annotation replies by each user as nested children.
		 *   - self::$anno_id['{role}:_reply_in_post_by_{role}']
		 *   - self::$anno_id['{role}:__reply_in_post_by_{role}']
		 *   - ...etc. for every post status & role combo.
		 */

		foreach ( self::$roles as $r ) {
			self::$user_id[ $r ] = $factory->user->create( array( 'role' => $r ) );

			self::$post_id[ "by_{$r}" ] = $factory->post->create( array(
				'post_author'  => self::$user_id[ $r ],
				'post_type'    => 'post',
				'post_status'  => 'publish',
				'post_title'   => 'Post by ' . $r,
				'post_content' => '<p><strong>bold</strong> <em>italic</em> test post.</p>',
			) );

			self::$post_id[ "draft_by_{$r}" ] = $factory->post->create( array(
				'post_author'  => self::$user_id[ $r ],
				'post_type'    => 'post',
				'post_status'  => 'draft',
				'post_title'   => 'Draft by ' . $r,
				'post_content' => '<p><strong>bold</strong> <em>italic</em> test draft.</p>',
			) );
		}

		foreach ( self::$roles as $r ) {
			foreach ( self::$roles as $_r ) {
				foreach ( array(
					'in_post_by'  => self::$post_id[ "by_{$r}" ],
					'in_draft_by' => self::$post_id[ "draft_by_{$r}" ],
				) as $k => $_parent_post_id ) {
					$common_annotation_meta = array(
						'_parent_post_id'      => $_parent_post_id,
						'_selection'           => array(
							'ranges' => array(
								array(
									'begin' => array(
										'offset' => 0,
									),
									'end'   => array(
										'offset' => 100,
									),
								),
							),
						),
						'_annotator'           => 'x-plugin',
						'_annotator_meta'      => array(
							'display_name' => 'X Plugin',
							'md5_email'    => 'c8e0057f78fa5b54326cd437494b87e9',
						),
						'_substatus'           => '',
						'_last_substatus_time' => 0,
						'_substatus_history'   => array(),
					);

					self::$anno_id[ "{$_r}:{$k}_{$r}" ] = $factory->post->create( array(
						'post_author'  => self::$user_id[ $_r ],
						'post_parent'  => 0,
						'post_status'  => 'publish',
						'post_type'    => WP_Annotation_Utils::$post_type,
						'post_content' => '<p><strong>bold</strong> <em>italic</em> test annotation.</p>',
						'meta_input'   => $common_annotation_meta,
					) );

					self::$anno_id[ "{$_r}:_reply_{$k}_{$r}" ] = $factory->post->create( array(
						'post_author'  => self::$user_id[ $_r ],
						'post_status'  => 'publish',
						'post_parent'  => self::$anno_id[ "{$_r}:{$k}_{$r}" ],
						'post_type'    => WP_Annotation_Utils::$post_type,
						'post_content' => '<p><strong>bold</strong> <em>italic</em> test annotation reply.</p>',
						'meta_input'   => $common_annotation_meta,
					) );

					self::$anno_id[ "{$_r}:__reply_{$k}_{$r}" ] = $factory->post->create( array(
						'post_author'  => self::$user_id[ $_r ],
						'post_status'  => 'publish',
						'post_parent'  => self::$anno_id[ "{$_r}:_reply_{$k}_{$r}" ],
						'post_type'    => WP_Annotation_Utils::$post_type,
						'post_content' => '<p><strong>bold</strong> <em>italic</em> test annotation reply.</p>',
						'meta_input'   => $common_annotation_meta,
					) );
				}
			}
		}
	}

	/**
	 * Delete fake data after our tests run.
	 */
	public static function wpTearDownAfterClass() {
		foreach ( self::$roles as $r ) {
			wp_delete_post( self::$post_id[ "by_{$r}" ] );
			wp_delete_post( self::$post_id[ "draft_by_{$r}" ] );

			foreach ( self::$roles as $_r ) {
				foreach ( array( 'in_post_by', 'in_draft_by' ) as $k ) {
					wp_delete_post( self::$anno_id[ "{$_r}:{$k}_{$r}" ] );
					wp_delete_post( self::$anno_id[ "{$_r}:_reply_{$k}_{$r}" ] );
					wp_delete_post( self::$anno_id[ "{$_r}:__reply_{$k}_{$r}" ] );
				}
			}
			self::delete_user( self::$user_id[ $r ] );
		}
	}

	/**
	 * Check post data via parent: WP_Test_REST_Post_Type_Controller_Testcase.
	 */
	protected function check_post_data( $post, $data, $context, $links ) {
		return parent::check_post_data( $post, $data, $context, array() );

		if ( $links ) {
			$links = test_rest_expand_compact_links( $links );
			$this->assertSame( $links['self'][0]['href'], rest_url( self::$rest_ns_base . '/' . $data['id'] ) );
			$this->assertSame( $links['collection'][0]['href'], rest_url( self::$rest_ns_base ) );
			$this->assertSame( $links['about'][0]['href'], rest_url( self::$rest_ns_base . '/' . $data['type'] ) );
		}
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

		$this->assertSame( 24, count( $properties ) );
		$this->assertArrayHasKey( 'parent_post_id', $properties );
		$this->assertArrayHasKey( 'selection', $properties );
		$this->assertArrayHasKey( 'annotator', $properties );
		$this->assertArrayHasKey( 'annotator_meta', $properties );
		$this->assertArrayHasKey( 'substatus', $properties );
		$this->assertArrayHasKey( 'last_substatus_time', $properties );
		$this->assertArrayHasKey( 'substatus_history', $properties );
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

		$request = new WP_REST_Request( 'GET', self::$rest_ns_base );
		$request->set_param( 'per_page', 100 );

		$response = $this->server->dispatch( $request );
		$status   = $response->get_status();
		$data     = $response->get_data();

		$this->assertSame( 200, $status );
		$this->assertSame( 100, count( $data ) );
		$this->check_get_posts_response( $response );
	}

	/**
	 * Check that we can GET a collection of annotations for a parent post ID.
	 */
	public function test_get_parent_post_id_items() {
		wp_set_current_user( self::$user_id['editor'] );

		$request = new WP_REST_Request( 'GET', self::$rest_ns_base );
		$request->set_param( 'parent_post_id', self::$post_id['by_editor'] );
		$request->set_param( 'per_page', 100 );

		$response = $this->server->dispatch( $request );
		$status   = $response->get_status();
		$data     = $response->get_data();

		$this->assertSame( 200, $status );
		$this->assertSame( 15, count( $data ) );
		$this->check_get_posts_response( $response );
	}

	/**
	 * Check that we can GET a collection of all annotations with specific parent post IDs.
	 */
	public function test_get_parent_post_ids_plural_items() {
		wp_set_current_user( self::$user_id['editor'] );

		$request = new WP_REST_Request( 'GET', self::$rest_ns_base );

		$request->set_param( 'parent_post_id', array(
			self::$post_id['by_editor'],
			self::$post_id['by_author'],
			self::$post_id['by_contributor'],
		) );
		$request->set_param( 'per_page', 100 );

		$response = $this->server->dispatch( $request );
		$status   = $response->get_status();
		$data     = $response->get_data();

		$this->assertSame( 200, $status );
		$this->assertSame( 45, count( $data ) );
		$this->check_get_posts_response( $response );
	}

	/**
	 * Check that we can GET a collection of all annotations
	 * with specific parent post IDs and specific parent annotation IDs.
	 */
	public function test_get_parent_post_ids_plural_parents_plural_items() {
		wp_set_current_user( self::$user_id['editor'] );

		$request = new WP_REST_Request( 'GET', self::$rest_ns_base );

		$request->set_param( 'parent_post_id', array(
			self::$post_id['by_editor'],
			self::$post_id['by_author'],
			self::$post_id['by_contributor'],
		) );
		$request->set_param( 'parent', array(
			self::$anno_id['editor:in_post_by_editor'],
			self::$anno_id['author:in_post_by_author'],
			self::$anno_id['contributor:in_post_by_contributor'],
		) );
		$request->set_param( 'per_page', 100 );

		$response = $this->server->dispatch( $request );
		$status   = $response->get_status();
		$data     = $response->get_data();

		$this->assertSame( 200, $status );
		$this->assertSame( 3, count( $data ) );
		$this->check_get_posts_response( $response );
	}

	/**
	 * Check that a collection of all annotations is flat by default.
	 */
	public function test_get_flat_items() {
		wp_set_current_user( self::$user_id['editor'] );

		$request = new WP_REST_Request( 'GET', self::$rest_ns_base );
		$request->set_param( 'parent', array( 0 ) );
		$request->set_param( 'per_page', 100 );

		$response = $this->server->dispatch( $request );
		$status   = $response->get_status();
		$data     = $response->get_data();

		$this->assertSame( 200, $status );
		$this->assertSame( 50, count( $data ) );

		foreach ( $data as $flat ) {
			$this->assertArrayNotHasKey( 'children', $flat );
		}
		$this->check_get_posts_response( $response );
	}

	/**
	 * Check that we can GET a collection in hierarchical=flat format.
	 */
	public function test_get_hierarchical_flat_items() {
		wp_set_current_user( self::$user_id['editor'] );

		$request = new WP_REST_Request( 'GET', self::$rest_ns_base );
		$request->set_param( 'hierarchical', 'flat' );
		$request->set_param( 'per_page', 100 );

		$response = $this->server->dispatch( $request );
		$status   = $response->get_status();
		$data     = $response->get_data();

		$this->assertSame( 200, $status );
		$this->assertSame( 150, count( $data ) );

		foreach ( $data as $flat ) {
			$this->assertArrayNotHasKey( 'children', $flat );
		}
		$this->check_get_posts_response( $response );
	}

	/**
	 * Check that we can GET a collection in hierarchical=threaded format.
	 */
	public function test_get_hierarchical_threaded_items() {
		wp_set_current_user( self::$user_id['editor'] );

		$request = new WP_REST_Request( 'GET', self::$rest_ns_base );
		$request->set_param( 'hierarchical', 'threaded' );
		$request->set_param( 'parent', array( 0 ) );
		$request->set_param( 'per_page', 100 );

		$response = $this->server->dispatch( $request );
		$status   = $response->get_status();
		$data     = $response->get_data();

		$this->assertSame( 200, $status );
		$this->assertSame( 50, count( $data ) );

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
		$this->check_get_posts_response( $response );
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
		$request->set_param( 'per_page', 100 );

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

		$request = new WP_REST_Request( 'GET', self::$rest_ns_base . '/999' );
		$request->set_param( 'per_page', 100 );

		$response = $this->server->dispatch( $request );
		$status   = $response->get_status();
		$data     = $response->get_data();

		$this->assertSame( 404, $status );
		$this->assertSame( 'rest_post_invalid_id', $data['code'] );
	}

	/**
	 * Check that we can GET a single item in edit context.
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
		$this->check_get_post_response( $response, 'edit' );
	}

	/**
	 * Check that we can GET a single annotation.
	 */
	public function test_get_item() {
		wp_set_current_user( self::$user_id['author'] );

		$request = new WP_REST_Request(
			'GET',
			self::$rest_ns_base .
			'/' . self::$anno_id['author:in_post_by_author']
		);
		$request->set_param( 'context', 'edit' );

		$response = $this->server->dispatch( $request );
		$status   = $response->get_status();
		$data     = $response->get_data();

		$this->assertSame( 200, $status );
		$this->check_get_post_response( $response, 'edit' );
	}

	/**
	 * Check that a user who can edit the posts of others can GET a single annotation by another user.
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
		$this->check_get_post_response( $response, 'edit' );
	}

	/**
	 * Check that we can POST a single annotation.
	 */
	public function test_create_item() {
		wp_set_current_user( self::$user_id['editor'] );

		$request = new WP_REST_Request( 'POST', self::$rest_ns_base );
		$request->set_body_params( array(
			'parent'         => 0,
			'status'         => 'publish',
			'author'         => self::$user_id['editor'],
			'type'           => WP_Annotation_Utils::$post_type,
			'content'        => '<p><strong>bold</strong> <em>italic</em> test annotation.</p>',

			'parent_post_id' => self::$post_id['by_editor'],

			'selection'      => array(
				'ranges' => array(
					array(
						'begin' => array(
							'offset' => 0,
						),
						'end'   => array(
							'offset' => 100,
						),
					),
				),
			),
			'annotator'      => 'x-plugin',
			'annotator_meta' => array(
				'display_name' => 'X Plugin',
				'md5_email'    => 'c8e0057f78fa5b54326cd437494b87e9',
			),
			'substatus'      => '',
		) );

		$response = $this->server->dispatch( $request );
		$status   = $response->get_status();
		$data     = $response->get_data();

		$this->assertSame( 201, $status );
		$this->check_create_post_response( $response );

		wp_delete_post( $data['id'] );
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
			'content' => 'hello world',
		) );

		$response = $this->server->dispatch( $request );
		$status   = $response->get_status();
		$data     = $response->get_data();

		$this->assertSame( 200, $status );
		$this->check_update_post_response( $response );
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
			'substatus' => 'foobar',
		) );

		$response = $this->server->dispatch( $request );
		$status   = $response->get_status();
		$data     = $response->get_data();

		$this->assertSame( 400, $status );
		$this->assertSame( 'rest_invalid_param', $data['code'] );
	}

	/**
	 * Check that we can DELETE a single annotation.
	 */
	public function test_delete_item() {
		wp_set_current_user( self::$user_id['author'] );

		$request = new WP_REST_Request( 'POST', self::$rest_ns_base );
		$request->set_body_params( array(
			'parent'         => 0,
			'status'         => 'publish',
			'author'         => self::$user_id['author'],
			'content'        => '<p>Test annotation.</p>',
			'parent_post_id' => self::$post_id['by_author'],
		) );

		$response = $this->server->dispatch( $request );
		$status   = $response->get_status();
		$data     = $response->get_data();

		$this->assertSame( 201, $response->get_status() );
		$this->check_create_post_response( $response );

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
	 * Check that a nonexistent user can't GET a single annotation.
	 */
	public function test_nonexistent_get_item_deny_permissions() {
		wp_set_current_user( 0 );

		foreach ( self::$roles as $r ) {
			foreach ( self::$roles as $_r ) {
				foreach ( array( 'in_post_by', 'in_draft_by' ) as $k ) {
					$request = new WP_REST_Request(
						'GET',
						self::$rest_ns_base .
						'/' . self::$anno_id[ "{$r}:{$k}_{$_r}" ]
					);
					$request->set_param( 'context', 'view' );

					$response = $this->server->dispatch( $request );
					$status   = $response->get_status();
					$data     = $response->get_data();

					// see: <https://core.trac.wordpress.org/ticket/42828>.
					$this->assertTrue( in_array( $status, array( 401, 403 ), true ) );
					$this->assertSame( 'rest_forbidden', $data['code'] );
				}
			}
		}
	}

	/**
	 * Check that a subscriber can't GET a single annotation.
	 */
	public function test_subscriber_get_item_deny_permissions() {
		wp_set_current_user( self::$user_id['subscriber'] );

		foreach ( self::$roles as $r ) {
			foreach ( self::$roles as $_r ) {
				foreach ( array( 'in_post_by', 'in_draft_by' ) as $k ) {
					$request = new WP_REST_Request(
						'GET',
						self::$rest_ns_base .
						'/' . self::$anno_id[ "{$r}:{$k}_{$_r}" ]
					);
					$request->set_param( 'context', 'view' );

					$response = $this->server->dispatch( $request );
					$status   = $response->get_status();
					$data     = $response->get_data();

					$this->assertSame( rest_authorization_required_code(), $status );
					$this->assertSame( 'rest_forbidden', $data['code'] );
				}
			}
		}
	}

	/**
	 * Check that nonexistent users can't GET (list) annotations whatsoever.
	 */
	public function test_nonexistent_get_items_deny_permissions() {
		wp_set_current_user( 0 );

		$request = new WP_REST_Request( 'GET', self::$rest_ns_base );

		$response = $this->server->dispatch( $request );
		$status   = $response->get_status();
		$data     = $response->get_data();

		$this->assertSame( rest_authorization_required_code(), $status );
		$this->assertSame( 'gutenberg_annotations_cannot_list_all', $data['code'] );

		foreach ( self::$roles as $_r ) {
			foreach ( array( 'by', 'draft_by' ) as $k ) {
				$request = new WP_REST_Request( 'GET', self::$rest_ns_base );
				$request->set_param( 'parent_post_id', self::$post_id[ "{$k}_{$_r}" ] );

				$response = $this->server->dispatch( $request );
				$status   = $response->get_status();
				$data     = $response->get_data();

				$this->assertSame( rest_authorization_required_code(), $status );
				$this->assertSame( 'gutenberg_annotations_cannot_list_parent_post', $data['code'] );
			}
		}
	}

	/**
	 * Check that subscribers can't GET (list) annotations whatsoever.
	 */
	public function test_subscriber_get_items_deny_permissions() {
		wp_set_current_user( self::$user_id['subscriber'] );

		$request = new WP_REST_Request( 'GET', self::$rest_ns_base );

		$response = $this->server->dispatch( $request );
		$status   = $response->get_status();
		$data     = $response->get_data();

		$this->assertSame( rest_authorization_required_code(), $status );
		$this->assertSame( 'gutenberg_annotations_cannot_list_all', $data['code'] );

		foreach ( self::$roles as $_r ) {
			foreach ( array( 'by', 'draft_by' ) as $k ) {
				$request = new WP_REST_Request( 'GET', self::$rest_ns_base );
				$request->set_param( 'parent_post_id', self::$post_id[ "{$k}_{$_r}" ] );

				$response = $this->server->dispatch( $request );
				$status   = $response->get_status();
				$data     = $response->get_data();

				$this->assertSame( rest_authorization_required_code(), $status );
				$this->assertSame( 'gutenberg_annotations_cannot_list_parent_post', $data['code'] );
			}
		}
	}

	/**
	 * Check that nonexistent users are unable tp PUT an annotation.
	 */
	public function test_nonexistent_update_item_deny_permissions() {
		wp_set_current_user( 0 );

		foreach ( self::$roles as $_r ) {
			foreach ( array( 'in_post_by', 'in_draft_by' ) as $k ) {
				$request = new WP_REST_Request(
					'PUT',
					self::$rest_ns_base .
					'/' . self::$anno_id[ "{$_r}:${k}_${_r}" ]
				);
				$request->set_param( 'substatus', 'archived' );

				$response = $this->server->dispatch( $request );
				$status   = $response->get_status();
				$data     = $response->get_data();

				$this->assertSame( rest_authorization_required_code(), $status );
				$this->assertSame( 'rest_cannot_edit', $data['code'] );
			}
		}
	}

	/**
	 * Check that subscribers are unable tp PUT an annotation.
	 */
	public function test_subscribers_update_item_deny_permissions() {
		foreach ( array( 'subscriber' ) as $r ) {
			wp_set_current_user( self::$user_id[ $r ] );

			foreach ( self::$roles as $_r ) {
				foreach ( array( 'in_post_by', 'in_draft_by' ) as $k ) {
					$request = new WP_REST_Request(
						'PUT',
						self::$rest_ns_base .
						'/' . self::$anno_id[ "{$r}:${k}_${_r}" ]
					);
					$request->set_param( 'substatus', 'archived' );

					$response = $this->server->dispatch( $request );
					$status   = $response->get_status();
					$data     = $response->get_data();

					$this->assertSame( rest_authorization_required_code(), $status );
					$this->assertSame( 'rest_cannot_edit', $data['code'] );
				}
			}
		}
	}

	/**
	 * Check that authors and contributors can't GET (list) the annotations of others.
	 */
	public function test_author_contributor_deny_get_permissions() {
		foreach ( array( 'author', 'contributor' ) as $r ) {
			wp_set_current_user( self::$user_id[ $r ] );

			foreach ( self::$roles as $_r ) {
				if ( $_r === $r ) {
					continue; // Skip their own.
				}
				$request = new WP_REST_Request( 'GET', self::$rest_ns_base );
				$request->set_param( 'parent_post_id', self::$post_id[ "by_{$_r}" ] );

				$response = $this->server->dispatch( $request );
				$status   = $response->get_status();
				$data     = $response->get_data();

				$this->assertSame( rest_authorization_required_code(), $status );
				$this->assertSame( 'gutenberg_annotations_cannot_list_parent_post', $data['code'] );
			}
		}
	}

	/**
	 * Check that authors and contributors can't GET (list) annotations
	 * for an array of parent post IDs, when any parent is owned by others.
	 */
	public function test_author_contributor_get_items_by_parent_post_id_deny_permissions() {
		foreach ( array( 'author', 'contributor' ) as $r ) {
			wp_set_current_user( self::$user_id[ $r ] );

			foreach ( self::$roles as $_r ) {
				if ( $r === $_r ) {
					continue; // Skip their own role.
				}
				foreach ( array( 'by', 'draft_by' ) as $k ) {
					$request = new WP_REST_Request( 'GET', self::$rest_ns_base );
					$request->set_param( 'parent_post_id', array(
						self::$post_id[ "{$k}_{$r}" ],
						self::$post_id[ "{$k}_{$_r}" ],
					) );
					$response = $this->server->dispatch( $request );
					$status   = $response->get_status();
					$data     = $response->get_data();

					$this->assertSame( rest_authorization_required_code(), $status );
					$this->assertSame( 'gutenberg_annotations_cannot_list_parent_post', $data['code'] );
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
				foreach ( array( 'in_post_by', 'in_draft_by' ) as $k ) {
					$request = new WP_REST_Request(
						'PUT',
						self::$rest_ns_base .
						'/' . self::$anno_id[ "${r}:{$k}_{$_r}" ]
					);
					$request->set_param( 'substatus', 'archived' );

					$response = $this->server->dispatch( $request );
					$status   = $response->get_status();
					$data     = $response->get_data();

					$this->assertSame( rest_authorization_required_code(), $status );
					$this->assertSame( 'rest_cannot_edit', $data['code'] );
				}
			}
		}
	}

	/**
	 * Test that authors and contributors are unable to DELETE annotations in others' posts.
	 */
	public function test_author_contributor_delete_item_in_others_post_deny_permissions() {
		foreach ( array( 'author', 'contributor' ) as $r ) {
			wp_set_current_user( self::$user_id[ $r ] );

			foreach ( self::$roles as $_r ) {
				if ( $r === $_r ) {
					continue; // Skip their own.
				}
				foreach ( array( 'in_post_by', 'in_draft_by' ) as $k ) {
					$request  = new WP_REST_Request(
						'DELETE',
						self::$rest_ns_base .
						'/' . self::$anno_id[ "${r}:{$k}_{$_r}" ]
					);
					$response = $this->server->dispatch( $request );
					$status   = $response->get_status();
					$data     = $response->get_data();

					$this->assertSame( rest_authorization_required_code(), $status );
					$this->assertSame( 'rest_cannot_delete', $data['code'] );
				}
			}
		}
	}

	/**
	 * Test that authors and contributors are able to PUT their own annotations in their own posts.
	 */
	public function test_author_contributor_update_item_in_own_draft_deny_permissions() {
		foreach ( array( 'author', 'contributor' ) as $r ) {
			wp_set_current_user( self::$user_id[ $r ] );

			foreach ( self::$roles as $_r ) {
				if ( $r !== $_r ) {
					continue; // Skip others.
				}
				foreach ( array( 'in_post_by', 'in_draft_by' ) as $k ) {
					$request = new WP_REST_Request(
						'PUT',
						self::$rest_ns_base .
						'/' . self::$anno_id[ "${r}:{$k}_{$_r}" ]
					);
					$request->set_body_params( array(
						'content' => 'hello world',
					) );
					$response = $this->server->dispatch( $request );
					$status   = $response->get_status();
					$data     = $response->get_data();

					$this->assertSame( 200, $status );
					$this->check_update_post_response( $response );
				}
			}
		}
	}

	/**
	 * Test that authors and contributors are able to DELETE their own annotations in their own posts.
	 */
	public function test_author_contributor_delete_item_in_own_draft_deny_permissions() {
		foreach ( array( 'author', 'contributor' ) as $r ) {
			wp_set_current_user( self::$user_id[ $r ] );

			foreach ( self::$roles as $_r ) {
				if ( $r !== $_r ) {
					continue; // Skip others.
				}
				foreach ( array( 'in_post_by', 'in_draft_by' ) as $k ) {
					$request  = new WP_REST_Request(
						'DELETE',
						self::$rest_ns_base .
						'/' . self::$anno_id[ "${r}:{$k}_{$_r}" ]
					);
					$response = $this->server->dispatch( $request );
					$status   = $response->get_status();
					$data     = $response->get_data();

					$this->assertSame( 200, $status );
				}
			}
		}
	}
}
