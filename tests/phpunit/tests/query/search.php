<?php
/**
 *
 * @group query
 * @group search
 */
class Tests_Query_Search extends WP_UnitTestCase {
	protected $q;
	protected $post_type;

	function setUp() {
		parent::setUp();

		$this->post_type = rand_str( 12 );
		register_post_type( $this->post_type );

		$this->q = new WP_Query();
	}

	function tearDown() {
		_unregister_post_type( $this->post_type );
		unset( $this->q );

		parent::tearDown();
	}

	function get_search_results( $terms ) {
		$args = http_build_query( array( 's' => $terms, 'post_type' => $this->post_type ) );
		return $this->q->query( $args );
	}

	function test_search_order_title_relevance() {
		foreach ( range( 1, 7 ) as $i )
			self::factory()->post->create( array( 'post_content' => $i . rand_str() . ' about', 'post_type' => $this->post_type ) );
		$post_id = self::factory()->post->create( array( 'post_title' => 'About', 'post_type' => $this->post_type ) );

		$posts = $this->get_search_results( 'About' );
		$this->assertEquals( $post_id, reset( $posts )->ID );
	}

	function test_search_terms_query_var() {
		$terms = 'This is a search term';
		$query = new WP_Query( array( 's' => 'This is a search term' ) );
		$this->assertNotEquals( explode( ' ', $terms ), $query->get( 'search_terms' ) );
		$this->assertEquals( array( 'search', 'term' ), $query->get( 'search_terms' ) );
	}

	function test_filter_stopwords() {
		$terms = 'This is a search term';
		add_filter( 'wp_search_stopwords', array( $this, 'filter_wp_search_stopwords' ) );
		$query = new WP_Query( array( 's' => $terms ) );
		remove_filter( 'wp_search_stopwords', array( $this, 'filter_wp_search_stopwords' ) );

		$this->assertNotEquals( array( 'search', 'term' ), $query->get( 'search_terms' ) );
		$this->assertEquals( array( 'This', 'is', 'search', 'term' ), $query->get( 'search_terms' ) );
	}

	function filter_wp_search_stopwords() {
		return array();
	}

	/**
	 * @ticket 38099
	 */
	function test_disable_search_exclusion_prefix() {
		$title = '-HYPHENATION_TEST';

		// Create a post with a title which starts with a hyphen
		$post_id = self::factory()->post->create( array(
			'post_content' => $title, 'post_type' => $this->post_type
		) );

		// By default, we can use the hyphen prefix to exclude results
		$this->assertEquals( array(), $this->get_search_results( $title ) );

		// After we disable the feature using the filter, we should get the result
		add_filter( 'wp_query_search_exclusion_prefix', '__return_false' );
		$result = $this->get_search_results( $title );
		$post = array_pop( $result );
		$this->assertEquals( $post->ID, $post_id );
		remove_filter( 'wp_query_search_exclusion_prefix', '__return_false' );
	}

	/**
	 * @ticket 38099
	 */
	function test_change_search_exclusion_prefix() {
		$title = '#OCTOTHORPE_TEST';

		// Create a post with a title that starts with a non-hyphen prefix.
		$post_id = self::factory()->post->create( array(
			'post_content' => $title, 'post_type' => $this->post_type
		) );

		// By default, we should get the result.
		$result = $this->get_search_results( $title );
		$post = array_pop( $result );
		$this->assertEquals( $post->ID, $post_id );

		// After we change the prefix, the result should be excluded.
		add_filter( 'wp_query_search_exclusion_prefix', array( $this, 'filter_search_exclusion_prefix_octothorpe' ) );
		$found = $this->get_search_results( $title );
		remove_filter( 'wp_query_search_exclusion_prefix', array( $this, 'filter_search_exclusion_prefix_octothorpe' ) );
		$this->assertEquals( array(), $found );
	}

	function filter_search_exclusion_prefix_octothorpe() {
		return '#';
	}

