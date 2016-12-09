<?php

/**
 * @group taxonomy
 */
class Tests_Category_GetCategoryParents extends WP_UnitTestCase {
	protected $c1;
	protected $c2;

	public function setUp() {
		parent::setUp();

		$this->c1 = self::factory()->category->create_and_get();
		$this->c2 = self::factory()->category->create_and_get( array(
			'parent' => $this->c1->term_id,
		) );
	}

	public function test_should_return_wp_error_for_invalid_category() {
		$this->assertWPError( get_category_parents( '' ) );
	}

	public function test_with_default_parameters() {
		$expected = $this->c1->name . '/'. $this->c2->name . '/';
		$found = get_category_parents( $this->c2->term_id );
		$this->assertSame( $expected, $found );
	}

	public function test_link_true() {
		$expected = '<a href="' . get_category_link( $this->c1->term_id ) . '">' . $this->c1->name . '</a>/<a href="' . get_category_link( $this->c2->term_id ) . '">'. $this->c2->name . '</a>/';
		$found = get_category_parents( $this->c2->term_id, true );
		$this->assertSame( $expected, $found );
	}

	public function test_separator() {
		$expected = $this->c1->name . ' --- ' . $this->c2->name . ' --- ';
		$found = get_category_parents( $this->c2->term_id, false, ' --- ', false );
		$this->assertSame( $expected, $found );
	}

	public function test_nicename_false() {
		$expected = $this->c1->name . '/'. $this->c2->name . '/';
		$found = get_category_parents( $this->c2->term_id, false, '/', false );
		$this->assertSame( $expected, $found );
	}

	public function test_nicename_true() {
		$expected = $this->c1->slug . '/'. $this->c2->slug . '/';
		$found = get_category_parents( $this->c2->term_id, false, '/', true );
		$this->assertSame( $expected, $found );
	}

	public function test_deprecated_argument_visited() {
		$this->setExpectedDeprecated( 'get_category_parents' );
		$found = get_category_parents( $this->c2->term_id, false, '/', false, array( $this->c1->term_id ) );
	}

	public function test_category_without_parents() {
		$expected = $this->c1->name . '/';
		$found = get_category_parents( $this->c1->term_id );
		$this->assertSame( $expected, $found );
	}
}
