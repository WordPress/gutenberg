<?php

class Tests_List_Pages extends WP_UnitTestCase {
	var $pages;

	/*
	$defaults = array(
		'depth' => 0,
		'show_date' => '',
		'date_format' => get_option('date_format'),
		'child_of' => 0,
		'exclude' => '',
		'title_li' => __('Pages'),
		'echo' => 1,
		'authors' => '',
		'sort_column' => 'menu_order, post_title',
		'link_before' => '',
		'link_after' => '',
		'walker' => '',
		'include'      => '',
		'post_type'    => 'page',
		'post_status'  => 'publish',
	);
	*/
	function setUp() {
		parent::setUp();
		global $wpdb;
		$wpdb->query( 'TRUNCATE ' . $wpdb->prefix . 'posts' );
		$pages = array();
		$this->factory->user->create();
		$pages[] = $this->factory->post->create( array( 'post_type' => 'page', 'post_title' => 'Parent 1' ) );
		$pages[] = $this->factory->post->create( array( 'post_type' => 'page', 'post_title' => 'Parent 2' ) );
		$pages[] = $this->factory->post->create( array( 'post_type' => 'page', 'post_title' => 'Parent 3', 'post_author' => '2' ) );

		foreach ( $pages as $page ) {
			$this->pages[$page] = $this->factory->post->create( array( 'post_parent' => $page, 'post_type' => 'page', 'post_title' => 'Child 1' ) );
			$this->pages[$page] = $this->factory->post->create( array( 'post_parent' => $page, 'post_type' => 'page', 'post_title' => 'Child 2' ) );
			$this->pages[$page] = $this->factory->post->create( array( 'post_parent' => $page, 'post_type' => 'page', 'post_title' => 'Child 3' ) );
		}
	}

	function test_wp_list_pages_default() {
		$args = array(
			'echo' => false
		);
		$expected['default'] = '<li class="pagenav">Pages<ul><li class="page_item page-item-1 page_item_has_children"><a href="' . get_permalink( 1 ) . '">Parent 1</a>
<ul class=\'children\'>
	<li class="page_item page-item-4"><a href="' . get_permalink( 4 ) . '">Child 1</a></li>
	<li class="page_item page-item-5"><a href="' . get_permalink( 5 ) . '">Child 2</a></li>
	<li class="page_item page-item-6"><a href="' . get_permalink( 6 ) . '">Child 3</a></li>
</ul>
</li>
<li class="page_item page-item-2 page_item_has_children"><a href="' . get_permalink( 2 ) . '">Parent 2</a>
<ul class=\'children\'>
	<li class="page_item page-item-7"><a href="' . get_permalink( 7 ) . '">Child 1</a></li>
	<li class="page_item page-item-8"><a href="' . get_permalink( 8 ) . '">Child 2</a></li>
	<li class="page_item page-item-9"><a href="' . get_permalink( 9 ) . '">Child 3</a></li>
</ul>
</li>
<li class="page_item page-item-3 page_item_has_children"><a href="' . get_permalink( 3 ) . '">Parent 3</a>
<ul class=\'children\'>
	<li class="page_item page-item-10"><a href="' . get_permalink( 10 ) . '">Child 1</a></li>
	<li class="page_item page-item-11"><a href="' . get_permalink( 11 ) . '">Child 2</a></li>
	<li class="page_item page-item-12"><a href="' . get_permalink( 12 ) . '">Child 3</a></li>
</ul>
</li>
</ul></li>';
		$actual = wp_list_pages( $args );
		$this->AssertEquals( $expected['default'], $actual );
	}

