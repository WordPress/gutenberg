<?php
/**
 * @group admin
 */
class Tests_Admin_includesTemplate extends WP_UnitTestCase {
	function test_equal() {
		$this->assertEquals(' selected=\'selected\'', selected('foo','foo',false));
		$this->assertEquals(' checked=\'checked\'', checked('foo','foo',false));

		$this->assertEquals(' selected=\'selected\'', selected('1',1,false));
		$this->assertEquals(' checked=\'checked\'', checked('1',1,false));

		$this->assertEquals(' selected=\'selected\'', selected('1',true,false));
		$this->assertEquals(' checked=\'checked\'', checked('1',true,false));

		$this->assertEquals(' selected=\'selected\'', selected(1,1,false));
		$this->assertEquals(' checked=\'checked\'', checked(1,1,false));

		$this->assertEquals(' selected=\'selected\'', selected(1,true,false));
		$this->assertEquals(' checked=\'checked\'', checked(1,true,false));

		$this->assertEquals(' selected=\'selected\'', selected(true,true,false));
		$this->assertEquals(' checked=\'checked\'', checked(true,true,false));

		$this->assertEquals(' selected=\'selected\'', selected('0',0,false));
		$this->assertEquals(' checked=\'checked\'', checked('0',0,false));

		$this->assertEquals(' selected=\'selected\'', selected(0,0,false));
		$this->assertEquals(' checked=\'checked\'', checked(0,0,false));

		$this->assertEquals(' selected=\'selected\'', selected('',false,false));
		$this->assertEquals(' checked=\'checked\'', checked('',false,false));

		$this->assertEquals(' selected=\'selected\'', selected(false,false,false));
		$this->assertEquals(' checked=\'checked\'', checked(false,false,false));
	}

	function test_notequal() {
		$this->assertEquals('', selected('0','',false));
		$this->assertEquals('', checked('0','',false));

		$this->assertEquals('', selected(0,'',false));
		$this->assertEquals('', checked(0,'',false));

		$this->assertEquals('', selected(0,false,false));
		$this->assertEquals('', checked(0,false,false));
	}

	public function test_add_meta_box() {
		global $wp_meta_boxes;

		add_meta_box( 'testbox1', 'Test Metabox', '__return_false', 'post' );
		
		$this->assertArrayHasKey( 'testbox1', $wp_meta_boxes['post']['advanced']['default'] );
	}

	public function test_remove_meta_box() {
		global $wp_meta_boxes;

		// Add a meta boxes to remove.
		add_meta_box( 'testbox1', 'Test Metabox', '__return_false', $current_screen = 'post' );

		// Confirm it's there.
		$this->assertArrayHasKey( 'testbox1', $wp_meta_boxes[ $current_screen ]['advanced']['default'] );

		// Remove the meta box.
		remove_meta_box( 'testbox1', $current_screen, 'advanced' );

		// Check that it was removed properly (The meta box should be set to false once that it has been removed)
		$this->assertFalse( $wp_meta_boxes[ $current_screen ]['advanced']['default']['testbox1'] );
	}

	/**
	 * @ticket 15000
	 */
	public function test_add_meta_box_on_multiple_screens() {
		global $wp_meta_boxes;

		// Add a meta box to three different post types
		add_meta_box( 'testbox1', 'Test Metabox', '__return_false', array( 'post', 'comment', 'attachment' ) );

		$this->assertArrayHasKey( 'testbox1', $wp_meta_boxes['post']['advanced']['default'] ); 
		$this->assertArrayHasKey( 'testbox1', $wp_meta_boxes['comment']['advanced']['default'] );
		$this->assertArrayHasKey( 'testbox1', $wp_meta_boxes['attachment']['advanced']['default'] );
	}

	/**
	 * @ticket 15000
	 */
	public function test_remove_meta_box_from_multiple_screens() {
		global $wp_meta_boxes;

		// Add a meta box to three different screens.
		add_meta_box( 'testbox1', 'Test Metabox', '__return_false', array( 'post', 'comment', 'attachment' ) );

		// Remove meta box from posts.
		remove_meta_box( 'testbox1', 'post', 'advanced' );

		// Check that we have removed the meta boxes only from posts
		$this->assertFalse( $wp_meta_boxes['post']['advanced']['default']['testbox1'] );
		$this->assertArrayHasKey( 'testbox1', $wp_meta_boxes['comment']['advanced']['default'] );
		$this->assertArrayHasKey( 'testbox1', $wp_meta_boxes['attachment']['advanced']['default'] );

		// Remove the meta box from the other screens.
		remove_meta_box( 'testbox1', array( 'comment', 'attachment' ), 'advanced' );

		$this->assertFalse( $wp_meta_boxes['comment']['advanced']['default']['testbox1'] );
		$this->assertFalse( $wp_meta_boxes['attachment']['advanced']['default']['testbox1'] );
	}

}