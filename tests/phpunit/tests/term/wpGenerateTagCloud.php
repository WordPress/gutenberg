<?php
/**
 * @group taxonomy
 */
class Tests_WP_Generate_Tag_Cloud extends WP_UnitTestCase {
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
		$this->factory->term->create_many( 4, array( 'taxonomy' => 'post_tag' ) );
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


	/**
	 * Testing the various output for a single link
	 * in various formats
	 *
	 * @dataProvider single_link_data_provider
	 *
	 * @param int   $create          How many tags to create.
	 * @param array $get_terms_args  What args we want to pass to retreve terms.
	 * @param mixed $expected        Expected output from `wp_generate_tag_cloud()`.
	 * @param array $args            Options for `wp_generate_tag_cloud()`.
	 *
	 */
	function test_wp_generate_tag_cloud( $create, $get_terms_args, $expected, $args ) {
		$this->factory->term->create_many( $create, array( 'taxonomy' => 'post_tag' ) );
		$tags = $this->retrieve_terms( $get_terms_args );

		$this->assertEquals( $expected, wp_generate_tag_cloud( $tags, $args ) );
	}


	function single_link_data_provider() {
		return array(
			array(
				1,
				array(
					'number' => 1,
					'hide_empty' => false,
				),
				"<a href='http://example.org/?tag=term-1' class='tag-link-0' title='0 topics' style='font-size: 8pt;'>Term 1</a>",
				array(
					'hide_empty' => false,
				),
			),

			// Should return an array of links.
			array(
				1,
				array(
					'number' => 1,
					'hide_empty' => false,
				),
				array(
					"<a href='http://example.org/?tag=term-1' class='tag-link-0' title='0 topics' style='font-size: 8pt;'>Term 1</a>",
				),
				array(
					'hide_empty' => false,
					'format'     => 'array',
				),
			),

			// Should return a string containing a <ul> list of links.
			array(
				1,
				array(
					'number' => 1,
					'hide_empty' => false,
				),
				"<ul class='wp-tag-cloud'>\n\t<li><a href='http://example.org/?tag=term-1' class='tag-link-0' title='0 topics' style='font-size: 8pt;'>Term 1</a></li>\n</ul>\n",
				array(
					'hide_empty' => false,
					'format'     => 'list',
				),
			),

			array(
				4,
				array(
					'number' => 4,
					'hide_empty' => false,
				),
				"<a href='http://example.org/?tag=term-1' class='tag-link-0' title='0 topics' style='font-size: 8pt;'>Term 1</a>\n".
				"<a href='http://example.org/?tag=term-2' class='tag-link-1' title='0 topics' style='font-size: 8pt;'>Term 2</a>\n".
				"<a href='http://example.org/?tag=term-3' class='tag-link-2' title='0 topics' style='font-size: 8pt;'>Term 3</a>\n".
				"<a href='http://example.org/?tag=term-4' class='tag-link-3' title='0 topics' style='font-size: 8pt;'>Term 4</a>",
				array(
					'hide_empty' => false,
				),
			),

			array(
				4,
				array(
					'number' => 4,
					'hide_empty' => false,
				),
				"<ul class='wp-tag-cloud'>\n\t<li>".
				"<a href='http://example.org/?tag=term-1' class='tag-link-0' title='0 topics' style='font-size: 8pt;'>Term 1</a></li>\n\t<li>".
				"<a href='http://example.org/?tag=term-2' class='tag-link-1' title='0 topics' style='font-size: 8pt;'>Term 2</a></li>\n\t<li>".
				"<a href='http://example.org/?tag=term-3' class='tag-link-2' title='0 topics' style='font-size: 8pt;'>Term 3</a></li>\n\t<li>".
				"<a href='http://example.org/?tag=term-4' class='tag-link-3' title='0 topics' style='font-size: 8pt;'>Term 4</a>".
				"</li>\n</ul>\n",
				array(
					'hide_empty' => false,
					'format'     => 'list',
				),
			),
		);
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
	protected function retrieve_terms( $get_terms_args ) {

		$terms = get_terms( array( 'post_tag' ), $get_terms_args );

		$tags = array();
		foreach ( $terms as $term ) {
			//add the link
			$term->link = get_term_link( $term );
			$tags[] = $term;

		}

		return $tags;
	}
}
