<?php

/**
 * @group admin-bar
 * @group toolbar
 * @group admin
 */
class Tests_AdminBar extends WP_UnitTestCase {

	static function setUpBeforeClass() {
		WP_UnitTestCase::setUpBeforeClass();
		require_once ABSPATH . WPINC . '/class-wp-admin-bar.php';
	}

	function setUp() {
		parent::setUp();
		$this->current_user = get_current_user_id();
		wp_set_current_user( $this->factory->user->create( array( 'role' => 'editor' ) ) );
	}

	function tearDown() {
		wp_set_current_user( $this->current_user );
		parent::tearDown();
	}

	/**
	 * @ticket 21117
	 */
	function test_content_post_type() {
		register_post_type( 'content', array( 'show_in_admin_bar' => true ) );

		$admin_bar = new WP_Admin_Bar;

		wp_admin_bar_new_content_menu( $admin_bar );

		$nodes = $admin_bar->get_nodes();
		$this->assertFalse( $nodes['new-content']->parent );
		$this->assertEquals( 'new-content', $nodes['add-new-content']->parent );

		_unregister_post_type( 'content' );
	}

	/**
	 * @ticket 21117
	 */
	function test_merging_existing_meta_values() {
		$admin_bar = new WP_Admin_Bar;

		$admin_bar->add_node( array(
			'id' => 'test-node',
			'meta' => array( 'class' => 'test-class' ),
		) );
		$node = $admin_bar->get_node( 'test-node' );
		$this->assertEquals( array( 'class' => 'test-class' ), $node->meta );

		$admin_bar->add_node( array(
			'id' => 'test-node',
			'meta' => array( 'some-meta' => 'value' ),
		) );

		$node = $admin_bar->get_node( 'test-node' );
		$this->assertEquals( array( 'class' => 'test-class', 'some-meta' => 'value' ), $node->meta );
	}
}