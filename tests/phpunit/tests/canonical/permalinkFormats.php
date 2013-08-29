<?php

/**
 * @group canonical
 * @group rewrite
 * @group query
 */
class Tests_Canonical_PermalinkFormat extends WP_UnitTestCase {

	/**
	 * @ticket 21167
	 */
	public function test_dotted_formats() {
		global $wp_rewrite;

		// Create a sample post
		$cat_id = $this->factory->term->create( array(
			'name'     => 'permalink-test',
			'taxonomy' => 'category'
		) );
		$user_id = $this->factory->user->create( array(
			'role'       => 'editor',
			'user_login' => 'permalink_user',
		) );
		$post_id = $this->factory->post->create( array(
			'post_title' => 'lorem-ipsum',
			'post_date'  => '2012-08-02 14:15:05',
			'post_author' => $user_id,
			'category'    => $cat_id
		) );
		wp_set_post_categories( $post_id, array( $cat_id ) );

		// Sample permalinks
		$tests = array(
			'/%postname%.%post_id%/ ' => array(
				'regex' => '([^/]+)\.([0-9]+)(/[0-9]+)?/?$',
				'url'   => 'index.php?name=$1&p=$2&page=$3'
			),
			'/%year%.%monthnum%.%postname%/' => array(
				'regex' => '([0-9]{4})\.([0-9]{1,2})\.([^/]+)(/[0-9]+)?/?$',
				'url'   => 'index.php?year=$1&monthnum=$2&name=$3&page=$4'
			),
			'/%post_id%.%postname%/' => array(
				'regex' => '([0-9]+)\.([^/]+)(/[0-9]+)?/?$',
				'url'   => 'index.php?p=$1&name=$2&page=$3'
			),
			'/%postname%.%year%/' => array(
				'regex' => '([^/]+)\.([0-9]{4})(/[0-9]+)?/?$',
				'url'   => 'index.php?name=$1&year=$2&page=$3'
			),
			'/$%postname%$/' => array(
				'regex' => '\$([^/]+)\$(/[0-9]+)?/?$',
				'url'   => 'index.php?name=$1&page=$2'
			),
			'%year%.+?%monthnum%.+?%day%.+?%hour%.+?%minute%.+?%second%.+?%post_id%.+?%postname%.+?%category%.+?%author%.+?' => array(
				'regex' => '([0-9]{4})\.\+\?([0-9]{1,2})\.\+\?([0-9]{1,2})\.\+\?([0-9]{1,2})\.\+\?([0-9]{1,2})\.\+\?([0-9]{1,2})\.\+\?([0-9]+)\.\+\?([^/]+)\.\+\?%category%\.\+\?([^/]+)\.\+\?(/[0-9]+)?/?$',
				'url'   => 'index.php?year=$1&monthnum=$2&day=$3&hour=$4&minute=$5&second=$6&p=$7&name=$8&%category%$9&author_name=$10&page=$11'
			),
		);

		// Test permalinks
		foreach ( $tests as $permalink_format => $expected ) {
			update_option( 'permalink_structure', $permalink_format );

			// Get the rewrite rules
			$rules = $wp_rewrite->generate_rewrite_rules( get_option( 'permalink_structure' ), EP_PERMALINK, false, false, false, false );

			// Filter out only the post rewrite rule
			foreach ( $rules as $regex => $url ) {
				if ( false === strpos( $url, 'attachment=$' ) && false === strpos( $url, 'tb=' ) && false === strpos( $url, 'cpage=$' ) ) {
					break;
				}
			}

			// Test that expected === actual
			$this->assertEquals( $regex, $expected['regex'], "Problem with permalink format: $permalink_format" );
			$this->assertEquals( $url, $expected['url'], "Problem with permalink format: $permalink_format" );
		}
	}
}
