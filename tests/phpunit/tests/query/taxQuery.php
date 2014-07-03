<?php

/**
 * Test the is_*() functions in query.php across the URL structure
 *
 * This exercises both query.php and rewrite.php: urls are fed through the rewrite code,
 * then we test the effects of each url on the wp_query object.
 *
 * @group query
 * @group rewrite
 */
class Tests_Query_TaxQuery extends WP_UnitTestCase {
	protected $tag_id;
	protected $cat_id;
	protected $tax_id;
	protected $tax_id2;
	protected $post_id;

	protected $cat;
	protected $uncat;
	protected $tag;
	protected $tax;

	function setUp() {
		global $wp_rewrite;
		parent::setUp();

		set_current_screen( 'front' );

		$GLOBALS['wp_the_query'] = new WP_Query();
		$GLOBALS['wp_query'] = $GLOBALS['wp_the_query'];

		$wp_rewrite->init();
		$wp_rewrite->set_permalink_structure( '/%year%/%monthnum%/%day%/%postname%/' );

		create_initial_taxonomies();
		register_taxonomy( 'testtax', 'post', array( 'public' => true ) );

		$wp_rewrite->flush_rules();

		$this->tag_id = $this->factory->tag->create( array( 'slug' => 'tag-slug' ) );
		$this->cat_id = $this->factory->category->create( array( 'slug' => 'cat-slug' ) );
		$this->tax_id = $this->factory->term->create( array( 'taxonomy' => 'testtax', 'slug' => 'tax-slug' ) );
		$this->tax_id2 = $this->factory->term->create( array( 'taxonomy' => 'testtax', 'slug' => 'tax-slug2' ) );
		$this->post_id = $this->factory->post->create();
		wp_set_object_terms( $this->post_id, $this->cat_id, 'category' );
		wp_set_object_terms( $this->post_id, array( $this->tax_id, $this->tax_id2 ), 'testtax' );

		$this->cat = get_term( $this->cat_id, 'category' );
		_make_cat_compat( $this->cat );
		$this->tag = get_term( $this->tag_id, 'post_tag' );

		$this->uncat = get_term_by( 'slug', 'uncategorized', 'category' );
		_make_cat_compat( $this->uncat );

		add_action( 'pre_get_posts', array( $this, 'pre_get_posts_tax_category_tax_query' ) );
	}

	function tearDown() {
		global $wp_rewrite;
		parent::tearDown();

		_unregister_taxonomy( 'testtax' );

		$wp_rewrite->init();

		remove_action( 'pre_get_posts', array( $this, 'pre_get_posts_tax_category_tax_query' ) );
	}

	function test_tag_action_tax() {
		// tag with tax added
		$this->go_to( home_url( "/tag/tag-slug/" ) );
		$this->assertQueryTrue( 'is_tag', 'is_archive' );
		$this->assertNotEmpty( get_query_var( 'tax_query' ) );
		$this->assertNotEmpty( get_query_var( 'taxonomy' ) );
		$this->assertNotEmpty( get_query_var( 'term_id' ) );
		$this->assertNotEmpty( get_query_var( 'tag_id' ) );
		$this->assertEquals( get_queried_object(), $this->tag );
	}

	function test_tag_query_cat_action_tax() {
		// tag + category with tax added
		$this->go_to( home_url( "/tag/tag-slug/?cat=$this->cat_id" ) );
		$this->assertQueryTrue( 'is_category', 'is_tag', 'is_archive' );
		$this->assertNotEmpty( get_query_var( 'tax_query' ) );
		$this->assertNotEmpty( get_query_var( 'taxonomy' ) );
		$this->assertNotEmpty( get_query_var( 'term_id' ) );
		$this->assertNotEmpty( get_query_var( 'cat' ) );
		$this->assertNotEmpty( get_query_var( 'tag_id' ) );
		$this->assertEquals( get_queried_object(), $this->cat );
	}

