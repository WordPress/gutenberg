<?php

/**
 * @group rewrite
 * @ticket 5305
 */
class Tests_Rewrite_NumericSlugs extends WP_UnitTestCase {
	private $old_current_user;

	public function setUp() {
		parent::setUp();
		$this->author_id = $this->factory->user->create( array( 'role' => 'editor' ) );

		// Override the post/archive slug collision prevention in `wp_unique_post_slug()`.
		add_filter( 'wp_unique_post_slug', array( $this, 'filter_unique_post_slug' ), 10, 6 );
	}

	public function tearDown() {
		remove_filter( 'wp_unique_post_slug', array( $this, 'filter_unique_post_slug' ), 10, 6 );
	}

	public function test_go_to_year_segment_collision_without_title() {
		global $wp_rewrite, $wpdb;
		$wp_rewrite->init();
		$wp_rewrite->set_permalink_structure( '/%postname%/' );
		$wp_rewrite->flush_rules();

		$id = $this->factory->post->create( array(
			'post_author'  => $this->author_id,
			'post_status'  => 'publish',
			'post_content' => rand_str(),
			'post_title'   => '',
			'post_name'    => '2015',
			'post_date'    => '2015-02-01 01:00:00'
		) );

		// Force an ID that resembles a year format
		$wpdb->update(
			$wpdb->posts,
			array(
				'ID'   => '2015',
				'guid' => 'http://example.org/?p=2015'
			),
			array( 'ID' => $id )
		);

		$this->go_to( get_permalink( '2015' ) );

		$this->assertQueryTrue( 'is_single', 'is_singular' );

		$wp_rewrite->set_permalink_structure('');
	}

	public function test_url_to_postid_year_segment_collision_without_title() {
		global $wp_rewrite, $wpdb;
		$wp_rewrite->init();
		$wp_rewrite->set_permalink_structure( '/%postname%/' );
		$wp_rewrite->flush_rules();

		$id = $this->factory->post->create( array(
			'post_author'  => $this->author_id,
			'post_status'  => 'publish',
			'post_content' => rand_str(),
			'post_title'   => '',
			'post_name'    => '2015',
			'post_date'    => '2015-02-01 01:00:00'
		) );

		// Force an ID that resembles a year format
		$wpdb->update(
			$wpdb->posts,
			array(
				'ID'   => '2015',
				'guid' => 'http://example.org/?p=2015'
			),
			array( 'ID' => $id )
		);

		$this->assertEquals( '2015', url_to_postid( get_permalink( '2015' ) ) );

		$wp_rewrite->set_permalink_structure('');
	}

	public function test_go_to_year_segment_collision_with_title() {
		global $wp_rewrite;
		$wp_rewrite->init();
		$wp_rewrite->set_permalink_structure( '/%postname%/' );
		$wp_rewrite->flush_rules();

		$id = $this->factory->post->create( array(
			'post_author'  => $this->author_id,
			'post_status'  => 'publish',
			'post_content' => rand_str(),
			'post_title'   => '2015',
			'post_date'    => '2015-02-01 01:00:00',
		) );

		$this->go_to( get_permalink( $id ) );

		$this->assertQueryTrue( 'is_single', 'is_singular' );

		$wp_rewrite->set_permalink_structure('');
	}

	public function test_url_to_postid_year_segment_collision_with_title() {
		global $wp_rewrite;
		$wp_rewrite->init();
		$wp_rewrite->set_permalink_structure( '/%postname%/' );
		$wp_rewrite->flush_rules();

		$id = $this->factory->post->create( array(
			'post_author'  => $this->author_id,
			'post_status'  => 'publish',
			'post_content' => rand_str(),
			'post_title'   => '2015',
			'post_date'    => '2015-02-01 01:00:00',
		) );

		$this->assertEquals( $id, url_to_postid( get_permalink( $id ) ) );

		$wp_rewrite->set_permalink_structure('');
	}

	public function test_go_to_month_segment_collision_without_title() {
		global $wp_rewrite;
		$wp_rewrite->init();
		$wp_rewrite->set_permalink_structure( '/%year%/%postname%/' );
		$wp_rewrite->flush_rules();

		$id = $this->factory->post->create( array(
			'post_author'  => $this->author_id,
			'post_status'  => 'publish',
			'post_content' => rand_str(),
			'post_title'   => '',
			'post_name'    => '02',
			'post_date'    => '2015-02-01 01:00:00',
		) );

		$this->go_to( get_permalink( $id ) );

		$this->assertQueryTrue( 'is_single', 'is_singular' );

		$wp_rewrite->set_permalink_structure('');
	}