	function test_wp_list_pages_depth() {
		$args = array(
			'echo' 	=> false,
			'depth' => 1
		);
		$expected['depth'] = '<li class="pagenav">Pages<ul><li class="page_item page-item-1 page_item_has_children"><a href="' . get_permalink( 1 ) . '">Parent 1</a></li>
<li class="page_item page-item-2 page_item_has_children"><a href="' . get_permalink( 2 ) . '">Parent 2</a></li>
<li class="page_item page-item-3 page_item_has_children"><a href="' . get_permalink( 3 ) . '">Parent 3</a></li>
</ul></li>';
		$actual = wp_list_pages( $args );
		$this->AssertEquals( $expected['depth'], $actual );
	}

	function test_wp_list_pages_show_date() {
		$args = array(
			'echo' => false,
			'depth' => 1,
			'show_date' => true
		);
		$expected['show_date'] = '<li class="pagenav">Pages<ul><li class="page_item page-item-1 page_item_has_children"><a href="' . get_permalink( 1 ) . '">Parent 1</a> ' . date( 'F j, Y' ) . '</li>
<li class="page_item page-item-2 page_item_has_children"><a href="' . get_permalink( 2 ) . '">Parent 2</a> ' . date( 'F j, Y' ) . '</li>
<li class="page_item page-item-3 page_item_has_children"><a href="' . get_permalink( 3 ) . '">Parent 3</a> ' . date( 'F j, Y' ) . '</li>
</ul></li>';
		$actual = wp_list_pages( $args );
		$this->AssertEquals( $expected['show_date'], $actual );
	}

	function test_wp_list_pages_date_format() {
		$args = array(
			'echo' => false,
			'show_date' => true,
			'date_format' => 'l, F j, Y'
		);
		$expected['date_format'] = '<li class="pagenav">Pages<ul><li class="page_item page-item-1 page_item_has_children"><a href="' . get_permalink( 1 ) . '">Parent 1</a> ' . date( 'l, F j, Y' ) . '
<ul class=\'children\'>
	<li class="page_item page-item-4"><a href="' . get_permalink( 4 ) . '">Child 1</a> ' . date( 'l, F j, Y' ) . '</li>
	<li class="page_item page-item-5"><a href="' . get_permalink( 5 ) . '">Child 2</a> ' . date( 'l, F j, Y' ) . '</li>
	<li class="page_item page-item-6"><a href="' . get_permalink( 6 ) . '">Child 3</a> ' . date( 'l, F j, Y' ) . '</li>
</ul>
</li>
<li class="page_item page-item-2 page_item_has_children"><a href="' . get_permalink( 2 ) . '">Parent 2</a> ' . date( 'l, F j, Y' ) . '
<ul class=\'children\'>
	<li class="page_item page-item-7"><a href="' . get_permalink( 7 ) . '">Child 1</a> ' . date( 'l, F j, Y' ) . '</li>
	<li class="page_item page-item-8"><a href="' . get_permalink( 8 ) . '">Child 2</a> ' . date( 'l, F j, Y' ) . '</li>
	<li class="page_item page-item-9"><a href="' . get_permalink( 9 ) . '">Child 3</a> ' . date( 'l, F j, Y' ) . '</li>
</ul>
</li>
<li class="page_item page-item-3 page_item_has_children"><a href="' . get_permalink( 3 ) . '">Parent 3</a> ' . date( 'l, F j, Y' ) . '
<ul class=\'children\'>
	<li class="page_item page-item-10"><a href="' . get_permalink( 10 ) . '">Child 1</a> ' . date( 'l, F j, Y' ) . '</li>
	<li class="page_item page-item-11"><a href="' . get_permalink( 11 ) . '">Child 2</a> ' . date( 'l, F j, Y' ) . '</li>
	<li class="page_item page-item-12"><a href="' . get_permalink( 12 ) . '">Child 3</a> ' . date( 'l, F j, Y' ) . '</li>
</ul>
</li>
</ul></li>';
		$actual = wp_list_pages( $args );
		$this->AssertEquals( $expected['date_format'], $actual );
	}