	function test_tag_query_cat_query_tax_action_tax() {
		// tag + category + tax with tax added
		$this->go_to( home_url( "/tag/tag-slug/?cat=$this->cat_id&testtax=tax-slug2" ) );
		$this->assertQueryTrue( 'is_category', 'is_tag', 'is_tax', 'is_archive' );
		$this->assertNotEmpty( get_query_var( 'tax_query' ) );
		$this->assertNotEmpty( get_query_var( 'taxonomy' ) );
		$this->assertNotEmpty( get_query_var( 'term_id' ) );
		$this->assertNotEmpty( get_query_var( 'cat' ) );
		$this->assertNotEmpty( get_query_var( 'tag_id' ) );
		$this->assertNotEmpty( get_query_var( 'testtax' ) );
		$this->assertEquals( get_queried_object(), $this->cat );
	}

	function test_cat_action_tax() {
		// category with tax added
		$this->go_to( home_url( "/category/cat-slug/" ) );
		$this->assertQueryTrue( 'is_category', 'is_archive' );
		$this->assertNotEmpty( get_query_var( 'cat' ) );
		$this->assertNotEmpty( get_query_var( 'tax_query' ) );
		$this->assertNotEmpty( get_query_var( 'taxonomy' ) );
		$this->assertNotEmpty( get_query_var( 'term_id' ) );
		$this->assertEquals( get_queried_object(), $this->cat );
	}

	/**
	 * @ticket 26627
	 */
	function test_cat_uncat_action_tax() {
		// category with tax added
		add_action( 'pre_get_posts', array( $this, '_cat_uncat_action_tax' ), 11 );

		$this->go_to( home_url( "/category/uncategorized/" ) );
		$this->assertQueryTrue( 'is_category', 'is_archive' );
		$this->assertNotEmpty( get_query_var( 'cat' ) );
		$this->assertNotEmpty( get_query_var( 'tax_query' ) );
		$this->assertNotEmpty( get_query_var( 'taxonomy' ) );
		$this->assertNotEmpty( get_query_var( 'term_id' ) );
		$this->assertEquals( get_queried_object(), $this->uncat );

		remove_action( 'pre_get_posts', array( $this, '_cat_uncat_action_tax' ), 11 );
	}

	function _cat_uncat_action_tax( &$query ) {
		$this->assertTrue( $query->is_category() );
		$this->assertTrue( $query->is_archive() );
		$this->assertNotEmpty( $query->get( 'category_name' ) );
		$this->assertNotEmpty( $query->get( 'tax_query' ) );
		$this->assertEquals( $query->get_queried_object(), $this->uncat );
	}

	/**
	 * @ticket 26728
	 */
	function test_tax_action_tax() {
		// tax with tax added
		$this->go_to( home_url( '/testtax/tax-slug2/' ) );
		$this->assertQueryTrue( 'is_tax', 'is_archive' );
		$this->assertNotEmpty( get_query_var( 'tax_query' ) );
		$this->assertNotEmpty( get_query_var( 'taxonomy' ) );
		$this->assertNotEmpty( get_query_var( 'term_id' ) );
		$this->assertEquals( get_queried_object(), get_term( $this->tax_id, 'testtax' ) );
	}

	function test_tax_query_tag_action_tax() {
		// tax + tag with tax added
		$this->go_to( home_url( "/testtax/tax-slug2/?tag_id=$this->tag_id" ) );
		$this->assertQueryTrue( 'is_tag', 'is_tax', 'is_archive' );
		$this->assertNotEmpty( get_query_var( 'tax_query' ) );
		$this->assertNotEmpty( get_query_var( 'taxonomy' ) );
		$this->assertNotEmpty( get_query_var( 'term_id' ) );
		$this->assertNotEmpty( get_query_var( 'tag_id' ) );
		$this->assertEquals( get_queried_object(), $this->tag );
	}

	function test_tax_query_cat_action_tax() {
		// tax + cat with tax added
		$this->go_to( home_url( "/testtax/tax-slug2/?cat=$this->cat_id" ) );
		$this->assertQueryTrue( 'is_category', 'is_tax', 'is_archive' );
		$this->assertNotEmpty( get_query_var( 'tax_query' ) );
		$this->assertNotEmpty( get_query_var( 'taxonomy' ) );
		$this->assertNotEmpty( get_query_var( 'term_id' ) );
		$this->assertNotEmpty( get_query_var( 'cat' ) );
		$this->assertEquals( get_queried_object(), $this->cat );
	}

	function pre_get_posts_tax_category_tax_query( &$query ) {
		$query->set( 'tax_query', array(
			array( 'taxonomy' => 'testtax', 'field' => 'term_id', 'terms' => $this->tax_id )
		) );
	}
}