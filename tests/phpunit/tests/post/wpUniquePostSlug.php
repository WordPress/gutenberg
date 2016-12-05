<?php

/**
 * @group post
 */
class Tests_Post_WpUniquePostSlug extends WP_UnitTestCase {
	protected $post_ids = array();

	/**
	 * @ticket 21013
	 */
	public function test_non_latin_slugs() {
		$author_id = self::factory()->user->create( array( 'role' => 'editor' ) );

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
					'post_content' => 'Post content',
					'post_title' => $post_title,
				);

				$id = $this->post_ids[] = self::factory()->post->create( $post );
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
		$one = self::factory()->post->create( $args );
		$args['post_type'] = 'post-type-2';
		$two = self::factory()->post->create( $args );

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
		$one = self::factory()->post->create( $args );
		$args['post_name'] = 'some-slug-2';
		$two = self::factory()->post->create( $args );

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
		$one = self::factory()->post->create( $args );

		$args = array(
			'post_mime_type' => 'image/jpeg',
			'post_type' => 'attachment',
			'post_name' => 'image'
		);
		$attachment = self::factory()->attachment->create_object( 'image.jpg', $one, $args );

		$args = array(
			'post_type' => 'post-type-1',
			'post_name' => 'image',
			'post_status' => 'publish',
			'post_parent' => $one
		);
		$two = self::factory()->post->create( $args );

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
		$p1 = self::factory()->post->create( array(
			'post_type' => 'post',
			'post_name' => 'foo',
		) );