	public function test_url_to_postid_month_segment_collision_without_title() {
		global $wp_rewrite;
		$wp_rewrite->init();
		$wp_rewrite->set_permalink_structure( '/%year%/%postname%/' );
		$wp_rewrite->flush_rules();

		$id = $this->factory->post->create( array(
			'post_author'  => $this->author_id,
			'post_status'  => 'publish',
			'post_content' => rand_str(),
			'post_title'   => '',
			'post_name'    => '02',
			'post_date'    => '2015-02-01 01:00:00',
		) );

		$this->assertEquals( $id, url_to_postid( get_permalink( $id ) ) );

		$wp_rewrite->set_permalink_structure('');
	}

	public function test_go_to_month_segment_collision_without_title_no_leading_zero() {
		global $wp_rewrite;
		$wp_rewrite->init();
		$wp_rewrite->set_permalink_structure( '/%year%/%postname%/' );
		$wp_rewrite->flush_rules();

		$id = $this->factory->post->create( array(
			'post_author'  => $this->author_id,
			'post_status'  => 'publish',
			'post_content' => rand_str(),
			'post_title'   => '',
			'post_name'    => '2',
			'post_date'    => '2015-02-01 01:00:00',
		) );

		$this->go_to( get_permalink( $id ) );

		$this->assertQueryTrue( 'is_single', 'is_singular' );

		$wp_rewrite->set_permalink_structure('');
	}

	public function test_url_to_postid_month_segment_collision_without_title_no_leading_zero() {
		global $wp_rewrite;
		$wp_rewrite->init();
		$wp_rewrite->set_permalink_structure( '/%year%/%postname%/' );
		$wp_rewrite->flush_rules();

		$id = $this->factory->post->create( array(
			'post_author'  => $this->author_id,
			'post_status'  => 'publish',
			'post_content' => rand_str(),
			'post_title'   => '',
			'post_name'    => '2',
			'post_date'    => '2015-02-01 01:00:00',
		) );

		$this->assertEquals( $id, url_to_postid( get_permalink( $id ) ) );

		$wp_rewrite->set_permalink_structure('');
	}

	public function test_go_to_month_segment_collision_with_title() {
		global $wp_rewrite;
		$wp_rewrite->init();
		$wp_rewrite->set_permalink_structure( '/%year%/%postname%/' );
		$wp_rewrite->flush_rules();

		$id = $this->factory->post->create( array(
			'post_author'  => $this->author_id,
			'post_status'  => 'publish',
			'post_content' => rand_str(),
			'post_title'   => '02',
			'post_date'    => '2015-02-01 01:00:00',
		) );

		$this->go_to( get_permalink( $id ) );

		$this->assertQueryTrue( 'is_single', 'is_singular' );

		$wp_rewrite->set_permalink_structure('');
	}

	public function test_url_to_postid_month_segment_collision_with_title() {
		global $wp_rewrite;
		$wp_rewrite->init();
		$wp_rewrite->set_permalink_structure( '/%year%/%postname%/' );
		$wp_rewrite->flush_rules();

		$id = $this->factory->post->create( array(
			'post_author'  => $this->author_id,
			'post_status'  => 'publish',
			'post_content' => rand_str(),
			'post_title'   => '02',
			'post_date'    => '2015-02-01 01:00:00',
		) );

		$this->assertEquals( $id, url_to_postid( get_permalink( $id ) ) );

		$wp_rewrite->set_permalink_structure('');
	}

	public function test_go_to_month_segment_collision_with_title_no_leading_zero() {
		global $wp_rewrite;
		$wp_rewrite->init();
		$wp_rewrite->set_permalink_structure( '/%year%/%postname%/' );
		$wp_rewrite->flush_rules();

		$id = $this->factory->post->create( array(
			'post_author'  => $this->author_id,
			'post_status'  => 'publish',
			'post_content' => rand_str(),
			'post_title'   => '2',
			'post_date'    => '2015-02-01 01:00:00',
		) );

		$this->go_to( get_permalink( $id ) );

		$this->assertQueryTrue( 'is_single', 'is_singular' );

		$wp_rewrite->set_permalink_structure('');
	}

	public function test_url_to_postid_month_segment_collision_with_title_no_leading_zero() {
		global $wp_rewrite;
		$wp_rewrite->init();
		$wp_rewrite->set_permalink_structure( '/%year%/%postname%/' );
		$wp_rewrite->flush_rules();

		$id = $this->factory->post->create( array(
			'post_author'  => $this->author_id,
			'post_status'  => 'publish',
			'post_content' => rand_str(),
			'post_title'   => '2',
			'post_date'    => '2015-02-01 01:00:00',
		) );

		$this->assertEquals( $id, url_to_postid( get_permalink( $id ) ) );

		$wp_rewrite->set_permalink_structure('');
	}

