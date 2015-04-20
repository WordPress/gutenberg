<?php

/**
 * @group taxonomy
 */
class Tests_Term_SplitSharedTerm extends WP_UnitTestCase {
	protected $terms = array();

	/**
	 * Sets up a number of split terms for testing. Terms are as follows.
	 *
	 * - `$this->terms['t1']` is an array of the 'term_id' and 'term_taxonomy_id' of a term in the 'wptests_tax'
	 *   taxonomy. Pre-split, the term_id of t1 (`$this->terms['t1']['term_id']`) was shared by t1, t2, and t3.
	 * - `$this->terms['t2']` is an array of the 'term_id' and 'term_taxonomy_id' of a term in the 'wptests_tax_2'
	 *   taxonomy. Pre-split, the term_id of t2 was `$this->terms['t1']['term_id']`.
	 * - `$this->terms['t3']` is an array of the 'term_id' and 'term_taxonomy_id' of a term in the 'wptests_tax_3'
	 *   taxonomy. Pre-split, the term_id of t2 was `$this->terms['t1']['term_id']`.
	 * - `$this->terms['t2_child']` is an array of the 'term_id' and 'term_taxonomy_id' of a term in the
	 *   'wptests_tax_2' taxonomy. This term is a child of t2, and is used to test parent/child relationships
	 *   after term splitting.
	 */
	public function setUp() {
		global $wpdb;

		parent::setUp();

		register_taxonomy( 'wptests_tax', 'post' );
		register_taxonomy( 'wptests_tax_2', 'post', array(
			'hierarchical' => true,
		) );
		register_taxonomy( 'wptests_tax_3', 'post' );

		$t1 = wp_insert_term( 'Foo', 'wptests_tax' );
		$t2 = wp_insert_term( 'Foo', 'wptests_tax_2' );
		$t3 = wp_insert_term( 'Foo', 'wptests_tax_3' );

		// Manually modify because shared terms shouldn't naturally occur.
		$wpdb->update( $wpdb->term_taxonomy,
			array( 'term_id' => $t1['term_id'] ),
			array( 'term_taxonomy_id' => $t2['term_taxonomy_id'] ),
			array( '%d' ),
			array( '%d' )
		);

		$wpdb->update( $wpdb->term_taxonomy,
			array( 'term_id' => $t1['term_id'] ),
			array( 'term_taxonomy_id' => $t3['term_taxonomy_id'] ),
			array( '%d' ),
			array( '%d' )
		);

		$t2_child = wp_insert_term( 'Foo Child', 'wptests_tax_2', array(
			'parent' => $t1['term_id'],
		) );

		// Split the terms and store the new term IDs.
		$t2['term_id'] = _split_shared_term( $t1['term_id'], $t2['term_taxonomy_id'] );
		$t3['term_id'] = _split_shared_term( $t1['term_id'], $t3['term_taxonomy_id'] );

		$this->terms = array(
			't1' => $t1,
			't2' => $t2,
			't3' => $t3,
			't2_child' => $t2_child,
		);
	}

	/**
	 * @ticket 5809
	 */
	public function test_should_create_new_term_ids() {
		$t1_term = get_term_by( 'term_taxonomy_id', $this->terms['t1']['term_taxonomy_id'], 'wptests_tax' );
		$t2_term = get_term_by( 'term_taxonomy_id', $this->terms['t2']['term_taxonomy_id'], 'wptests_tax_2' );
		$t3_term = get_term_by( 'term_taxonomy_id', $this->terms['t3']['term_taxonomy_id'], 'wptests_tax_3' );

		$this->assertNotEquals( $t1_term->term_id, $t2_term->term_id );
		$this->assertNotEquals( $t1_term->term_id, $t3_term->term_id );
		$this->assertNotEquals( $t2_term->term_id, $t3_term->term_id );
	}

	/**
	 * @ticket 5809
	 */
	public function test_should_retain_child_terms_when_using_get_terms_parent() {
		$children = get_terms( 'wptests_tax_2', array(
			'parent' => $this->terms['t2']['term_id'],
			'hide_empty' => false,
		) );

		$this->assertEquals( $this->terms['t2_child']['term_taxonomy_id'], $children[0]->term_taxonomy_id );
	}

	/**
	 * @ticket 5809
	 */
	public function test_should_retain_child_terms_when_using_get_terms_child_of() {
		$children = get_terms( 'wptests_tax_2', array(
			'child_of' => $this->terms['t2']['term_id'],
			'hide_empty' => false,
		) );

		$this->assertEquals( $this->terms['t2_child']['term_taxonomy_id'], $children[0]->term_taxonomy_id );
	}

