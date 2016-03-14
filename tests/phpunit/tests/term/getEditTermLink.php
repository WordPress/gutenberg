<?php

/**
 * @group taxonomy
 */
class Tests_Term_GetEditTermLink extends WP_UnitTestCase {
	public function setUp() {
		parent::setUp();
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		register_taxonomy( 'wptests_tax', 'post' );
	}

	public function test_get_edit_term_link_default() {
		$term1 = self::factory()->term->create( array(
			'taxonomy' => 'wptests_tax',
			'name' => 'foo',
		) );

		$actual = get_edit_term_link( $term1, 'wptests_tax' );
		$expected = 'http://' . WP_TESTS_DOMAIN . '/wp-admin/term.php?taxonomy=wptests_tax&tag_ID=' . $term1 . '&post_type=post';
		$this->assertEquals( $expected, $actual );
	}

	/**
	 * @ticket 32786
	 */
	public function test_get_edit_term_link_invalid_id() {
		$term1 = self::factory()->term->create( array(
			'taxonomy' => 'wptests_tax',
			'name' => 'foo',
		) );

		$actual = get_edit_term_link( 12345, 'wptests_tax' );
		$this->assertNull( $actual );
	}

	/**
	 * @ticket 32786
	 */
	public function test_get_edit_term_link_empty_id() {
		$actual = get_edit_term_link( '', 'wptests_tax' );
		$this->assertNull( $actual );
	}

	/**
	 * @ticket 32786
	 */
	public function test_get_edit_term_link_bad_tax() {
		$actual = get_edit_term_link( '', 'bad_tax' );
		$this->assertNull( $actual );
	}

	/**
	 * @ticket 35922
	 */
	public function test_taxonomy_should_not_be_required() {
		$t = self::factory()->term->create( array(
			'taxonomy' => 'wptests_tax',
			'name' => 'foo',
		) );

		$actual = get_edit_term_link( $t );
		$this->assertNotNull( $actual );
	}

	/**
	 * @ticket 35922
	 */
	public function test_cap_check_should_use_correct_taxonomy_when_taxonomy_is_not_specified() {
		register_taxonomy( 'wptests_tax_subscriber', 'post', array(
			'capabilities' => array(
				'edit_terms' => 'read',
			),
		) );

		$t = self::factory()->term->create( array(
			'taxonomy' => 'wptests_tax_subscriber',
			'name' => 'foo',
		) );

		$u = self::factory()->user->create( array(
			'role' => 'subscriber',
		) );
		wp_set_current_user( $u );

		$actual = get_edit_term_link( $t );
		$this->assertNotNull( $actual );
	}
}
