<?php

/**
 * @group taxonomy
 */
class Tests_Term_getTermField extends WP_UnitTestCase {

	public $taxonomy = 'wptests_tax';

	function setUp() {
		parent::setUp();

		register_taxonomy( $this->taxonomy, 'post' );
	}

	/**
	 * @ticket 34245
	 */
	public function test_get_term_field_should_not_return_error_for_empty_taxonomy() {
		$term = self::$factory->term->create_and_get( array( 'taxonomy' => $this->taxonomy ) );

		$found = get_term_field( 'taxonomy', $term->term_id, '' );
		$this->assertNotWPError( $found );
		$this->assertSame( $this->taxonomy, $found );
	}

	/**
	 * @ticket 34245
	 */
	public function test_get_term_field_supplying_a_taxonomy() {
		$term = self::$factory->term->create_and_get( array( 'taxonomy' => $this->taxonomy ) );

		$found = get_term_field( 'taxonomy', $term->term_id, $term->taxonomy );
		$this->assertSame( $this->taxonomy, $found );
	}

	/**
	 * @ticket 34245
	 */
	public function test_get_term_field_supplying_no_taxonomy() {
		$term = self::$factory->term->create_and_get( array( 'taxonomy' => $this->taxonomy ) );

		$found = get_term_field( 'taxonomy', $term->term_id );
		$this->assertSame( $this->taxonomy, $found );
	}

	/**
	 * @ticket 34245
	 */
	public function test_get_term_field_should_accept_a_WP_Term_object_or_a_term_id() {
		$term = self::$factory->term->create_and_get( array( 'taxonomy' => $this->taxonomy ) );

		$this->assertInstanceOf( 'WP_Term', $term );
		$this->assertSame( $term->term_id, get_term_field( 'term_id', $term ) );
		$this->assertSame( $term->term_id, get_term_field( 'term_id', $term->term_id ) );
	}

	/**
	 * @ticket 34245
	 */
	public function test_get_term_field_invalid_taxonomy_should_return_WP_Error() {
		$term = self::$factory->term->create_and_get( array( 'taxonomy' => $this->taxonomy ) );

		$found = get_term_field( 'taxonomy', $term, 'foo-taxonomy' );
		$this->assertWPError( $found );
		$this->assertSame( 'invalid_taxonomy', $found->get_error_code() );
	}

	/**
	 * @ticket 34245
	 */
	public function test_get_term_field_invalid_term_should_return_WP_Error() {
		$found = get_term_field( 'taxonomy', 0, $this->taxonomy );

		$this->assertWPError( $found );
		$this->assertSame( 'invalid_term', $found->get_error_code() );

		$_found = get_term_field( 'taxonomy', 0 );

		$this->assertWPError( $_found );
		$this->assertSame( 'invalid_term', $_found->get_error_code() );
	}
}
