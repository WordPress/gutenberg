<?php
/**
 * WP_REST_Annotations_Controller Tests
 *
 * @package gutenberg
 */

require_once dirname( __FILE__ ) . '/includes/class-annotation-test-objects.php';
require_once dirname( __FILE__ ) . '/includes/class-annotation-test-utils.php';

/**
 * Tests WP_REST_Annotations_Controller.
 */
class REST_Annotations_Controller_Test extends WP_Test_REST_Controller_Testcase {
	/**
	 * REST namespace/base.
	 *
	 * @var string
	 */
	public $rest_ns_base = '/wp/v2/annotations';

	/**
	 * Magic first-access properties.
	 *
	 * @param  string $property Property name.
	 * @return mixed            Property value.
	 */
	public function __get( $property ) {
		if ( 'objects' === $property ) {
			$this->objects = new Annotation_Test_Objects( $this );
			return $this->objects;
		} elseif ( 'utils' === $property ) {
			$this->utils = new Annotation_Test_Utils( $this );
			return $this->utils;
		}
		return parent::__get( $property );
	}

	/**
	 * Test registered routes.
	 */
	public function test_register_routes() {
		$routes = $this->server->get_routes();

		$this->assertArrayHasKey( $this->rest_ns_base, $routes );
		$this->assertCount( 2, $routes[ $this->rest_ns_base ] );

		$this->assertArrayHasKey( $this->rest_ns_base . '/(?P<id>[\d]+)', $routes );
		$this->assertCount( 3, $routes[ $this->rest_ns_base . '/(?P<id>[\d]+)' ] );
	}

	/**
	 * Test JSON schema.
	 */
	public function test_get_item_schema() {
		$request = new WP_REST_Request( 'OPTIONS', $this->rest_ns_base );

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
	 * Test context.
	 */
	public function test_context_param() {
		$this->utils->set_current_user( 'editor' );

		$request  = new WP_REST_Request( 'OPTIONS', $this->rest_ns_base );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status(), 'status' );
		$this->assertSame( 'view', $data['endpoints'][0]['args']['context']['default'], 'default' );
		$this->assertSame( array( 'view', 'embed', 'edit' ), $data['endpoints'][0]['args']['context']['enum'], 'enum' );
	}