	/**
	 * @ticket 33988
	 */
	public function test_s_should_exclude_term_prefixed_with_dash() {
		$p1 = self::factory()->post->create( array(
			'post_status' => 'publish',
			'post_content' => 'This post has foo but also bar',
		) );
		$p2 = self::factory()->post->create( array(
			'post_status' => 'publish',
			'post_content' => 'This post has only foo',
		) );

		$q = new WP_Query( array(
			's' => 'foo -bar',
			'fields' => 'ids',
		) );

		$this->assertEqualSets( array( $p2 ), $q->posts );
	}

	/**
	 * @ticket 33988
	 */
	public function test_s_should_exclude_first_term_if_prefixed_with_dash() {
		$p1 = self::factory()->post->create( array(
			'post_status' => 'publish',
			'post_content' => 'This post has foo but also bar',
		) );
		$p2 = self::factory()->post->create( array(
			'post_status' => 'publish',
			'post_content' => 'This post has only bar',
		) );

		$q = new WP_Query( array(
			's' => '-foo bar',
			'fields' => 'ids',
		) );

		$this->assertEqualSets( array( $p2 ), $q->posts );
	}

	/**
	 * @ticket 33988
	 */
	public function test_s_should_not_exclude_for_dashes_in_the_middle_of_words() {
		$p1 = self::factory()->post->create( array(
			'post_status' => 'publish',
			'post_content' => 'This post has foo but also bar',
		) );
		$p2 = self::factory()->post->create( array(
			'post_status' => 'publish',
			'post_content' => 'This post has only bar',
		) );
		$p3 = self::factory()->post->create( array(
			'post_status' => 'publish',
			'post_content' => 'This post has only foo-bar',
		) );

		$q = new WP_Query( array(
			's' => 'foo-bar',
			'fields' => 'ids',
		) );

		$this->assertEqualSets( array( $p3 ), $q->posts );
	}

	/**
	 * @ticket 36195
	 */
	public function test_s_should_not_exclude_for_dashes_between_words() {
		$p1 = self::factory()->post->create( array(
			'post_status' => 'publish',
			'post_content' => 'This post has foo but also bar',
		) );
		$p2 = self::factory()->post->create( array(
			'post_status' => 'publish',
			'post_content' => 'This post has only bar',
		) );
		$p3 = self::factory()->post->create( array(
			'post_status' => 'publish',
			'post_content' => 'This post has only foo - bar',
		) );

		$q = new WP_Query( array(
			's' => 'foo - bar',
			'fields' => 'ids',
		) );

		$this->assertEqualSets( array( $p1, $p3 ), $q->posts );
	}

	/**
	 * @ticket 35361
	 */
	public function test_search_orderby_should_be_empty_when_search_string_is_longer_than_6_words_and_exclusion_operator_is_used() {
		$q = new WP_Query( array(
			's' => 'foo1 foo2 foo3 foo4 foo5 foo6 foo7 -bar',
			'fields' => 'ids',
		) );

		$this->assertNotRegExp( '|ORDER BY \(CASE[^\)]+\)|', $q->request );
	}

	/**
	 * @ticket 31025
	 */
	public function test_s_zero() {
		$p1 = $this->factory->post->create( array(
			'post_status' => 'publish',
			'post_title' => '1',
			'post_content' => 'this post contains no zeroes',
			'post_excerpt' => 'this post contains no zeroes',
		) );

		$p2 = $this->factory->post->create( array(
			'post_status' => 'publish',
			'post_title' => '0',
			'post_content' => 'this post contains zeroes',
			'post_excerpt' => 'this post containts zeroes',
		) );

		$q = new WP_Query( array(
			's' => '0',
			'fields' => 'ids',
		) );

		$this->assertEqualSets( array( $p2 ), $q->posts );
	}

	/**
	 * @ticket 35594
	 */
	public function test_search_should_respect_suppress_filters() {
		add_filter( 'posts_search', array( $this, 'filter_posts_search' ) );
		add_filter( 'posts_search_orderby', array( $this, 'filter_posts_search' ) );
		$q = new WP_Query( array(
			's' => 'foo',
			'suppress_filters' => true,
		) );
		remove_filter( 'posts_search', array( $this, 'filter_posts_search' ) );
		remove_filter( 'posts_search_orderby', array( $this, 'filter_posts_search' ) );

		$this->assertNotContains( 'posts_search', $q->request );
	}