	function test_wp_list_pages_child_of() {
		$args = array(
			'echo' => false,
			'child_of' => 2
		);
		$expected['child_of'] = '<li class="pagenav">Pages<ul><li class="page_item page-item-7"><a href="' . get_permalink( 7 ) . '">Child 1</a></li>
<li class="page_item page-item-8"><a href="' . get_permalink( 8 ) . '">Child 2</a></li>
<li class="page_item page-item-9"><a href="' . get_permalink( 9 ) . '">Child 3</a></li>
</ul></li>';
		$actual = wp_list_pages( $args );
		$this->AssertEquals( $expected['child_of'], $actual );
	}

	function test_wp_list_pages_exclude() {
		$args = array(
			'echo' => false,
			'exclude' => '2, 2'
		);
		$expected['exclude'] = '<li class="pagenav">Pages<ul><li class="page_item page-item-1 page_item_has_children"><a href="' . get_permalink( 1 ) . '">Parent 1</a>
<ul class=\'children\'>
	<li class="page_item page-item-4"><a href="' . get_permalink( 4 ) . '">Child 1</a></li>
	<li class="page_item page-item-5"><a href="' . get_permalink( 5 ) . '">Child 2</a></li>
	<li class="page_item page-item-6"><a href="' . get_permalink( 6 ) . '">Child 3</a></li>
</ul>
</li>
<li class="page_item page-item-3 page_item_has_children"><a href="' . get_permalink( 3 ) . '">Parent 3</a>
<ul class=\'children\'>
	<li class="page_item page-item-10"><a href="' . get_permalink( 10 ) . '">Child 1</a></li>
	<li class="page_item page-item-11"><a href="' . get_permalink( 11 ) . '">Child 2</a></li>
	<li class="page_item page-item-12"><a href="' . get_permalink( 12 ) . '">Child 3</a></li>
</ul>
</li>
<li class="page_item page-item-7"><a href="' . get_permalink( 7 ) . '">Child 1</a></li>
<li class="page_item page-item-8"><a href="' . get_permalink( 8 ) . '">Child 2</a></li>
<li class="page_item page-item-9"><a href="' . get_permalink( 9 ) . '">Child 3</a></li>
</ul></li>';
		$actual = wp_list_pages( $args );
		$this->AssertEquals( $expected['exclude'], $actual );
	}

	function test_wp_list_pages_title_li() {
		$args = array(
			'echo' => false,
			'depth' => 1,
			'title_li' => 'PageTitle'
		);
		$expected['title_li'] = '<li class="pagenav">PageTitle<ul><li class="page_item page-item-1 page_item_has_children"><a href="' . get_permalink( 1 ) . '">Parent 1</a></li>
<li class="page_item page-item-2 page_item_has_children"><a href="' . get_permalink( 2 ) . '">Parent 2</a></li>
<li class="page_item page-item-3 page_item_has_children"><a href="' . get_permalink( 3 ) . '">Parent 3</a></li>
</ul></li>';
		$actual = wp_list_pages( $args );
		$this->AssertEquals( $expected['title_li'], $actual );
	}

	function test_wp_list_pages_echo() {
		$args = array(
			'echo' => true,
			'depth' => 1
		);
		$expected['echo'] = '<li class="pagenav">Pages<ul><li class="page_item page-item-1 page_item_has_children"><a href="' . get_permalink( 1 ) . '">Parent 1</a></li>
<li class="page_item page-item-2 page_item_has_children"><a href="' . get_permalink( 2 ) . '">Parent 2</a></li>
<li class="page_item page-item-3 page_item_has_children"><a href="' . get_permalink( 3 ) . '">Parent 3</a></li>
</ul></li>';
		ob_start();
		wp_list_pages( $args );
		$actual = ob_get_clean();
		$this->AssertEquals( $expected['echo'], $actual );
	}

	function test_wp_list_pages_authors() {
		$args = array(
			'echo' => false,
			'authors' => '2',
		);
		$expected['authors'] = '<li class="pagenav">Pages<ul><li class="page_item page-item-3"><a href="' . get_permalink( 3) . '">Parent 3</a></li>
</ul></li>';
		$actual = wp_list_pages( $args );
		$this->AssertEquals( $expected['authors'], $actual );
	}

