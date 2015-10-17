<?php

/**
 * @group taxonomy
 */
class Tests_Term_GetTermLink extends WP_UnitTestCase {

	public function setUp() {
		parent::setUp();

		register_taxonomy( 'wptests_tax', 'post' );
	}

	public function test_integer_should_be_interpreted_as_term_id() {
		$t1 = self::factory()->term->create( array(
			'taxonomy' => 'wptests_tax',
			'name' => 'foo',
		) );
		$t2 = self::factory()->term->create( array(
			'taxonomy' => 'wptests_tax',
			'slug' => $t1,
		) );

		$term = intval( $t1 );

		$actual = get_term_link( $term, 'wptests_tax' );
		$this->assertContains( 'wptests_tax=foo', $actual );
	}

	public function test_numeric_string_should_be_interpreted_as_term_slug() {
		$t1 = self::factory()->term->create( array(
			'taxonomy' => 'wptests_tax',
			'name' => 'foo',
		) );
		$t2 = self::factory()->term->create( array(
			'taxonomy' => 'wptests_tax',
			'slug' => $t1,
		) );

		$term = (string) $t1;

		$actual = get_term_link( $term, 'wptests_tax' );
		$this->assertContains( 'wptests_tax=' . $term, $actual );
	}

	public function test_invalid_term_should_return_wp_error() {
		$actual = get_term_link( 'foo', 'wptests_tax' );
		$this->assertWPError( $actual );
	}

	public function test_category_should_use_cat_query_var_with_term_id() {
		$c = self::factory()->category->create();

		$actual = get_term_link( $c, 'category' );
		$this->assertContains( 'cat=' . $c, $actual );
	}

	public function test_taxonomy_with_query_var_should_use_that_query_var_with_term_slug() {
		register_taxonomy( 'wptests_tax2', 'post', array(
			'query_var' => 'foo',
		) );

		$t = self::factory()->term->create( array(
			'taxonomy' => 'wptests_tax2',
			'slug' => 'bar',
		) );

		$actual = get_term_link( $t, 'wptests_tax2' );
		$this->assertContains( 'foo=bar', $actual );
	}

	public function test_taxonomy_without_query_var_should_use_taxonomy_query_var_and_term_query_var_with_term_slug() {
		register_taxonomy( 'wptests_tax2', 'post', array(
			'query_var' => false,
		) );

		$t = self::factory()->term->create( array(
			'taxonomy' => 'wptests_tax2',
			'slug' => 'bar',
		) );

		$actual = get_term_link( $t, 'wptests_tax2' );
		$this->assertContains( 'taxonomy=wptests_tax2', $actual );
		$this->assertContains( 'term=bar', $actual );
	}

	public function test_taxonomy_permastruct_with_hierarchical_rewrite_should_put_term_ancestors_in_link() {
		$this->set_permalink_structure( '/%year%/%monthnum%/%day%/%postname%/' );

		register_taxonomy( 'wptests_tax2', 'post', array(
			'hierarchical' => true,
			'rewrite' => array(
				'slug' => 'foo',
				'hierarchical' => true,
			),
		) );

		flush_rewrite_rules();

		$t1 = self::factory()->term->create( array(
			'taxonomy' => 'wptests_tax2',
			'slug' => 'term1',
		) );

		$t2 = self::factory()->term->create( array(
			'taxonomy' => 'wptests_tax2',
			'slug' => 'term2',
			'parent' => $t1,
		) );

		$actual = get_term_link( $t2, 'wptests_tax2' );

		$this->assertContains( '/foo/term1/term2/', $actual );
	}

	public function test_taxonomy_permastruct_with_nonhierarchical_rewrite_should_not_put_term_ancestors_in_link() {
		$this->set_permalink_structure( '/%year%/%monthnum%/%day%/%postname%/' );

		register_taxonomy( 'wptests_tax2', 'post', array(
			'hierarchical' => true,
			'rewrite' => array(
				'slug' => 'foo',
				'hierarchical' => false,
			),
		) );

		flush_rewrite_rules();

		$t1 = self::factory()->term->create( array(
			'taxonomy' => 'wptests_tax2',
			'slug' => 'term1',
		) );

		$t2 = self::factory()->term->create( array(
			'taxonomy' => 'wptests_tax2',
			'slug' => 'term2',
			'parent' => $t1,
		) );

		$actual = get_term_link( $t2, 'wptests_tax2' );

		$this->assertContains( '/foo/term2/', $actual );
	}
}