	public function test_go_to_day_segment_collision_without_title() {
		global $wp_rewrite;
		$wp_rewrite->init();
		$wp_rewrite->set_permalink_structure( '/%year%/%monthnum%/%postname%/' );
		$wp_rewrite->flush_rules();

		$id = $this->factory->post->create( array(
			'post_author'  => $this->author_id,
			'post_status'  => 'publish',
			'post_content' => rand_str(),
			'post_title'   => '',
			'post_name'    => '01',
			'post_date'    => '2015-02-01 01:00:00',
		) );

		$this->go_to( get_permalink( $id ) );

		$this->assertQueryTrue( 'is_single', 'is_singular' );

		$wp_rewrite->set_permalink_structure('');
	}

	public function test_url_to_postid_day_segment_collision_without_title() {
		global $wp_rewrite;
		$wp_rewrite->init();
		$wp_rewrite->set_permalink_structure( '/%year%/%monthnum%/%postname%/' );
		$wp_rewrite->flush_rules();

		$id = $this->factory->post->create( array(
			'post_author'  => $this->author_id,
			'post_status'  => 'publish',
			'post_content' => rand_str(),
			'post_title'   => '',
			'post_name'    => '01',
			'post_date'    => '2015-02-01 01:00:00',
		) );

		$this->assertEquals( $id, url_to_postid( get_permalink( $id ) ) );

		$wp_rewrite->set_permalink_structure('');
	}

	public function test_go_to_day_segment_collision_with_title() {
		global $wp_rewrite;
		$wp_rewrite->init();
		$wp_rewrite->set_permalink_structure( '/%year%/%monthnum%/%postname%/' );
		$wp_rewrite->flush_rules();

		$id = $this->factory->post->create( array(
			'post_author'  => $this->author_id,
			'post_status'  => 'publish',
			'post_content' => rand_str(),
			'post_title'   => '01',
			'post_date'    => '2015-02-01 01:00:00',
		) );

		$this->go_to( get_permalink( $id ) );

		$this->assertQueryTrue( 'is_single', 'is_singular' );

		$wp_rewrite->set_permalink_structure('');
	}

	public function test_url_to_postid_day_segment_collision_with_title() {
		global $wp_rewrite;
		$wp_rewrite->init();
		$wp_rewrite->set_permalink_structure( '/%year%/%monthnum%/%postname%/' );
		$wp_rewrite->flush_rules();

		$id = $this->factory->post->create( array(
			'post_author'  => $this->author_id,
			'post_status'  => 'publish',
			'post_content' => rand_str(),
			'post_title'   => '01',
			'post_date'    => '2015-02-01 01:00:00',
		) );

		$this->assertEquals( $id, url_to_postid( get_permalink( $id ) ) );

		$wp_rewrite->set_permalink_structure('');
	}

	public function test_numeric_slug_permalink_conflicts_should_only_be_resolved_for_the_main_query() {
		global $wp_rewrite;
		$wp_rewrite->init();
		$wp_rewrite->set_permalink_structure( '/%year%/%monthnum%/%postname%/' );
		$wp_rewrite->flush_rules();

		$id = $this->factory->post->create( array(
			'post_author'  => $this->author_id,
			'post_status'  => 'publish',
			'post_content' => rand_str(),
			'post_title'   => '01',
			'post_date'    => '2015-02-01 01:00:00',
		) );

		$q = new WP_Query( array(
			'year'     => '2015',
			'monthnum' => '02',
			'day'      => '01',
		) );

		$this->assertTrue( $q->is_day );
		$this->assertFalse( $q->is_single );

		$wp_rewrite->set_permalink_structure('');
	}

	public function test_month_slug_collision_should_resolve_to_date_archive_when_year_does_not_match_post_year() {
		global $wp_rewrite;
		$wp_rewrite->init();
		$wp_rewrite->set_permalink_structure( '/%year%/%postname%/' );
		$wp_rewrite->flush_rules();

		// Make sure a post is published in 2013/02, to avoid 404s.
		$this->factory->post->create( array(
			'post_author'  => $this->author_id,
			'post_status'  => 'publish',
			'post_content' => 'foo',
			'post_title'   => 'bar',
			'post_date'    => '2013-02-01 01:00:00',
		) );

		$id = $this->factory->post->create( array(
			'post_author'  => $this->author_id,
			'post_status'  => 'publish',
			'post_content' => 'foo',
			'post_title'   => '02',
			'post_date'    => '2015-02-01 01:00:00',
		) );

		$permalink = get_permalink( $id );
		$permalink = str_replace( '/2015/', '/2013/', $permalink );

		$this->go_to( $permalink );

		$this->assertTrue( is_month() );
	}