	function test_wp_list_pages_number() {
		$args = array(
			'echo' => false,
			'number' => 1,
		);
		$expected['number'] = '<li class="pagenav">Pages<ul><li class="page_item page-item-4"><a href="' . get_permalink( 4 ) . '">Child 1</a></li>
</ul></li>';
		$actual = wp_list_pages( $args );
		$this->AssertEquals( $expected['number'], $actual );
	}

	function test_wp_list_pages_sort_column() {
		$args = array(
			'echo' => false,
			'sort_column' => 'post_author',
			'sort_order' => 'DESC'
		);
		$expected['sort_column'] = '<li class="pagenav">Pages<ul><li class="page_item page-item-3 page_item_has_children"><a href="' . get_permalink( 3 ) . '">Parent 3</a>
<ul class=\'children\'>
	<li class="page_item page-item-10"><a href="' . get_permalink( 10 ) . '">Child 1</a></li>
	<li class="page_item page-item-11"><a href="' . get_permalink( 11 ) . '">Child 2</a></li>
	<li class="page_item page-item-12"><a href="' . get_permalink( 12 ) . '">Child 3</a></li>
</ul>
</li>
<li class="page_item page-item-1 page_item_has_children"><a href="' . get_permalink( 1 ) . '">Parent 1</a>
<ul class=\'children\'>
	<li class="page_item page-item-4"><a href="' . get_permalink( 4 ) . '">Child 1</a></li>
	<li class="page_item page-item-5"><a href="' . get_permalink( 5 ) . '">Child 2</a></li>
	<li class="page_item page-item-6"><a href="' . get_permalink( 6 ) . '">Child 3</a></li>
</ul>
</li>
<li class="page_item page-item-2 page_item_has_children"><a href="' . get_permalink( 2 ) . '">Parent 2</a>
<ul class=\'children\'>
	<li class="page_item page-item-7"><a href="' . get_permalink( 7 ) . '">Child 1</a></li>
	<li class="page_item page-item-8"><a href="' . get_permalink( 8 ) . '">Child 2</a></li>
	<li class="page_item page-item-9"><a href="' . get_permalink( 9 ) . '">Child 3</a></li>
</ul>
</li>
</ul></li>';
		$actual = wp_list_pages( $args );
		$this->AssertEquals( $expected['sort_column'], $actual );
	}

	function test_wp_list_pages_link_before() {
		$args = array(
			'echo' => false,
			'link_before' => 'BEFORE'
		);
		$expected['link_before'] = '<li class="pagenav">Pages<ul><li class="page_item page-item-1 page_item_has_children"><a href="' . get_permalink( 1 ) . '">BEFOREParent 1</a>
<ul class=\'children\'>
	<li class="page_item page-item-4"><a href="' . get_permalink( 4 ) . '">BEFOREChild 1</a></li>
	<li class="page_item page-item-5"><a href="' . get_permalink( 5 ) . '">BEFOREChild 2</a></li>
	<li class="page_item page-item-6"><a href="' . get_permalink( 6 ) . '">BEFOREChild 3</a></li>
</ul>
</li>
<li class="page_item page-item-2 page_item_has_children"><a href="' . get_permalink( 2 ) . '">BEFOREParent 2</a>
<ul class=\'children\'>
	<li class="page_item page-item-7"><a href="' . get_permalink( 7 ) . '">BEFOREChild 1</a></li>
	<li class="page_item page-item-8"><a href="' . get_permalink( 8 ) . '">BEFOREChild 2</a></li>
	<li class="page_item page-item-9"><a href="' . get_permalink( 9 ) . '">BEFOREChild 3</a></li>
</ul>
</li>
<li class="page_item page-item-3 page_item_has_children"><a href="' . get_permalink( 3 ) . '">BEFOREParent 3</a>
<ul class=\'children\'>
	<li class="page_item page-item-10"><a href="' . get_permalink( 10 ) . '">BEFOREChild 1</a></li>
	<li class="page_item page-item-11"><a href="' . get_permalink( 11 ) . '">BEFOREChild 2</a></li>
	<li class="page_item page-item-12"><a href="' . get_permalink( 12 ) . '">BEFOREChild 3</a></li>
</ul>
</li>
</ul></li>';
		$actual = wp_list_pages( $args );
		$this->AssertEquals( $expected['link_before'], $actual );
	}

