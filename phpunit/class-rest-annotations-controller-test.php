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
	protected static $annotation_id = array();

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
		foreach ( self::$roles as $role ) {
			/*
			 * - A user for each role.
			 * - A post for each user.
			 * - An annotation by each user as a child of their post.
			 * - An annotation reply by each user as a child of their annotation.
			 */
			self::$user_id[ $role ] = $factory->user->create( array( 'role' => $role ) );

			self::$post_id[ 'by_' . $role ] = $factory->post->create( array(
				'post_author'  => self::$user_id[ $role ],
				'post_type'    => 'post',
				'post_status'  => 'publish',
				'post_title'   => 'Post by ' . $role,
				'post_content' => '<p><strong>bold</strong> <em>italic</em> test post.</p>',
			) );

			self::$annotation_id[ 'by_' . $role ] = $factory->post->create( array(
				'post_parent'  => 0,
				'post_status'  => 'publish',
				'post_author'  => self::$user_id[ $role ],
				'post_type'    => gutenberg_annotation_post_type(),
				'post_content' => '<p><strong>bold</strong> <em>italic</em> test annotation.</p>',

				'meta_input'   => array(
					'_parent_post_id'      => self::$post_id[ 'by_' . $role ],
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
				),
			) );

			self::$annotation_id[ '_reply_by_' . $role ] = $factory->post->create( array(
				'post_status'  => 'publish',
				'post_parent'  => self::$annotation_id[ 'by_' . $role ],
				'post_type'    => gutenberg_annotation_post_type(),
				'post_content' => '<p><strong>bold</strong> <em>italic</em> test annotation reply.</p>',
				'meta_input'   => array(
					'_parent_post_id'      => self::$post_id[ 'by_' . $role ],
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
				),
			) );

			self::$annotation_id[ '__reply_by_' . $role ] = $factory->post->create( array(
				'post_status'  => 'publish',
				'post_parent'  => self::$annotation_id[ '_reply_by_' . $role ],
				'post_type'    => gutenberg_annotation_post_type(),
				'post_content' => '<p><strong>bold</strong> <em>italic</em> test annotation nested reply.</p>',
				'meta_input'   => array(
					'_parent_post_id'      => self::$post_id[ 'by_' . $role ],
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
				),
			) );
		}
	}

	/**
	 * Delete fake data after our tests run.
	 */
	public static function wpTearDownAfterClass() {
		foreach ( self::$roles as $role ) {
			wp_delete_post( self::$post_id[ 'by_' . $role ] );
			wp_delete_post( self::$annotation_id[ 'by_' . $role ] );
			wp_delete_post( self::$annotation_id[ '_reply_by_' . $role ] );
			wp_delete_post( self::$annotation_id[ '__reply_by_' . $role ] );
			self::delete_user( self::$user_id[ $role ] );
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
	 * Check that our routes got set up properly.
	 */
	public function test_register_routes() {
		$routes = $this->server->get_routes();

		$this->assertArrayHasKey( self::$rest_ns_base, $routes );
		$this->assertCount( 2, $routes[ self::$rest_ns_base ] );

		$this->assertArrayHasKey( self::$rest_ns_base . '/(?P<id>[\d]+)', $routes );
		$this->assertCount( 3, $routes[ self::$rest_ns_base . '/(?P<id>[\d]+)' ] );
	}

	/**
	 * Check that we have defined a JSON schema.
	 */
	public function test_get_item_schema() {
		$request = new WP_REST_Request( 'OPTIONS', self::$rest_ns_base );

		$response   = $this->server->dispatch( $request );
		$status     = $response->get_status();
		$data       = $response->get_data();
		$properties = $data['schema']['properties'];

		$this->assertSame( 23, count( $properties ) ); // Not including conditional `children` property.
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

		$request = new WP_REST_Request( 'OPTIONS', self::$rest_ns_base . '/' . self::$annotation_id['by_editor'] );

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
		$this->assertSame( 5 * 3, count( $data ) ); // roles * annotations per role.
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
		$this->assertSame( 1 * 3, count( $data ) ); // roles * annotations per role.
		$this->check_get_posts_response( $response );
	}

	/**
	 * Check that we can GET a collection of all annotations with specific parent post IDs (plural).
	 */
	public function test_get_parent_post_ids_plural_items() {
		wp_set_current_user( self::$user_id['editor'] );

		$request = new WP_REST_Request( 'GET', self::$rest_ns_base );
		$request->set_param( 'parent_post_id', array( self::$post_id['by_editor'], self::$post_id['by_author'], self::$post_id['by_contributor'] ) );
		$request->set_param( 'per_page', 100 );

		$response = $this->server->dispatch( $request );
		$status   = $response->get_status();
		$data     = $response->get_data();

		$this->assertSame( 200, $status );
		$this->assertSame( 3 * 3, count( $data ) ); // roles * annotations per role.
		$this->check_get_posts_response( $response );
	}

	/**
	 * Check that we can GET a collection of all annotations with specific parent post IDs (plural),
	 * and also with specific parent annotation IDs (plural).
	 */
	public function test_get_parent_post_ids_plural_parents_plural_items() {
		wp_set_current_user( self::$user_id['editor'] );

		$request = new WP_REST_Request( 'GET', self::$rest_ns_base );
		$request->set_param( 'parent_post_id', array( self::$post_id['by_editor'], self::$post_id['by_author'], self::$post_id['by_contributor'] ) );
		$request->set_param( 'parent', array( self::$annotation_id['by_editor'], self::$annotation_id['by_author'], self::$annotation_id['by_contributor'] ) );
		$request->set_param( 'per_page', 100 );

		$response = $this->server->dispatch( $request );
		$status   = $response->get_status();
		$data     = $response->get_data();

		$this->assertSame( 200, $status );
		$this->assertSame( 3 * 1, count( $data ) ); // roles * parent annotations per role.
		$this->check_get_posts_response( $response );
	}

	/**
	 * Check that we can GET a collection of all annotations, and that they're flat by default.
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
		$this->assertSame( 5 * 1, count( $data ) ); // roles * top-level annotations per role.

		foreach ( $data as $flat ) {
			$this->assertArrayNotHasKey( 'children', $flat );
		}
		$this->check_get_posts_response( $response );
	}

	/**
	 * Check that we can GET a collection of all annotations in hierarchical=flat format.
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
		$this->assertSame( 5 * 3, count( $data ) ); // roles * annotations per role.

		foreach ( $data as $flat ) {
			$this->assertArrayNotHasKey( 'children', $flat );
		}
		$this->check_get_posts_response( $response );
	}

	/**
	 * Check that we can GET a collection of all annotations in hierarchical=threaded format.
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
		$this->assertSame( 5 * 1, count( $data ) ); // roles * level (0) annotations per role.

		foreach ( $data as $level0 ) {
			$this->assertArrayHasKey( 'children', $level0 );
			$this->assertSame( 1, count( $level0['children'] ) ); // level (0) child annotations per role.

			foreach ( $level0['children'] as $level1 ) {
				$this->assertArrayHasKey( 'children', $level1 );
				$this->assertSame( 1, count( $level1['children'] ) ); // level (1) child annotations per role.

				foreach ( $level1['children'] as $level2 ) {
					$this->assertArrayHasKey( 'children', $level2 );
					$this->assertSame( 0, count( $level2['children'] ) ); // level (2) child annotations per role (none).
				}
			}
		}
		$this->check_get_posts_response( $response );
	}

	/*
	 * Single item tests.
	 */

	/**
	 * Check that we can GET a single item in edit context.
	 */
	public function test_prepare_item() {
		wp_set_current_user( self::$user_id['editor'] );

		$request = new WP_REST_Request( 'GET', self::$rest_ns_base . '/' . self::$annotation_id['by_editor'] );
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
		wp_set_current_user( self::$user_id['editor'] );

		$request = new WP_REST_Request( 'GET', self::$rest_ns_base . '/' . self::$annotation_id['by_editor'] );

		$response = $this->server->dispatch( $request );
		$status   = $response->get_status();
		$data     = $response->get_data();

		$this->assertSame( 200, $status );
		$this->check_get_post_response( $response );
	}

	/**
	 * Check that a user who can edit the posts of others can GET a single annotation by another user.
	 */
	public function test_get_item_by_other() {
		wp_set_current_user( self::$user_id['editor'] );

		$request = new WP_REST_Request( 'GET', self::$rest_ns_base . '/' . self::$annotation_id['by_contributor'] );

		$response = $this->server->dispatch( $request );
		$status   = $response->get_status();
		$data     = $response->get_data();

		$this->assertSame( 200, $status );
		$this->check_get_post_response( $response );
	}

	/**
	 * Check that we can create (POST) a single annotation.
	 */
	public function test_create_item() {
		wp_set_current_user( self::$user_id['editor'] );

		$request = new WP_REST_Request( 'POST', self::$rest_ns_base );
		$request->set_body_params( array(
			'parent'         => 0,
			'status'         => 'publish',
			'author'         => self::$user_id['editor'],
			'type'           => gutenberg_annotation_post_type(),
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

		$request = new WP_REST_Request( 'PUT', self::$rest_ns_base . '/' . self::$annotation_id['by_contributor'] );
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
	 * Check that we can DELETE a single annotation.
	 */
	public function test_delete_item() {
		wp_set_current_user( self::$user_id['editor'] );

		$request = new WP_REST_Request( 'POST', self::$rest_ns_base );
		$request->set_body_params( array(
			'parent'         => 0,
			'status'         => 'publish',
			'author'         => self::$user_id['editor'],
			'content'        => '<p><strong>bold</strong> <em>italic</em> test annotation.</p>',
			'parent_post_id' => self::$post_id['by_editor'],
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
	 * Additional security tests.
	 */

	/**
	 * Check that users without permission can't GET a collection of annotations.
	 */
	public function test_get_items_when_not_allowed() {
		wp_set_current_user( self::$user_id['subscriber'] );

		$request = new WP_REST_Request( 'GET', self::$rest_ns_base );
		$request->set_param( 'per_page', 100 );

		$response = $this->server->dispatch( $request );
		$status   = $response->get_status();
		$data     = $response->get_data();

		$this->assertSame( rest_authorization_required_code(), $status );
		$this->assertSame( 'gutenberg_annotations_cannot_list_all', $data['code'] );
	}

	/**
	 * Check that users without permission can't GET a collection of annotations
	 * for a parent post that they are not allowed to edit.
	 */
	public function test_get_items_when_parent_post_id_not_allowed() {
		wp_set_current_user( self::$user_id['contributor'] );

		$request = new WP_REST_Request( 'GET', self::$rest_ns_base );
		$request->set_param( 'parent_post_id', self::$post_id['by_editor'] );
		$request->set_param( 'per_page', 100 );

		$response = $this->server->dispatch( $request );
		$status   = $response->get_status();
		$data     = $response->get_data();

		$this->assertSame( rest_authorization_required_code(), $status );
		$this->assertSame( 'gutenberg_annotations_cannot_list_parent_post', $data['code'] );
	}

	/**
	 * Check that users without permission can't GET a collection of annotations
	 * for an array of parent post IDs, where any one of the parents is uneditable by the user.
	 */
	public function test_get_items_when_any_parent_post_id_not_allowed() {
		wp_set_current_user( self::$user_id['contributor'] );

		$request = new WP_REST_Request( 'GET', self::$rest_ns_base );
		$request->set_param( 'parent_post_id', array( self::$post_id['by_contributor'], self::$post_id['by_editor'] ) );
		$request->set_param( 'per_page', 100 );

		$response = $this->server->dispatch( $request );
		$status   = $response->get_status();
		$data     = $response->get_data();

		$this->assertSame( rest_authorization_required_code(), $status );
		$this->assertSame( 'gutenberg_annotations_cannot_list_parent_post', $data['code'] );
	}

	/**
	 * Check that a user without permission can't GET a single annotation, even if they are the original author.
	 */
	public function test_get_item_when_not_allowed() {
		wp_set_current_user( self::$user_id['subscriber'] );

		$request = new WP_REST_Request( 'GET', self::$rest_ns_base . '/' . self::$annotation_id['by_subscriber'] );
		$request->set_param( 'per_page', 100 );

		$response = $this->server->dispatch( $request );
		$status   = $response->get_status();
		$data     = $response->get_data();

		$this->assertSame( rest_authorization_required_code(), $status );
		$this->assertSame( 'rest_forbidden', $data['code'] );
	}

	/**
	 * Again, check that a user without permission can't GET a single annotation.
	 */
	public function test_get_item_when_not_allowed2() {
		wp_set_current_user( self::$user_id['author'] );

		$request = new WP_REST_Request( 'GET', self::$rest_ns_base . '/' . self::$annotation_id['by_contributor'] );
		$request->set_param( 'per_page', 100 );

		$response = $this->server->dispatch( $request );
		$status   = $response->get_status();
		$data     = $response->get_data();

		$this->assertSame( rest_authorization_required_code(), $status );
		$this->assertSame( 'rest_forbidden', $data['code'] );
	}

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
	 * Check that users without permission can't PUT a single annotation.
	 */
	public function test_update_item_when_not_allowed() {
		wp_set_current_user( self::$user_id['subscriber'] );

		$request = new WP_REST_Request( 'PUT', self::$rest_ns_base . '/' . self::$annotation_id['by_subscriber'] );
		$request->set_param( 'substatus', 'archived' );

		$response = $this->server->dispatch( $request );
		$status   = $response->get_status();
		$data     = $response->get_data();

		$this->assertSame( rest_authorization_required_code(), $status );
		$this->assertSame( 'rest_cannot_edit', $data['code'] );
	}

	/**
	 * Test that a user is unable to update when a PUT request contains invalid field data.
	 */
	public function test_update_item_with_invalid_fields() {
		wp_set_current_user( self::$user_id['editor'] );

		$request = new WP_REST_Request( 'PUT', self::$rest_ns_base . '/' . self::$annotation_id['by_editor'] );
		$request->set_body_params( array(
			'substatus' => 'foo',
		) );

		$response = $this->server->dispatch( $request );
		$status   = $response->get_status();
		$data     = $response->get_data();

		$this->assertSame( 400, $status );
		$this->assertSame( 'rest_invalid_param', $data['code'] );
	}

	/**
	 * Test that a user is unable to DELETE a reply that's in a post they're unable to edit.
	 */
	public function test_delete_item_when_not_allowed() {
		wp_set_current_user( self::$user_id['author'] );

		$request = new WP_REST_Request( 'DELETE', self::$rest_ns_base . '/' . self::$annotation_id['_reply_by_contributor'] );

		$response = $this->server->dispatch( $request );
		$status   = $response->get_status();
		$data     = $response->get_data();

		$this->assertSame( rest_authorization_required_code(), $status );
		$this->assertSame( 'rest_cannot_delete', $data['code'] );
	}
}
