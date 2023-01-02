<?php
/**
 * Unit tests covering WP_HTML_Tag_Processor functionality.
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
class WP_HTML_Tag_Processor_Test extends WP_UnitTestCase {
	const HTML_SIMPLE       = '<div id="first"><span id="second">Text</span></div>';
	const HTML_WITH_CLASSES = '<div class="main with-border" id="first"><span class="not-main bold with-border" id="second">Text</span></div>';
	const HTML_MALFORMED    = '<div><span class="d-md-none" Notifications</span><span class="d-none d-md-inline">Back to notifications</span></div>';

	/**
	 * @ticket 56299
	 *
	 * @covers get_tag
	 */
	public function test_get_tag_returns_null_before_finding_tags() {
		$p = new WP_HTML_Tag_Processor( '<div>Test</div>' );
		$this->assertNull( $p->get_tag() );
	}

	/**
	 * @ticket 56299
	 *
	 * @covers next_tag
	 * @covers get_tag
	 */
	public function test_get_tag_returns_null_when_not_in_open_tag() {
		$p = new WP_HTML_Tag_Processor( '<div>Test</div>' );
		$this->assertFalse( $p->next_tag( 'p' ), 'Querying a non-existing tag did not return false' );
		$this->assertNull( $p->get_tag(), 'Accessing a non-existing tag did not return null' );
	}

	/**
	 * @ticket 56299
	 *
	 * @covers next_tag
	 * @covers get_tag
	 */
	public function test_get_tag_returns_open_tag_name() {
		$p = new WP_HTML_Tag_Processor( '<div>Test</div>' );
		$this->assertTrue( $p->next_tag( 'div' ), 'Querying an existing tag did not return true' );
		$this->assertSame( 'DIV', $p->get_tag(), 'Accessing an existing tag name did not return "div"' );
	}

	/**
	 * @ticket 56299
	 *
	 * @covers get_attribute
	 */
	public function test_get_attribute_returns_null_before_finding_tags() {
		$p = new WP_HTML_Tag_Processor( '<div class="test">Test</div>' );
		$this->assertNull( $p->get_attribute( 'class' ) );
	}

	/**
	 * @ticket 56299
	 *
	 * @covers next_tag
	 * @covers get_attribute
	 */
	public function test_get_attribute_returns_null_when_not_in_open_tag() {
		$p = new WP_HTML_Tag_Processor( '<div class="test">Test</div>' );
		$this->assertFalse( $p->next_tag( 'p' ), 'Querying a non-existing tag did not return false' );
		$this->assertNull( $p->get_attribute( 'class' ), 'Accessing an attribute of a non-existing tag did not return null' );
	}

	/**
	 * @ticket 56299
	 *
	 * @covers next_tag
	 * @covers get_attribute
	 */
	public function test_get_attribute_returns_null_when_in_closing_tag() {
		$p = new WP_HTML_Tag_Processor( '<div class="test">Test</div>' );
		$this->assertTrue( $p->next_tag( 'div' ), 'Querying an existing tag did not return true' );
		$this->assertTrue( $p->next_tag( array( 'tag_closers' => 'visit' ) ), 'Querying an existing closing tag did not return true' );
		$this->assertNull( $p->get_attribute( 'class' ), 'Accessing an attribute of a closing tag did not return null' );
	}

	/**
	 * @ticket 56299
	 *
	 * @covers next_tag
	 * @covers get_attribute
	 */
	public function test_get_attribute_returns_null_when_attribute_missing() {
		$p = new WP_HTML_Tag_Processor( '<div class="test">Test</div>' );
		$this->assertTrue( $p->next_tag( 'div' ), 'Querying an existing tag did not return true' );
		$this->assertNull( $p->get_attribute( 'test-id' ), 'Accessing a non-existing attribute did not return null' );
	}

	/**
	 * @ticket 56299
	 *
	 * @covers next_tag
	 * @covers get_attribute
	 */
	public function test_get_attribute_returns_attribute_value() {
		$p = new WP_HTML_Tag_Processor( '<div class="test">Test</div>' );
		$this->assertTrue( $p->next_tag( 'div' ), 'Querying an existing tag did not return true' );
		$this->assertSame( 'test', $p->get_attribute( 'class' ), 'Accessing a class="test" attribute value did not return "test"' );
	}

	/**
	 * @ticket 56299
	 *
	 * @covers next_tag
	 * @covers get_attribute
	 */
	public function test_get_attribute_returns_true_for_boolean_attribute() {
		$p = new WP_HTML_Tag_Processor( '<div enabled class="test">Test</div>' );
		$this->assertTrue( $p->next_tag( array( 'class_name' => 'test' ) ), 'Querying an existing tag did not return true' );
		$this->assertTrue( $p->get_attribute( 'enabled' ), 'Accessing a boolean "enabled" attribute value did not return true' );
	}

	/**
	 * @ticket 56299
	 *
	 * @covers next_tag
	 * @covers get_attribute
	 */
	public function test_get_attribute_returns_string_for_truthy_attributes() {
		$p = new WP_HTML_Tag_Processor( '<div enabled=enabled checked=1 hidden="true" class="test">Test</div>' );
		$this->assertTrue( $p->next_tag( array() ), 'Querying an existing tag did not return true' );
		$this->assertSame( 'enabled', $p->get_attribute( 'enabled' ), 'Accessing a boolean "enabled" attribute value did not return true' );
		$this->assertSame( '1', $p->get_attribute( 'checked' ), 'Accessing a checked=1 attribute value did not return "1"' );
		$this->assertSame( 'true', $p->get_attribute( 'hidden' ), 'Accessing a hidden="true" attribute value did not return "true"' );
	}

	/**
	 * @ticket 56299
	 *
	 * @covers WP_HTML_Tag_Processor::get_attribute
	 */
	public function test_get_attribute_decodes_html_character_references() {
		$p = new WP_HTML_Tag_Processor( '<div id="the &quot;grande&quot; is &lt; &#x033;&#50;oz&dagger;"></div>' );
		$p->next_tag();
		$this->assertSame( 'the "grande" is < 32oz†', $p->get_attribute( 'id' ), 'HTML Attribute value was returned without decoding character references' );
	}

	/**
	 * @ticket 56299
	 *
	 * @covers next_tag
	 * @covers get_attribute
	 */
	public function test_attributes_parser_treats_slash_as_attribute_separator() {
		$p = new WP_HTML_Tag_Processor( '<div a/b/c/d/e="test">Test</div>' );
		$this->assertTrue( $p->next_tag( array() ), 'Querying an existing tag did not return true' );
		$this->assertTrue( $p->get_attribute( 'a' ), 'Accessing an existing attribute did not return true' );
		$this->assertTrue( $p->get_attribute( 'b' ), 'Accessing an existing attribute did not return true' );
		$this->assertTrue( $p->get_attribute( 'c' ), 'Accessing an existing attribute did not return true' );
		$this->assertTrue( $p->get_attribute( 'd' ), 'Accessing an existing attribute did not return true' );
		$this->assertSame( 'test', $p->get_attribute( 'e' ), 'Accessing an existing e="test" did not return "test"' );
	}

	/**
	 * @ticket 56299
	 *
	 * @covers next_tag
	 * @covers get_attribute
	 */
	public function test_attributes_parser_is_case_insensitive() {
		$p = new WP_HTML_Tag_Processor( '<div DATA-enabled="true" data-VISIBLE>Test</div>' );
		$p->next_tag();
		$p->get_attribute( 'data-enabled' );
		$this->assertEquals( 'true', $p->get_attribute( 'DATA-enabled' ), 'A case-insensitive get_attribute call did not return "true".' );
		$this->assertEquals( 'true', $p->get_attribute( 'data-enabled' ), 'A case-insensitive get_attribute call did not return "true".' );
		$this->assertEquals( 'true', $p->get_attribute( 'DATA-ENABLED' ), 'A case-insensitive get_attribute call did not return "true".' );
		$this->assertEquals( true, $p->get_attribute( 'data-VISIBLE' ), 'A case-insensitive get_attribute call did not return true.' );
		$this->assertEquals( true, $p->get_attribute( 'DATA-visible' ), 'A case-insensitive get_attribute call did not return true.' );
		$this->assertEquals( true, $p->get_attribute( 'dAtA-ViSiBlE' ), 'A case-insensitive get_attribute call did not return true.' );
	}

	/**
	 * @ticket 56299
	 *
	 * @covers next_tag
	 * @covers remove_attribute
	 */
	public function test_remove_attribute_is_case_insensitive() {
		$p = new WP_HTML_Tag_Processor( '<div DATA-enabled="true">Test</div>' );
		$p->next_tag();
		$p->remove_attribute( 'data-enabled' );
		$this->assertEquals( '<div >Test</div>', $p->get_updated_html(), 'A case-insensitive remove_attribute call did not remove the attribute.' );
	}

	/**
	 * @ticket 56299
	 *
	 * @covers next_tag
	 * @covers set_attribute
	 */
	public function test_set_attribute_is_case_insensitive() {
		$p = new WP_HTML_Tag_Processor( '<div DATA-enabled="true">Test</div>' );
		$p->next_tag();
		$p->set_attribute( 'data-enabled', 'abc' );
		$this->assertEquals( '<div data-enabled="abc">Test</div>', $p->get_updated_html(), 'A case-insensitive set_attribute call did not update the existing attribute.' );
	}

	/**
	 * @ticket 56299
	 *
	 * @covers get_attribute_names_with_prefix
	 */
	public function test_get_attribute_names_with_prefix_returns_null_before_finding_tags() {
		$p = new WP_HTML_Tag_Processor( '<div data-foo="bar">Test</div>' );
		$this->assertNull( $p->get_attribute_names_with_prefix( 'data-' ) );
	}

	/**
	 * @ticket 56299
	 *
	 * @covers get_attribute_names_with_prefix
	 */
	public function test_get_attribute_names_with_prefix_returns_null_when_not_in_open_tag() {
		$p = new WP_HTML_Tag_Processor( '<div data-foo="bar">Test</div>' );
		$p->next_tag( 'p' );
		$this->assertNull( $p->get_attribute_names_with_prefix( 'data-' ), 'Accessing attributes of a non-existing tag did not return null' );
	}

	/**
	 * @ticket 56299
	 *
	 * @covers get_attribute_names_with_prefix
	 */
	public function test_get_attribute_names_with_prefix_returns_null_when_in_closing_tag() {
		$p = new WP_HTML_Tag_Processor( '<div data-foo="bar">Test</div>' );
		$p->next_tag( 'div' );
		$p->next_tag( array( 'tag_closers' => 'visit' ) );
		$this->assertNull( $p->get_attribute_names_with_prefix( 'data-' ), 'Accessing attributes of a closing tag did not return null' );
	}

	/**
	 * @ticket 56299
	 *
	 * @covers get_attribute_names_with_prefix
	 */
	public function test_get_attribute_names_with_prefix_returns_empty_array_when_no_attributes_present() {
		$p = new WP_HTML_Tag_Processor( '<div>Test</div>' );
		$p->next_tag( 'div' );
		$this->assertSame( array(), $p->get_attribute_names_with_prefix( 'data-' ), 'Accessing the attributes on a tag without any did not return an empty array' );
	}

	/**
	 * @ticket 56299
	 *
	 * @covers get_attribute_names_with_prefix
	 */
	public function test_get_attribute_names_with_prefix_returns_matching_attribute_names_in_lowercase() {
		$p = new WP_HTML_Tag_Processor( '<div DATA-enabled class="test" data-test-ID="14">Test</div>' );
		$p->next_tag();
		$this->assertSame(
			array( 'data-enabled', 'data-test-id' ),
			$p->get_attribute_names_with_prefix( 'data-' )
		);
	}

	/**
	 * @ticket 56299
	 *
	 * @covers set_attribute
	 * @covers get_updated_html
	 * @covers get_attribute_names_with_prefix
	 */
	public function test_get_attribute_names_with_prefix_returns_attribute_added_by_set_attribute() {
		$p = new WP_HTML_Tag_Processor( '<div data-foo="bar">Test</div>' );
		$p->next_tag();
		$p->set_attribute( 'data-test-id', '14' );
		$this->assertSame(
			'<div data-test-id="14" data-foo="bar">Test</div>',
			$p->get_updated_html(),
			"Updated HTML doesn't include attribute added via set_attribute"
		);
		$this->assertSame(
			array( 'data-test-id', 'data-foo' ),
			$p->get_attribute_names_with_prefix( 'data-' ),
			"Accessing attribute names doesn't find attribute added via set_attribute"
		);
	}

	/**
	 * @ticket 56299
	 *
	 * @covers __toString
	 */
	public function tostring_returns_updated_html() {
		$p = new WP_HTML_Tag_Processor( '<hr id="remove" /><div enabled class="test">Test</div><span id="span-id"></span>' );
		$p->next_tag();
		$p->remove_attribute( 'id' );

		$p->next_tag();
		$p->set_attribute( 'id', 'div-id-1' );
		$p->add_class( 'new_class_1' );

		$this->assertEquals(
			$p->get_updated_html(),
			(string) $p
		);
	}

	/**
	 * @ticket 56299
	 *
	 * @covers get_updated_html
	 */
	public function test_get_updated_html_applies_the_updates_so_far_and_keeps_the_processor_on_the_current_tag() {
		$p = new WP_HTML_Tag_Processor( '<hr id="remove" /><div enabled class="test">Test</div><span id="span-id"></span>' );
		$p->next_tag();
		$p->remove_attribute( 'id' );

		$p->next_tag();
		$p->set_attribute( 'id', 'div-id-1' );
		$p->add_class( 'new_class_1' );
		$this->assertSame(
			'<hr  /><div id="div-id-1" enabled class="test new_class_1">Test</div><span id="span-id"></span>',
			$p->get_updated_html(),
			'Calling get_updated_html after updating the attributes of the second tag returned different HTML than expected'
		);

		$p->set_attribute( 'id', 'div-id-2' );
		$p->add_class( 'new_class_2' );
		$this->assertSame(
			'<hr  /><div id="div-id-2" enabled class="test new_class_1 new_class_2">Test</div><span id="span-id"></span>',
			$p->get_updated_html(),
			'Calling get_updated_html after updating the attributes of the second tag for the second time returned different HTML than expected'
		);

		$p->next_tag();
		$p->remove_attribute( 'id' );
		$this->assertSame(
			'<hr  /><div id="div-id-2" enabled class="test new_class_1 new_class_2">Test</div><span ></span>',
			$p->get_updated_html(),
			'Calling get_updated_html after removing the id attribute of the third tag returned different HTML than expected'
		);
	}

	/**
	 * @ticket 56299
	 *
	 * @covers get_updated_html
	 */
	public function test_get_updated_html_without_updating_any_attributes_returns_the_original_html() {
		$p = new WP_HTML_Tag_Processor( self::HTML_SIMPLE );
		$this->assertSame( self::HTML_SIMPLE, $p->get_updated_html() );
	}

	/**
	 * @ticket 56299
	 *
	 * @covers next_tag
	 */
	public function test_next_tag_with_no_arguments_should_find_the_next_existing_tag() {
		$p = new WP_HTML_Tag_Processor( self::HTML_SIMPLE );
		$this->assertTrue( $p->next_tag(), 'Querying an existing tag did not return true' );
	}

	/**
	 * @ticket 56299
	 *
	 * @covers next_tag
	 */
	public function test_next_tag_should_return_false_for_a_non_existing_tag() {
		$p = new WP_HTML_Tag_Processor( self::HTML_SIMPLE );
		$this->assertFalse( $p->next_tag( 'p' ), 'Querying a non-existing tag did not return false' );
	}

	/**
	 * @covers next_tag
	 * @covers is_tag_closer
	 */
	public function test_next_tag_should_stop_on_closers_only_when_requested() {
		$p = new WP_HTML_Tag_Processor( '<div><img /></div>' );
		$this->assertTrue( $p->next_tag( array( 'tag_name' => 'div' ) ), 'Did not find desired tag opener' );
		$this->assertFalse( $p->next_tag( array( 'tag_name' => 'div' ) ), 'Visited an unwanted tag, a tag closer' );

		$p = new WP_HTML_Tag_Processor( '<div><img /></div>' );
		$p->next_tag(
			array(
				'tag_name'    => 'div',
				'tag_closers' => 'visit',
			)
		);
		$this->assertFalse( $p->is_tag_closer(), 'Indicated a tag opener is a tag closer' );
		$this->assertTrue(
			$p->next_tag(
				array(
					'tag_name'    => 'div',
					'tag_closers' => 'visit',
				)
			),
			'Did not stop at desired tag closer'
		);
		$this->assertTrue( $p->is_tag_closer(), 'Indicated a tag closer is a tag opener' );
	}

	/**
	 * @ticket 56299
	 *
	 * @covers next_tag
	 * @covers get_updated_html
	 */
	public function test_set_attribute_on_a_non_existing_tag_does_not_change_the_markup() {
		$p = new WP_HTML_Tag_Processor( self::HTML_SIMPLE );
		$this->assertFalse( $p->next_tag( 'p' ), 'Querying a non-existing tag did not return false' );
		$this->assertFalse( $p->next_tag( 'div' ), 'Querying a non-existing tag did not return false' );
		$p->set_attribute( 'id', 'primary' );
		$this->assertSame(
			self::HTML_SIMPLE,
			$p->get_updated_html(),
			'Calling get_updated_html after updating a non-existing tag returned an HTML that was different from the original HTML'
		);
	}

	public function test_attribute_ops_on_tag_closer_do_not_change_the_markup() {
		$p = new WP_HTML_Tag_Processor( '<div id=3></div invalid-id=4>' );
		$p->next_tag(
			array(
				'tag_name'    => 'div',
				'tag_closers' => 'visit',
			)
		);
		$this->assertFalse( $p->is_tag_closer(), 'Skipped tag opener' );
		$p->next_tag(
			array(
				'tag_name'    => 'div',
				'tag_closers' => 'visit',
			)
		);
		$this->assertTrue( $p->is_tag_closer(), 'Skipped tag closer' );
		$this->assertFalse( $p->set_attribute( 'id', 'test' ), "Allowed setting an attribute on a tag closer when it shouldn't have" );
		$this->assertFalse( $p->remove_attribute( 'invalid-id' ), "Allowed removing an attribute on a tag closer when it shouldn't have" );
		$this->assertFalse( $p->add_class( 'sneaky' ), "Allowed adding a class on a tag closer when it shouldn't have" );
		$this->assertFalse( $p->remove_class( 'not-appearing-in-this-test' ), "Allowed removing a class on a tag closer when it shouldn't have" );
		$this->assertSame(
			'<div id=3></div invalid-id=4>',
			$p->get_updated_html(),
			'Calling get_updated_html after updating a non-existing tag returned an HTML that was different from the original HTML'
		);
	}

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
	public function test_set_attribute_prevents_xss( $attribute_value ) {
		$p = new WP_HTML_Tag_Processor( '<div></div>' );
		$p->next_tag();
		$p->set_attribute( 'test', $attribute_value );

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

		$this->assertEquals( $actual_value, '"' . esc_attr( $attribute_value ) . '"' );
	}

	/**
	 * Data provider with HTML attribute values that might need escaping.
	 */
	public function data_set_attribute_escapable_values() {
		return array(
			array( '"' ),
			array( '&quot;' ),
			array( '&' ),
			array( '&amp;' ),
			array( '&euro;' ),
			array( "'" ),
			array( '<>' ),
			array( '&quot";' ),
			array( '" onclick="alert(\'1\');"><span onclick=""></span><script>alert("1")</script>' ),
		);
	}

	/**
	 * @ticket 56299
	 *
	 * @covers set_attribute
	 * @covers get_updated_html
	 */
	public function test_set_attribute_with_a_non_existing_attribute_adds_a_new_attribute_to_the_markup() {
		$p = new WP_HTML_Tag_Processor( self::HTML_SIMPLE );
		$p->next_tag();
		$p->set_attribute( 'test-attribute', 'test-value' );
		$this->assertSame( '<div test-attribute="test-value" id="first"><span id="second">Text</span></div>', $p->get_updated_html() );
	}

	/**
	 * According to HTML spec, only the first instance of an attribute counts.
	 * The other ones are ignored.
	 *
	 * @ticket 56299
	 *
	 * @covers set_attribute
	 * @covers get_updated_html
	 */
	public function test_update_first_when_duplicated_attribute() {
		$p = new WP_HTML_Tag_Processor( '<div id="update-me" id="ignored-id"><span id="second">Text</span></div>' );
		$p->next_tag();
		$p->set_attribute( 'id', 'updated-id' );
		$this->assertSame( '<div id="updated-id" id="ignored-id"><span id="second">Text</span></div>', $p->get_updated_html() );
	}

	/**
	 * @ticket 56299
	 *
	 * @covers set_attribute
	 * @covers get_updated_html
	 */
	public function test_set_attribute_with_an_existing_attribute_name_updates_its_value_in_the_markup() {
		$p = new WP_HTML_Tag_Processor( self::HTML_SIMPLE );
		$p->next_tag();
		$p->set_attribute( 'id', 'new-id' );
		$this->assertSame( '<div id="new-id"><span id="second">Text</span></div>', $p->get_updated_html() );
	}

	/**
	 * @ticket 56299
	 *
	 * @covers set_attribute
	 * @covers get_updated_html
	 */
	public function test_next_tag_and_set_attribute_in_a_loop_update_all_tags_in_the_markup() {
		$p = new WP_HTML_Tag_Processor( self::HTML_SIMPLE );
		while ( $p->next_tag() ) {
			$p->set_attribute( 'data-foo', 'bar' );
		}

		$this->assertSame( '<div data-foo="bar" id="first"><span data-foo="bar" id="second">Text</span></div>', $p->get_updated_html() );
	}

	/**
	 * Removing an attribute that's listed many times, e.g. `<div id="a" id="b" />` should remove
	 * all its instances and output just `<div />`.
	 *
	 * Today, however, WP_HTML_Tag_Processor only removes the first such attribute. It seems like a corner case
	 * and introducing additional complexity to correctly handle this scenario doesn't seem to be worth it.
	 * Let's revisit if and when this becomes a problem.
	 *
	 * This test is in place to confirm this behavior, while incorrect, is well-defined.
	 *
	 * @ticket 56299
	 *
	 * @covers remove_attribute
	 * @covers get_updated_html
	 */
	public function test_remove_first_when_duplicated_attribute() {
		$p = new WP_HTML_Tag_Processor( '<div id="update-me" id="ignored-id"><span id="second">Text</span></div>' );
		$p->next_tag();
		$p->remove_attribute( 'id' );
		$this->assertSame( '<div  id="ignored-id"><span id="second">Text</span></div>', $p->get_updated_html() );
	}

	/**
	 * @ticket 56299
	 *
	 * @covers remove_attribute
	 * @covers get_updated_html
	 */
	public function test_remove_attribute_with_an_existing_attribute_name_removes_it_from_the_markup() {
		$p = new WP_HTML_Tag_Processor( self::HTML_SIMPLE );
		$p->next_tag();
		$p->remove_attribute( 'id' );
		$this->assertSame( '<div ><span id="second">Text</span></div>', $p->get_updated_html() );
	}

	/**
	 * @ticket 56299
	 *
	 * @covers remove_attribute
	 * @covers get_updated_html
	 */
	public function test_remove_attribute_with_a_non_existing_attribute_name_does_not_change_the_markup() {
		$p = new WP_HTML_Tag_Processor( self::HTML_SIMPLE );
		$p->next_tag();
		$p->remove_attribute( 'no-such-attribute' );
		$this->assertSame( self::HTML_SIMPLE, $p->get_updated_html() );
	}

	/**
	 * @ticket 56299
	 *
	 * @covers add_class
	 * @covers get_updated_html
	 */
	public function test_add_class_creates_a_class_attribute_when_there_is_none() {
		$p = new WP_HTML_Tag_Processor( self::HTML_SIMPLE );
		$p->next_tag();
		$p->add_class( 'foo-class' );
		$this->assertSame( '<div class="foo-class" id="first"><span id="second">Text</span></div>', $p->get_updated_html() );
	}

	/**
	 * @ticket 56299
	 *
	 * @covers add_class
	 * @covers get_updated_html
	 */
	public function test_calling_add_class_twice_creates_a_class_attribute_with_both_class_names_when_there_is_no_class_attribute() {
		$p = new WP_HTML_Tag_Processor( self::HTML_SIMPLE );
		$p->next_tag();
		$p->add_class( 'foo-class' );
		$p->add_class( 'bar-class' );
		$this->assertSame( '<div class="foo-class bar-class" id="first"><span id="second">Text</span></div>', $p->get_updated_html() );
	}

	/**
	 * @ticket 56299
	 *
	 * @covers remove_class
	 * @covers get_updated_html
	 */
	public function test_remove_class_does_not_change_the_markup_when_there_is_no_class_attribute() {
		$p = new WP_HTML_Tag_Processor( self::HTML_SIMPLE );
		$p->next_tag();
		$p->remove_class( 'foo-class' );
		$this->assertSame( self::HTML_SIMPLE, $p->get_updated_html() );
	}

	/**
	 * @ticket 56299
	 *
	 * @covers add_class
	 * @covers get_updated_html
	 */
	public function test_add_class_appends_class_names_to_the_existing_class_attribute_when_one_already_exists() {
		$p = new WP_HTML_Tag_Processor( self::HTML_WITH_CLASSES );
		$p->next_tag();
		$p->add_class( 'foo-class' );
		$p->add_class( 'bar-class' );
		$this->assertSame(
			'<div class="main with-border foo-class bar-class" id="first"><span class="not-main bold with-border" id="second">Text</span></div>',
			$p->get_updated_html()
		);
	}

	/**
	 * @ticket 56299
	 *
	 * @covers remove_class
	 * @covers get_updated_html
	 */
	public function test_remove_class_removes_a_single_class_from_the_class_attribute_when_one_exists() {
		$p = new WP_HTML_Tag_Processor( self::HTML_WITH_CLASSES );
		$p->next_tag();
		$p->remove_class( 'main' );
		$this->assertSame(
			'<div class=" with-border" id="first"><span class="not-main bold with-border" id="second">Text</span></div>',
			$p->get_updated_html()
		);
	}

	/**
	 * @ticket 56299
	 *
	 * @covers remove_class
	 * @covers get_updated_html
	 */
	public function test_calling_remove_class_with_all_listed_class_names_removes_the_existing_class_attribute_from_the_markup() {
		$p = new WP_HTML_Tag_Processor( self::HTML_WITH_CLASSES );
		$p->next_tag();
		$p->remove_class( 'main' );
		$p->remove_class( 'with-border' );
		$this->assertSame(
			'<div  id="first"><span class="not-main bold with-border" id="second">Text</span></div>',
			$p->get_updated_html()
		);
	}

	/**
	 * @ticket 56299
	 *
	 * @covers add_class
	 * @covers get_updated_html
	 */
	public function test_add_class_does_not_add_duplicate_class_names() {
		$p = new WP_HTML_Tag_Processor( self::HTML_WITH_CLASSES );
		$p->next_tag();
		$p->add_class( 'with-border' );
		$this->assertSame(
			'<div class="main with-border" id="first"><span class="not-main bold with-border" id="second">Text</span></div>',
			$p->get_updated_html()
		);
	}

	/**
	 * @ticket 56299
	 *
	 * @covers add_class
	 * @covers get_updated_html
	 */
	public function test_add_class_preserves_class_name_order_when_a_duplicate_class_name_is_added() {
		$p = new WP_HTML_Tag_Processor( self::HTML_WITH_CLASSES );
		$p->next_tag();
		$p->add_class( 'main' );
		$this->assertSame(
			'<div class="main with-border" id="first"><span class="not-main bold with-border" id="second">Text</span></div>',
			$p->get_updated_html()
		);
	}

	/**
	 * @ticket 56299
	 *
	 * @covers add_class
	 * @covers get_updated_html
	 */
	public function test_add_class_when_there_is_a_class_attribute_with_excessive_whitespaces() {
		$p = new WP_HTML_Tag_Processor(
			'<div class="   main   with-border   " id="first"><span class="not-main bold with-border" id="second">Text</span></div>'
		);
		$p->next_tag();
		$p->add_class( 'foo-class' );
		$this->assertSame(
			'<div class="   main   with-border foo-class" id="first"><span class="not-main bold with-border" id="second">Text</span></div>',
			$p->get_updated_html()
		);
	}

	/**
	 * @ticket 56299
	 *
	 * @covers remove_class
	 * @covers get_updated_html
	 */
	public function test_remove_class_preserves_whitespaces_when_there_is_a_class_attribute_with_excessive_whitespaces() {
		$p = new WP_HTML_Tag_Processor(
			'<div class="   main   with-border   " id="first"><span class="not-main bold with-border" id="second">Text</span></div>'
		);
		$p->next_tag();
		$p->remove_class( 'with-border' );
		$this->assertSame(
			'<div class="   main" id="first"><span class="not-main bold with-border" id="second">Text</span></div>',
			$p->get_updated_html()
		);
	}

	/**
	 * @ticket 56299
	 *
	 * @covers remove_class
	 * @covers get_updated_html
	 */
	public function test_removing_all_classes_removes_the_existing_class_attribute_from_the_markup_even_when_excessive_whitespaces_are_present() {
		$p = new WP_HTML_Tag_Processor(
			'<div class="   main   with-border   " id="first"><span class="not-main bold with-border" id="second">Text</span></div>'
		);
		$p->next_tag();
		$p->remove_class( 'main' );
		$p->remove_class( 'with-border' );
		$this->assertSame(
			'<div  id="first"><span class="not-main bold with-border" id="second">Text</span></div>',
			$p->get_updated_html()
		);
	}

	/**
	 * When both set_attribute('class', $value) and add_class( $different_value ) are called,
	 * the final class name should be $value. In other words, the `add_class` call should be ignored,
	 * and the `set_attribute` call should win. This holds regardless of the order in which these methods
	 * are called.
	 *
	 * @ticket 56299
	 *
	 * @covers add_class
	 * @covers set_attribute
	 * @covers get_updated_html
	 */
	public function test_set_attribute_takes_priority_over_add_class() {
		$p = new WP_HTML_Tag_Processor( self::HTML_WITH_CLASSES );
		$p->next_tag();
		$p->add_class( 'add_class' );
		$p->set_attribute( 'class', 'set_attribute' );
		$this->assertSame(
			'<div class="set_attribute" id="first"><span class="not-main bold with-border" id="second">Text</span></div>',
			$p->get_updated_html(),
			'Calling get_updated_html after updating first tag\'s attributes did not return the expected HTML'
		);

		$p = new WP_HTML_Tag_Processor( self::HTML_WITH_CLASSES );
		$p->next_tag();
		$p->set_attribute( 'class', 'set_attribute' );
		$p->add_class( 'add_class' );
		$this->assertSame(
			'<div class="set_attribute" id="first"><span class="not-main bold with-border" id="second">Text</span></div>',
			$p->get_updated_html(),
			'Calling get_updated_html after updating second tag\'s attributes did not return the expected HTML'
		);
	}

	/**
	 * @ticket 56299
	 *
	 * @covers set_attribute
	 * @covers remove_attribute
	 * @covers add_class
	 * @covers remove_class
	 * @covers get_updated_html
	 */
	public function test_advanced_use_case() {
		$input = <<<HTML
<div selected class="merge-message" checked>
	<div class="select-menu d-inline-block">
		<div checked class="BtnGroup MixedCaseHTML position-relative" />
		<div checked class="BtnGroup MixedCaseHTML position-relative">
			<button type="button" class="merge-box-button btn-group-merge rounded-left-2 btn  BtnGroup-item js-details-target hx_create-pr-button" aria-expanded="false" data-details-container=".js-merge-pr" disabled="">
			  Merge pull request
			</button>

			<button type="button" class="merge-box-button btn-group-squash rounded-left-2 btn  BtnGroup-item js-details-target hx_create-pr-button" aria-expanded="false" data-details-container=".js-merge-pr" disabled="">
			  Squash and merge
			</button>

			<button type="button" class="merge-box-button btn-group-rebase rounded-left-2 btn  BtnGroup-item js-details-target hx_create-pr-button" aria-expanded="false" data-details-container=".js-merge-pr" disabled="">
			  Rebase and merge
			</button>

			<button aria-label="Select merge method" disabled="disabled" type="button" data-view-component="true" class="select-menu-button btn BtnGroup-item"></button>
		</div>
	</div>
</div>
HTML;

		$expected_output = <<<HTML
<div data-details="{ &quot;key&quot;: &quot;value&quot; }" selected class="merge-message is-processed" checked>
	<div class="select-menu d-inline-block">
		<div checked class=" MixedCaseHTML position-relative button-group Another-Mixed-Case" />
		<div checked class=" MixedCaseHTML position-relative button-group Another-Mixed-Case">
			<button type="button" class="merge-box-button btn-group-merge rounded-left-2 btn  BtnGroup-item js-details-target hx_create-pr-button" aria-expanded="false" data-details-container=".js-merge-pr" disabled="">
			  Merge pull request
			</button>

			<button type="button" class="merge-box-button btn-group-squash rounded-left-2 btn  BtnGroup-item js-details-target hx_create-pr-button" aria-expanded="false" data-details-container=".js-merge-pr" disabled="">
			  Squash and merge
			</button>

			<button type="button"  aria-expanded="false" data-details-container=".js-merge-pr" disabled="">
			  Rebase and merge
			</button>

			<button aria-label="Select merge method" disabled="disabled" type="button" data-view-component="true" class="select-menu-button btn BtnGroup-item"></button>
		</div>
	</div>
</div>
HTML;

		$p = new WP_HTML_Tag_Processor( $input );
		$this->assertTrue( $p->next_tag( 'div' ), 'Querying an existing tag did not return true' );
		$p->set_attribute( 'data-details', '{ "key": "value" }' );
		$p->add_class( 'is-processed' );
		$this->assertTrue(
			$p->next_tag(
				array(
					'tag_name'   => 'div',
					'class_name' => 'BtnGroup',
				)
			),
			'Querying an existing tag did not return true'
		);
		$p->remove_class( 'BtnGroup' );
		$p->add_class( 'button-group' );
		$p->add_class( 'Another-Mixed-Case' );
		$this->assertTrue(
			$p->next_tag(
				array(
					'tag_name'   => 'div',
					'class_name' => 'BtnGroup',
				)
			),
			'Querying an existing tag did not return true'
		);
		$p->remove_class( 'BtnGroup' );
		$p->add_class( 'button-group' );
		$p->add_class( 'Another-Mixed-Case' );
		$this->assertTrue(
			$p->next_tag(
				array(
					'tag_name'     => 'button',
					'class_name'   => 'btn',
					'match_offset' => 3,
				)
			),
			'Querying an existing tag did not return true'
		);
		$p->remove_attribute( 'class' );
		$this->assertFalse( $p->next_tag( 'non-existent' ), 'Querying a non-existing tag did not return false' );
		$p->set_attribute( 'class', 'test' );
		$this->assertSame( $expected_output, $p->get_updated_html(), 'Calling get_updated_html after updating the attributes did not return the expected HTML' );
	}

	/**
	 * @ticket 56299
	 *
	 * @covers remove_attribute
	 * @covers set_attribute
	 * @covers get_updated_html
	 */
	public function test_correctly_parses_html_attributes_wrapped_in_single_quotation_marks() {
		$p = new WP_HTML_Tag_Processor(
			'<div id=\'first\'><span id=\'second\'>Text</span></div>'
		);
		$p->next_tag(
			array(
				'tag_name' => 'div',
				'id'       => 'first',
			)
		);
		$p->remove_attribute( 'id' );
		$p->next_tag(
			array(
				'tag_name' => 'span',
				'id'       => 'second',
			)
		);
		$p->set_attribute( 'id', 'single-quote' );
		$this->assertSame(
			'<div ><span id="single-quote">Text</span></div>',
			$p->get_updated_html()
		);
	}

	/**
	 * @ticket 56299
	 *
	 * @covers set_attribute
	 * @covers get_updated_html
	 */
	public function test_set_attribute_with_value_equals_to_true_adds_a_boolean_html_attribute_with_implicit_value() {
		$p = new WP_HTML_Tag_Processor(
			'<form action="/action_page.php"><input type="checkbox" name="vehicle" value="Bike"><label for="vehicle">I have a bike</label></form>'
		);
		$p->next_tag( 'input' );
		$p->set_attribute( 'checked', true );
		$this->assertSame(
			'<form action="/action_page.php"><input checked type="checkbox" name="vehicle" value="Bike"><label for="vehicle">I have a bike</label></form>',
			$p->get_updated_html()
		);
	}

	/**
	 * @ticket 56299
	 *
	 * @covers set_attribute
	 * @covers get_updated_html
	 */
	public function test_setting_a_boolean_attribute_to_false_removes_it_from_the_markup() {
		$p = new WP_HTML_Tag_Processor(
			'<form action="/action_page.php"><input checked type="checkbox" name="vehicle" value="Bike"><label for="vehicle">I have a bike</label></form>'
		);
		$p->next_tag( 'input' );
		$p->set_attribute( 'checked', false );
		$this->assertSame(
			'<form action="/action_page.php"><input  type="checkbox" name="vehicle" value="Bike"><label for="vehicle">I have a bike</label></form>',
			$p->get_updated_html()
		);
	}

	/**
	 * @ticket 56299
	 *
	 * @covers set_attribute
	 * @covers get_updated_html
	 */
	public function test_setting_a_missing_attribute_to_false_does_not_change_the_markup() {
		$html_input = '<form action="/action_page.php"><input type="checkbox" name="vehicle" value="Bike"><label for="vehicle">I have a bike</label></form>';
		$p          = new WP_HTML_Tag_Processor( $html_input );
		$p->next_tag( 'input' );
		$p->set_attribute( 'checked', false );
		$this->assertSame( $html_input, $p->get_updated_html() );
	}

	/**
	 * @ticket 56299
	 *
	 * @covers set_attribute
	 * @covers get_updated_html
	 */
	public function test_setting_a_boolean_attribute_to_a_string_value_adds_explicit_value_to_the_markup() {
		$p = new WP_HTML_Tag_Processor(
			'<form action="/action_page.php"><input checked type="checkbox" name="vehicle" value="Bike"><label for="vehicle">I have a bike</label></form>'
		);
		$p->next_tag( 'input' );
		$p->set_attribute( 'checked', 'checked' );
		$this->assertSame(
			'<form action="/action_page.php"><input checked="checked" type="checkbox" name="vehicle" value="Bike"><label for="vehicle">I have a bike</label></form>',
			$p->get_updated_html()
		);
	}

	/**
	 * @ticket 56299
	 *
	 * @covers get_tag
	 * @covers next_tag
	 */
	public function test_unclosed_script_tag_should_not_cause_an_infinite_loop() {
		$p = new WP_HTML_Tag_Processor( '<script>' );
		$p->next_tag();
		$this->assertSame( 'SCRIPT', $p->get_tag() );
		$p->next_tag();
	}

	/**
	 * @ticket 56299
	 *
	 * @covers next_tag
	 *
	 * @dataProvider data_script_state
	 */
	public function test_next_tag_ignores_the_contents_of_a_script_tag( $script_then_div ) {
		$p = new WP_HTML_Tag_Processor( $script_then_div );
		$p->next_tag();
		$this->assertSame( 'SCRIPT', $p->get_tag(), 'The first found tag was not "script"' );
		$p->next_tag();
		$this->assertSame( 'DIV', $p->get_tag(), 'The second found tag was not "div"' );
	}

	/**
	 * Data provider for test_ignores_contents_of_a_script_tag().
	 *
	 * @return array {
	 *     @type array {
	 *         @type string $script_then_div The HTML snippet containing script and div tags.
	 *     }
	 * }
	 */
	public function data_script_state() {
		$examples = array();

		$examples['Simple script tag'] = array(
			'<script><span class="d-none d-md-inline">Back to notifications</span></script><div></div>',
		);

		$examples['Simple uppercase script tag'] = array(
			'<script><span class="d-none d-md-inline">Back to notifications</span></SCRIPT><div></div>',
		);

		$examples['Script with a comment opener inside should end at the next script tag closer (dash dash escaped state)'] = array(
			'<script class="d-md-none"><!--</script><div></div>-->',
		);

		$examples['Script with a comment opener and a script tag opener inside should end two script tag closer later (double escaped state)'] = array(
			'<script class="d-md-none"><!--<script><span1></script><span2></span2></script><div></div>-->',
		);

		$examples['Double escaped script with a tricky opener'] = array(
			'<script class="d-md-none"><!--<script attr="</script>"></script>"><div></div>',
		);

		$examples['Double escaped script with a tricky closer'] = array(
			'<script class="d-md-none"><!--<script><span></script attr="</script>"><div></div>',
		);

		$examples['Double escaped, then escaped, then double escaped'] = array(
			'<script class="d-md-none"><!--<script></script><script></script><span></span></script><div></div>',
		);

		$examples['Script with a commented a script tag opener inside should at the next tag closer (dash dash escaped state)'] = array(
			'<script class="d-md-none"><!--<script>--><span></script><div></div>-->',
		);

		$examples['Script closer with another script tag in closer attributes'] = array(
			'<script><span class="d-none d-md-inline">Back to notifications</title</span></script <script><div></div>',
		);

		$examples['Script closer with attributes'] = array(
			'<script class="d-md-none"><span class="d-none d-md-inline">Back to notifications</span></script id="test"><div></div>',
		);

		$examples['Script opener with title closer inside'] = array(
			'<script class="d-md-none"></title></script><div></div>',
		);

		$examples['Complex script with many parsing states'] = array(
			'<script class="d-md-none"><!--<script>--><scRipt><span><!--<span><Script</script>--></scripT><div></div>-->',
		);
		return $examples;
	}

	/**
	 * @ticket 56299
	 *
	 * @covers next_tag
	 *
	 * @dataProvider data_rcdata_state
	 */
	public function test_next_tag_ignores_the_contents_of_a_rcdata_tag( $rcdata_then_div, $rcdata_tag ) {
		$p = new WP_HTML_Tag_Processor( $rcdata_then_div );
		$p->next_tag();
		$this->assertSame( strtoupper( $rcdata_tag ), $p->get_tag(), "The first found tag was not '$rcdata_tag'" );
		$p->next_tag();
		$this->assertSame( 'DIV', $p->get_tag(), "The second found tag was not 'div'" );
	}

	/**
	 * Data provider for test_ignores_contents_of_a_rcdata_tag().
	 *
	 * @return array {
	 *     @type array {
	 *         @type string $rcdata_then_div The HTML snippet containing RCDATA and div tags.
	 *         @type string $rcdata_tag      The RCDATA tag.
	 *     }
	 * }
	 */
	public function data_rcdata_state() {
		$examples                    = array();
		$examples['Simple textarea'] = array(
			'<textarea><span class="d-none d-md-inline">Back to notifications</span></textarea><div></div>',
			'TEXTAREA',
		);

		$examples['Simple title'] = array(
			'<title><span class="d-none d-md-inline">Back to notifications</title</span></title><div></div>',
			'TITLE',
		);

		$examples['Comment opener inside a textarea tag should be ignored'] = array(
			'<textarea class="d-md-none"><!--</textarea><div></div>-->',
			'TEXTAREA',
		);

		$examples['Textarea closer with another textarea tag in closer attributes'] = array(
			'<textarea><span class="d-none d-md-inline">Back to notifications</title</span></textarea <textarea><div></div>',
			'TEXTAREA',
		);

		$examples['Textarea closer with attributes'] = array(
			'<textarea class="d-md-none"><span class="d-none d-md-inline">Back to notifications</span></textarea id="test"><div></div>',
			'TEXTAREA',
		);

		$examples['Textarea opener with title closer inside'] = array(
			'<textarea class="d-md-none"></title></textarea><div></div>',
			'TEXTAREA',
		);
		return $examples;
	}

	/**
	 * @ticket 56299
	 *
	 * @covers next_tag
	 * @covers set_attribute
	 * @covers get_updated_html
	 */
	public function test_can_query_and_update_wrongly_nested_tags() {
		$p = new WP_HTML_Tag_Processor(
			'<span>123<p>456</span>789</p>'
		);
		$p->next_tag( 'span' );
		$p->set_attribute( 'class', 'span-class' );
		$p->next_tag( 'p' );
		$p->set_attribute( 'class', 'p-class' );
		$this->assertSame(
			'<span class="span-class">123<p class="p-class">456</span>789</p>',
			$p->get_updated_html()
		);
	}

	/**
	 * @ticket 56299
	 *
	 * @covers next_tag
	 * @covers remove_attribute
	 * @covers get_updated_html
	 */
	public function test_removing_attributes_works_even_in_malformed_html() {
		$p = new WP_HTML_Tag_Processor( self::HTML_MALFORMED );
		$p->next_tag( 'span' );
		$p->remove_attribute( 'Notifications<' );
		$this->assertSame(
			'<div><span class="d-md-none" /span><span class="d-none d-md-inline">Back to notifications</span></div>',
			$p->get_updated_html()
		);
	}

	/**
	 * @ticket 56299
	 *
	 * @covers next_Tag
	 * @covers set_attribute
	 * @covers get_updated_html
	 */
	public function test_updating_attributes_works_even_in_malformed_html_1() {
		$p = new WP_HTML_Tag_Processor( self::HTML_MALFORMED );
		$p->next_tag( 'span' );
		$p->set_attribute( 'id', 'first' );
		$p->next_tag( 'span' );
		$p->set_attribute( 'id', 'second' );
		$this->assertSame(
			'<div><span id="first" class="d-md-none" Notifications</span><span id="second" class="d-none d-md-inline">Back to notifications</span></div>',
			$p->get_updated_html()
		);
	}

	/**
	 * @ticket 56299
	 *
	 * @covers next_tag
	 * @covers set_attribute
	 * @covers add_class
	 * @covers get_updated_html
	 *
	 * @dataProvider data_malformed_tag
	 */
	public function test_updating_attributes_works_even_in_malformed_html_2( $html_input, $html_expected ) {
		$p = new WP_HTML_Tag_Processor( $html_input );
		$p->next_tag();
		$p->set_attribute( 'foo', 'bar' );
		$p->add_class( 'firstTag' );
		$p->next_tag();
		$p->add_class( 'secondTag' );
		$this->assertSame(
			$html_expected,
			$p->get_updated_html()
		);
	}

	/**
	 * Data provider for test_updates_when_malformed_tag().
	 *
	 * @return array {
	 *     @type array {
	 *         @type string $html_input    The input HTML snippet.
	 *         @type string $html_expected The expected HTML snippet after processing.
	 *     }
	 * }
	 */
	public function data_malformed_tag() {
		$null_byte = chr( 0 );
		$examples  = array();
		$examples['Invalid entity inside attribute value'] = array(
			'<img src="https://s0.wp.com/i/atat.png" title="&; First &lt;title&gt; is &notit;" TITLE="second title" title="An Imperial &imperial; AT-AT"><span>test</span>',
			'<img class="firstTag" foo="bar" src="https://s0.wp.com/i/atat.png" title="&; First &lt;title&gt; is &notit;" TITLE="second title" title="An Imperial &imperial; AT-AT"><span class="secondTag">test</span>',
		);

		$examples['HTML tag opening inside attribute value'] = array(
			'<pre id="<code" class="wp-block-code <code is poetry&gt;"><code>This &lt;is> a &lt;strong is="true">thing.</code></pre><span>test</span>',
			'<pre foo="bar" id="<code" class="wp-block-code &lt;code is poetry&gt; firstTag"><code class="secondTag">This &lt;is> a &lt;strong is="true">thing.</code></pre><span>test</span>',
		);

		$examples['HTML tag brackets in attribute values and data markup'] = array(
			'<pre id="<code-&gt;-block-&gt;" class="wp-block-code <code is poetry&gt;"><code>This &lt;is> a &lt;strong is="true">thing.</code></pre><span>test</span>',
			'<pre foo="bar" id="<code-&gt;-block-&gt;" class="wp-block-code &lt;code is poetry&gt; firstTag"><code class="secondTag">This &lt;is> a &lt;strong is="true">thing.</code></pre><span>test</span>',
		);

		$examples['Single and double quotes in attribute value'] = array(
			'<p title="Demonstrating how to use single quote (\') and double quote (&quot;)"><span>test</span>',
			'<p class="firstTag" foo="bar" title="Demonstrating how to use single quote (\') and double quote (&quot;)"><span class="secondTag">test</span>',
		);

		$examples['Unquoted attribute values'] = array(
			'<hr a=1 a=2 a=3 a=5 /><span>test</span>',
			'<hr class="firstTag" foo="bar" a=1 a=2 a=3 a=5 /><span class="secondTag">test</span>',
		);

		$examples['Double-quotes escaped in double-quote attribute value'] = array(
			'<hr title="This is a &quot;double-quote&quot;"><span>test</span>',
			'<hr class="firstTag" foo="bar" title="This is a &quot;double-quote&quot;"><span class="secondTag">test</span>',
		);

		$examples['Unquoted attribute value'] = array(
			'<hr id=code><span>test</span>',
			'<hr class="firstTag" foo="bar" id=code><span class="secondTag">test</span>',
		);

		$examples['Unquoted attribute value with tag-like value'] = array(
			'<hr id= 	<code> ><span>test</span>',
			'<hr class="firstTag" foo="bar" id= 	<code> ><span class="secondTag">test</span>',
		);

		$examples['Unquoted attribute value with tag-like value followed by tag-like data'] = array(
			'<hr id=code>><span>test</span>',
			'<hr class="firstTag" foo="bar" id=code>><span class="secondTag">test</span>',
		);

		$examples['1'] = array(
			'<hr id=&quo;code><span>test</span>',
			'<hr class="firstTag" foo="bar" id=&quo;code><span class="secondTag">test</span>',
		);

		$examples['2'] = array(
			'<hr id/test=5><span>test</span>',
			'<hr class="firstTag" foo="bar" id/test=5><span class="secondTag">test</span>',
		);

		$examples['4'] = array(
			'<hr title="<hr>"><span>test</span>',
			'<hr class="firstTag" foo="bar" title="<hr>"><span class="secondTag">test</span>',
		);

		$examples['5'] = array(
			'<hr id=>code><span>test</span>',
			'<hr class="firstTag" foo="bar" id=>code><span class="secondTag">test</span>',
		);

		$examples['6'] = array(
			'<hr id"quo="test"><span>test</span>',
			'<hr class="firstTag" foo="bar" id"quo="test"><span class="secondTag">test</span>',
		);

		$examples['7'] = array(
			'<hr id' . $null_byte . 'zero="test"><span>test</span>',
			'<hr class="firstTag" foo="bar" id' . $null_byte . 'zero="test"><span class="secondTag">test</span>',
		);

		$examples['8'] = array(
			'<hr >id="test"><span>test</span>',
			'<hr class="firstTag" foo="bar" >id="test"><span class="secondTag">test</span>',
		);

		$examples['9'] = array(
			'<hr =id="test"><span>test</span>',
			'<hr class="firstTag" foo="bar" =id="test"><span class="secondTag">test</span>',
		);

		$examples['10'] = array(
			'</><span>test</span>',
			'</><span class="firstTag" foo="bar">test</span>',
		);

		$examples['11'] = array(
			'The applicative operator <* works well in Haskell; <data-tag> is what?<span>test</span>',
			'The applicative operator <* works well in Haskell; <data-tag class="firstTag" foo="bar"> is what?<span class="secondTag">test</span>',
		);

		$examples['12'] = array(
			'<3 is a heart but <t3> is a tag.<span>test</span>',
			'<3 is a heart but <t3 class="firstTag" foo="bar"> is a tag.<span class="secondTag">test</span>',
		);

		$examples['13'] = array(
			'<?comment --><span>test</span>',
			'<?comment --><span class="firstTag" foo="bar">test</span>',
		);

		$examples['14'] = array(
			'<!-- this is a comment. no <strong>tags</strong> allowed --><span>test</span>',
			'<!-- this is a comment. no <strong>tags</strong> allowed --><span class="firstTag" foo="bar">test</span>',
		);

		$examples['15'] = array(
			'<![CDATA[This <is> a <strong id="yes">HTML Tag</strong>]]><span>test</span>',
			'<![CDATA[This <is> a <strong id="yes">HTML Tag</strong>]]><span class="firstTag" foo="bar">test</span>',
		);

		$examples['16'] = array(
			'<hr ===name="value"><span>test</span>',
			'<hr class="firstTag" foo="bar" ===name="value"><span class="secondTag">test</span>',
		);

		$examples['17'] = array(
			'<hr asdf="test"><span>test</span>',
			'<hr class="firstTag" foo="bar" asdf="test"><span class="secondTag">test</span>',
		);

		$examples['18'] = array(
			'<hr =asdf="tes"><span>test</span>',
			'<hr class="firstTag" foo="bar" =asdf="tes"><span class="secondTag">test</span>',
		);

		$examples['19'] = array(
			'<hr ==="test"><span>test</span>',
			'<hr class="firstTag" foo="bar" ==="test"><span class="secondTag">test</span>',
		);

		$examples['20'] = array(
			'<hr =><span>test</span>',
			'<hr class="firstTag" foo="bar" =><span class="secondTag">test</span>',
		);

		$examples['21'] = array(
			'<hr =5><span>test</span>',
			'<hr class="firstTag" foo="bar" =5><span class="secondTag">test</span>',
		);

		$examples['22'] = array(
			'<hr ==><span>test</span>',
			'<hr class="firstTag" foo="bar" ==><span class="secondTag">test</span>',
		);

		$examples['23'] = array(
			'<hr ===><span>test</span>',
			'<hr class="firstTag" foo="bar" ===><span class="secondTag">test</span>',
		);

		$examples['24'] = array(
			'<hr disabled><span>test</span>',
			'<hr class="firstTag" foo="bar" disabled><span class="secondTag">test</span>',
		);

		$examples['25'] = array(
			'<hr a"sdf="test"><span>test</span>',
			'<hr class="firstTag" foo="bar" a"sdf="test"><span class="secondTag">test</span>',
		);

		$examples['Multiple unclosed tags treated as a single tag'] = array(
			<<<HTML
			<hr id=">"code
			<hr id="value>"code
			<hr id="/>"code
			<hr id="value/>"code
			/>
			<span>test</span>
HTML
			,
			<<<HTML
			<hr class="firstTag" foo="bar" id=">"code
			<hr id="value>"code
			<hr id="/>"code
			<hr id="value/>"code
			/>
			<span class="secondTag">test</span>
HTML
		,
		);

		$examples['27'] = array(
			'<hr id   =5><span>test</span>',
			'<hr class="firstTag" foo="bar" id   =5><span class="secondTag">test</span>',
		);

		$examples['28'] = array(
			'<hr id a  =5><span>test</span>',
			'<hr class="firstTag" foo="bar" id a  =5><span class="secondTag">test</span>',
		);

		return $examples;
	}
}
