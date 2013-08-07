<?php

/**
 * @group xmlrpc
 */
class Tests_XMLRPC_wp_getPages extends WP_XMLRPC_UnitTestCase {
    var $post_data;
    var $post_id;
    var $post_date_ts;
    var $editor_id;

    function setUp() {
        parent::setUp();

        $this->post_date_ts = strtotime( '+1 day' );
        $this->post_data = array(
            'post_type' => 'page',
            'post_title' => rand_str(),
            'post_content' => rand_str( 2000 ),
            'post_excerpt' => rand_str( 100 ),
            'post_author' => $this->make_user_by_role( 'administrator' ),
            'post_date'  => strftime( "%Y-%m-%d %H:%M:%S", $this->post_date_ts ),
        );
        $this->post_id = wp_insert_post( $this->post_data );
        $this->editor_id = $this->make_user_by_role( 'editor' );
    }

    function test_invalid_username_password() {
        $result = $this->myxmlrpcserver->wp_getPages( array( 1, 'username', 'password' ) );
        $this->assertInstanceOf( 'IXR_Error', $result );
        $this->assertEquals( 403, $result->code );
    }

    function test_incapable_user() {
		$this->make_user_by_role( 'contributor' );

        $result = $this->myxmlrpcserver->wp_getPages( array( 1, 'contributor', 'contributor' ) );
        $this->assertInstanceOf( 'IXR_Error', $result );
        $this->assertEquals( 401, $result->code );
    }

    function test_capable_user() {
        $results = $this->myxmlrpcserver->wp_getPages( array( 1, 'administrator', 'administrator' ) );
        $this->assertNotInstanceOf( 'IXR_Error', $results );

        foreach( $results as $result ) {
            $page = get_post( $result['page_id'] );
            $this->assertEquals( $page->post_type, 'page' );
        }
    }

    function remove_editor_edit_page_cap( $caps, $cap, $user_id, $args ) {
        if ( in_array( $cap, array( 'edit_page', 'edit_others_pages' ) ) ) {
            if ( $user_id == $this->editor_id && $args[0] == $this->post_id ) {
                return array( false );
            }
        }

        return $caps;
    }

	/**
	 * @ticket 20629
	 */
	function test_semi_capable_user() {
        add_filter( 'map_meta_cap', array( $this, 'remove_editor_edit_page_cap') , 10, 4 );

        $results = $this->myxmlrpcserver->wp_getPages( array( 1, 'editor', 'editor' ) );
        $this->assertNotInstanceOf( 'IXR_Error', $results );

        $found_incapable = false;
        foreach( $results as $result ) {
            // WP#20629
            $this->assertNotInstanceOf( 'IXR_Error', $result );

            if ( $result['page_id'] == $this->post_id ) {
                $found_incapable = true;
                break;
            }
        }
        $this->assertFalse( $found_incapable );

        remove_filter( 'map_meta_cap', array( $this, 'remove_editor_edit_page_cap' ), 10, 4 );
    }

}
