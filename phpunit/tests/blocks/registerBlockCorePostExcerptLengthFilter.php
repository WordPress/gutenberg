<?php

/**
 * Tests for hooked blocks rendering.
 *
 * @package WordPress
 * @subpackage Blocks
 * @since 6.5.0
 *
 * @group blocks
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
	 * @dataProvider data_register_block_core_post_excerpt_length_filter
	 */
	public function test_register_block_core_post_excerpt_length_filter( $expected_word_length, $context ) {
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

		$mock->expects( $this->atLeast( 1 ) )
		     ->method( 'excerpt_length_callback' )
		     ->with( $this->equalTo( $expected_word_length ) )
		     ->willReturn( $expected_word_length );

		add_filter('excerpt_length', [$mock, 'excerpt_length_callback'], PHP_INT_MAX );
		rest_get_server()->dispatch( $request );
		remove_filter('excerpt_length', [$mock, 'excerpt_length_callback'], PHP_INT_MAX );
		unset ($_REQUEST['context']);
	}

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
