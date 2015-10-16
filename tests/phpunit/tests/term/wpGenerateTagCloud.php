<?php
/**
 * @group taxonomy
 */
class Tests_WP_Generate_Tag_Cloud extends WP_UnitTestCase {
	protected $terms = array();

	/**
	 * Testing when passed $tags array is empty
	 *
	 * @dataProvider empty_tags_data_provider
	 *
	 * @param $expected Expected output from `wp_generate_tag_cloud()`.
	 * @param $args     Options for `wp_generate_tag_cloud()`.
	 */
	public function test_empty_tags_passed( $expected, $args ) {
		$empty_tags = array();
		$this->assertSame( $expected, wp_generate_tag_cloud( $empty_tags, $args ) );
	}

	/**
	 * Testing when no tags are found
	 *
	 * @dataProvider empty_tags_data_provider
	 *
	 * @param $expected Expected output from `wp_generate_tag_cloud()`.
	 * @param $args     Options for `wp_generate_tag_cloud()`.
	 */
	function test_empty_tags_list_returned( $expected, $args ) {
		$term_ids = self::$factory->term->create_many( 4, array( 'taxonomy' => 'post_tag' ) );
		$this->terms = array();
		foreach ( $term_ids as $term_id ) {
			$this->terms[] = get_term( $term_id, 'post_tag' );
		}
		$tags = $this->retrieve_terms( array( 'number' => 4 ) );
		$this->assertSame( $expected, wp_generate_tag_cloud( $tags, $args ) );
	}

	/**
	 * Provider for test when tags are empty.
	 * @return array
	 */
	function empty_tags_data_provider ( ) {
		return array(
			/**
			 * when format => array, we should be getting an empty array back
			 */
			array(
				array(),
				array( 'format' => 'array' ),
			),
			/**
			 * List format returns an empty string
			 */
			array(
				'',
				array( 'format' => 'list' ),
			),
			/**
			 * $args can be an array or ''. Either should return an empty string
			 */
			array(
				'',
				array(),
			),
			array(
				'',
				'',
			),
		);
	}

	function test_hide_empty_false() {
		$term_id = self::$factory->tag->create();
		$term = get_term( $term_id, 'post_tag' );

		$tags = $this->retrieve_terms( array(
			'number' => 1,
			'hide_empty' => false,
		) );
		$expected = "<a href='http://" . WP_TESTS_DOMAIN . "/?tag={$term->slug}' class='tag-link-0' title='0 topics' style='font-size: 8pt;'>{$term->name}</a>";
		$this->assertEquals( $expected, wp_generate_tag_cloud( $tags, array(
			'hide_empty' => false,
		) ) );
	}

	function test_hide_empty_false_format_array() {
		$term_id = self::$factory->tag->create();
		$term = get_term( $term_id, 'post_tag' );

		$tags = $this->retrieve_terms( array(
			'number' => 1,
			'hide_empty' => false,
			'format'     => 'array',
		) );

		$expected = "<a href='http://" . WP_TESTS_DOMAIN . "/?tag={$term->slug}' class='tag-link-0' title='0 topics' style='font-size: 8pt;'>{$term->name}</a>";
		$this->assertEquals( $expected, wp_generate_tag_cloud( $tags, array(
			'hide_empty' => false,
		) ) );
	}

	function test_hide_empty_false_format_list() {
		$term_id = self::$factory->tag->create();
		$term = get_term( $term_id, 'post_tag' );

		$tags = $this->retrieve_terms( array(
			'number' => 1,
			'hide_empty' => false,
		) );

		$expected = "<ul class='wp-tag-cloud'>\n\t<li><a href='http://" . WP_TESTS_DOMAIN . "/?tag={$term->slug}' class='tag-link-0' title='0 topics' style='font-size: 8pt;'>{$term->name}</a></li>\n</ul>\n";
		$this->assertEquals( $expected, wp_generate_tag_cloud( $tags, array(
			'hide_empty' => false,
			'format'     => 'list',
		) ) );
	}

	function test_hide_empty_false_multi() {
		$term_ids = self::$factory->tag->create_many( 4 );
		$terms = array();
		foreach ( $term_ids as $term_id ) {
			$terms[] = get_term( $term_id, 'post_tag' );
		}

		$tags = $this->retrieve_terms( array(
			'number' => 4,
			'order' => 'id',
			'hide_empty' => false,
		) );

		$expected = "<a href='http://" . WP_TESTS_DOMAIN . "/?tag={$terms[0]->slug}' class='tag-link-0' title='0 topics' style='font-size: 8pt;'>{$terms[0]->name}</a>\n".
			"<a href='http://" . WP_TESTS_DOMAIN . "/?tag={$terms[1]->slug}' class='tag-link-1' title='0 topics' style='font-size: 8pt;'>{$terms[1]->name}</a>\n".
			"<a href='http://" . WP_TESTS_DOMAIN . "/?tag={$terms[2]->slug}' class='tag-link-2' title='0 topics' style='font-size: 8pt;'>{$terms[2]->name}</a>\n".
			"<a href='http://" . WP_TESTS_DOMAIN . "/?tag={$terms[3]->slug}' class='tag-link-3' title='0 topics' style='font-size: 8pt;'>{$terms[3]->name}</a>";
		$this->assertEquals( $expected, wp_generate_tag_cloud( $tags, array(
			'hide_empty' => false,
		) ) );
	}

