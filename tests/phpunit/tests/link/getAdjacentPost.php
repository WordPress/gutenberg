<?php
/**
 * @group link
 * @covers ::get_adjacent_post
 */
class Tests_Link_GetAdjacentPost extends WP_UnitTestCase {
	protected $exclude_term;

	/**
	 * @ticket 17807
	 */
	public function test_get_adjacent_post() {
		// Need some sample posts to test adjacency
		$post_one = self::factory()->post->create_and_get( array(
			'post_title' => 'First',
			'post_date' => '2012-01-01 12:00:00'
		) );

		$post_two = self::factory()->post->create_and_get( array(
			'post_title' => 'Second',
			'post_date' => '2012-02-01 12:00:00'
		) );

		$post_three = self::factory()->post->create_and_get( array(
			'post_title' => 'Third',
			'post_date' => '2012-03-01 12:00:00'
		) );

		$post_four = self::factory()->post->create_and_get( array(
			'post_title' => 'Fourth',
			'post_date' => '2012-04-01 12:00:00'
		) );

		// Assign some terms
		wp_set_object_terms( $post_one->ID, 'wordpress', 'category', false );
		wp_set_object_terms( $post_three->ID, 'wordpress', 'category', false );

		wp_set_object_terms( $post_two->ID, 'plugins', 'post_tag', false );
		wp_set_object_terms( $post_four->ID, 'plugins', 'post_tag', false );

		// Test normal post adjacency
		$this->go_to( get_permalink( $post_two->ID ) );

		$this->assertEquals( $post_one, get_adjacent_post( false, '', true ) );
		$this->assertEquals( $post_three, get_adjacent_post( false, '', false ) );

		$this->assertNotEquals( $post_two, get_adjacent_post( false, '', true ) );
		$this->assertNotEquals( $post_two, get_adjacent_post( false, '', false ) );

		// Test category adjacency
		$this->go_to( get_permalink( $post_one->ID ) );

		$this->assertEquals( '', get_adjacent_post( true, '', true, 'category' ) );
		$this->assertEquals( $post_three, get_adjacent_post( true, '', false, 'category' ) );

		// Test tag adjacency
		$this->go_to( get_permalink( $post_two->ID ) );

		$this->assertEquals( '', get_adjacent_post( true, '', true, 'post_tag' ) );
		$this->assertEquals( $post_four, get_adjacent_post( true, '', false, 'post_tag' ) );

		// Test normal boundary post
		$this->go_to( get_permalink( $post_two->ID ) );

		$this->assertEquals( array( $post_one ), get_boundary_post( false, '', true ) );
		$this->assertEquals( array( $post_four ), get_boundary_post( false, '', false ) );

		// Test category boundary post
		$this->go_to( get_permalink( $post_one->ID ) );

		$this->assertEquals( array( $post_one ), get_boundary_post( true, '', true, 'category' ) );
		$this->assertEquals( array( $post_three ), get_boundary_post( true, '', false, 'category' ) );

		// Test tag boundary post
		$this->go_to( get_permalink( $post_two->ID ) );

		$this->assertEquals( array( $post_two ), get_boundary_post( true, '', true, 'post_tag' ) );
		$this->assertEquals( array( $post_four ), get_boundary_post( true, '', false, 'post_tag' ) );
	}

	/**
	 * @ticket 22112
	 */
	function test_get_adjacent_post_exclude_self_term() {
		// Bump term_taxonomy to mimic shared term offsets.
		global $wpdb;
		$wpdb->insert( $wpdb->term_taxonomy, array( 'taxonomy' => 'foo', 'term_id' => 12345, 'description' => '' ) );

		$include = self::factory()->term->create( array(
			'taxonomy' => 'category',
			'name' => 'Include',
		) );
		$exclude = self::factory()->category->create();

		$one = self::factory()->post->create_and_get( array(
			'post_date' => '2012-01-01 12:00:00',
			'post_category' => array( $include, $exclude ),
		) );

		$two = self::factory()->post->create_and_get( array(
			'post_date' => '2012-01-02 12:00:00',
			'post_category' => array(),
		) );

		$three = self::factory()->post->create_and_get( array(
			'post_date' => '2012-01-03 12:00:00',
			'post_category' => array( $include, $exclude ),
		) );

		$four = self::factory()->post->create_and_get( array(
			'post_date' => '2012-01-04 12:00:00',
			'post_category' => array( $include ),
		) );

		$five = self::factory()->post->create_and_get( array(
			'post_date' => '2012-01-05 12:00:00',
			'post_category' => array( $include, $exclude ),
		) );

		// First post
		$this->go_to( get_permalink( $one ) );
		$this->assertEquals( $two, get_adjacent_post( false, array(), false ) );
		$this->assertEquals( $three, get_adjacent_post( true, array(), false ) );
		$this->assertEquals( $two, get_adjacent_post( false, array( $exclude ), false ) );
		$this->assertEquals( $four, get_adjacent_post( true, array( $exclude ), false ) );
		$this->assertEmpty( get_adjacent_post( false, array(), true ) );

		// Fourth post
		$this->go_to( get_permalink( $four ) );
		$this->assertEquals( $five, get_adjacent_post( false, array(), false ) );
		$this->assertEquals( $five, get_adjacent_post( true, array(), false ) );
		$this->assertEmpty( get_adjacent_post( false, array( $exclude ), false ) );
		$this->assertEmpty( get_adjacent_post( true, array( $exclude ), false ) );

		$this->assertEquals( $three, get_adjacent_post( false, array(), true ) );
		$this->assertEquals( $three, get_adjacent_post( true, array(), true ) );
		$this->assertEquals( $two, get_adjacent_post( false, array( $exclude ), true ) );
		$this->assertEmpty( get_adjacent_post( true, array( $exclude ), true ) );

		// Last post
		$this->go_to( get_permalink( $five ) );
		$this->assertEquals( $four, get_adjacent_post( false, array(), true ) );
		$this->assertEquals( $four, get_adjacent_post( true, array(), true ) );
		$this->assertEquals( $four, get_adjacent_post( false, array( $exclude ), true ) );
		$this->assertEquals( $four, get_adjacent_post( true, array( $exclude ), true ) );
		$this->assertEmpty( get_adjacent_post( false, array(), false ) );
	}

