<?php
/**
 * Unit tests covering WP_HTML_Tag_Processor functionality.
 * This file is only for tests that require WordPress libraries.
 * Put all other tests in wp-html-tag-processor-test-standalone.php.
 *
 * Run these tests locally as follows:
 *
 * ```
 * npx wp-env run phpunit "phpunit -c /var/www/html/wp-content/plugins/gutenberg/phpunit.xml.dist --filter WP_HTML_Tag_Processor_Test_WP"
 * ```
 *
 * @package WordPress
 * @subpackage HTML
 */

require_once __DIR__ . '/../../lib/experimental/html/index.php';

/**
 * @group html
 *
 * @coversDefaultClass WP_HTML_Tag_Processor
 */
class WP_HTML_Tag_Processor_Test_WP extends WP_UnitTestCase {

	/**
	 * Passing a double quote inside of an attribute values could lead to an XSS attack as follows:
	 *
	 * <code>
	 *     $p = new WP_HTML_Tag_Processor( '<div class="header"></div>' );
	 *     $p->next_tag();
	 *     $p->set_attribute('class', '" onclick="alert');
	 *     echo $p;
	 *     // <div class="" onclick="alert"></div>
	 * </code>
	 *
	 * To prevent it, `set_attribute` calls `esc_attr()` on its given values.
	 *
	 * <code>
	 *    <div class="&quot; onclick=&quot;alert"></div>
	 * </code>
	 *
	 * @ticket 56299
	 *
	 * @dataProvider data_set_attribute_escapable_values
	 * @covers set_attribute
	 */
	public function test_set_attribute_prevents_xss( $value_to_set, $expected_result ) {
		$p = new WP_HTML_Tag_Processor( '<div></div>' );
		$p->next_tag();
		$p->set_attribute( 'test', $value_to_set );

		/*
		 * Testing the escaping is hard using tools that properly parse
		 * HTML because they might interpret the escaped values. It's hard
		 * with tools that don't understand HTML because they might get
		 * confused by improperly-escaped values.
		 *
		 * For this test, since we control the input HTML we're going to
		 * do what looks like the opposite of what we want to be doing with
		 * this library but are only doing so because we have full control
		 * over the content and because we want to look at the raw values.
		 */
		$match = null;
		preg_match( '~^<div test=(.*)></div>$~', $p->get_updated_html(), $match );
		list( , $actual_value ) = $match;

		$this->assertEquals( $actual_value, '"' . $expected_result . '"' );
	}

	/**
	 * Data provider with HTML attribute values that might need escaping.
	 */
	public function data_set_attribute_escapable_values() {
		return array(
			array( '"', '&quot;' ),
			array( '&quot;', '&quot;' ),
			array( '&', '&amp;' ),
			array( '&amp;', '&amp;' ),
			array( '&euro;', '&euro;' ),
			array( "'", '&#039;' ),
			array( '<>', '&lt;&gt;' ),
			array( '&quot";', '&amp;quot&quot;;' ),
			array(
				'" onclick="alert(\'1\');"><span onclick=""></span><script>alert("1")</script>',
				'&quot; onclick=&quot;alert(&#039;1&#039;);&quot;&gt;&lt;span onclick=&quot;&quot;&gt;&lt;/span&gt;&lt;script&gt;alert(&quot;1&quot;)&lt;/script&gt;',
			),
		);
	}

}