	/**
	 * @ticket 35762
	 */
	public function test_search_post_excerpt() {
		$p1 = self::factory()->post->create( array(
			'post_status' => 'publish',
			'post_content' => 'This post has foo but also bar',
		) );
		$p2 = self::factory()->post->create( array(
			'post_status' => 'publish',
			'post_content' => '',
			'post_excerpt' => 'This post has bar and baz',
		) );
		$p3 = self::factory()->post->create( array(
			'post_status' => 'publish',
			'post_content' => '',
			'post_excerpt' => 'This post has only foo',
		) );

		$q = new WP_Query( array(
			's' => 'foo',
			'fields' => 'ids',
		) );

		$this->assertEqualSets( array( $p1, $p3 ), $q->posts );

		$q = new WP_Query( array(
			's' => 'bar',
			'fields' => 'ids',
		) );

		$this->assertEqualSets( array( $p1, $p2 ), $q->posts );

		$q = new WP_Query( array(
			's' => 'baz',
			'fields' => 'ids',
		) );

		$this->assertEqualSets( array( $p2 ), $q->posts );
	}

	/**
	 * @ticket 35762
	 */
	public function test_search_order_title_before_excerpt_and_content() {
		$p1 = self::factory()->post->create( array(
			'post_status' => 'publish',
			'post_title'  => 'This post has foo',
			'post_content' => '',
			'post_excerpt' => '',
		) );

		$p2 = self::factory()->post->create( array(
			'post_status'  => 'publish',
			'post_title' => '',
			'post_content' => 'This post has foo',
			'post_excerpt' => '',
		) );

		$p3 = self::factory()->post->create( array(
			'post_status'  => 'publish',
			'post_title' => '',
			'post_content' => '',
			'post_excerpt' => 'This post has foo',
		) );

		$q = new WP_Query( array(
			's'      => 'this post has foo',
			'fields' => 'ids',
			'orderby' => false,
		) );

		$this->assertSame( array( $p1, $p3, $p2 ), $q->posts );
	}

	/**
	 * Unfiltered search queries for attachment post types should not inlcude
	 * filenames to ensure the postmeta JOINs don't happen on the front end.
	 *
	 * @ticket 22744
	 */
	public function test_exclude_file_names_in_attachment_search_by_default() {
		$attachment = self::factory()->post->create( array(
			'post_type'    => 'attachment',
			'post_status'  => 'publish',
			'post_title'   => 'bar foo',
			'post_content' => 'foo bar',
			'post_excerpt' => 'This post has foo',
		) );

		add_post_meta( $attachment, '_wp_attached_file', 'some-image2.png', true );

		// Pass post_type an array value.
		$q = new WP_Query( array(
			's'           => 'image2',
			'fields'      => 'ids',
			'post_type'   => 'attachment',
			'post_status' => 'inherit',
		) );

		$this->assertNotEquals( array( $attachment ), $q->posts );
	}

	/**
	 * @ticket 22744
	 */
	public function test_include_file_names_in_attachment_search_as_string() {
		$attachment = self::factory()->post->create( array(
			'post_type'    => 'attachment',
			'post_status'  => 'publish',
			'post_title'   => 'bar foo',
			'post_content' => 'foo bar',
			'post_excerpt' => 'This post has foo',
		) );

		add_post_meta( $attachment, '_wp_attached_file', 'some-image1.png', true );
		add_filter( 'posts_clauses', '_filter_query_attachment_filenames' );

		// Pass post_type a string value.
		$q = new WP_Query( array(
			's'           => 'image1',
			'fields'      => 'ids',
			'post_type'   => 'attachment',
			'post_status' => 'inherit',
		) );

		$this->assertSame( array( $attachment ), $q->posts );
	}