	public function test_day_slug_collision_should_resolve_to_date_archive_when_monthnum_does_not_match_post_month() {
		global $wp_rewrite;
		$wp_rewrite->init();
		$wp_rewrite->set_permalink_structure( '/%year%/%monthnum%/%postname%/' );
		$wp_rewrite->flush_rules();

		// Make sure a post is published on 2015/01/01, to avoid 404s.
		$this->factory->post->create( array(
			'post_author'  => $this->author_id,
			'post_status'  => 'publish',
			'post_content' => 'foo',
			'post_title'   => 'bar',
			'post_date'    => '2015-01-02 01:00:00',
		) );

		$id = $this->factory->post->create( array(
			'post_author'  => $this->author_id,
			'post_status'  => 'publish',
			'post_content' => 'foo',
			'post_title'   => '02',
			'post_date'    => '2015-02-02 01:00:00',
		) );

		$permalink = get_permalink( $id );
		$permalink = str_replace( '/2015/02/', '/2015/01/', $permalink );

		$this->go_to( $permalink );

		$this->assertTrue( is_day() );
	}

	public function test_date_slug_collision_should_distinguish_valid_pagination_from_date() {
		global $wp_rewrite;
		$wp_rewrite->init();
		$wp_rewrite->set_permalink_structure( '/%year%/%postname%/' );
		$wp_rewrite->flush_rules();

		$id = $this->factory->post->create( array(
			'post_author'  => $this->author_id,
			'post_status'  => 'publish',
			'post_content' => 'Page 0<!--nextpage-->Page 1<!--nextpage-->Page 2<!--nextpage-->Page 3',
			'post_title'   => '02',
			'post_date'    => '2015-02-01 01:00:00',
		) );

		$this->go_to( get_permalink( $id ) . '1' );

		$this->assertFalse( is_day() );
	}

	public function test_date_slug_collision_should_distinguish_too_high_pagination_from_date() {
		global $wp_rewrite;
		$wp_rewrite->init();
		$wp_rewrite->set_permalink_structure( '/%year%/%postname%/' );
		$wp_rewrite->flush_rules();

		$id = $this->factory->post->create( array(
			'post_author'  => $this->author_id,
			'post_status'  => 'publish',
			'post_content' => 'Page 0<!--nextpage-->Page 1<!--nextpage-->Page 2<!--nextpage-->Page 3',
			'post_title'   => '02',
			'post_date'    => '2015-02-05 01:00:00',
		) );

		$this->go_to( get_permalink( $id ) . '5' );

		$this->assertTrue( is_day() );
	}

	public function test_date_slug_collision_should_not_require_pagination_query_var() {
		global $wp_rewrite;
		$wp_rewrite->init();
		$wp_rewrite->set_permalink_structure( '/%year%/%postname%/' );
		$wp_rewrite->flush_rules();

		$id = $this->factory->post->create( array(
			'post_author'  => $this->author_id,
			'post_status'  => 'publish',
			'post_content' => 'Page 0<!--nextpage-->Page 1<!--nextpage-->Page 2<!--nextpage-->Page 3',
			'post_title'   => '02',
			'post_date'    => '2015-02-05 01:00:00',
		) );

		$this->go_to( get_permalink( $id ) );

		$this->assertQueryTrue( 'is_single', 'is_singular' );
		$this->assertFalse( is_date() );
	}

	public function test_date_slug_collision_should_be_ignored_when_pagination_var_is_present_but_post_does_not_have_multiple_pages() {
		global $wp_rewrite;
		$wp_rewrite->init();
		$wp_rewrite->set_permalink_structure( '/%year%/%postname%/' );
		$wp_rewrite->flush_rules();

		$id = $this->factory->post->create( array(
			'post_author'  => $this->author_id,
			'post_status'  => 'publish',
			'post_content' => 'This post does not have pagination.',
			'post_title'   => '02',
			'post_date'    => '2015-02-05 01:00:00',
		) );

		$this->go_to( get_permalink( $id ) . '5' );

		$this->assertTrue( is_day() );
	}

	public function filter_unique_post_slug( $slug, $post_id, $post_status, $post_type, $post_parent, $original_slug ) {
		return $original_slug;
	}
}
