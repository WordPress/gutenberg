<?php

/**
 * @group taxonomy
 */
class Tests_Term_GetTermLink extends WP_UnitTestCase {
	private $permalink_structure;

	public function setUp() {
		parent::setUp();

		// Assume no pretty permalinks.
		global $wp_rewrite;
		$this->permalink_structure = get_option( 'permalink_structure' );
		$wp_rewrite->set_permalink_structure( '' );
		$wp_rewrite->flush_rules();

		register_taxonomy( 'wptests_tax', 'post' );
	}

	public function tearDown() {
		global $wp_rewrite;
		$wp_rewrite->set_permalink_structure( $this->permalink_structure );
		$wp_rewrite->flush_rules();

		parent::tearDown();
	}

	public function test_integer_should_be_interpreted_as_term_id() {
		$t1 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
			'name' => 'foo',
		) );
		$t2 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
			'slug' => $t1,
		) );

		$term = intval( $t1 );

		$actual = get_term_link( $term, 'wptests_tax' );
		$this->assertContains( 'wptests_tax=foo', $actual );
	}

	public function test_numeric_string_should_be_interpreted_as_term_slug() {
		$t1 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
			'name' => 'foo',
		) );
		$t2 = $this->factory->term->create( array(
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
		$c = $this->factory->category->create();

		$actual = get_term_link( $c, 'category' );
		$this->assertContains( 'cat=' . $c, $actual );
	}

	public function test_taxonomy_with_query_var_should_use_that_query_var_with_term_slug() {
		register_taxonomy( 'wptests_tax2', 'post', array(
			'query_var' => 'foo',
		) );

		$t = $this->factory->term->create( array(
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

		$t = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax2',
			'slug' => 'bar',
		) );

		$actual = get_term_link( $t, 'wptests_tax2' );
		$this->assertContains( 'taxonomy=wptests_tax2', $actual );
		$this->assertContains( 'term=bar', $actual );
	}

	public function test_taxonomy_permastruct_with_hierarchical_rewrite_should_put_term_ancestors_in_link() {
		global $wp_rewrite;
		$permalink_structure = get_option( 'permalink_structure' );
		$wp_rewrite->set_permalink_structure( '/%year%/%monthnum%/%day%/%postname%/' );
		$wp_rewrite->flush_rules();

		register_taxonomy( 'wptests_tax2', 'post', array(
			'hierarchical' => true,
			'rewrite' => array(
				'slug' => 'foo',
				'hierarchical' => true,
			),
		) );

		$t1 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax2',
			'slug' => 'term1',
		) );

		$t2 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax2',
			'slug' => 'term2',
			'parent' => $t1,
		) );

		$actual = get_term_link( $t2, 'wptests_tax2' );

		$wp_rewrite->set_permalink_structure( $permalink_structure );
		$wp_rewrite->flush_rules();

		$this->assertContains( '/foo/term1/term2/', $actual );
	}

	public function test_taxonomy_permastruct_with_nonhierarchical_rewrite_should_not_put_term_ancestors_in_link() {
		global $wp_rewrite;
		$permalink_structure = get_option( 'permalink_structure' );
		$wp_rewrite->set_permalink_structure( '/%year%/%monthnum%/%day%/%postname%/' );
		$wp_rewrite->flush_rules();

		register_taxonomy( 'wptests_tax2', 'post', array(
			'hierarchical' => true,
			'rewrite' => array(
				'slug' => 'foo',
				'hierarchical' => false,
			),
		) );

		$t1 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax2',
			'slug' => 'term1',
		) );

		$t2 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax2',
			'slug' => 'term2',
			'parent' => $t1,
		) );

		$actual = get_term_link( $t2, 'wptests_tax2' );

		$wp_rewrite->set_permalink_structure( $permalink_structure );
		$wp_rewrite->flush_rules();

		$this->assertContains( '/foo/term2/', $actual );
	}
}
