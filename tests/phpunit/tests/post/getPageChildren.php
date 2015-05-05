<?php

/**
 * @group post
 */
class Tests_Post_GetPageChildren extends WP_UnitTestCase {
	protected $pages = array();

	/*
	 * Here's the tree we are testing (4 is not in the tree):
	 *
	 * pages[0]
	 * - pages[1]
	 * -- pages[3]
	 * - pages[2]
	 * -- pages[6]
	 * --- pages[7]
	 * ---- pages[8]
	 * - pages[5]
	 */
	public function setUp() {
		parent::setUp();

		// Mock page objects.
		$this->pages = array(
			0 => (object) array(
				'ID' => 100,
				'post_parent' => 0,
			),
			1 => (object) array(
				'ID' => 101,
				'post_parent' => 100,
			),
			2 => (object) array(
				'ID' => 102,
				'post_parent' => 100,
			),
			3 => (object) array(
				'ID' => 103,
				'post_parent' => 101,
			),

			// Not in the tree.
			4 => (object) array(
				'ID' => 104,
				'post_parent' => 9898989898,
			),

			5 => (object) array(
				'ID' => 105,
				'post_parent' => 100,
			),
			6 => (object) array(
				'ID' => 106,
				'post_parent' => 102,
			),
			7 => (object) array(
				'ID' => 107,
				'post_parent' => 106,
			),
			8 => (object) array(
				'ID' => 108,
				'post_parent' => 107,
			),
		);
	}

	public function test_page_id_0_should_return_all_pages_in_tree_and_exclude_pages_not_in_tree() {
		$expected = array( 100, 101, 102, 103, 105, 106, 107, 108 );
		$actual = get_page_children( 0, $this->pages );
		$this->assertEqualSets( $expected, wp_list_pluck( $actual, 'ID' ) );
	}

	public function test_hierarchical_order_should_be_respected_in_results() {
		$expected = array( 100, 101, 103, 102, 106, 107, 108, 105 );
		$actual = get_page_children( 0, $this->pages );
		$this->assertEquals( $expected, wp_list_pluck( $actual, 'ID' ) );
	}

	public function test_not_all_pages_should_be_returned_when_page_id_is_in_the_middle_of_the_tree() {
		$expected = array( 106, 107, 108 );
		$actual = get_page_children( 102, $this->pages );
		$this->assertEquals( $expected, wp_list_pluck( $actual, 'ID' ) );
	}

	public function test_page_id_that_is_a_leaf_should_return_empty_array() {
		$actual = get_page_children( 103, $this->pages );
		$this->assertEquals( array(), $actual );
	}

	public function test_nonzero_page_id_not_matching_any_actual_post_id_should_return_empty_array() {
		$actual = get_page_children( 200, $this->pages );
		$this->assertEquals( array(), $actual );
	}
}
