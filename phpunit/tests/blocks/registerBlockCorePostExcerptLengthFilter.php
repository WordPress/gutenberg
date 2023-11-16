<?php

/**
 * Functional unit test for wp_register_block_core_post_excerpt_length_filter().
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * @group blocks
 * @covers ::register_block_core_post_excerpt_length_filter
 */
class Tests_Blocks_RegisterBlockCorePostExcerptLengthFilter extends WP_Test_REST_TestCase {

	protected static $post_id;
	protected static $admin_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$post_id = $factory->post->create( array(
				'post_excerpt' => '',
			)
		);

		self::$admin_id = $factory->user->create(
			array(
				'role'       => 'administrator',
				'user_login' => 'superadmin',
			)
		);
	}

	/**
	 * Unit test for ensuring correct length of the post excerpt in the REST API context.
	 *
	 * @dataProvider data_register_block_core_post_excerpt_length_filter
	 *
	 * @param int    $expeceted_excerpt_length Expected excerpt length.
	 * @param string $context                  Current context.
	 */
	public function test_register_block_core_post_excerpt_length_filter( $expeceted_excerpt_length, $context ) {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'GET', '/wp/v2/posts/' . self::$post_id );
		if ( '' !== $context ) {
			$request->set_param( 'context', $context );
			$_REQUEST['context'] = $context;
		}

		$request->set_param( '_locale', 'user' );
		$mock = $this->getMockBuilder( stdClass::class )
		             ->addMethods( [ 'excerpt_length_callback' ] )
		             ->getMock();

		$mock->expects( $this->atLeastOnce() )
		     ->method( 'excerpt_length_callback' )
		     ->with( $this->equalTo( $expeceted_excerpt_length ) )
		     ->willReturn( $expeceted_excerpt_length );

		add_filter( 'excerpt_length', [ $mock, 'excerpt_length_callback' ], PHP_INT_MAX );
		rest_get_server()->dispatch( $request );
		remove_filter( 'excerpt_length', [ $mock, 'excerpt_length_callback' ], PHP_INT_MAX );
		unset ( $_REQUEST['context'] );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_register_block_core_post_excerpt_length_filter() {
		return array(
			'no_edit_context' => array(
				55,
				''
			),
			'edit_context'    => array(
				100,
				'edit'
			),
		);
	}
}
