<?php
/**
 * @group xmlrpc
 */
class Tests_XMLRPC_wp_setOptions extends WP_XMLRPC_UnitTestCase {

	/**
	 * @ticket 22936
	 */
	function test_set_option_no_escape_strings() {
		$this->make_user_by_role( 'administrator' );
		$string_with_quote = "Mary's Lamb Shop";
		$escaped_string_with_quote = esc_html( $string_with_quote ); // title is passed through esc_html()

		$result = $this->myxmlrpcserver->wp_setOptions( array( 1, 'administrator', 'administrator', array(
			'blog_title' => $string_with_quote,
			'users_can_register' => true,
		) ) );

		$this->assertInternalType( 'array', $result );
		$this->assertEquals( $escaped_string_with_quote, $result['blog_title']['value'] );
		$this->assertEquals( true, $result['users_can_register']['value'] );
	}
}
