<?php

/**
 * @group taxonomy
 * @covers ::wp_delete_object_term_relationships
 */
class Tests_Term_WpDeleteObjectTermRelationships extends WP_UnitTestCase {
	public function test_single_taxonomy() {
		register_taxonomy( 'wptests_tax1', 'post' );
		register_taxonomy( 'wptests_tax2', 'post' );

		$t1 = self::factory()->term->create( array( 'taxonomy' => 'wptests_tax1' ) );
		$t2 = self::factory()->term->create( array( 'taxonomy' => 'wptests_tax2' ) );

		$object_id = 567;

		wp_set_object_terms( $object_id, array( $t1 ), 'wptests_tax1' );
		wp_set_object_terms( $object_id, array( $t2 ), 'wptests_tax2' );

		// Confirm the setup.
		$terms = wp_get_object_terms( $object_id, array( 'wptests_tax1', 'wptests_tax2' ), array( 'fields' => 'ids' ) );
		$this->assertEqualSets( array( $t1, $t2 ), $terms );

		// wp_delete_object_term_relationships() doesn't have a return value.
		wp_delete_object_term_relationships( $object_id, 'wptests_tax2' );
		$terms = wp_get_object_terms( $object_id, array( 'wptests_tax1', 'wptests_tax2' ), array( 'fields' => 'ids' ) );

		$this->assertEqualSets( array( $t1 ), $terms );
	}

	public function test_array_of_taxonomies() {
		register_taxonomy( 'wptests_tax1', 'post' );
		register_taxonomy( 'wptests_tax2', 'post' );
		register_taxonomy( 'wptests_tax3', 'post' );

		$t1 = self::factory()->term->create( array( 'taxonomy' => 'wptests_tax1' ) );
		$t2 = self::factory()->term->create( array( 'taxonomy' => 'wptests_tax2' ) );
		$t3 = self::factory()->term->create( array( 'taxonomy' => 'wptests_tax3' ) );

		$object_id = 567;

		wp_set_object_terms( $object_id, array( $t1 ), 'wptests_tax1' );
		wp_set_object_terms( $object_id, array( $t2 ), 'wptests_tax2' );
		wp_set_object_terms( $object_id, array( $t3 ), 'wptests_tax3' );

		// Confirm the setup.
		$terms = wp_get_object_terms( $object_id, array( 'wptests_tax1', 'wptests_tax2', 'wptests_tax3' ), array( 'fields' => 'ids' ) );
		$this->assertEqualSets( array( $t1, $t2, $t3 ), $terms );

		// wp_delete_object_term_relationships() doesn't have a return value.
		wp_delete_object_term_relationships( $object_id, array( 'wptests_tax1', 'wptests_tax3' ) );
		$terms = wp_get_object_terms( $object_id, array( 'wptests_tax1', 'wptests_tax2', 'wptests_tax3' ), array( 'fields' => 'ids' ) );

		$this->assertEqualSets( array( $t2 ), $terms );
	}
}
