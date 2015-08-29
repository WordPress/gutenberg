<?php

/**
 * @group taxonomy
 */
class Tests_Category_WpListCategories extends WP_UnitTestCase {
	public function test_class() {
		$c = $this->factory->category->create();

		$found = wp_list_categories( array(
			'hide_empty' => false,
			'echo' => false,
		) );

		$this->assertContains( 'class="cat-item cat-item-' . $c . '"', $found );
	}

	public function test_class_containing_current_cat() {
		$c1 = $this->factory->category->create();
		$c2 = $this->factory->category->create();

		$found = wp_list_categories( array(
			'hide_empty' => false,
			'echo' => false,
			'current_category' => $c2,
		) );

		$this->assertNotRegExp( '/class="[^"]*cat-item-' . $c1 . '[^"]*current-cat[^"]*"/', $found );
		$this->assertRegExp( '/class="[^"]*cat-item-' . $c2 . '[^"]*current-cat[^"]*"/', $found );
	}

	public function test_class_containing_current_cat_parent() {
		$c1 = $this->factory->category->create();
		$c2 = $this->factory->category->create( array(
			'parent' => $c1,
		) );

		$found = wp_list_categories( array(
			'hide_empty' => false,
			'echo' => false,
			'current_category' => $c2,
		) );

		$this->assertRegExp( '/class="[^"]*cat-item-' . $c1 . '[^"]*current-cat-parent[^"]*"/', $found );
		$this->assertNotRegExp( '/class="[^"]*cat-item-' . $c2 . '[^"]*current-cat-parent[^"]*"/', $found );
	}

	/**
	 * @ticket 33565
	 */
	public function test_current_category_should_accept_an_array_of_ids() {
		$cats = $this->factory->category->create_many( 3 );

		$found = wp_list_categories( array(
			'echo' => false,
			'hide_empty' => false,
			'current_category' => array( $cats[0], $cats[2] ),
		) );

		$this->assertRegExp( '/class="[^"]*cat-item-' . $cats[0] . '[^"]*current-cat[^"]*"/', $found );
		$this->assertNotRegExp( '/class="[^"]*cat-item-' . $cats[1] . '[^"]*current[^"]*"/', $found );
		$this->assertRegExp( '/class="[^"]*cat-item-' . $cats[2] . '[^"]*current-cat[^"]*"/', $found );
	}

	/**
	 * @ticket 16792
	 */
	public function test_should_not_create_element_when_cat_name_is_filtered_to_empty_string() {
		$c1 = $this->factory->category->create( array(
			'name' => 'Test Cat 1',
		) );
		$c2 = $this->factory->category->create( array(
			'name' => 'Test Cat 2',
		) );

		add_filter( 'list_cats', array( $this, 'list_cats_callback' ) );
		$found = wp_list_categories( array(
			'hide_empty' => false,
			'echo' => false,
		) );
		remove_filter( 'list_cats', array( $this, 'list_cats_callback' ) );

		$this->assertContains( "cat-item-$c2", $found );
		$this->assertContains( 'Test Cat 2', $found );

		$this->assertNotContains( "cat-item-$c1", $found );
		$this->assertNotContains( 'Test Cat 1', $found );
	}

	public function test_show_option_all_link_should_go_to_home_page_when_show_on_front_is_false() {
		$cats = $this->factory->category->create_many( 2 );

		$found = wp_list_categories( array(
			'echo' => false,
			'show_option_all' => 'All',
			'hide_empty' => false,
			'taxonomy' => 'category',
		) );

		$this->assertContains( "<li class='cat-item-all'><a href='" . home_url( '/' ) . "'>All</a></li>", $found );
	}

	public function test_show_option_all_link_should_respect_page_for_posts() {
		$cats = $this->factory->category->create_many( 2 );
		$p = $this->factory->post->create( array( 'post_type' => 'page' ) );

		update_option( 'show_on_front', 'page' );
		update_option( 'page_for_posts', $p );

		$found = wp_list_categories( array(
			'echo' => false,
			'show_option_all' => 'All',
			'hide_empty' => false,
			'taxonomy' => 'category',
		) );

		$this->assertContains( "<li class='cat-item-all'><a href='" . get_permalink( $p ) . "'>All</a></li>", $found );
	}

