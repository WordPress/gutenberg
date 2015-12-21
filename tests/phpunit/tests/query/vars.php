<?php

/**
 * Tests to make sure query vars are as expected.
 *
 * @group query
 */
class Tests_Query_Vars extends WP_UnitTestCase {

	/**
	 * @ticket 35115
	 */
	public function testPublicQueryVarsAreAsExpected() {
		global $wp;

		// Re-initialise any dynamically-added public query vars:
		do_action( 'init' );

		$this->assertEquals( array(

			// Static public query vars:
			'm',
			'p',
			'posts',
			'w',
			'cat',
			'withcomments',
			'withoutcomments',
			's',
			'search',
			'exact',
			'sentence',
			'calendar',
			'page',
			'paged',
			'more',
			'tb',
			'pb',
			'author',
			'order',
			'orderby',
			'year',
			'monthnum',
			'day',
			'hour',
			'minute',
			'second',
			'name',
			'category_name',
			'tag',
			'feed',
			'author_name',
			'static',
			'pagename',
			'page_id',
			'error',
			'attachment',
			'attachment_id',
			'subpost',
			'subpost_id',
			'preview',
			'robots',
			'taxonomy',
			'term',
			'cpage',
			'post_type',
			'embed',

			// Dynamically added public query vars:
			'post_format',
			'rest_route',

		), $wp->public_query_vars, 'Care should be taken when introducing new public query vars. See https://core.trac.wordpress.org/ticket/35115' );
	}

}
