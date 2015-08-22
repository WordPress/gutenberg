<?php

/**
 * @group taxonomy
 */
class Tests_Term_WpDeleteTerm extends WP_UnitTestCase {
	protected $deleted_term;

	/**
	 * @ticket 33485
	 */
	public function test_count_property_passed_to_filters_should_reflect_pre_deleted_term() {
		register_taxonomy( 'wptests_tax', 'post' );

		$terms = $this->factory->term->create_many( 2, array(
			'taxonomy' => 'wptests_tax',
		) );

		$p = $this->factory->post->create();

		wp_set_object_terms( $p, array( $terms[0] ), 'wptests_tax' );

		add_action( 'delete_term', array( $this, 'catch_deleted_term' ), 10, 4 );

		wp_delete_term( $terms[0], 'wptests_tax' );
		$this->assertEquals( 1, $this->deleted_term->count );

		wp_delete_term( $terms[1], 'wptests_tax' );
		$this->assertEquals( 0, $this->deleted_term->count );
	}

	public function catch_deleted_term( $term_id, $tt_id, $taxonomy, $deleted_term ) {
		$this->deleted_term = $deleted_term;
	}
}