	function test_wp_list_pages_link_after() {
		$args = array(
			'echo' => false,
			'link_after' => 'AFTER'
		);
		$expected['link_after'] = '<li class="pagenav">Pages<ul><li class="page_item page-item-1 page_item_has_children"><a href="' . get_permalink( 1 ) . '">Parent 1AFTER</a>
<ul class=\'children\'>
	<li class="page_item page-item-4"><a href="' . get_permalink( 4 ) . '">Child 1AFTER</a></li>
	<li class="page_item page-item-5"><a href="' . get_permalink( 5 ) . '">Child 2AFTER</a></li>
	<li class="page_item page-item-6"><a href="' . get_permalink( 6 ) . '">Child 3AFTER</a></li>
</ul>
</li>
<li class="page_item page-item-2 page_item_has_children"><a href="' . get_permalink( 2 ) . '">Parent 2AFTER</a>
<ul class=\'children\'>
	<li class="page_item page-item-7"><a href="' . get_permalink( 7 ) . '">Child 1AFTER</a></li>
	<li class="page_item page-item-8"><a href="' . get_permalink( 8 ) . '">Child 2AFTER</a></li>
	<li class="page_item page-item-9"><a href="' . get_permalink( 9 ) . '">Child 3AFTER</a></li>
</ul>
</li>
<li class="page_item page-item-3 page_item_has_children"><a href="' . get_permalink( 3 ) . '">Parent 3AFTER</a>
<ul class=\'children\'>
	<li class="page_item page-item-10"><a href="' . get_permalink( 10 ) . '">Child 1AFTER</a></li>
	<li class="page_item page-item-11"><a href="' . get_permalink( 11 ) . '">Child 2AFTER</a></li>
	<li class="page_item page-item-12"><a href="' . get_permalink( 12 ) . '">Child 3AFTER</a></li>
</ul>
</li>
</ul></li>';
		$actual = wp_list_pages( $args );
		$this->AssertEquals( $expected['link_after'], $actual );
	}


	function test_wp_list_pages_include() {
		$args = array(
			'echo' => false,
			'include' => '1,3'
		);
		$expected['include'] = '<li class="pagenav">Pages<ul><li class="page_item page-item-1"><a href="' . get_permalink( 1 ) . '">Parent 1</a></li>
<li class="page_item page-item-3"><a href="' . get_permalink( 3 ) . '">Parent 3</a></li>
</ul></li>';
		$actual = wp_list_pages( $args );
		$this->AssertEquals( $expected['include'], $actual );
	}

	function test_wp_list_pages_exclude_tree() {
		$args = array(
			'echo' => false,
			'exclude_tree' => '2, 3'
		);
		$expected['exclude'] = '<li class="pagenav">Pages<ul><li class="page_item page-item-1 page_item_has_children"><a href="' . get_permalink( 1 ) . '">Parent 1</a>
<ul class=\'children\'>
	<li class="page_item page-item-4"><a href="' . get_permalink( 4 ) . '">Child 1</a></li>
	<li class="page_item page-item-5"><a href="' . get_permalink( 5 ) . '">Child 2</a></li>
	<li class="page_item page-item-6"><a href="' . get_permalink( 6 ) . '">Child 3</a></li>
</ul>
</li>
</ul></li>';
		$actual = wp_list_pages( $args );
		$this->AssertEquals( $expected['exclude'], $actual );
	}
}