	/**
	 * @ticket 22744
	 */
	public function test_include_file_names_in_attachment_search_as_array() {
		$attachment = self::factory()->post->create( array(
			'post_type'    => 'attachment',
			'post_status'  => 'publish',
			'post_title'   => 'bar foo',
			'post_content' => 'foo bar',
			'post_excerpt' => 'This post has foo',
		) );

		add_post_meta( $attachment, '_wp_attached_file', 'some-image2.png', true );
		add_filter( 'posts_clauses', '_filter_query_attachment_filenames' );

		// Pass post_type an array value.
		$q = new WP_Query( array(
			's'           => 'image2',
			'fields'      => 'ids',
			'post_type'   => array( 'attachment' ),
			'post_status' => 'inherit',
		) );

		$this->assertSame( array( $attachment ), $q->posts );
	}

	/**
	 * @ticket 22744
	 */
	public function test_exclude_attachment_file_names_in_general_searches() {
		$attachment = self::factory()->post->create( array(
			'post_type'    => 'attachment',
			'post_status'  => 'publish',
			'post_title'   => 'bar foo',
			'post_content' => 'foo bar',
			'post_excerpt' => 'This post has foo',
		) );

		add_post_meta( $attachment, '_wp_attached_file', 'some-image3.png', true );

		$q = new WP_Query( array(
			's'           => 'image3',
			'fields'      => 'ids',
			'post_type'   => array( 'post', 'page', 'attachment' ),
			'post_status' => 'inherit',
		) );

		$this->assertNotEquals( array( $attachment ), $q->posts );
	}

	/**
	 * @ticket 22744
	 */
	public function test_include_file_names_in_attachment_search_with_meta_query() {
		$attachment = self::factory()->post->create( array(
			'post_type'    => 'attachment',
			'post_status'  => 'publish',
			'post_title'   => 'bar foo',
			'post_content' => 'foo bar',
			'post_excerpt' => 'This post has foo',
		) );

		add_post_meta( $attachment, '_wp_attached_file', 'some-image4.png', true );
		add_post_meta( $attachment, '_test_meta_key', 'value', true );
		add_filter( 'posts_clauses', '_filter_query_attachment_filenames' );

		// Pass post_type a string value.
		$q = new WP_Query( array(
			's'           => 'image4',
			'fields'      => 'ids',
			'post_type'   => 'attachment',
			'post_status' => 'inherit',
			'meta_query'  => array(
				array(
					'key'     => '_test_meta_key',
					'value'   => 'value',
					'compare' => '=',
				),
			),
		) );

		$this->assertSame( array( $attachment ), $q->posts );
	}

	/**
	 * @ticket 22744
	 */
	public function test_include_file_names_in_attachment_search_with_tax_query() {
		$attachment = self::factory()->post->create( array(
			'post_type'    => 'attachment',
			'post_status'  => 'publish',
			'post_title'   => 'bar foo',
			'post_content' => 'foo bar',
			'post_excerpt' => 'This post has foo',
		) );

		// Add a tag to the post.
		wp_set_post_terms( $attachment, 'test', 'post_tag' );

		add_post_meta( $attachment, '_wp_attached_file', 'some-image5.png', true );
		add_filter( 'posts_clauses', '_filter_query_attachment_filenames' );

		// Pass post_type a string value.
		$q = new WP_Query( array(
			's'           => 'image5',
			'fields'      => 'ids',
			'post_type'   => 'attachment',
			'post_status' => 'inherit',
			'tax_query' => array(
				array(
					'taxonomy' => 'post_tag',
					'field'    => 'slug',
					'terms'    => 'test',
				),
			),
		) );

		$this->assertSame( array( $attachment ), $q->posts );
	}

	/**
	 * @ticket 22744
	 */
	public function test_filter_query_attachment_filenames_unhooks_itself() {
		add_filter( 'posts_clauses', '_filter_query_attachment_filenames' );

		apply_filters( 'posts_clauses', array(
			'where'    => '',
			'groupby'  => '',
			'join'     => '',
			'orderby'  => '',
			'distinct' => '',
			'fields'   => '',
			'limit'    => '',
		) );

		$result = has_filter( 'posts_clauses', '_filter_query_attachment_filenames' );

		$this->assertFalse( $result );
	}

	public function filter_posts_search( $sql ) {
		return $sql . ' /* posts_search */';
	}
}
