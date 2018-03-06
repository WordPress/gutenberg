<?php
/**
 * WP_Block_Type_Registry Tests
 *
 * @package Gutenberg
 */

/**
 * Tests for WP_Block_Type_Registry
 */
class Gutenberg_REST_API_Test extends WP_UnitTestCase {
	function setUp() {
		parent::setUp();

		$this->administrator = $this->factory->user->create( array(
			'role' => 'administrator',
		) );
		$this->author        = $this->factory->user->create( array(
			'role' => 'author',
		) );
		$this->editor        = $this->factory->user->create( array(
			'role' => 'editor',
		) );
	}

	function tearDown() {
		parent::tearDown();
	}

	/**
	 * Should return an extra visibility field on response when in edit context.
	 */
	function test_visibility_field() {
		wp_set_current_user( $this->administrator );

		$request = new WP_REST_Request( 'GET', '/wp/v2/taxonomies/category' );
		$request->set_param( 'context', 'edit' );
		$response = rest_do_request( $request );

		$result = $response->get_data();

		$this->assertTrue( isset( $result['visibility'] ) );
		$this->assertInternalType( 'array', $result['visibility'] );
		$this->assertArrayHasKey( 'public', $result['visibility'] );
		$this->assertArrayHasKey( 'publicly_queryable', $result['visibility'] );
		$this->assertArrayHasKey( 'show_ui', $result['visibility'] );
		$this->assertArrayHasKey( 'show_admin_column', $result['visibility'] );
		$this->assertArrayHasKey( 'show_in_nav_menus', $result['visibility'] );
		$this->assertArrayHasKey( 'show_in_quick_edit', $result['visibility'] );
	}

	/**
	 * Should return an extra visibility field on response.
	 */
	function test_visibility_field_for_non_admin_roles() {
		wp_set_current_user( $this->editor );

		$request = new WP_REST_Request( 'GET', '/wp/v2/taxonomies/category' );
		$request->set_param( 'context', 'edit' );
		$response = rest_do_request( $request );

		$result = $response->get_data();

		$this->assertTrue( isset( $result['visibility'] ) );
		$this->assertInternalType( 'array', $result['visibility'] );
		$this->assertArrayHasKey( 'public', $result['visibility'] );
		$this->assertArrayHasKey( 'publicly_queryable', $result['visibility'] );
		$this->assertArrayHasKey( 'show_ui', $result['visibility'] );
		$this->assertArrayHasKey( 'show_admin_column', $result['visibility'] );
		$this->assertArrayHasKey( 'show_in_nav_menus', $result['visibility'] );
		$this->assertArrayHasKey( 'show_in_quick_edit', $result['visibility'] );

		/**
		 * See https://github.com/WordPress/gutenberg/issues/2545
		 *
		 * Until that is resolved authors will not be able to set taxonomies.
		 * This should definitely be resolved though.
		 */
		wp_set_current_user( $this->author );

		$response = rest_do_request( $request );

		$result = $response->get_data();

		$this->assertFalse( isset( $result['visibility'] ) );
	}

	/**
	 * Should not return an extra visibility field without context set.
	 */
	function test_visibility_field_without_context() {
		$request  = new WP_REST_Request( 'GET', '/wp/v2/taxonomies/category' );
		$response = rest_do_request( $request );

		$result = $response->get_data();

		$this->assertFalse( isset( $result['visibility'] ) );
	}
}
