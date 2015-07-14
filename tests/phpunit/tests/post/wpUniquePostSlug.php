<?php

/**
 * @group post
 */
class Tests_Post_WpUniquePostSlug extends WP_UnitTestCase {
	/**
	 * @ticket 21013
	 */
	public function test_non_latin_slugs() {
		$author_id = $this->factory->user->create( array( 'role' => 'editor' ) );

		$inputs = array(
			'Αρνάκι άσπρο και παχύ της μάνας του καμάρι, και άλλα τραγούδια',
			'Предлагаем супер металлообрабатывающее оборудование',
		);

		$outputs = array(
			'αρνάκι-άσπρο-και-παχύ-της-μάνας-του-κα-2',
			'предлагаем-супер-металлообрабатыва-2',
		);

		foreach ( $inputs as $k => $post_title ) {
			for ( $i = 0; $i < 2; $i++ ) {
				$post = array(
					'post_author' => $author_id,
					'post_status' => 'publish',
					'post_content' => rand_str(),
					'post_title' => $post_title,
				);

				$id = $this->post_ids[] = wp_insert_post( $post );
			}

			$post = get_post( $id );
			$this->assertEquals( $outputs[$k], urldecode( $post->post_name ) );
		}
	}

	/**
	 * @ticket 18962
	 */
	public function test_with_multiple_hierarchies() {
		register_post_type( 'post-type-1', array( 'hierarchical' => true ) );
		register_post_type( 'post-type-2', array( 'hierarchical' => true ) );

		$args = array(
			'post_type' => 'post-type-1',
			'post_name' => 'some-slug',
			'post_status' => 'publish',
		);
		$one = $this->factory->post->create( $args );
		$args['post_type'] = 'post-type-2';
		$two = $this->factory->post->create( $args );

		$this->assertEquals( 'some-slug', get_post( $one )->post_name );
		$this->assertEquals( 'some-slug', get_post( $two )->post_name );

		$this->assertEquals( 'some-other-slug', wp_unique_post_slug( 'some-other-slug', $one, 'publish', 'post-type-1', 0 ) );
		$this->assertEquals( 'some-other-slug', wp_unique_post_slug( 'some-other-slug', $one, 'publish', 'post-type-2', 0 ) );

		_unregister_post_type( 'post-type-1' );
		_unregister_post_type( 'post-type-2' );
	}

	/**
	 * @ticket 30339
	 */
	public function test_with_hierarchy() {
		register_post_type( 'post-type-1', array( 'hierarchical' => true ) );

		$args = array(
			'post_type' => 'post-type-1',
			'post_name' => 'some-slug',
			'post_status' => 'publish',
		);
		$one = $this->factory->post->create( $args );
		$args['post_name'] = 'some-slug-2';
		$two = $this->factory->post->create( $args );

		$this->assertEquals( 'some-slug', get_post( $one )->post_name );
		$this->assertEquals( 'some-slug-2', get_post( $two )->post_name );

		$this->assertEquals( 'some-slug-3', wp_unique_post_slug( 'some-slug', 0, 'publish', 'post-type-1', 0 ) );

		_unregister_post_type( 'post-type-1' );
	}

	/**
	 * @ticket 18962
	 */
	function test_wp_unique_post_slug_with_hierarchy_and_attachments() {
		register_post_type( 'post-type-1', array( 'hierarchical' => true ) );

		$args = array(
			'post_type' => 'post-type-1',
			'post_name' => 'some-slug',
			'post_status' => 'publish',
		);
		$one = $this->factory->post->create( $args );

		$args = array(
			'post_mime_type' => 'image/jpeg',
			'post_type' => 'attachment',
			'post_name' => 'image'
		);
		$attachment = $this->factory->attachment->create_object( 'image.jpg', $one, $args );

		$args = array(
			'post_type' => 'post-type-1',
			'post_name' => 'image',
			'post_status' => 'publish',
			'post_parent' => $one
		);
		$two = $this->factory->post->create( $args );

		$this->assertEquals( 'some-slug', get_post( $one )->post_name );
		$this->assertEquals( 'image', get_post( $attachment )->post_name );
		$this->assertEquals( 'image-2', get_post( $two )->post_name );

		// 'image' can be a child of image-2
		$this->assertEquals( 'image', wp_unique_post_slug( 'image', 0, 'publish', 'post-type-1', $two ) );

		_unregister_post_type( 'post-type-1' );
	}

