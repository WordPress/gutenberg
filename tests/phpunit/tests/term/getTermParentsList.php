<?php

/**
 * @group taxonomy
 */
class Tests_Terms_GetTermsParentsList extends WP_UnitTestCase {
	protected static $c1;
	protected static $c2;

	public static function wpSetUpBeforeClass( $factory ) {
		register_taxonomy( 'wptests_tax', 'post', array( 'hierarchical' => true ) );

		self::$c1 = $factory->term->create_and_get( array( 'taxonomy' => 'wptests_tax' ) );
		self::$c2 = $factory->term->create_and_get( array(
			'taxonomy' => 'wptests_tax',
			'parent'   => self::$c1->term_id,
		) );
	}

	public static function wpTearDownAfterClass() {
		wp_delete_term( self::$c1->term_id, 'wptests_tax' );
		wp_delete_term( self::$c2->term_id, 'wptests_tax' );
	}

	public function setUp() {
		parent::setUp();
		register_taxonomy( 'wptests_tax', 'post', array( 'hierarchical' => true ) );
	}

	public function test_should_return_wp_error_for_empty_id() {
		$this->assertWPError( get_term_parents_list( '', 'wptests_tax' ) );
	}

	public function test_should_return_empty_for_invalid_id() {
		$this->assertEquals( '', get_term_parents_list( 99999999, 'wptests_tax' ) );
	}

	public function test_should_return_wp_error_for_invalid_taxonomy() {
		$this->assertWPError( get_term_parents_list( self::$c2->term_id, 'foo' ) );
	}

	public function test_with_default_parameters() {
		$expected = '<a href="' . get_term_link( self::$c1->term_id ) . '">' . self::$c1->name . '</a>/<a href="' . get_term_link( self::$c2->term_id ) . '">'. self::$c2->name . '</a>/';
		$found = get_term_parents_list( self::$c2->term_id, 'wptests_tax' );
		$this->assertSame( $expected, $found );
	}

	public function test_array_parameters() {
		$args = array(
			'separator' => ' --- ',
			'link'      => false,
			'format'    => 'slug',
			'inclusive' => false,
		);

		$expected = self::$c1->slug . ' --- ';
		$found = get_term_parents_list( self::$c2->term_id, 'wptests_tax',  $args );
		$this->assertSame( $expected, $found );
	}

	public function test_link_false() {
		$expected = self::$c1->name . '/' . self::$c2->name . '/';
		$found = get_term_parents_list( self::$c2->term_id, 'wptests_tax', 'link=false' );
		$this->assertSame( $expected, $found );
	}

	public function test_separator() {
		$expected = self::$c1->name . ' --- ' . self::$c2->name . ' --- ';
		$found = get_term_parents_list( self::$c2->term_id, 'wptests_tax', 'link=false&separator= --- ' );
		$this->assertSame( $expected, $found );
	}

	public function test_format_name() {
		$expected = self::$c1->name . '/'. self::$c2->name . '/';
		$found = get_term_parents_list( self::$c2->term_id, 'wptests_tax', 'link=false&format=name' );
		$this->assertSame( $expected, $found );
	}

	public function test_format_slug() {
		$expected = self::$c1->slug . '/'. self::$c2->slug . '/';
		$found = get_term_parents_list( self::$c2->term_id, 'wptests_tax', 'link=false&format=slug' );
		$this->assertSame( $expected, $found );
	}

	public function test_inclusive_false() {
		$expected = '<a href="' . get_term_link( self::$c1->term_id ) . '">' . self::$c1->name . '</a>/';
		$found = get_term_parents_list( self::$c2->term_id, 'wptests_tax', 'inclusive=false' );
		$this->assertSame( $expected, $found );
	}

	public function test_term_without_parents() {
		$expected = '<a href="' . get_term_link( self::$c1->term_id ) . '">' . self::$c1->name . '</a>/';
		$found = get_term_parents_list( self::$c1->term_id, 'wptests_tax' );
		$this->assertSame( $expected, $found );
	}

	public function test_order_should_go_from_distant_to_nearest_ancestor() {
		$c3 = self::factory()->term->create_and_get( array(
			'taxonomy' => 'wptests_tax',
			'parent'   => self::$c2->term_id,
		) );

		$expected = self::$c1->name . '/' . self::$c2->name . '/' . $c3->name . '/';
		$found = get_term_parents_list( $c3->term_id, 'wptests_tax', array( 'link' => false ) );
		$this->assertSame( $expected, $found );
	}

	public function test_should_accept_term_object() {
		$expected = self::$c1->name . '/' . self::$c2->name . '/';
		$found = get_term_parents_list( self::$c2, 'wptests_tax', array( 'link' => false ) );
		$this->assertSame( $expected, $found );
	}
}