	/**
	 * @ticket 32833
	 */
	public function test_get_adjacent_post_excluded_terms() {
		register_taxonomy( 'wptests_tax', 'post' );

		$t = self::factory()->term->create( array(
			'taxonomy' => 'wptests_tax',
		) );

		$p1 = self::factory()->post->create( array( 'post_date' => '2015-08-27 12:00:00' ) );
		$p2 = self::factory()->post->create( array( 'post_date' => '2015-08-26 12:00:00' ) );
		$p3 = self::factory()->post->create( array( 'post_date' => '2015-08-25 12:00:00' ) );

		wp_set_post_terms( $p2, array( $t ), 'wptests_tax' );

		// Fake current page.
		$_post = isset( $GLOBALS['post'] ) ? $GLOBALS['post'] : null;
		$GLOBALS['post'] = get_post( $p1 );

		$found = get_adjacent_post( false, array( $t ), true, 'wptests_tax' );

		if ( ! is_null( $_post ) ) {
			$GLOBALS['post'] = $_post;
		} else {
			unset( $GLOBALS['post'] );
		}

		// Should skip $p2, which belongs to $t.
		$this->assertEquals( $p3, $found->ID );
	}

	/**
	 * @ticket 32833
	 */
	public function test_get_adjacent_post_excluded_terms_should_not_require_posts_to_have_terms_in_any_taxonomy() {
		register_taxonomy( 'wptests_tax', 'post' );

		$t = self::factory()->term->create( array(
			'taxonomy' => 'wptests_tax',
		) );

		$p1 = self::factory()->post->create( array( 'post_date' => '2015-08-27 12:00:00' ) );
		$p2 = self::factory()->post->create( array( 'post_date' => '2015-08-26 12:00:00' ) );
		$p3 = self::factory()->post->create( array( 'post_date' => '2015-08-25 12:00:00' ) );

		wp_set_post_terms( $p2, array( $t ), 'wptests_tax' );

		// Make sure that $p3 doesn't have the 'Uncategorized' category.
		wp_delete_object_term_relationships( $p3, 'category' );

		// Fake current page.
		$_post = isset( $GLOBALS['post'] ) ? $GLOBALS['post'] : null;
		$GLOBALS['post'] = get_post( $p1 );

		$found = get_adjacent_post( false, array( $t ), true, 'wptests_tax' );

		if ( ! is_null( $_post ) ) {
			$GLOBALS['post'] = $_post;
		} else {
			unset( $GLOBALS['post'] );
		}

		// Should skip $p2, which belongs to $t.
		$this->assertEquals( $p3, $found->ID );
	}

	/**
	 * @ticket 35211
	 */
	public function test_excluded_terms_filter() {
		register_taxonomy( 'wptests_tax', 'post' );

		$terms = self::factory()->term->create_many( 2, array(
			'taxonomy' => 'wptests_tax',
		) );

		$p1 = self::factory()->post->create( array( 'post_date' => '2015-08-27 12:00:00' ) );
		$p2 = self::factory()->post->create( array( 'post_date' => '2015-08-26 12:00:00' ) );
		$p3 = self::factory()->post->create( array( 'post_date' => '2015-08-25 12:00:00' ) );

		wp_set_post_terms( $p1, array( $terms[0], $terms[1] ), 'wptests_tax' );
		wp_set_post_terms( $p2, array( $terms[1] ), 'wptests_tax' );
		wp_set_post_terms( $p3, array( $terms[0] ), 'wptests_tax' );

		$this->go_to( get_permalink( $p1 ) );

		$this->exclude_term = $terms[1];
		add_filter( 'get_previous_post_excluded_terms', array( $this, 'filter_excluded_terms' ) );

		$found = get_adjacent_post( true, array(), true, 'wptests_tax' );

		remove_filter( 'get_previous_post_excluded_terms', array( $this, 'filter_excluded_terms' ) );
		unset( $this->exclude_term );

		$this->assertSame( $p3, $found->ID );
	}

	public function filter_excluded_terms( $excluded_terms ) {
		$excluded_terms[] = $this->exclude_term;
		return $excluded_terms;
	}
}