	/**
	 * @ticket 30335
	 */
	public function test_should_rebuild_split_term_taxonomy_hierarchy() {
		global $wpdb;

		register_taxonomy( 'wptests_tax_3', 'post' );
		register_taxonomy( 'wptests_tax_4', 'post', array(
			'hierarchical' => true,
		) );

		$t1 = wp_insert_term( 'Foo1', 'wptests_tax_3' );
		$t2 = wp_insert_term( 'Foo1 Parent', 'wptests_tax_4' );
		$t3 = wp_insert_term( 'Foo1', 'wptests_tax_4', array(
			'parent' => $t2['term_id'],
		) );

		// Manually modify because shared terms shouldn't naturally occur.
		$wpdb->update( $wpdb->term_taxonomy,
			array( 'term_id' => $t1['term_id'] ),
			array( 'term_taxonomy_id' => $t3['term_taxonomy_id'] ),
			array( '%d' ),
			array( '%d' )
		);
		$th = _get_term_hierarchy( 'wptests_tax_4' );

		$new_term_id = _split_shared_term( $t1['term_id'], $t3['term_taxonomy_id'] );

		$t2_children = get_term_children( $t2['term_id'], 'wptests_tax_4' );
		$this->assertEquals( array( $new_term_id ), $t2_children );
	}

	/**
	 * @ticket 30335
	 */
	public function test_should_update_default_category_on_term_split() {
		global $wpdb;
		$t1 = wp_insert_term( 'Foo Default', 'category' );

		update_option( 'default_category', $t1['term_id'] );

		register_taxonomy( 'wptests_tax_5', 'post' );
		$t2 = wp_insert_term( 'Foo Default', 'wptests_tax_5' );

		// Manually modify because shared terms shouldn't naturally occur.
		$wpdb->update( $wpdb->term_taxonomy,
			array( 'term_id' => $t1['term_id'] ),
			array( 'term_taxonomy_id' => $t2['term_taxonomy_id'] ),
			array( '%d' ),
			array( '%d' )
		);

		$this->assertEquals( $t1['term_id'], get_option( 'default_category', -1 ) );

		$new_term_id = _split_shared_term( $t1['term_id'], $t1['term_taxonomy_id'] );

		$this->assertNotEquals( $new_term_id, $t1['term_id'] );
		$this->assertEquals( $new_term_id, get_option( 'default_category', -1 ) );
	}

	/**
	 * @ticket 30335
	 */
	public function test_should_update_menus_on_term_split() {
		global $wpdb;

		$t1 = wp_insert_term( 'Foo Menu', 'category' );

		register_taxonomy( 'wptests_tax_6', 'post' );
		$t2 = wp_insert_term( 'Foo Menu', 'wptests_tax_6' );

		// Manually modify because shared terms shouldn't naturally occur.
		$wpdb->update( $wpdb->term_taxonomy,
			array( 'term_id' => $t1['term_id'] ),
			array( 'term_taxonomy_id' => $t2['term_taxonomy_id'] ),
			array( '%d' ),
			array( '%d' )
		);

		$menu_id = wp_create_nav_menu( rand_str() );
		$cat_menu_item = wp_update_nav_menu_item( $menu_id, 0, array(
			'menu-item-type' => 'taxonomy',
			'menu-item-object' => 'category',
			'menu-item-object-id' => $t1['term_id'],
			'menu-item-status' => 'publish'
		) );
		$this->assertEquals( $t1['term_id'], get_post_meta( $cat_menu_item, '_menu_item_object_id', true ) );

		$new_term_id = _split_shared_term( $t1['term_id'], $t1['term_taxonomy_id'] );
		$this->assertNotEquals( $new_term_id, $t1['term_id'] );
		$this->assertEquals( $new_term_id, get_post_meta( $cat_menu_item, '_menu_item_object_id', true ) );
	}

	public function test_wp_get_split_terms() {
		$found = wp_get_split_terms( $this->terms['t1']['term_id'] );

		$expected = array(
			'wptests_tax_2' => $this->terms['t2']['term_id'],
			'wptests_tax_3' => $this->terms['t3']['term_id'],
		);

		$this->assertEqualSets( $expected, $found );
	}

	public function test_wp_get_split_term() {
		$found = wp_get_split_term( $this->terms['t1']['term_id'], 'wptests_tax_3' );
		$this->assertEquals( $this->terms['t3']['term_id'], $found );
	}
}
