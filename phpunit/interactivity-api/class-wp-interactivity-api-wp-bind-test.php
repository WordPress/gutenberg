<?php
/**
 * Unit tests covering the data_wp_bind_processor functionality of the
 * WP_Interactivity_API class.
 *
 * @package WordPress
 * @subpackage Interactivity API
 *
 * @group interactivity-api
 */
class Tests_WP_Interactivity_API_WP_Bind extends WP_UnitTestCase {
	/**
	 * Instance of WP_Interactivity_API.
	 *
	 * @var WP_Interactivity_API
	 */
	protected $interactivity;

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();
		$this->interactivity = new WP_Interactivity_API();
		$this->interactivity->state(
			'myPlugin',
			array(
				'id'          => 'some-id',
				'width'       => 100,
				'isOpen'      => false,
				'null'        => null,
				'trueString'  => 'true',
				'falseString' => 'false',
			)
		);
	}

	/**
	 * Invokes the `process_directives` method of WP_Interactivity_API class.
	 *
	 * @param string $html The HTML that needs to be processed.
	 * @return array An array containing an instance of the WP_HTML_Tag_Processor and the processed HTML.
	 */
	private function process_directives( $html ) {
		$new_html = $this->interactivity->process_directives( $html );
		$p        = new WP_HTML_Tag_Processor( $new_html );
		$p->next_tag();
		return array( $p, $new_html );
	}

	/**
	 * Tests setting an attribute via `data-wp-bind`.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_bind_sets_attribute() {
		$html    = '<div data-wp-bind--id="myPlugin::state.id">Text</div>';
		list($p) = $this->process_directives( $html );
		$this->assertEquals( 'some-id', $p->get_attribute( 'id' ) );
	}

	/**
	 * Tests replacing an existing attribute via `data-wp-bind`.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_bind_replaces_attribute() {
		$html    = '<div id="other-id" data-wp-bind--id="myPlugin::state.id">Text</div>';
		list($p) = $this->process_directives( $html );
		$this->assertEquals( 'some-id', $p->get_attribute( 'id' ) );
	}

	/**
	 * Tests setting a numerical value as an attribute via `data-wp-bind`.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_bind_sets_number_value() {
		$html    = '<img data-wp-bind--width="myPlugin::state.width">';
		list($p) = $this->process_directives( $html );
		$this->assertEquals( '100', $p->get_attribute( 'width' ) );
	}

	/**
	 * Tests that true strings are set properly as attribute values.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_bind_sets_true_string() {
		$html               = '<div data-wp-bind--id="myPlugin::state.trueString">Text</div>';
		list($p, $new_html) = $this->process_directives( $html );
		$this->assertEquals( 'true', $p->get_attribute( 'id' ) );
		$this->assertEquals( '<div id="true" data-wp-bind--id="myPlugin::state.trueString">Text</div>', $new_html );
	}

	/**
	 * Tests that false strings are set properly as attribute values.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_bind_sets_false_string() {
		$html               = '<div data-wp-bind--id="myPlugin::state.falseString">Text</div>';
		list($p, $new_html) = $this->process_directives( $html );
		$this->assertEquals( 'false', $p->get_attribute( 'id' ) );
		$this->assertEquals( '<div id="false" data-wp-bind--id="myPlugin::state.falseString">Text</div>', $new_html );
	}

	/**
	 * Tests that `data-wp-bind` ignores directives with no suffix.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_bind_ignores_empty_bound_attribute() {
		$html     = '<div data-wp-bind="myPlugin::state.id">Text</div>';
		$new_html = $this->interactivity->process_directives( $html );
		$this->assertEquals( $html, $new_html );
	}

	/**
	 * Tests that `data-wp-bind` does nothing when referencing non-existent
	 * references.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_bind_doesnt_do_anything_on_non_existent_references() {
		$html     = '<div data-wp-bind--id="myPlugin::state.nonExistengKey">Text</div>';
		$new_html = $this->interactivity->process_directives( $html );
		$this->assertEquals( $html, $new_html );
	}

	/**
	 * Tests that `data-wp-bind` ignores directives with empty values.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_bind_ignores_empty_value() {
		$html     = '<div data-wp-bind--id="">Text</div>';
		$new_html = $this->interactivity->process_directives( $html );
		$this->assertEquals( $html, $new_html );
	}

	/**
	 * Tests that `data-wp-bind` ignores directives without values.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_bind_ignores_without_value() {
		$html     = '<div data-wp-bind--id>Text</div>';
		$new_html = $this->interactivity->process_directives( $html );
		$this->assertEquals( $html, $new_html );
	}

	/**
	 * Tests that `data-wp-bind` works with multiple instances of the same
	 * directive on a tag.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_bind_works_with_multiple_same_directives() {
		$html    = '<div data-wp-bind--id="myPlugin::state.id" data-wp-bind--id="myPlugin::state.id">Text</div>';
		list($p) = $this->process_directives( $html );
		$this->assertEquals( 'some-id', $p->get_attribute( 'id' ) );
	}

	/**
	 * Tests that `data-wp-bind` works with multiple instances of different
	 * directives on a tag.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_bind_works_with_multiple_different_directives() {
		$html    = '<img data-wp-bind--id="myPlugin::state.id" data-wp-bind--width="myPlugin::state.width">';
		list($p) = $this->process_directives( $html );
		$this->assertEquals( 'some-id', $p->get_attribute( 'id' ) );
		$this->assertEquals( '100', $p->get_attribute( 'width' ) );
	}

	/**
	 * Tests adding boolean attributes to a tag using `data-wp-bind`.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_bind_adds_boolean_attribute_if_true() {
		$html               = '<div data-wp-bind--hidden="myPlugin::!state.isOpen">Text</div>';
		list($p, $new_html) = $this->process_directives( $html );
		$this->assertTrue( $p->get_attribute( 'hidden' ) );
		$this->assertEquals( '<div hidden data-wp-bind--hidden="myPlugin::!state.isOpen">Text</div>', $new_html );
	}

	/**
	 * Tests replacing a pre-existing boolean attribute on a tag using
	 * `data-wp-bind`.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_bind_replaces_existing_attribute_if_true() {
		$html               = '<div hidden="true" data-wp-bind--hidden="myPlugin::!state.isOpen">Text</div>';
		list($p, $new_html) = $this->process_directives( $html );
		$this->assertTrue( $p->get_attribute( 'hidden' ) );
		$this->assertEquals( '<div hidden data-wp-bind--hidden="myPlugin::!state.isOpen">Text</div>', $new_html );
	}

	/**
	 * Tests that boolean attributes are not added when bound to false or null
	 * values.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_bind_doesnt_add_boolean_attribute_if_false_or_null() {
		$html               = '<div data-wp-bind--hidden="myPlugin::state.isOpen">Text</div>';
		list($p, $new_html) = $this->process_directives( $html );
		$this->assertNull( $p->get_attribute( 'hidden' ) );
		$this->assertEquals( $html, $new_html );

		$html               = '<div data-wp-bind--hidden="myPlugin::state.null">Text</div>';
		list($p, $new_html) = $this->process_directives( $html );
		$this->assertNull( $p->get_attribute( 'hidden' ) );
		$this->assertEquals( $html, $new_html );
	}

	/**
	 * Tests removing boolean attributes from a tag using `data-wp-bind` and a
	 * false or null value.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_bind_removes_boolean_attribute_if_false_or_null() {
		$html    = '<div hidden data-wp-bind--hidden="myPlugin::state.isOpen">Text</div>';
		list($p) = $this->process_directives( $html );
		$this->assertNull( $p->get_attribute( 'hidden' ) );

		$html    = '<div hidden data-wp-bind--hidden="myPlugin::state.null">Text</div>';
		list($p) = $this->process_directives( $html );
		$this->assertNull( $p->get_attribute( 'hidden' ) );
	}

	/**
	 * Tests adding values to aria or data attributes when the condition evaluates
	 * to true.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_bind_adds_value_if_true_in_aria_or_data_attributes() {
		$html               = '<div data-wp-bind--aria-hidden="myPlugin::!state.isOpen">Text</div>';
		list($p, $new_html) = $this->process_directives( $html );
		$this->assertEquals( 'true', $p->get_attribute( 'aria-hidden' ) );
		$this->assertEquals( '<div aria-hidden="true" data-wp-bind--aria-hidden="myPlugin::!state.isOpen">Text</div>', $new_html );

		$html               = '<div data-wp-bind--data-is-closed="myPlugin::!state.isOpen">Text</div>';
		list($p, $new_html) = $this->process_directives( $html );
		$this->assertEquals( 'true', $p->get_attribute( 'data-is-closed' ) );
		$this->assertEquals( '<div data-is-closed="true" data-wp-bind--data-is-closed="myPlugin::!state.isOpen">Text</div>', $new_html );
	}

	/**
	 * Tests replacing values in aria or data attributes when the condition
	 * evaluates to true.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_bind_replaces_value_if_true_in_aria_or_data_attributes() {
		$html               = '<div aria-hidden="false" data-wp-bind--aria-hidden="myPlugin::!state.isOpen">Text</div>';
		list($p, $new_html) = $this->process_directives( $html );
		$this->assertEquals( 'true', $p->get_attribute( 'aria-hidden' ) );
		$this->assertEquals( '<div aria-hidden="true" data-wp-bind--aria-hidden="myPlugin::!state.isOpen">Text</div>', $new_html );

		$html     = '<div data-is-closed="false" data-wp-bind--data-is-closed="myPlugin::!state.isOpen">Text</div>';
		$new_html = $this->interactivity->process_directives( $html );
		$p        = new WP_HTML_Tag_Processor( $new_html );
		$p->next_tag();
		$this->assertEquals( 'true', $p->get_attribute( 'data-is-closed' ) );
		$this->assertEquals( '<div data-is-closed="true" data-wp-bind--data-is-closed="myPlugin::!state.isOpen">Text</div>', $new_html );
	}

	/**
	 * Tests adding the value 'false' to aria or data attributes when the
	 * condition evaluates to false.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_bind_adds_value_if_false_in_aria_or_data_attributes() {
		$html               = '<div data-wp-bind--aria-hidden="myPlugin::state.isOpen">Text</div>';
		list($p, $new_html) = $this->process_directives( $html );
		$this->assertEquals( 'false', $p->get_attribute( 'aria-hidden' ) );
		$this->assertEquals( '<div aria-hidden="false" data-wp-bind--aria-hidden="myPlugin::state.isOpen">Text</div>', $new_html );

		$html               = '<div data-wp-bind--data-is-closed="myPlugin::state.isOpen">Text</div>';
		list($p, $new_html) = $this->process_directives( $html );
		$this->assertEquals( 'false', $p->get_attribute( 'data-is-closed' ) );
		$this->assertEquals( '<div data-is-closed="false" data-wp-bind--data-is-closed="myPlugin::state.isOpen">Text</div>', $new_html );
	}

	/**
	 * Tests replacing values in aria or data attributes when the condition
	 * evaluates to false.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_bind_replaces_value_if_false_in_aria_or_data_attributes() {
		$html               = '<div aria-hidden="true" data-wp-bind--aria-hidden="myPlugin::state.isOpen">Text</div>';
		list($p, $new_html) = $this->process_directives( $html );
		$this->assertEquals( 'false', $p->get_attribute( 'aria-hidden' ) );
		$this->assertEquals( '<div aria-hidden="false" data-wp-bind--aria-hidden="myPlugin::state.isOpen">Text</div>', $new_html );

		$html               = '<div data-is-closed="true" data-wp-bind--data-is-closed="myPlugin::state.isOpen">Text</div>';
		list($p, $new_html) = $this->process_directives( $html );
		$this->assertEquals( 'false', $p->get_attribute( 'data-is-closed' ) );
		$this->assertEquals( '<div data-is-closed="false" data-wp-bind--data-is-closed="myPlugin::state.isOpen">Text</div>', $new_html );
	}

	/**
	 * Tests removing values from aria or data attributes when the value is null.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_bind_removes_value_if_null_in_aria_or_data_attributes() {
		$html    = '<div aria-hidden="true" data-wp-bind--aria-hidden="myPlugin::state.null">Text</div>';
		list($p) = $this->process_directives( $html );
		$this->assertNull( $p->get_attribute( 'aria-hidden' ) );

		$html    = '<div data-is-closed="true" data-wp-bind--data-is-closed="myPlugin::state.null">Text</div>';
		list($p) = $this->process_directives( $html );
		$this->assertNull( $p->get_attribute( 'data-is-closed' ) );
	}

	/**
	 * Tests handling of bindings within nested tags.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_bind_handles_nested_bindings() {
		$html    = '<div data-wp-bind--id="myPlugin::state.id"><img data-wp-bind--width="myPlugin::state.width"></div>';
		list($p) = $this->process_directives( $html );
		$this->assertEquals( 'some-id', $p->get_attribute( 'id' ) );
		$p->next_tag();
		$this->assertEquals( '100', $p->get_attribute( 'width' ) );
	}
}