	function test_hide_empty_false_multi_format_list() {
		$term_ids = self::$factory->tag->create_many( 4 );
		$terms = array();
		foreach ( $term_ids as $term_id ) {
			$terms[] = get_term( $term_id, 'post_tag' );
		}

		$tags = $this->retrieve_terms( array(
			'number' => 4,
			'orderby' => 'id',
			'hide_empty' => false,
		) );

		$expected = "<ul class='wp-tag-cloud'>\n\t<li>".
			"<a href='http://" . WP_TESTS_DOMAIN . "/?tag={$terms[0]->slug}' class='tag-link-0' title='0 topics' style='font-size: 8pt;'>{$terms[0]->name}</a></li>\n\t<li>".
			"<a href='http://" . WP_TESTS_DOMAIN . "/?tag={$terms[1]->slug}' class='tag-link-1' title='0 topics' style='font-size: 8pt;'>{$terms[1]->name}</a></li>\n\t<li>".
			"<a href='http://" . WP_TESTS_DOMAIN . "/?tag={$terms[2]->slug}' class='tag-link-2' title='0 topics' style='font-size: 8pt;'>{$terms[2]->name}</a></li>\n\t<li>".
			"<a href='http://" . WP_TESTS_DOMAIN . "/?tag={$terms[3]->slug}' class='tag-link-3' title='0 topics' style='font-size: 8pt;'>{$terms[3]->name}</a>".
			"</li>\n</ul>\n";

		$this->assertEquals( $expected, wp_generate_tag_cloud( $tags, array(
			'hide_empty' => false,
			'format'     => 'list',
		) ) );
	}

	public function test_topic_count_text() {
		register_taxonomy( 'wptests_tax', 'post' );
		$term_ids = self::$factory->term->create_many( 2, array( 'taxonomy' => 'wptests_tax' ) );
		$this->terms = array();
		foreach ( $term_ids as $term_id ) {
			$this->terms[] = get_term( $term_id, 'post_tag' );
		}
		$posts = self::$factory->post->create_many( 2 );

		wp_set_post_terms( $posts[0], $term_ids, 'wptests_tax' );
		wp_set_post_terms( $posts[1], array( $term_ids[1] ), 'wptests_tax' );

		$term_objects = $this->retrieve_terms( array(
			'include' => $term_ids,
		), 'wptests_tax' );

		$actual = wp_generate_tag_cloud( $term_objects, array(
			'format' => 'array',
			'topic_count_text' => array(
				'singular' => 'Term has %s post',
				'plural' => 'Term has %s posts',
				'domain' => 'foo',
				'context' => 'bar',
			),
		) );

		$this->assertContains( "title='Term has 1 post'", $actual[0] );
		$this->assertContains( "title='Term has 2 posts'", $actual[1] );
	}

	public function test_topic_count_text_callback() {
		register_taxonomy( 'wptests_tax', 'post' );
		$term_ids = self::$factory->term->create_many( 2, array( 'taxonomy' => 'wptests_tax' ) );
		$this->terms = array();
		foreach ( $term_ids as $term_id ) {
			$this->terms[] = get_term( $term_id, 'post_tag' );
		}
		$posts = self::$factory->post->create_many( 2 );

		wp_set_post_terms( $posts[0], $term_ids, 'wptests_tax' );
		wp_set_post_terms( $posts[1], array( $term_ids[1] ), 'wptests_tax' );

		$term_objects = $this->retrieve_terms( array(
			'include' => $term_ids,
		), 'wptests_tax' );

		$actual = wp_generate_tag_cloud( $term_objects, array(
			'format' => 'array',
			'topic_count_text_callback' => array( $this, 'topic_count_text_callback' ),
		) );

		$this->assertContains( "title='1 foo'", $actual[0] );
		$this->assertContains( "title='2 foo'", $actual[1] );
	}

	/**
	 * Helper method retrieve the created terms.
	 *
	 * @uses get_terms
	 *
	 * @param array $get_terms_args Options passed to get_terms()
	 *
	 * @return array
	 */
	protected function retrieve_terms( $get_terms_args, $taxonomy = 'post_tag' ) {
		$terms = get_terms( array( $taxonomy ), $get_terms_args );

		$tags = array();
		foreach ( $terms as $term ) {
			//add the link
			$term->link = get_term_link( $term );
			$tags[] = $term;

		}

		return $tags;
	}

	public function topic_count_text_callback( $real_count, $tag, $args ) {
		return sprintf( '%s foo', $real_count );
	}
}