		$p2 = self::factory()->post->create( array(
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
		$p1 = self::factory()->post->create( array(
			'post_type' => 'post',
			'post_name' => 'foo',
		) );

		$p2 = self::factory()->post->create( array(
			'post_type' => 'post',
		) );

		$actual = wp_unique_post_slug( 'foo', $p2, 'inherit', 'revision', 0 );

		$this->assertSame( 'foo', $actual );
	}

	/**
	 * @ticket 5305
	 */
	public function test_slugs_resulting_in_permalinks_that_resemble_year_archives_should_be_suffixed() {
		$this->set_permalink_structure( '/%postname%/' );

		$p = self::factory()->post->create( array(
			'post_type' => 'post',
			'post_name' => 'foo',
		) );

		$found = wp_unique_post_slug( '2015', $p, 'publish', 'post', 0 );
		$this->assertEquals( '2015-2', $found );
	}

	/**
	 * @ticket 5305
	 */
	public function test_slugs_resulting_in_permalinks_that_resemble_year_archives_should_not_be_suffixed_for_already_published_posts() {
		$this->set_permalink_structure( '/%postname%/' );

		$p = self::factory()->post->create( array(
			'post_type' => 'post',
			'post_name' => 'foo',
			'post_status' => 'publish',
		) );

		$found = wp_unique_post_slug( '2015', $p, 'publish', 'post', 0 );
		$this->assertEquals( '2015-2', $found );
	}

	/**
	 * @ticket 5305
	 */
	public function test_yearlike_slugs_should_not_be_suffixed_if_permalink_structure_does_not_result_in_a_clash_with_year_archives() {
		$this->set_permalink_structure( '/%year%/%postname%/' );

		$p = self::factory()->post->create( array(
			'post_type' => 'post',
			'post_name' => 'foo',
		) );

		$found = wp_unique_post_slug( '2015', $p, 'publish', 'post', 0 );
		$this->assertEquals( '2015', $found );
	}

	/**
	 * @ticket 5305
	 */
	public function test_slugs_resulting_in_permalinks_that_resemble_month_archives_should_be_suffixed() {
		$this->set_permalink_structure( '/%year%/%postname%/' );

		$p = self::factory()->post->create( array(
			'post_type' => 'post',
			'post_name' => 'foo',
		) );

		$found = wp_unique_post_slug( '11', $p, 'publish', 'post', 0 );
		$this->assertEquals( '11-2', $found );
	}

	/**
	 * @ticket 5305
	 */
	public function test_monthlike_slugs_should_not_be_suffixed_if_permalink_structure_does_not_result_in_a_clash_with_month_archives() {
		$this->set_permalink_structure( '/%year%/foo/%postname%/' );

		$p = self::factory()->post->create( array(
			'post_type' => 'post',
			'post_name' => 'foo',
		) );

		$found = wp_unique_post_slug( '11', $p, 'publish', 'post', 0 );
		$this->assertEquals( '11', $found );
	}

	/**
	 * @ticket 5305
	 */
	public function test_monthlike_slugs_should_not_be_suffixed_for_invalid_month_numbers() {
		$this->set_permalink_structure( '/%year%/%postname%/' );

		$p = self::factory()->post->create( array(
			'post_type' => 'post',
			'post_name' => 'foo',
		) );

		$found = wp_unique_post_slug( '13', $p, 'publish', 'post', 0 );
		$this->assertEquals( '13', $found );
	}

	/**
	 * @ticket 5305
	 */
	public function test_slugs_resulting_in_permalinks_that_resemble_day_archives_should_be_suffixed() {
		$this->set_permalink_structure( '/%year%/%monthnum%/%postname%/' );

		$p = self::factory()->post->create( array(
			'post_type' => 'post',
			'post_name' => 'foo',
		) );

		$found = wp_unique_post_slug( '30', $p, 'publish', 'post', 0 );
		$this->assertEquals( '30-2', $found );
	}

	/**
	 * @ticket 5305
	 */
	public function test_daylike_slugs_should_not_be_suffixed_if_permalink_structure_does_not_result_in_a_clash_with_day_archives() {
		$this->set_permalink_structure( '/%year%/%monthnum%/%day%/%postname%/' );

		$p = self::factory()->post->create( array(
			'post_type' => 'post',
			'post_name' => 'foo',
		) );

		$found = wp_unique_post_slug( '30', $p, 'publish', 'post', 0 );
		$this->assertEquals( '30', $found );
	}

	/**
	 * @ticket 5305
	 */
	public function test_daylike_slugs_should_not_be_suffixed_for_invalid_day_numbers() {
		$this->set_permalink_structure( '/%year%/%monthnum%/%postname%/' );

		$p = self::factory()->post->create( array(
			'post_type' => 'post',
			'post_name' => 'foo',
		) );

		$found = wp_unique_post_slug( '32', $p, 'publish', 'post', 0 );
		$this->assertEquals( '32', $found );
	}

	/**
	 * @ticket 34971
	 */
	public function test_embed_slug_should_be_suffixed_for_posts() {
		$this->set_permalink_structure( '/%postname%/' );

		$p = self::factory()->post->create( array(
			'post_type' => 'post',
			'post_name' => 'embed',
		) );

		$found = wp_unique_post_slug( 'embed', $p, 'publish', 'post', 0 );
		$this->assertSame( 'embed-2', $found );
	}

	/**
	 * @ticket 34971
	 */
	public function test_embed_slug_should_be_suffixed_for_pages() {
		$this->set_permalink_structure( '/%postname%/' );

		$p = self::factory()->post->create( array(
			'post_type' => 'page',
			'post_name' => 'embed',
		) );

		$found = wp_unique_post_slug( 'embed', $p, 'publish', 'paage', 0 );
		$this->assertSame( 'embed-2', $found );
	}

	/**
	 * @ticket 34971
	 */
	public function test_embed_slug_should_be_suffixed_for_attachments() {
		$this->set_permalink_structure( '/%postname%/' );

		$p = self::factory()->post->create( array(
			'post_type' => 'attachment',
			'post_name' => 'embed',
		) );

		$found = wp_unique_post_slug( 'embed', $p, 'publish', 'attachment', 0 );
		$this->assertSame( 'embed-2', $found );
	}
}