	/**
	 * @dataProvider whitelist_post_statuses
	 */
	public function test_whitelisted_post_statuses_should_not_be_forced_to_be_unique( $status ) {
		$p1 = $this->factory->post->create( array(
			'post_type' => 'post',
			'post_name' => 'foo',
		) );

		$p2 = $this->factory->post->create( array(
			'post_type' => 'post',
		) );

		$actual = wp_unique_post_slug( 'foo', $p2, $status, 'post', 0 );

		$this->assertSame( 'foo', $actual );
	}

	public function whitelist_post_statuses() {
		return array(
			array( 'draft' ),
			array( 'pending' ),
			array( 'auto-draft' ),
		);
	}

	public function test_revisions_should_not_be_forced_to_be_unique() {
		$p1 = $this->factory->post->create( array(
			'post_type' => 'post',
			'post_name' => 'foo',
		) );

		$p2 = $this->factory->post->create( array(
			'post_type' => 'post',
		) );

		$actual = wp_unique_post_slug( 'foo', $p2, 'inherit', 'revision', 0 );

		$this->assertSame( 'foo', $actual );
	}

	/**
	 * @ticket 5305
	 */
	public function test_slugs_resulting_in_permalinks_that_resemble_year_archives_should_be_suffixed() {
		global $wp_rewrite;
		$wp_rewrite->init();
		$wp_rewrite->set_permalink_structure( '/%postname%/' );
		$wp_rewrite->flush_rules();

		$p = $this->factory->post->create( array(
			'post_type' => 'post',
			'post_name' => 'foo',
		) );

		$found = wp_unique_post_slug( '2015', $p, 'publish', 'post', 0 );
		$this->assertEquals( '2015-2', $found );

		$wp_rewrite->set_permalink_structure( '' );
		flush_rewrite_rules();
	}

	/**
	 * @ticket 5305
	 */
	public function test_slugs_resulting_in_permalinks_that_resemble_year_archives_should_not_be_suffixed_for_already_published_posts() {
		global $wp_rewrite;
		$wp_rewrite->init();
		$wp_rewrite->set_permalink_structure( '/%postname%/' );
		$wp_rewrite->flush_rules();

		$p = $this->factory->post->create( array(
			'post_type' => 'post',
			'post_name' => 'foo',
			'post_status' => 'publish',
		) );

		$found = wp_unique_post_slug( '2015', $p, 'publish', 'post', 0 );
		$this->assertEquals( '2015-2', $found );

		$wp_rewrite->set_permalink_structure( '' );
		flush_rewrite_rules();
	}

	/**
	 * @ticket 5305
	 */
	public function test_yearlike_slugs_should_not_be_suffixed_if_permalink_structure_does_not_result_in_a_clash_with_year_archives() {
		global $wp_rewrite;
		$wp_rewrite->init();
		$wp_rewrite->set_permalink_structure( '/%year%/%postname%/' );
		$wp_rewrite->flush_rules();

		$p = $this->factory->post->create( array(
			'post_type' => 'post',
			'post_name' => 'foo',
		) );

		$found = wp_unique_post_slug( '2015', $p, 'publish', 'post', 0 );
		$this->assertEquals( '2015', $found );

		$wp_rewrite->set_permalink_structure( '' );
		flush_rewrite_rules();
	}