	/**
	 * Test ID-specific context.
	 */
	public function test_single_context_param() {
		$user       = $this->utils->set_current_user( 'editor' );
		$post       = $this->objects->create_post( $user->ID );
		$annotation = $this->objects->create_annotation( $post->ID, $user->ID );

		$request  = new WP_REST_Request( 'OPTIONS', $this->rest_ns_base . '/' . $annotation->comment_ID );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status(), 'status' );
		$this->assertSame( 'view', $data['endpoints'][0]['args']['context']['default'], 'default' );
		$this->assertSame( array( 'view', 'embed', 'edit' ), $data['endpoints'][0]['args']['context']['enum'], 'enum' );
	}

	/**
	 * Test GET items.
	 */
	public function test_get_items() {
		foreach ( $this->generate_get_items_tests() as $key => $test ) {
			list( $user, $params, $status, $count, $code, $assertions ) = $test;
			$this->utils->set_current_user( $user );

			$request            = new WP_REST_Request( 'GET', $this->rest_ns_base );
			$params['per_page'] = isset( $params['per_page'] ) ? $params['per_page'] : 100;

			foreach ( $params as $_key => $_value ) {
				$request->set_param( $_key, $_value );
			}

			$response        = $this->server->dispatch( $request );
			$response_status = $response->get_status();
			$response_data   = $response->get_data();
			$is_error        = $response->is_error();

			if ( $code || $is_error ) {
				$response_code = isset( $response_data['code'] ) ? $response_data['code'] : '';
				$this->assertSame( $code, $response_code, $key . '::error' );
			}
			$this->assertSame( $status, $response_status, $key . '::status' );
			$this->assertSame( $count, $is_error ? 0 : count( $response_data ), $key . '::count' );

			if ( ! $is_error ) {
				$context      = isset( $params['context'] ) ? $params['context'] : 'view';
				$hierarchical = isset( $params['hierarchical'] ) ? $params['hierarchical'] : '';
				$this->check_collection( $response, $context, 'threaded' === $hierarchical, $assertions );
			}
		}
	}

	/**
	 * Test GET item.
	 */
	public function test_get_item() {
		foreach ( $this->generate_get_item_tests() as $key => $test ) {
			list( $user, $id, $params, $status, $code, $assertions ) = $test;
			$this->utils->set_current_user( $user );

			$request = new WP_REST_Request( 'GET', $this->rest_ns_base . '/' . $id );

			foreach ( $params as $_key => $_value ) {
				$request->set_param( $_key, $_value );
			}

			$response        = $this->server->dispatch( $request );
			$response_status = $response->get_status();
			$response_data   = $response->get_data();
			$is_error        = $response->is_error();

			if ( $code || $is_error ) {
				$response_code = isset( $response_data['code'] ) ? $response_data['code'] : '';
				$this->assertSame( $code, $response_code, $key . '::error' );
			}
			$this->assertSame( $status, $response_status, $key . '::status' );

			if ( ! $is_error ) {
				$context = isset( $params['context'] ) ? $params['context'] : 'view';
				$this->check_data( $response_data, $context, $response->get_links(), false, $assertions );
			}
		}
	}

	/**
	 * Test GET item w/ edit context.
	 */
	public function test_prepare_item() {
		$this->markTestSkipped( 'Tested already via test_get_item().' );
	}

	/**
	 * Test POST item.
	 */
	public function test_create_item() {
		foreach ( $this->generate_create_item_tests() as $key => $test ) {
			list( $user, $params, $status, $code, $assertions ) = $test;
			$this->utils->set_current_user( $user );

			$request = new WP_REST_Request( 'POST', $this->rest_ns_base );

			foreach ( $params as $_key => $_value ) {
				$request->set_param( $_key, $_value );
			}

			$response        = $this->server->dispatch( $request );
			$response_status = $response->get_status();
			$response_data   = $response->get_data();
			$is_error        = $response->is_error();

			if ( $code || $is_error ) {
				$response_code = isset( $response_data['code'] ) ? $response_data['code'] : '';
				$this->assertSame( $code, $response_code, $key . '::error' );
			}
			$this->assertSame( $status, $response_status, $key . '::status' );

			if ( ! $is_error ) {
				$context = $user->has_cap( 'edit_annotation', $response_data['id'] ) ? 'edit' : 'view';
				$this->check_data( $response_data, $context, $response->get_links(), false, $assertions );
			}
		}
	}

	/**
	 * Test PUT item.
	 */
	public function test_update_item() {
		foreach ( $this->generate_update_item_tests() as $key => $test ) {
			list( $user, $id, $params, $status, $code, $assertions ) = $test;
			$this->utils->set_current_user( $user );

			$request = new WP_REST_Request( 'PUT', $this->rest_ns_base . '/' . $id );

			foreach ( $params as $_key => $_value ) {
				$request->set_param( $_key, $_value );
			}

			$response        = $this->server->dispatch( $request );
			$response_status = $response->get_status();
			$response_data   = $response->get_data();
			$is_error        = $response->is_error();

			if ( $code || $is_error ) {
				$response_code = isset( $response_data['code'] ) ? $response_data['code'] : '';
				$this->assertSame( $code, $response_code, $key . '::error' );
			}
			$this->assertSame( $status, $response_status, $key . '::status' );

			if ( ! $is_error ) {
				$this->check_data( $response_data, 'edit', $response->get_links(), false, $assertions );
			}
		}
	}

	/**
	 * Test DELETE item.
	 */
	public function test_delete_item() {
		foreach ( $this->generate_delete_item_tests() as $key => $test ) {
			list( $user, $id, $params, $status, $code ) = $test;
			$this->utils->set_current_user( $user );

			$request = new WP_REST_Request( 'DELETE', $this->rest_ns_base . '/' . $id );

			foreach ( $params as $_key => $_value ) {
				$request->set_param( $_key, $_value );
			}

			$response        = $this->server->dispatch( $request );
			$response_status = $response->get_status();
			$response_data   = $response->get_data();
			$is_error        = $response->is_error();

			if ( $code || $is_error ) {
				$response_code = isset( $response_data['code'] ) ? $response_data['code'] : '';
				$this->assertSame( $code, $response_code, $key . '::error' );
			}
			$this->assertSame( $status, $response_status, $key . '::status' );
		}
	}

	/**
	 * Test function calls.
	 */
	public function test_function_calls() {
		foreach ( $this->generate_function_tests() as $key => $test ) {
			list( $user, $function, $args, $assertions ) = $test;

			$this->utils->set_current_user( $user );
			$value = call_user_func_array( $function, $args );

			foreach ( $assertions as $_key => $assertion ) {
				$this->{ 'assert' . $assertion['assert'] }(
					$assertion['value'],
					$value,
					is_string( $_key ) ? $_key : $key
				);
			}
		}
	}

	/*
	 * --- Test generators -------------------------------------------------------
	 */

	/**
	 * Generates tests for {@see test_get_items()}.
	 *
	 * @return array Test arrays.
	 */
	protected function generate_get_items_tests() {
		$tests   = array();
		$counter = 0;

		$users                   = $this->objects->create_users();
		$posts                   = $this->objects->create_posts( $users, array( 'publish' ) );
		$trashed_posts           = $this->objects->create_posts( $users, array( 'trash' ) );
		$password_protected_post = $this->objects->create_post( $users['editor']->ID );
		wp_update_post( array(
			'ID'       => $password_protected_post->ID,
			'password' => 'foo',
		) );
		$annotations                     = $this->objects->create_annotations( array(
			'in_posts'      => $posts,
			'by_users'      => $users,
			'with_statuses' => array( '1', 'trash' ),
		) );
		$replies                         = $this->objects->create_annotations( array(
			'in_posts'      => $posts,
			'by_users'      => $users,
			'in_reply_to'   => $annotations,
			'with_statuses' => array( '1', 'trash' ),
		) );
		$annotations_in_trashed_posts    = $this->objects->create_annotations( array(
			'in_posts'      => $trashed_posts,
			'by_users'      => $users,
			'with_statuses' => array( '1' ),
		) );
		$password_protected_annotation   = $this->objects->create_annotation( array(
			'in_post_id' => $password_protected_post->ID,
			'by_user_id' => $users['editor']->ID,
		) );
		$post_ids                        = $this->utils->extract_ids( $posts );
		$trashed_post_ids                = $this->utils->extract_ids( $trashed_posts );
		$annotation_ids                  = $this->utils->extract_ids( $annotations );
		$annotation_ids_in_trashed_posts = $this->utils->extract_ids( $annotations_in_trashed_posts );

		// Admins and editors.
		foreach ( array( $users['administrator'], $users['editor'] ) as $user ) {
			foreach ( array( 'view', 'edit' ) as $context ) {

				// Test valid params.
				foreach ( array(
					array(
						'post' => $post_ids[0],
						8,
					),
					array(
						'post' => $post_ids,
						32,
					),
					array(
						'post'   => $post_ids,
						'parent' => $annotation_ids,
						16,
					),
					array(
						'post'         => $post_ids,
						'hierarchical' => 'flat',
						32,
					),
					array(
						'post'         => $post_ids,
						'hierarchical' => 'flat',
						'status'       => '1,trash',
						64,
					),
					array(
						'post'         => $post_ids,
						'hierarchical' => 'threaded',
						16,
					),
				) as $_params ) {
					list( $_count ) = $_params;
					unset( $_params[0] );

					$tests += $this->generate_collection_test( $user, $_params + array( 'context' => $context ), 200, $_count, '' );
					$counter++;
				}

				// Test no access in trashed posts.
				foreach ( $trashed_post_ids as $_trashed_post_id ) {
					$tests += $this->generate_collection_test(
						$user,
						array(
							'context' => $context,
							'post'    => $_trashed_post_id,
						),
						403,
						0,
						'rest_cannot_read_annotations'
					);
					$counter++;
				}
			}
		}

		// Authors and contributors.
		foreach ( array( $users['author'], $users['contributor'] ) as $user ) {
			$own_post_ids            = $this->utils->extract_ids( $posts[ $user->ID ] );
			$own_trashed_post_ids    = $this->utils->extract_ids( $trashed_posts[ $user->ID ] );
			$own_post_annotation_ids = array();

			foreach ( $annotations as $in_post_id => $annotations_by_users ) {
				if ( in_array( $in_post_id, $own_post_ids, true ) ) {
					$_extracted_ids          = $this->utils->extract_ids( $annotations_by_users );
					$own_post_annotation_ids = array_merge( $own_post_annotation_ids, $_extracted_ids );
				}
			}
			foreach ( array( 'view', 'edit' ) as $context ) {

				// Test valid params.
				foreach ( array(
					array(
						'post' => $own_post_ids[0],
						8,
					),
					array(
						'post' => $own_post_ids,
						8,
					),
					array(
						'post'   => $own_post_ids,
						'parent' => $own_post_annotation_ids,
						4,
					),
					array(
						'post'         => $own_post_ids,
						'hierarchical' => 'flat',
						8,
					),
					array(
						'post'         => $own_post_ids,
						'author'       => $user->ID,
						'hierarchical' => 'flat',
						'status'       => '1,trash',
						4,
					),
					array(
						'post'         => $own_post_ids,
						'hierarchical' => 'threaded',
						4,
					),
				) as $_params ) {
					list( $_count ) = $_params;
					unset( $_params[0] );

					$tests += $this->generate_collection_test( $user, $_params + array( 'context' => $context ), 200, $_count, '' );
					$counter++;
				}

				// Test no access in others' posts.
				foreach ( array_diff( $post_ids, $own_post_ids ) as $_others_post_id ) {
					$tests += $this->generate_collection_test(
						$user,
						array(
							'context' => $context,
							'post'    => $_others_post_id,
						),
						403,
						0,
						'rest_cannot_read_annotations'
					);
					$counter++;
				}

				// Test no access in others' trashed posts.
				foreach ( array_diff( $trashed_post_ids, $own_trashed_post_ids ) as $_trashed_post_id ) {
					$tests += $this->generate_collection_test(
						$user,
						array(
							'context' => $context,
							'post'    => $_trashed_post_id,
						),
						403,
						0,
						'rest_cannot_read_annotations_post'
					);
					$counter++;
				}

				// Test no access in own trashed posts.
				foreach ( $own_trashed_post_ids as $_own_trashed_post_id ) {
					$tests += $this->generate_collection_test(
						$user,
						array(
							'context' => $context,
							'post'    => $_own_trashed_post_id,
						),
						403,
						0,
						'rest_cannot_read_annotations'
					);
					$counter++;
				}

				// Test forbidden params.
				foreach ( array(
					'status'         => 'trash',
					'author'         => $users['editor']->ID,
					'author_exclude' => $users['editor']->ID,
					'author_email'   => $users['editor']->user_email,
				) as $_key => $_value ) {
					$tests += $this->generate_collection_test(
						$user,
						array( $_key => $_value ) + array(
							'context' => $context,
							'post'    => $own_post_ids[0],
						),
						403,
						0,
						'rest_forbidden_annotations_param_' . $_key
					);
					$counter++;
				}
			}
		}

		// Subscriber and anonymous users.
		foreach ( array( $users['subscriber'], $users['anonymous'] ) as $user ) {
			foreach ( array( 'view', 'edit' ) as $context ) {

				// Test no access to any.
				foreach ( array(
					array( 'post' => $post_ids ),
					array( 'post' => $post_ids[0] ),
				) as $_params ) {
					$tests += $this->generate_collection_test(
						$user,
						$_params + array(
							'context' => $context,
							'post'    => $post_ids[0],
						),
						$user->ID ? 403 : 401,
						0,
						'rest_cannot_read_annotations'
					);
					$counter++;
				}

				// Test no access to any in trashed posts.
				foreach ( array(
					array( 'post' => $trashed_post_ids ),
					array( 'post' => $trashed_post_ids[0] ),
				) as $_params ) {
					$tests += $this->generate_collection_test(
						$user,
						$_params + array(
							'context' => $context,
							'post'    => $trashed_post_ids[0],
						),
						$user->ID ? 403 : 401,
						0,
						'rest_cannot_read_annotations_post'
					);
					$counter++;
				}
			}
		}

		// Other tests with 'editor' user.
		foreach ( array( $users['editor'] ) as $user ) {
			foreach ( array( 'edit' ) as $context ) {

				// Test valid params.
				foreach ( array(
					array(
						'post' => $post_ids,
						'type' => get_default_annotation_type(),
						32,
					),
					array(
						'post' => $post_ids,
						'type' => array(
							get_default_annotation_type(),
							get_default_annotation_type(),
						),
						32,
					),
					array(
						'post'   => $post_ids[0],
						'author' => $user->ID,
						2,
					),
					array(
						'post'   => $post_ids[0],
						'author' => $user->ID,
						'status' => '1,trash',
						4,
					),
					array(
						'post'   => $post_ids,
						'author' => $user->ID,
						'status' => '1,trash',
						16,
					),
					array(
						'post'           => $post_ids,
						'author'         => $user->ID,
						'author_exclude' => $user->ID,
						0,
					),
					array(
						'post'           => $post_ids,
						'author_exclude' => $user->ID,
						24,
					),
					array(
						'post' => $post_ids,
						'via'  => 'gutenberg,other',
						32,
					),
					array(
						'post' => $post_ids,
						'via'  => 'other',
						0,
					),
					array(
						'post' => $password_protected_post->ID,
						1,
					),
					array(
						'post'         => $post_ids,
						'parent'       => 0,
						'hierarchical' => 'flat',
						32,
					),
				) as $_params ) {
					list( $_count ) = $_params;
					unset( $_params[0] );

					$tests += $this->generate_collection_test( $user, $_params + array( 'context' => $context ), 200, $_count, '' );
					$counter++;
				}

				// Test invalid params.
				foreach ( array(
					array( 'context' => 'foo' ),
					array( 'type' => 'foo' ),
					array(
						'type' => array(),
						'rest_invalid_param',
					),
					array( 'type' => array( '' ) ),
					array( 'type' => array( 'foo' => 'bar' ) ),
					array( 'type' => array( 'annotation', 'foo' ) ),
					array(
						'post' => null,
						'rest_missing_callback_param',
					),
					array(
						'post' => array(),
						'rest_invalid_param',
					),
					array(
						'post' => array( 0 ),
						'rest_invalid_param',
					),
					array(
						'post' => array( 999999 ),
						'rest_cannot_read_annotations_post',
						403,
					),
					array( 'post' => 'foo' ),
					array( 'password' => 0 ),
					array( 'parent' => 'foo' ),
					array( 'parent_exclude' => 'foo' ),
					array(
						'status' => array(),
						'rest_invalid_param',
					),
					array( 'status' => 'foo' ),
					array( 'status' => array( 'foo' => 'bar' ) ),
					array( 'status' => array( '1', 'foo' ) ),
					array( 'include' => 'foo' ),
					array( 'exclude' => 'foo' ),
					array( 'search' => 0 ),
					array( 'before' => 'foo' ),
					array( 'after' => 'foo' ),
					array( 'author' => 'foo' ),
					array( 'author_email' => 'foo' ),
					array( 'author_exclude' => 'foo' ),
					array( 'via' => '[foo]' ),
					array( 'via' => array( 'foo' => 'bar' ) ),
					array( 'via' => array( 'foo', '^bar' ) ),
					array( 'hierarchical' => 'foo' ),
					array( 'page' => 'foo' ),
					array( 'offset' => 'foo' ),
					array( 'per_page' => 'foo' ),
					array( 'order' => 'foo' ),
					array( 'orderby' => 'foo' ),
				) as $_params ) {
					$_params                += array( 'rest_invalid_param', 400 );
					list( $_code, $_status ) = $_params;
					unset( $_params[0], $_params[1] );

					$tests += $this->generate_collection_test(
						$user,
						$_params + array(
							'context' => $context,
							'post'    => $post_ids[0],
						),
						$_status,
						0,
						$_code
					);
					$counter++;
				}
			}
		}

		$this->assertSame( $counter, count( $tests ) );

		return $tests;
	}

	/**
	 * Generates tests for {@see test_get_item()}.
	 *
	 * @return array Test arrays.
	 */
	protected function generate_get_item_tests() {
		$tests   = array();
		$counter = 0;

		$users                   = $this->objects->create_users();
		$posts                   = $this->objects->create_posts( $users, array( 'publish' ) );
		$password_protected_post = $this->objects->create_post( $users['editor']->ID );
		wp_update_post( array(
			'ID'       => $password_protected_post->ID,
			'password' => 'foo',
		) );
		$annotations                   = $this->objects->create_annotations( array(
			'in_posts'      => $posts,
			'by_users'      => $users,
			'with_statuses' => array( '1', 'trash' ),
		) );
		$orphan_annotation             = $this->objects->create_annotation( array(
			'in_post_id' => 0,
			'by_user_id' => $users['editor']->ID,
		) );
		$unknown_post_annotation       = $this->objects->create_annotation( array(
			'in_post_id' => 999999,
			'by_user_id' => $users['editor']->ID,
		) );
		$password_protected_annotation = $this->objects->create_annotation( array(
			'in_post_id' => $password_protected_post->ID,
			'by_user_id' => $users['editor']->ID,
		) );
		$post_ids                      = $this->utils->extract_ids( $posts );
		$annotation_ids                = $this->utils->extract_ids( $annotations );

		// Admins and editors.
		foreach ( array( $users['administrator'], $users['editor'] ) as $user ) {
			foreach ( array( 'edit' ) as $context ) {

				// Test permissions.
				foreach ( $annotation_ids as $_id ) {
					$tests += $this->generate_id_test( $user, $_id, array( 'context' => $context ), 200, '' );
					$counter++;
				}
			}
		}

		// Authors and contributors.
		foreach ( array( $users['author'], $users['contributor'] ) as $user ) {
			$own_post_ids = $this->utils->extract_ids( $posts[ $user->ID ] );

			foreach ( array( 'view', 'edit' ) as $context ) {
				foreach ( $annotations as $_in_post_id => $_by_users ) {
					foreach ( $_by_users as $_by_user_id => $_with_statuses ) {
						foreach ( $_with_statuses as $_with_status => $_annotation ) {
							$_id                = (int) $_annotation->comment_ID;
							$_is_own_post       = in_array( $_in_post_id, $own_post_ids, true );
							$_is_own_annotation = $_by_user_id === $user->ID;

							// Test permissions.
							if ( ( $_is_own_post && $_is_own_annotation )
									|| ( $_is_own_post && 'view' === $context && 'trash' !== $_with_status ) ) {
								$tests += $this->generate_id_test( $user, $_id, array( 'context' => $context ), 200, '' );
							} elseif ( $_is_own_post && 'view' !== $context && 'trash' !== $_with_status ) {
								$tests += $this->generate_id_test( $user, $_id, array( 'context' => $context ), 403, 'rest_forbidden_annotation_context' );
							} else {
								$tests += $this->generate_id_test( $user, $_id, array( 'context' => $context ), 403, 'rest_cannot_read_annotation' );
							}
							$counter++;
						}
					}
				}
			}
		}

		// Subscriber and anonymous users.
		foreach ( array( $users['subscriber'], $users['anonymous'] ) as $user ) {
			foreach ( array( 'view', 'edit' ) as $context ) {

				// Test permissions.
				foreach ( $annotation_ids as $_id ) {
					$tests += $this->generate_id_test( $user, $_id, array( 'context' => $context ), $user->ID ? 403 : 401, 'rest_cannot_read_annotation' );
					$counter++;
				}
			}
		}

		// Other tests with 'editor' user.
		foreach ( array( $users['editor'] ) as $user ) {
			foreach ( array( 'edit' ) as $context ) {

				// Test valid params.
				foreach ( array(
					array( $password_protected_annotation->comment_ID ),
				) as $_params ) {
					$_params    += array( $annotation_ids[0] );
					list( $_id ) = $_params;
					unset( $_params[0] );

					$tests += $this->generate_id_test( $user, $_id, $_params + array( 'context' => $context ), 200, '' );
					$counter++;
				}

				// Test invalid params.
				foreach ( array(
					array( 'rest_no_route', 404, null ),
					array( 'rest_cannot_read_annotation_post', 403, 0 ),
					array( 'rest_cannot_read_annotation_post', 403, 999999 ),
					array( 'rest_no_route', 404, '0/' . $annotation_ids[0] ),
					array( 'rest_cannot_read_annotation_post', 403, $orphan_annotation->comment_ID ),
					array( 'rest_cannot_read_annotation_post', 403, $unknown_post_annotation->comment_ID ),
					array(
						'context' => 'foo',
						'rest_invalid_param',
					),
				) as $_params ) {
					$_params                      += array( 'rest_invalid_param', 400, $annotation_ids[0] );
					list( $_code, $_status, $_id ) = $_params;
					unset( $_params[0], $_params[1], $_params[2] );

					$tests += $this->generate_id_test(
						$user,
						$_id,
						$_params + array(
							'context' => $context,
							'post'    => $post_ids[0],
						),
						$_status,
						$_code
					);
					$counter++;
				}
			}
		}

		$this->assertSame( $counter, count( $tests ) );

		return $tests;
	}

	/**
	 * Generates tests for {@see test_create_item()}.
	 *
	 * @return array Test arrays.
	 */
	protected function generate_create_item_tests() {
		$tests   = array();
		$counter = 0;

		update_option( 'require_name_email', '1' );
		add_filter( 'annotation_selector_is_allowed', '__return_true' );

		$users         = $this->objects->create_users();
		$no_email_user = $this->objects->create_user( 'editor' );
		wp_update_user( array(
			'ID'         => $no_email_user->ID,
			'user_email' => '',
		) );
		$posts                   = $this->objects->create_posts( $users, array( 'publish' ) );
		$password_protected_post = $this->objects->create_post( $users['editor']->ID );
		wp_update_post( array(
			'ID'       => $password_protected_post->ID,
			'password' => 'foo',
		) );
		$post_ids    = $this->utils->extract_ids( $posts );
		$max_lengths = wp_get_comment_fields_max_lengths();

		// Admins and editors.
		foreach ( array( $users['administrator'], $users['editor'] ) as $user ) {

			// Test permissions.
			foreach ( $users as $_user ) {
				if ( $_user->ID ) {
					foreach ( $post_ids as $_post_id ) {
						$tests += $this->generate_test(
							$user,
							array(
								'post'    => $_post_id,
								'author'  => $_user->ID,
								'content' => 'foo',
							),
							201,
							''
						);
						$counter++;
					}
				}
			}
		}

		// Authors and contributors.
		foreach ( array( $users['author'], $users['contributor'] ) as $user ) {
			$own_post_ids = $this->utils->extract_ids( $posts[ $user->ID ] );

			foreach ( $posts as $_by_user_id => $_with_statuses ) {
				foreach ( $_with_statuses as $_with_status => $_post ) {
					$_is_own_post = in_array( $_post->ID, $own_post_ids, true );

					// Test permissions.
					if ( $_is_own_post ) {
						$tests += $this->generate_test(
							$user,
							array(
								'post'    => $_post->ID,
								'content' => 'foo',
							),
							201,
							''
						);
						$counter++;
					} else {
						$tests += $this->generate_test(
							$user,
							array(
								'post'    => $_post->ID,
								'content' => 'foo',
							),
							403,
							'rest_cannot_create_annotation'
						);
						$counter++;
					}
				}
			}

			// Test inability to create as another user.
			foreach ( $users as $_user ) {
				if ( $_user->ID && $_user->ID !== $user->ID ) {
					$tests += $this->generate_test(
						$user,
						array(
							'post'    => $own_post_ids[0],
							'author'  => $_user->ID,
							'content' => 'foo',
						),
						403,
						'rest_forbidden_annotation_param_author'
					);
					$counter++;
				}
			}

			// Test filtered HTML.
			$tests += $this->generate_test(
				$user,
				array(
					'post'    => $own_post_ids[0],
					'content' => '<foo><code>bar</code></foo>',
				),
				201,
				'',
				array(
					'only allowed tags should remain' => array(
						'key'    => 'content.raw',
						'assert' => 'same',
						'value'  => '<code>bar</code>',
					),
				)
			);
			$counter++;

			// Test filtered HTML w/ empty content check.
			$tests += $this->generate_test(
				$user,
				array(
					'post'    => $own_post_ids[0],
					'content' => '<svg><p>0 <foo /></p></svg>',
				),
				400,
				'rest_missing_annotation_content'
			);
			$counter++;

			// Test restricted statuses.
			foreach ( array( '0', 'hold', 'spam' ) as $status ) {
				$tests += $this->generate_test(
					$user,
					array(
						'post'    => $own_post_ids[0],
						'content' => 'foo',
						'status'  => $status,
					),
					403,
					'rest_forbidden_annotation_param_status'
				);
				$counter++;
			}
		}

		// Subscriber and anonymous users.
		foreach ( array( $users['subscriber'], $users['anonymous'] ) as $user ) {

			// Test permissions.
			foreach ( $post_ids as $_post_id ) {
				$tests += $this->generate_test(
					$user,
					array(
						'post'    => $_post_id,
						'author'  => $user->ID,
						'content' => 'foo',
					),
					$user->ID ? 403 : 401,
					'rest_cannot_create_annotation'
				);
				$counter++;
			}
		}

		// Other tests with 'editor' user.
		foreach ( array( $users['editor'] ) as $user ) {

			// Test valid params.
			foreach ( array(
				array( 'status' => 'hold' ),
				array( 'status' => 'approve' ),
				array( 'status' => 'spam' ),
				array( 'status' => 'unspam' ),
				array( 'status' => 'trash' ),
				array( 'status' => 'untrash' ),
				array( 'status' => 'resolve' ),
				array( 'status' => 'reject' ),
				array( 'status' => 'archive' ),
				array(
					'via'      => 'foo',
					'selector' => array(),
				),
				array(
					'selector' => array(
						'type'       => 'FragmentSelector',
						'conformsTo' => 'https://foo.com',
						'value'      => 'foo',
						'refinedBy'  => array(
							'type'  => 'TextPositionSelector',
							'start' => 0,
							'end'   => 0,
						),
					),
				),
				array(
					'selector' => array(
						'type'      => 'CssSelector',
						'value'     => '#foo > .bar',
						'refinedBy' => array(
							'type'  => 'DataPositionSelector',
							'start' => 0,
							'end'   => 0,
						),
					),
				),
				array(
					'selector' => array(
						'type'   => 'TextQuoteSelector',
						'exact'  => 'foo bar',
						'prefix' => 'foo',
						'suffix' => 'bar',
					),
				),
				array(
					'selector' => array(
						'type'          => 'RangeSelector',
						'startSelector' => array(
							'type'      => 'XPathSelector',
							'value'     => '//*[@id="c9xi4jhi"]/text()[1]',
							'refinedBy' => array(
								'type'  => 'TextPositionSelector',
								'start' => 0,
								'end'   => 0,
							),
						),
						'endSelector'   => array(
							'type'      => 'XPathSelector',
							'value'     => '//*[@id="c9xi4jhi"]/text()[1]',
							'refinedBy' => array(
								'type'  => 'TextPositionSelector',
								'start' => 1,
								'end'   => 1,
							),
						),
					),
				),
				array(
					'selector' => array(
						'type' => 'SvgSelector',
						'id'   => 'https://foo.com/foo.svg',
					),
				),
				array(
					'selector' => array(
						'type'  => 'SvgSelector',
						'value' => '<svg></svg>',
					),
				),
				array(
					'content' => 'Iñtërnâtiônàlizætiøn 🤪',
					array(
						'valid UTF-8 chars' => array(
							'key'    => 'content.raw',
							'assert' => 'same',
							'value'  => 'Iñtërnâtiônàlizætiøn 🤪',
						),
					),
				),
				array(
					'content' => "\xc3\xb1",
					array(
						'valid 2-byte UTF-8 sequence' => array(
							'key'    => 'content.raw',
							'assert' => 'same',
							'value'  => "\xc3\xb1",
						),
					),
				),
				array(
					'content' => "\xe2\x82\xa1",
					array(
						'valid 3-byte UTF-8 sequence' => array(
							'key'    => 'content.raw',
							'assert' => 'same',
							'value'  => "\xe2\x82\xa1",
						),
					),
				),
				array(
					'content' => "\xf0\x90\x8c\xbc",
					array(
						'valid 4-byte UTF-8 sequence' => array(
							'key'    => 'content.raw',
							'assert' => 'same',
							'value'  => "\xf0\x90\x8c\xbc",
						),
					),
				),
				array( 'meta' => array( 'foo' => 'bar' ) ),
				array( 'post' => $password_protected_post->ID ),
			) as $_params ) {
				$_params    += array( array() );
				$_assertions = $_params[0];
				unset( $_params[0] );

				$tests += $this->generate_test(
					$user,
					$_params + array(
						'post'    => $post_ids[0],
						'author'  => $user->ID,
						'content' => 'foo',
					),
					201,
					'',
					$_assertions
				);
				$counter++;
			}

			// Test invalid params.
			foreach ( array(
				array(
					'id' => 1,
					'rest_readonly_annotation_param_id',
				),
				array(
					'post' => null,
					'rest_cannot_read_annotation_post',
					403,
				),
				array(
					'post' => 0,
					'rest_cannot_read_annotation_post',
					403,
				),
				array(
					'post' => 999999,
					'rest_cannot_read_annotation_post',
					403,
				),
				array( 'post' => 'foo' ),
				array( 'type' => '' ),
				array( 'type' => 'foo' ),
				array( 'type' => 'comment' ),
				array( 'parent' => 'foo' ),
				array(
					'parent' => 999999,
					'rest_cannot_read_annotation_parent',
					403,
				),
				array( 'date' => 'foo' ),
				array( 'date_gmt' => 'foo' ),
				array( 'author' => 'foo' ),
				array(
					'author' => '123',
					'rest_comment_author_invalid',
				),
				array( 'author_name' => 0 ),
				array(
					'author' => $no_email_user->ID,
					'rest_missing_annotation_author_data',
				),
				array(
					'author_name' => str_repeat( 'x', $max_lengths['comment_author'] + 1 ),
					'comment_author_column_length',
				),
				array( 'author_email' => 'foo' ),
				array(
					'author_email' => str_repeat( 'x', $max_lengths['comment_author_email'] + 1 ) . '@foo.com',
					'comment_author_email_column_length',
				),
				array( 'author_url' => 0 ),
				array( 'author_ip' => 0 ),
				array( 'author_user_agent' => 0 ),
				array(
					'content' => 0,
					'rest_missing_annotation_content',
				),
				array(
					'content' => null,
					'rest_missing_annotation_content',
				),
				array( // A lonely first byte of a 2-byte sequence.
					'content' => "\xc0",
					'rest_missing_annotation_content',
				),
				array( // A lonely first byte of a 3-byte sequence.
					'content' => "\xe0",
					'rest_missing_annotation_content',
				),
				array( // A lonely first byte of a 4-byte sequence.
					'content' => "\xf0",
					'rest_missing_annotation_content',
				),
				array( // A valid 5-byte sequence is not valid UTF-8.
					'content' => "\xf8\xa1\xa1\xa1\xa1",
					'rest_missing_annotation_content',
				),
				array( // A valid 6-byte sequence is not valid UTF-8.
					'content' => "\xfc\xa1\xa1\xa1\xa1\xa1",
					'rest_missing_annotation_content',
				),
				array(
					'content' => " 0 \t \n \r \0 \x0B" .
						' <script src="#">foo</script> <style href="#">foo</style>' .
						' &nbsp; <div>&nbsp;</div> <p></p> <br/><br> <hr/><hr> </><>',
					'rest_missing_annotation_content',
				),
				array(
					'content' => str_repeat( 'x', $max_lengths['comment_content'] + 1 ),
					'comment_content_column_length',
				),
				array( 'via' => 0 ),
				array(
					'via' => '[foo]',
					'rest_annotation_field_validation_update_failure',
				),
				array( 'selector' => 'foo' ),
				array( 'selector' => array( 'type' => '' ) ),
				array( 'selector' => array( 'type' => 'foo' ) ),
				array(
					'selector' => array(
						'type'  => 'CssSelector',
						'value' => str_repeat( 'x', 16385 ),
					),
					'rest_annotation_field_validation_update_failure',
				),
				// FragmentSelector type.
				array(
					'selector' => array(
						'type' => 'FragmentSelector',
						'foo'  => '',
					),
					'rest_annotation_field_validation_update_failure',
				),
				array(
					'selector' => array(
						'type'  => 'FragmentSelector',
						'value' => '',
					),
					'rest_annotation_field_validation_update_failure',
				),
				array(
					'selector' => array(
						'type'       => 'FragmentSelector',
						'value'      => 'foo',
						'conformsTo' => ':',
					),
					'rest_annotation_field_validation_update_failure',
				),
				array(
					'selector' => array(
						'type'      => 'FragmentSelector',
						'value'     => 'foo',
						'refinedBy' => array(),
					),
					'rest_annotation_field_validation_update_failure',
				),
				// CssSelector type.
				array(
					'selector' => array(
						'type' => 'CssSelector',
						'foo'  => '',
					),
					'rest_annotation_field_validation_update_failure',
				),
				array(
					'selector' => array(
						'type'  => 'CssSelector',
						'value' => '',
					),
					'rest_annotation_field_validation_update_failure',
				),
				array(
					'selector' => array(
						'type'      => 'CssSelector',
						'value'     => 'foo',
						'refinedBy' => array(),
					),
					'rest_annotation_field_validation_update_failure',
				),
				// TextQuoteSelector type.
				array(
					'selector' => array(
						'type' => 'TextQuoteSelector',
						'foo'  => '',
					),
					'rest_annotation_field_validation_update_failure',
				),
				array(
					'selector' => array(
						'type'  => 'TextQuoteSelector',
						'exact' => 0,
					),
					'rest_annotation_field_validation_update_failure',
				),
				array(
					'selector' => array(
						'type'  => 'TextQuoteSelector',
						'exact' => '',
					),
					'rest_annotation_field_validation_update_failure',
				),
				array(
					'selector' => array(
						'type'   => 'TextQuoteSelector',
						'exact'  => 'foo',
						'prefix' => 0,
					),
					'rest_annotation_field_validation_update_failure',
				),
				array(
					'selector' => array(
						'type'   => 'TextQuoteSelector',
						'exact'  => 'foo',
						'suffix' => 0,
					),
					'rest_annotation_field_validation_update_failure',
				),
				// TextPositionSelector type.
				array(
					'selector' => array(
						'type' => 'TextPositionSelector',
						'foo'  => '',
					),
					'rest_annotation_field_validation_update_failure',
				),
				array(
					'selector' => array(
						'type'  => 'TextPositionSelector',
						'start' => null,
					),
					'rest_annotation_field_validation_update_failure',
				),
				array(
					'selector' => array(
						'type'  => 'TextPositionSelector',
						'start' => 0,
						'end'   => null,
					),
					'rest_annotation_field_validation_update_failure',
				),
				// SvgSelector type.
				array(
					'selector' => array(
						'type' => 'SvgSelector',
						'foo'  => '',
					),
					'rest_annotation_field_validation_update_failure',
				),
				array(
					'selector' => array(
						'type'  => 'SvgSelector',
						'id'    => '',
						'value' => '',
					),
					'rest_annotation_field_validation_update_failure',
				),
				array(
					'selector' => array(
						'type' => 'SvgSelector',
						'id'   => ':',
					),
					'rest_annotation_field_validation_update_failure',
				),
				array(
					'selector' => array(
						'type'  => 'SvgSelector',
						'value' => 'foo',
					),
					'rest_annotation_field_validation_update_failure',
				),
				// RangeSelector type.
				array(
					'selector' => array(
						'type' => 'RangeSelector',
						'foo'  => '',
					),
					'rest_annotation_field_validation_update_failure',
				),
				array(
					'selector' => array(
						'type'          => 'RangeSelector',
						'startSelector' => array(),
					),
					'rest_annotation_field_validation_update_failure',
				),
				array(
					'selector' => array(
						'type'          => 'RangeSelector',
						'startSelector' => array( 'foo' ),
						'endSelector'   => array( 'foo' ),
					),
					'rest_annotation_field_validation_update_failure',
				),
				array(
					'selector' => array(
						'type'          => 'RangeSelector',
						'startSelector' => array(
							'type'  => 'CssSelector',
							'value' => '#foo',
						),
						'endSelector'   => array( 'foo' ),
					),
					'rest_annotation_field_validation_update_failure',
				),
				array( 'status' => '' ),
				array( 'status' => 'foo' ),
				array( 'meta' => 'foo' ),
				array(
					'author_url' => 'https://foo.com/' . str_repeat( 'x', $max_lengths['comment_author_url'] + 1 ),
					'comment_author_url_column_length',
				),
			) as $_params ) {
				$_params                              += array( 'rest_invalid_param', 400, array() );
				list( $_code, $_status, $_assertions ) = $_params;
				unset( $_params[0], $_params[1], $_params[2] );

				$tests += $this->generate_test(
					$user,
					$_params + array(
						'post'    => $post_ids[0],
						'author'  => $user->ID,
						'content' => 'foo',
					),
					$_status,
					$_code,
					$_assertions
				);
				$counter++;
			}
		}

		$this->assertSame( $counter, count( $tests ) );

		return $tests;
	}

	/**
	 * Generates tests for {@see test_update_item()}.
	 *
	 * @return array Test arrays.
	 */
	protected function generate_update_item_tests() {
		$tests   = array();
		$counter = 0;

		update_option( 'require_name_email', '1' );
		add_filter( 'annotation_selector_is_allowed', '__return_true' );

		$users                   = $this->objects->create_users();
		$posts                   = $this->objects->create_posts( $users, array( 'publish' ) );
		$password_protected_post = $this->objects->create_post( $users['editor']->ID );
		wp_update_post( array(
			'ID'       => $password_protected_post->ID,
			'password' => 'foo',
		) );
		$annotations                   = $this->objects->create_annotations( array(
			'in_posts'      => $posts,
			'by_users'      => $users,
			'with_statuses' => array( '1', 'trash' ),
		) );
		$orphan_annotation             = $this->objects->create_annotation( array(
			'in_post_id' => 0,
			'by_user_id' => $users['editor']->ID,
		) );
		$unknown_post_annotation       = $this->objects->create_annotation( array(
			'in_post_id' => 999999,
			'by_user_id' => $users['editor']->ID,
		) );
		$password_protected_annotation = $this->objects->create_annotation( array(
			'in_post_id' => $password_protected_post->ID,
			'by_user_id' => $users['editor']->ID,
		) );
		$post_ids                      = $this->utils->extract_ids( $posts );
		$annotation_ids                = $this->utils->extract_ids( $annotations );
		$max_lengths                   = wp_get_comment_fields_max_lengths();

		// Admins and editors.
		foreach ( array( $users['administrator'], $users['editor'] ) as $user ) {

			// Test permissions.
			foreach ( $annotation_ids as $_id ) {
				$tests += $this->generate_id_test(
					$user,
					$_id,
					array(
						'author_name'       => 'foo',
						'author_email'      => 'foo@bar.com',
						'author_ip'         => '127.0.0.1',
						'author_user_agent' => 'foo',
						'author_url'        => 'https://foo.com',
						'content'           => 'foo',
					),
					200,
					''
				);
				$counter++;
			}
		}

		// Authors and contributors.
		foreach ( array( $users['author'], $users['contributor'] ) as $user ) {
			$own_post_ids = $this->utils->extract_ids( $posts[ $user->ID ] );

			foreach ( $annotations as $_in_post_id => $_by_users ) {
				foreach ( $_by_users as $_by_user_id => $_with_statuses ) {
					foreach ( $_with_statuses as $_with_status => $_annotation ) {
						$_id                = (int) $_annotation->comment_ID;
						$_is_own_post       = in_array( $_in_post_id, $own_post_ids, true );
						$_is_own_annotation = $_by_user_id === $user->ID;

						// Test permissions.
						if ( $_is_own_post && $_is_own_annotation ) {
							$tests += $this->generate_id_test(
								$user,
								$_id,
								array(
									'content' => 'foo',
									'status'  => $_annotation->comment_approved,
								),
								200,
								''
							);
							$counter++;

							// Test restricted params.
							$_0_255  = mt_rand( 0, 255 );
							$_uniqid = str_replace( '.', '', uniqid( '', true ) );

							foreach ( array(
								'author'            => $users['editor']->ID,
								'author_name'       => $_uniqid . '-foo',
								'author_email'      => $_uniqid . '@foo.com',
								'author_ip'         => $_0_255 . str_repeat( '.' . $_0_255, 3 ),
								'author_user_agent' => $_uniqid . '-foo',
								'author_url'        => 'https://' . $_uniqid . '-foo.com',
								'status'            => 'spam',
							) as $_key => $_value ) {
								$tests += $this->generate_id_test( $user, $_id, array( $_key => $_value ), 403, 'rest_forbidden_annotation_param_' . $_key );
								$counter++;
							}
						} else {
							$tests += $this->generate_id_test( $user, $_id, array( 'content' => 'foo' ), 403, 'rest_cannot_update_annotation' );
							$counter++;
						}
					}
				}
			}
		}

		// Subscriber and anonymous users.
		foreach ( array( $users['subscriber'], $users['anonymous'] ) as $user ) {

			// Test permissions.
			foreach ( $annotation_ids as $_id ) {
				$tests += $this->generate_id_test( $user, $_id, array( 'content' => 'foo' ), $user->ID ? 403 : 401, 'rest_cannot_update_annotation' );
				$counter++;
			}
		}

		// Other tests with 'editor' user.
		foreach ( array( $users['editor'] ) as $user ) {

			// Test valid params.
			foreach ( array(
				array(
					'via'      => 'foo',
					'selector' => array(),
				),
				array(
					'via'      => 'foo',
					'selector' => array(
						'type'  => 'CssSelector',
						'value' => '#foo > .bar',
					),
				),
				array(
					'content' => 'Iñtërnâtiônàlizætiøn 🤪',
					array(
						'valid UTF-8 chars' => array(
							'key'    => 'content.raw',
							'assert' => 'same',
							'value'  => 'Iñtërnâtiônàlizætiøn 🤪',
						),
					),
				),
				array(
					'content' => "\xc3\xb1",
					array(
						'valid 2-byte UTF-8 sequence' => array(
							'key'    => 'content.raw',
							'assert' => 'same',
							'value'  => "\xc3\xb1",
						),
					),
				),
				array(
					'content' => "\xe2\x82\xa1",
					array(
						'valid 3-byte UTF-8 sequence' => array(
							'key'    => 'content.raw',
							'assert' => 'same',
							'value'  => "\xe2\x82\xa1",
						),
					),
				),
				array(
					'content' => "\xf0\x90\x8c\xbc",
					array(
						'valid 4-byte UTF-8 sequence' => array(
							'key'    => 'content.raw',
							'assert' => 'same',
							'value'  => "\xf0\x90\x8c\xbc",
						),
					),
				),
				array( array(), $password_protected_annotation->comment_ID ),
			) as $_params ) {
				$_params                  += array( array(), $annotation_ids[0] );
				list( $_assertions, $_id ) = $_params;
				unset( $_params[0], $_params[1] );

				$tests += $this->generate_id_test( $user, $_id, $_params + array( 'content' => 'foo' ), 200, '', $_assertions );
				$counter++;
			}

			// Test invalid params.
			foreach ( array(
				array(
					'post' => 999999,
					'rest_cannot_update_annotation_param_post',
				),
				array(
					'type' => 'comment',
					'rest_invalid_param',
				),
				array(
					'parent' => 999999,
					'rest_cannot_update_annotation_param_parent',
				),
				array(
					'rest_cannot_read_annotation_post',
					403,
					3 => 999999,
				),
				array(
					'rest_cannot_read_annotation_post',
					403,
					3 => $orphan_annotation->comment_ID,
				),
				array(
					'rest_cannot_read_annotation_post',
					403,
					3 => $unknown_post_annotation->comment_ID,
				),
				array( 'date' => 'foo' ),
				array( 'date_gmt' => 'foo' ),
				array( 'author' => 'foo' ),
				array( 'author_name' => 0 ),
				array(
					'author_name' => str_repeat( 'x', $max_lengths['comment_author'] + 1 ),
					'comment_author_column_length',
				),
				array( 'author_email' => 'foo' ),
				array(
					'author_email' => str_repeat( 'x', $max_lengths['comment_author_email'] + 1 ) . '@foo.com',
					'comment_author_email_column_length',
				),
				array( 'author_url' => 0 ),
				array( 'author_ip' => 0 ),
				array( 'author_user_agent' => 0 ),
				array( // A lonely first byte of a 2-byte sequence.
					'content' => "\xc0",
					'rest_missing_annotation_content',
				),
				array( // A lonely first byte of a 3-byte sequence.
					'content' => "\xe0",
					'rest_missing_annotation_content',
				),
				array( // A lonely first byte of a 4-byte sequence.
					'content' => "\xf0",
					'rest_missing_annotation_content',
				),
				array( // A valid 5-byte sequence is not valid UTF-8.
					'content' => "\xf8\xa1\xa1\xa1\xa1",
					'rest_missing_annotation_content',
				),
				array( // A valid 6-byte sequence is not valid UTF-8.
					'content' => "\xfc\xa1\xa1\xa1\xa1\xa1",
					'rest_missing_annotation_content',
				),
				array(
					'content' => " 0 \t \n \r \0 \x0B" .
						' <script src="#">foo</script> <style href="#">foo</style>' .
						' &nbsp; <div>&nbsp;</div> <p></p> <br/><br> <hr/><hr> </><>',
					'rest_missing_annotation_content',
				),
				array(
					'content' => str_repeat( 'x', $max_lengths['comment_content'] + 1 ),
					'comment_content_column_length',
				),
				array( 'via' => 0 ),
				array(
					'via' => '[foo]',
					'rest_annotation_field_validation_update_failure',
				),
				array( 'selector' => 'foo' ),
				array( 'selector' => array( 'type' => 'foo' ) ),
				array(
					'selector' => array(
						'type'  => 'CssSelector',
						'value' => '',
					),
					'rest_annotation_field_validation_update_failure',
				),
				array( 'status' => 'foo' ),
				array( 'meta' => 'foo' ),
				array(
					'author_url' => 'https://foo.com/' . str_repeat( 'x', $max_lengths['comment_author_url'] + 1 ),
					'comment_author_url_column_length',
				),
			) as $_params ) {
				$_params                                    += array( 'rest_invalid_param', 400, array(), $annotation_ids[0] );
				list( $_code, $_status, $_assertions, $_id ) = $_params;
				unset( $_params[0], $_params[1], $_params[2], $_params[3] );

				$tests += $this->generate_id_test( $user, $_id, $_params + array( 'content' => 'foo' ), $_status, $_code, $_assertions );
				$counter++;
			}
		}

		$this->assertSame( $counter, count( $tests ) );

		return $tests;
	}

	/**
	 * Generates tests for {@see test_delete_item()}.
	 *
	 * @return array Test arrays.
	 */
	protected function generate_delete_item_tests() {
		$tests   = array();
		$counter = 0;

		$users                   = $this->objects->create_users();
		$posts                   = $this->objects->create_posts( $users, array( 'publish' ) );
		$password_protected_post = $this->objects->create_post( $users['editor']->ID );
		wp_update_post( array(
			'ID'       => $password_protected_post->ID,
			'password' => 'foo',
		) );
		$password_protected_annotation = $this->objects->create_annotation( array(
			'in_post_id' => $password_protected_post->ID,
			'by_user_id' => $users['editor']->ID,
		) );
		$orphan_annotation             = $this->objects->create_annotation( array(
			'in_post_id' => 0,
			'by_user_id' => $users['editor']->ID,
		) );
		$unknown_post_annotation       = $this->objects->create_annotation( array(
			'in_post_id' => 999999,
			'by_user_id' => $users['editor']->ID,
		) );
		$post_ids                      = $this->utils->extract_ids( $posts );

		// Admins and editors.
		foreach ( array( $users['administrator'], $users['editor'] ) as $user ) {
			$annotations = $this->objects->create_annotations( array(
				'in_posts'      => $posts,
				'by_users'      => $users,
				'with_statuses' => array( '1' ),
			) );

			// Test permissions.
			foreach ( $this->utils->extract_ids( $annotations ) as $_id ) {
				$tests += $this->generate_id_test( $user, $_id, array( 'force' => true ), 200, '' );
				$counter++;
			}
		}

		// Authors and contributors.
		foreach ( array( $users['author'], $users['contributor'] ) as $user ) {
			$own_post_ids = $this->utils->extract_ids( $posts[ $user->ID ] );
			$annotations  = $this->objects->create_annotations( array(
				'in_posts'      => $posts,
				'by_users'      => $users,
				'with_statuses' => array( '1' ),
			) );

			foreach ( $annotations as $_in_post_id => $_by_users ) {
				foreach ( $_by_users as $_by_user_id => $_with_statuses ) {
					foreach ( $_with_statuses as $_with_status => $_annotation ) {
						$_id                = (int) $_annotation->comment_ID;
						$_is_own_post       = in_array( $_in_post_id, $own_post_ids, true );
						$_is_own_annotation = $_by_user_id === $user->ID;

						// Test permissions.
						if ( $_is_own_post && $_is_own_annotation ) {
							$tests += $this->generate_id_test( $user, $_id, array( 'force' => true ), 200, '' );
						} else {
							$tests += $this->generate_id_test( $user, $_id, array(), 403, 'rest_cannot_delete_annotation' );
						}
						$counter++;
					}
				}
			}
		}

		// Subscriber and anonymous users.
		$annotations = $this->objects->create_annotations( array(
			'in_posts'      => $posts,
			'by_users'      => $users,
			'with_statuses' => array( '1' ),
		) );
		foreach ( array( $users['subscriber'], $users['anonymous'] ) as $user ) {
			// Test permissions.
			foreach ( $this->utils->extract_ids( $annotations ) as $_id ) {
				$tests += $this->generate_id_test( $user, $_id, array(), $user->ID ? 403 : 401, 'rest_cannot_delete_annotation' );
				$counter++;
			}
		}

		// Other tests with 'editor' user.
		$annotations    = $this->objects->create_annotations( array(
			'in_posts'      => $posts,
			'by_users'      => array( $users['editor'] ),
			'with_statuses' => array( '1' ),
		) );
		$annotation_ids = $this->utils->extract_ids( $annotations );

		foreach ( array( $users['editor'] ) as $user ) {
			// Test valid params.
			foreach ( array(
				array( array(), $password_protected_annotation->comment_ID ),
			) as $_params ) {
				$_params                  += array( array(), $annotation_ids[0] );
				list( $_assertions, $_id ) = $_params;
				unset( $_params[0], $_params[1] );

				$tests += $this->generate_id_test( $user, $_id, array(), 200, '', $_assertions );
				$counter++;
			}

			// Test invalid params.
			foreach ( array(
				array(
					'rest_cannot_read_annotation_post',
					403,
					3 => 999999,
				),
				array(
					'rest_cannot_read_annotation_post',
					403,
					3 => $orphan_annotation->comment_ID,
				),
				array(
					'rest_cannot_read_annotation_post',
					403,
					3 => $unknown_post_annotation->comment_ID,
				),
			) as $_params ) {
				$_params                                    += array( 'rest_invalid_param', 400, array(), $annotation_ids[0] );
				list( $_code, $_status, $_assertions, $_id ) = $_params;
				unset( $_params[0], $_params[1], $_params[2], $_params[3] );

				$tests += $this->generate_id_test( $user, $_id, array(), $_status, $_code, $_assertions );
				$counter++;
			}
		}

		$this->assertSame( $counter, count( $tests ) );

		return $tests;
	}

	/**
	 * Generates tests for {@see test_function_calls()}.
	 *
	 * @return array Test arrays.
	 */
	protected function generate_function_tests() {
		$tests   = array();
		$counter = 0;

		$user       = $this->objects->create_user( 'editor' );
		$controller = new WP_REST_Annotations_Controller();
		$request    = new WP_REST_Request( 'GET', $this->rest_ns_base );

		$post                   = $this->objects->create_post( $user->ID );
		$nonexistent_annotation = new WP_Annotation( (object) array(
			'comment_ID'   => 0,
			'comment_type' => get_default_annotation_type(),
		) );
		$orphan_annotation      = $this->objects->create_annotation( array(
			'in_post_id' => 0,
			'by_user_id' => $user->ID,
		) );

		foreach ( array(
			'create w/ ID' => array(
				'id' => 999999,
			),
		) as $_key => $_params ) {
			$_request = new WP_REST_Request( 'POST', $this->rest_ns_base );

			foreach ( $_params as $__key => $_value ) {
				$_request->set_param( $__key, $_value );
			}

			$_function = array( $controller, 'create_item' );
			$tests    += $this->generate_function_test(
				$user,
				$_function,
				array( $_request ),
				array(
					$_key => array(
						'assert' => 'instanceof',
						'value'  => 'WP_Error',
					),
				)
			);
			$counter++;
		}

		foreach ( array(
			'empty type'   => array(
				'post'   => $post->ID,
				'type'   => '',
				'status' => 'foo',
			),
			'empty status' => array(
				'post'   => $post->ID,
				'type'   => 'foo',
				'status' => '',
			),
		) as $_key => $_params ) {
			$_request = new WP_REST_Request( 'POST', $this->rest_ns_base );

			foreach ( $_params as $__key => $_value ) {
				$_request->set_param( $__key, $_value );
			}

			$_function = array( $controller, 'create_item_permissions_check' );
			$tests    += $this->generate_function_test(
				$user,
				$_function,
				array( $_request ),
				array(
					$_key => array(
						'assert' => 'instanceof',
						'value'  => 'WP_Error',
					),
				)
			);
			$counter++;
		}

		foreach ( array(
			'unknown field'          => array( $orphan_annotation->comment, 'foo', $request ),
			'nonexistent annotation' => array( $nonexistent_annotation->comment, 'foo', $request ),
			'annotation array ID'    => array( array( 'id' => -1 ), 'foo', $request ),
		) as $_key => $_args ) {
			$_function = array( $controller, 'on_get_additional_field' );
			$tests    += $this->generate_function_test(
				$user,
				$_function,
				$_args,
				array(
					$_key => array(
						'assert' => 'same',
						'value'  => null,
					),
				)
			);
			$counter++;
		}

		foreach ( array(
			'unknown field'          => array( null, $orphan_annotation->comment, 'foo', $request ),
			'nonexistent annotation' => array( null, $nonexistent_annotation->comment, 'foo', $request ),
			'annotation array ID'    => array( null, array( 'id' => -1 ), 'foo', $request ),
		) as $_key => $_args ) {
			$_function = array( $controller, 'on_update_additional_field' );
			$tests    += $this->generate_function_test(
				$user,
				$_function,
				$_args,
				array(
					$_key => array(
						'assert' => 'instanceof',
						'value'  => 'WP_Error',
					),
				)
			);
			$counter++;
		}

		$this->assertSame( $counter, count( $tests ) );

		return $tests;
	}

	/*
	 * --- REST API utilities ----------------------------------------------------
	 */

	/**
	 * Generates a test array.
	 *
	 * @param WP_User $user   User.
	 * @param array   $params Request params.
	 * @param int     $status Expected status.
	 * @param int     $code   Expected error code.
	 * @param array   $assertions {
	 *    Optional. An array of assertion arrays with descriptive keys.
	 *
	 *    @type array $assertion {
	 *        @type string $key    Response data array key; e.g., 'selector'.
	 *        @type string $assert PHPUnit assert method w/o prefix; e.g., 'same'.
	 *        @type mixed  $value  Expected value for this assertion.
	 *    }
	 * }
	 * @return array Test array.
	 */
	protected function generate_test( $user, $params, $status, $code, $assertions = array() ) {
		$json                  = json_encode( $params );
		$serialized_params     = serialize( $params );
		$serialized_assertions = serialize( $assertions );

		$key = md5( $json . $serialized_params . $status . $code . $serialized_assertions );

		$role   = $this->utils->get_user_role( $user );
		$params = $this->utils->remove_nulls( $params );

		return array( "{$role}:{$json}:{$key}" => array( $user, $params, $status, $code, $assertions ) );
	}

	/**
	 * Generates a ID-specific test array.
	 *
	 * @param WP_User $user   User.
	 * @param int     $id     Annotation ID.
	 * @param array   $params Request params.
	 * @param int     $status Expected status.
	 * @param int     $code   Expected error code.
	 * @param array   $assertions {
	 *    Optional. An array of assertion arrays with descriptive keys.
	 *
	 *    @type array $assertion {
	 *        @type string $key    Response data array key; e.g., 'selector'.
	 *        @type string $assert PHPUnit assert method w/o prefix; e.g., 'same'.
	 *        @type mixed  $value  Expected value for this assertion.
	 *    }
	 * }
	 * @return array Test array.
	 */
	protected function generate_id_test( $user, $id, $params, $status, $code, $assertions = array() ) {
		$json                  = json_encode( array_merge( compact( 'id' ), $params ) );
		$serialized_params     = serialize( $params );
		$serialized_assertions = serialize( $assertions );

		$key = md5( $json . $serialized_params . $status . $code . $serialized_assertions );

		$role   = $this->utils->get_user_role( $user );
		$params = $this->utils->remove_nulls( $params );

		return array( "{$role}:{$json}:{$key}" => array( $user, $id, $params, $status, $code, $assertions ) );
	}

	/**
	 * Generates a collection test array.
	 *
	 * @param WP_User $user   User.
	 * @param array   $params Request params.
	 * @param int     $status Expected status.
	 * @param int     $count  Expected total items.
	 * @param int     $code   Expected error code.
	 * @param array   $assertions {
	 *    Optional. An array of assertion arrays with descriptive keys.
	 *
	 *    @type array $assertion {
	 *        @type string $key    Response data array key; e.g., 'selector'.
	 *        @type string $assert PHPUnit assert method w/o prefix; e.g., 'same'.
	 *        @type mixed  $value  Expected value for this assertion.
	 *    }
	 * }
	 * @return array Test array.
	 */
	protected function generate_collection_test( $user, $params, $status, $count, $code, $assertions = array() ) {
		$json                  = json_encode( $params );
		$serialized_params     = serialize( $params );
		$serialized_assertions = serialize( $assertions );

		$key = md5( $json . $serialized_params . $status . $code . $serialized_assertions );

		$role   = $this->utils->get_user_role( $user );
		$params = $this->utils->remove_nulls( $params );

		return array( "{$role}:{$json}:{$key}" => array( $user, $params, $status, $count, $code, $assertions ) );
	}

	/**
	 * Generates a function test array.
	 *
	 * @param WP_User  $user     User.
	 * @param callable $function Callable.
	 * @param array    $args     Arguments.
	 * @param array    $assertions {
	 *    Assertion arrays with descriptive keys.
	 *
	 *    @type array $assertion {
	 *        @type string $assert PHPUnit assert method w/o prefix; e.g., 'same'.
	 *        @type mixed  $value  Expected value for this assertion.
	 *    }
	 * }
	 * @return array Test array.
	 */
	protected function generate_function_test( $user, $function, $args, $assertions ) {
		$function_id           = _test_filter_build_unique_id( '', $function, 0 );
		$serialized_args       = serialize( $args );
		$serialized_assertions = serialize( $assertions );

		$key  = md5( $function_id . $serialized_args . $serialized_assertions );
		$role = $this->utils->get_user_role( $user );

		return array( "{$role}:{$function_id}:{$key}" => array( $user, $function, $args, $assertions ) );
	}

	/**
	 * Tests an annotation collection.
	 *
	 * @param WP_REST_Response $response REST API response.
	 * @param string           $context  Exepcted response context.
	 * @param bool             $threaded True if it's a threaded response.
	 * @param array            $assertions {
	 *    Optional. An array of assertion arrays with descriptive keys.
	 *
	 *    @type array $assertion {
	 *        @type string $key    Response data array key; e.g., 'selector'.
	 *        @type string $assert PHPUnit assert method w/o prefix; e.g., 'same'.
	 *        @type mixed  $value  Expected value for this assertion.
	 *    }
	 * }
	 */
	protected function check_collection( $response, $context, $threaded, $assertions = array() ) {
		$this->assertNotInstanceOf( 'WP_Error', $response );

		$response = rest_ensure_response( $response );
		$this->assertEquals( 200, $response->get_status() );

		$headers = $response->get_headers();
		$this->assertArrayHasKey( 'X-WP-Total', $headers );
		$this->assertArrayHasKey( 'X-WP-TotalPages', $headers );

		foreach ( $response->get_data() as $data ) {
			$this->check_data( $data, $context, $data['_links'], $threaded, $assertions );
		}
	}

	/**
	 * Tests annotation data.
	 *
	 * @param array  $data     Response data.
	 * @param string $context  Response context.
	 * @param array  $links    Response links.
	 * @param bool   $threaded True if threaded data.
	 * @param array  $assertions {
	 *    Optional. An array of assertion arrays with descriptive keys.
	 *
	 *    @type array $assertion {
	 *        @type string $key    Response data array key; e.g., 'selector'.
	 *        @type string $assert PHPUnit assert method w/o prefix; e.g., 'same'.
	 *        @type mixed  $value  Expected value for this assertion.
	 *    }
	 * }
	 */
	protected function check_data( $data, $context, $links, $threaded, $assertions = array() ) {
		$this->assertSame( true, ! empty( $data['id'] ), '!empty(id)' );
		$annotation = get_annotation( $data['id'] );

		$this->assertSame( (int) $annotation->comment_ID, $data['id'], 'id' );
		$this->assertSame( (int) $annotation->comment_post_ID, $data['post'], 'post' );
		$this->assertSame( (int) $annotation->comment_parent, $data['parent'], 'parent' );
		$this->assertSame( (int) $annotation->user_id, $data['author'], 'author' );
		$this->assertSame( $annotation->comment_author, $data['author_name'], 'author_name' );
		$this->assertSame( $annotation->comment_author_url, $data['author_url'], 'author_url' );
		$this->assertSame( wpautop( $annotation->comment_content ), $data['content']['rendered'], 'content[rendered]' );

		// phpcs:ignore PHPCompatibility.PHP.RemovedExtensions.mysql_DeprecatedRemoved — function provided by core.
		$this->assertSame( mysql_to_rfc3339( $annotation->comment_date ), $data['date'], 'date' ); // @codingStandardsIgnoreLine
		$this->assertSame( mysql_to_rfc3339( $annotation->comment_date_gmt ), $data['date_gmt'], 'date_gmt' ); // @codingStandardsIgnoreLine

		$this->assertSame( get_comment_link( $annotation->comment ), $data['link'], 'link' );
		$this->assertArrayHasKey( 'author_avatar_urls', $data, 'author_avatar_urls' );

		$this->assertSame( $annotation->get_meta( '_via' ), $data['via'], 'via' );
		$this->assertSame( $annotation->get_meta( '_selector' ), $data['selector'], 'selector' );

		$this->assertSame( rest_url( '/wp/v2/posts/' . $data['post'] ), $links['up'][0]['href'], 'links[up]' );
		$this->assertSame( rest_url( '/wp/v2/users/' . $data['author'] ), $links['author'][0]['href'], 'links[author]' );
		$this->assertSame( rest_url( $this->rest_ns_base . '/' . $data['id'] ), $links['self'][0]['href'], 'links[self]' );
		$this->assertSame( rest_url( $this->rest_ns_base ), $links['collection'][0]['href'], 'links[collection]' );

		if ( 'edit' === $context ) {
			$this->assertSame( $annotation->comment_author_email, $data['author_email'], 'author_email' );
			$this->assertSame( $annotation->comment_author_IP, $data['author_ip'], 'author_ip' );
			$this->assertSame( $annotation->comment_agent, $data['author_user_agent'], 'author_user_agent' );
			$this->assertSame( $annotation->comment_content, $data['content']['raw'], 'content[raw]' );
		}

		if ( 'edit' !== $context ) {
			$this->assertArrayNotHasKey( 'author_email', $data, '!author_email' );
			$this->assertArrayNotHasKey( 'author_ip', $data, '!author_ip' );
			$this->assertArrayNotHasKey( 'author_user_agent', $data, '!author_user_agent' );
			$this->assertArrayNotHasKey( 'raw', $data['content'], '!content[raw]' );
		}

		if ( $threaded ) {
			$this->assertArrayHasKey( 'children', $data, 'children' );

			foreach ( $data['children'] as $child ) {
				$this->assertArrayHasKey( '_links', $child, 'child[_links]' );
				$this->check_data( $child, $context, $child['_links'], $threaded );
			}
		} else {
			$this->assertArrayNotHasKey( 'children', $data, '!children' );
		}

		foreach ( $assertions as $key => $assertion ) {
			$this->{ 'assert' . $assertion['assert'] }(
				$assertion['value'],
				$this->utils->get_path( $data, $assertion['key'] ),
				is_string( $key ) ? $key : $assertion['key']
			);
		}
	}
}