	/**
	 * @ticket 21881
	 */
	public function test_show_option_all_link_should_link_to_post_type_archive_when_taxonomy_does_not_apply_to_posts() {
		register_post_type( 'wptests_pt', array( 'has_archive' => true ) );
		register_post_type( 'wptests_pt2', array( 'has_archive' => true ) );
		register_taxonomy( 'wptests_tax', array( 'foo', 'wptests_pt', 'wptests_pt2' ) );

		$terms = $this->factory->term->create_many( 2, array(
			'taxonomy' => 'wptests_tax',
		) );

		$found = wp_list_categories( array(
			'echo' => false,
			'show_option_all' => 'All',
			'hide_empty' => false,
			'taxonomy' => 'wptests_tax',
		) );

		$pt_archive = get_post_type_archive_link( 'wptests_pt' );

		$this->assertContains( "<li class='cat-item-all'><a href='" . $pt_archive . "'>All</a></li>", $found );
	}

	/**
	 * @ticket 21881
	 */
	public function test_show_option_all_link_should_not_link_to_post_type_archive_if_has_archive_is_false() {
		register_post_type( 'wptests_pt', array( 'has_archive' => false ) );
		register_post_type( 'wptests_pt2', array( 'has_archive' => true ) );
		register_taxonomy( 'wptests_tax', array( 'foo', 'wptests_pt', 'wptests_pt2' ) );

		$terms = $this->factory->term->create_many( 2, array(
			'taxonomy' => 'wptests_tax',
		) );

		$found = wp_list_categories( array(
			'echo' => false,
			'show_option_all' => 'All',
			'hide_empty' => false,
			'taxonomy' => 'wptests_tax',
		) );

		$pt_archive = get_post_type_archive_link( 'wptests_pt2' );

		$this->assertContains( "<li class='cat-item-all'><a href='" . $pt_archive . "'>All</a></li>", $found );
	}

	public function test_show_option_all_link_should_link_to_post_archive_if_available() {
		register_post_type( 'wptests_pt', array( 'has_archive' => true ) );
		register_post_type( 'wptests_pt2', array( 'has_archive' => true ) );
		register_taxonomy( 'wptests_tax', array( 'foo', 'wptests_pt', 'post', 'wptests_pt2' ) );

		$terms = $this->factory->term->create_many( 2, array(
			'taxonomy' => 'wptests_tax',
		) );

		$found = wp_list_categories( array(
			'echo' => false,
			'show_option_all' => 'All',
			'hide_empty' => false,
			'taxonomy' => 'wptests_tax',
		) );

		$url = home_url( '/' );

		$this->assertContains( "<li class='cat-item-all'><a href='" . $url . "'>All</a></li>", $found );
	}

	public function test_show_option_all_link_should_link_to_post_archive_if_no_associated_post_types_have_archives() {
		register_post_type( 'wptests_pt', array( 'has_archive' => false ) );
		register_post_type( 'wptests_pt2', array( 'has_archive' => false ) );
		register_taxonomy( 'wptests_tax', array( 'foo', 'wptests_pt', 'wptests_pt2' ) );

		$terms = $this->factory->term->create_many( 2, array(
			'taxonomy' => 'wptests_tax',
		) );

		$found = wp_list_categories( array(
			'echo' => false,
			'show_option_all' => 'All',
			'hide_empty' => false,
			'taxonomy' => 'wptests_tax',
		) );

		$url = home_url( '/' );

		$this->assertContains( "<li class='cat-item-all'><a href='" . $url . "'>All</a></li>", $found );
	}

	public function list_cats_callback( $cat ) {
		if ( 'Test Cat 1' === $cat ) {
			return '';
		}

		return $cat;
	}

	/**
	 * @ticket 33460
	 */
	public function test_title_li_should_be_shown_by_default_for_empty_lists() {
		$found = wp_list_categories( array(
			'echo' => false,
		) );

		$this->assertContains( '<li class="categories">Categories', $found );
	}

	/**
	 * @ticket 33460
	 */
	public function test_hide_title_if_empty_should_be_respected_for_empty_lists_when_true() {
		$found = wp_list_categories( array(
			'echo' => false,
			'hide_title_if_empty' => true,
		) );

		$this->assertNotContains( '<li class="categories">Categories', $found );
	}

	/**
	 * @ticket 33460
	 */
	public function test_hide_title_if_empty_should_be_respected_for_empty_lists_when_false() {
		$found = wp_list_categories( array(
			'echo' => false,
			'hide_title_if_empty' => false,
		) );

		$this->assertContains( '<li class="categories">Categories', $found );
	}

	/**
	 * @ticket 33460
	 */
	public function test_hide_title_if_empty_should_be_ignored_when_category_list_is_not_empty() {
		$cat = $this->factory->category->create();

		$found = wp_list_categories( array(
			'echo' => false,
			'hide_empty' => false,
			'hide_title_if_empty' => true,
		) );

		$this->assertContains( '<li class="categories">Categories', $found );
	}
}