	/**
	 * @ticket 5305
	 */
	public function test_slugs_resulting_in_permalinks_that_resemble_month_archives_should_be_suffixed() {
		global $wp_rewrite;
		$wp_rewrite->init();
		$wp_rewrite->set_permalink_structure( '/%year%/%postname%/' );
		$wp_rewrite->flush_rules();

		$p = $this->factory->post->create( array(
			'post_type' => 'post',
			'post_name' => 'foo',
		) );

		$found = wp_unique_post_slug( '11', $p, 'publish', 'post', 0 );
		$this->assertEquals( '11-2', $found );

		$wp_rewrite->set_permalink_structure( '' );
		flush_rewrite_rules();
	}

	/**
	 * @ticket 5305
	 */
	public function test_monthlike_slugs_should_not_be_suffixed_if_permalink_structure_does_not_result_in_a_clash_with_month_archives() {
		global $wp_rewrite;
		$wp_rewrite->init();
		$wp_rewrite->set_permalink_structure( '/%year%/foo/%postname%/' );
		$wp_rewrite->flush_rules();

		$p = $this->factory->post->create( array(
			'post_type' => 'post',
			'post_name' => 'foo',
		) );

		$found = wp_unique_post_slug( '11', $p, 'publish', 'post', 0 );
		$this->assertEquals( '11', $found );

		$wp_rewrite->set_permalink_structure( '' );
		flush_rewrite_rules();
	}

	/**
	 * @ticket 5305
	 */
	public function test_monthlike_slugs_should_not_be_suffixed_for_invalid_month_numbers() {
		global $wp_rewrite;
		$wp_rewrite->init();
		$wp_rewrite->set_permalink_structure( '/%year%/%postname%/' );
		$wp_rewrite->flush_rules();

		$p = $this->factory->post->create( array(
			'post_type' => 'post',
			'post_name' => 'foo',
		) );

		$found = wp_unique_post_slug( '13', $p, 'publish', 'post', 0 );
		$this->assertEquals( '13', $found );

		$wp_rewrite->set_permalink_structure( '' );
		flush_rewrite_rules();
	}

	/**
	 * @ticket 5305
	 */
	public function test_slugs_resulting_in_permalinks_that_resemble_day_archives_should_be_suffixed() {
		global $wp_rewrite;
		$wp_rewrite->init();
		$wp_rewrite->set_permalink_structure( '/%year%/%monthnum%/%postname%/' );
		$wp_rewrite->flush_rules();

		$p = $this->factory->post->create( array(
			'post_type' => 'post',
			'post_name' => 'foo',
		) );

		$found = wp_unique_post_slug( '30', $p, 'publish', 'post', 0 );
		$this->assertEquals( '30-2', $found );

		$wp_rewrite->set_permalink_structure( '' );
		flush_rewrite_rules();
	}

	/**
	 * @ticket 5305
	 */
	public function test_daylike_slugs_should_not_be_suffixed_if_permalink_structure_does_not_result_in_a_clash_with_day_archives() {
		global $wp_rewrite;
		$wp_rewrite->init();
		$wp_rewrite->set_permalink_structure( '/%year%/%monthnum%/%day%/%postname%/' );
		$wp_rewrite->flush_rules();

		$p = $this->factory->post->create( array(
			'post_type' => 'post',
			'post_name' => 'foo',
		) );

		$found = wp_unique_post_slug( '30', $p, 'publish', 'post', 0 );
		$this->assertEquals( '30', $found );

		$wp_rewrite->set_permalink_structure( '' );
		flush_rewrite_rules();
	}

	/**
	 * @ticket 5305
	 */
	public function test_daylike_slugs_should_not_be_suffixed_for_invalid_day_numbers() {
		global $wp_rewrite;
		$wp_rewrite->init();
		$wp_rewrite->set_permalink_structure( '/%year%/%monthnum%/%postname%/' );
		$wp_rewrite->flush_rules();

		$p = $this->factory->post->create( array(
			'post_type' => 'post',
			'post_name' => 'foo',
		) );

		$found = wp_unique_post_slug( '32', $p, 'publish', 'post', 0 );
		$this->assertEquals( '32', $found );

		$wp_rewrite->set_permalink_structure( '' );
		flush_rewrite_rules();
	}
}
