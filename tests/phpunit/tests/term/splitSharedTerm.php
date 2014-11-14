<?php

/**
 * @group taxonomy
 */
class Tests_Term_SplitSharedTerm extends WP_UnitTestCase {
	protected $tt_ids = array();

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

		// Manually modify because split terms shouldn't naturally occur.
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

		$this->tt_ids = array(
			't1' => $t1['term_taxonomy_id'],
			't2' => $t2['term_taxonomy_id'],
			't3' => $t3['term_taxonomy_id'],
			't2_child' => $t2_child['term_taxonomy_id'],
		);

		_split_shared_term( $t1['term_id'], $t2['term_taxonomy_id'] );
		_split_shared_term( $t1['term_id'], $t3['term_taxonomy_id'] );
	}

	/**
	 * @ticket 5809
	 */
	public function test_should_create_new_term_ids() {
		$t1_term = get_term_by( 'term_taxonomy_id', $this->tt_ids['t1'], 'wptests_tax' );
		$t2_term = get_term_by( 'term_taxonomy_id', $this->tt_ids['t2'], 'wptests_tax_2' );
		$t3_term = get_term_by( 'term_taxonomy_id', $this->tt_ids['t3'], 'wptests_tax_3' );

		$this->assertNotEquals( $t1_term->term_id, $t2_term->term_id );
		$this->assertNotEquals( $t1_term->term_id, $t3_term->term_id );
		$this->assertNotEquals( $t2_term->term_id, $t3_term->term_id );
	}

	/**
	 * @ticket 5809
	 */
	public function test_should_retain_child_terms_when_using_get_terms_parent() {
		$t2_term = get_term_by( 'term_taxonomy_id', $this->tt_ids['t2'], 'wptests_tax_2' );
		$children = get_terms( 'wptests_tax_2', array(
			'parent' => $t2_term->term_id,
			'hide_empty' => false,
		) );

		$this->assertEquals( $this->tt_ids['t2_child'], $children[0]->term_taxonomy_id );
	}

	/**
	 * @ticket 5809
	 */
	public function test_should_retain_child_terms_when_using_get_terms_child_of() {
		$t2_term = get_term_by( 'term_taxonomy_id', $this->tt_ids['t2'], 'wptests_tax_2' );
		$children = get_terms( 'wptests_tax_2', array(
			'child_of' => $t2_term->term_id,
			'hide_empty' => false,
		) );

		$this->assertEquals( $this->tt_ids['t2_child'], $children[0]->term_taxonomy_id );
	}
}
