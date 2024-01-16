<?php
/**
 * Unit tests covering the data_wp_class_processor functionality of the
 * WP_Interactivity_API class.
 *
 * @package WordPress
 * @subpackage Interactivity API
 *
 * @group interactivity-api
 */
class Tests_WP_Interactivity_API_WP_Class extends WP_UnitTestCase {
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
				'true'  => true,
				'false' => false,
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
	 * Tests that `data-wp-class` adds a class when the condition is true.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_class_sets_class_name() {
		$html    = '<div data-wp-class--some-class="myPlugin::state.true">Text</div>';
		list($p) = $this->process_directives( $html );
		$this->assertEquals( 'some-class', $p->get_attribute( 'class' ) );
	}

	/**
	 * Tests that `data-wp-class` can add multiple classes based on true
	 * conditions.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_class_sets_multiple_class_names() {
		$html    = '
			<div
				data-wp-class--some-class="myPlugin::state.true"
				data-wp-class--other-class="myPlugin::state.true"
			>Text</div>';
		list($p) = $this->process_directives( $html );
		$this->assertEquals( 'some-class other-class', $p->get_attribute( 'class' ) );
	}

	/**
	 * Tests handling of adding one and not adding another class based on
	 * different boolean values.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_class_handles_multiple_class_names_with_different_values() {
		$html    = '
			<div
				data-wp-class--some-class="myPlugin::state.true"
				data-wp-class--other-class="myPlugin::state.false"
			>Text</div>';
		list($p) = $this->process_directives( $html );
		$this->assertEquals( 'some-class', $p->get_attribute( 'class' ) );

		$html    = '
			<div
				class="other-class"
				data-wp-class--some-class="myPlugin::state.true"
				data-wp-class--other-class="myPlugin::state.false"
			>Text</div>';
		list($p) = $this->process_directives( $html );
		$this->assertEquals( 'some-class', $p->get_attribute( 'class' ) );
	}

	/**
	 * Tests that `data-wp-class` adds new classes alongside existing ones.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_class_sets_class_name_when_class_attribute_exists() {
		$html    = '<div class="other-class" data-wp-class--some-class="myPlugin::state.true">Text</div>';
		list($p) = $this->process_directives( $html );
		$this->assertEquals( 'other-class some-class', $p->get_attribute( 'class' ) );
	}

	/**
	 * Tests that no class is added when the associated state is false.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_class_doesnt_add_class_attribute_on_false() {
		$html    = '<div data-wp-class--some-class="myPlugin::state.false">Text</div>';
		list($p) = $this->process_directives( $html );
		$this->assertNull( $p->get_attribute( 'class' ) );
	}

	/**
	 * Tests that existing class names are preserved when the directive condition
	 * is false.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_class_doesnt_add_class_name_on_false() {
		$html    = '<div class="other-class" data-wp-class--some-class="myPlugin::state.false">Text</div>';
		list($p) = $this->process_directives( $html );
		$this->assertEquals( 'other-class', $p->get_attribute( 'class' ) );
	}

	/**
	 * Tests that existing class names remain intact when they should be re-added
	 * as per their directive.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_class_keeps_class_name_when_class_name_exists() {
		$html    = '<div class="some-class" data-wp-class--some-class="myPlugin::state.true">Text</div>';
		list($p) = $this->process_directives( $html );
		$this->assertEquals( 'some-class', $p->get_attribute( 'class' ) );
	}

	/**
	 * Tests preservation of existing class names, even when one is repeated in a
	 * directive that evaluates to true.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_class_keeps_class_name_when_class_name_exists_and_is_not_the_only_one() {
		$html    = '<div class="other-class some-class" data-wp-class--some-class="myPlugin::state.true">Text</div>';
		list($p) = $this->process_directives( $html );
		$this->assertEquals( 'other-class some-class', $p->get_attribute( 'class' ) );
	}

	/**
	 * Tests that a class attribute with only one class name is removed when the
	 * directive evaluates to false.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_class_removes_class_attribute_when_class_name_exists_and_is_the_only_one() {
		$html    = '<div class="some-class" data-wp-class--some-class="myPlugin::state.false">Text</div>';
		list($p) = $this->process_directives( $html );
		$this->assertNull( $p->get_attribute( 'class' ) );
	}

	/**
	 * Tests that one of several class names is removed when its directive
	 * evaluates to false.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_class_removes_class_name_when_class_name_exists_and_is_not_the_only_one() {
		$html    = '<div class="other-class some-class" data-wp-class--some-class="myPlugin::state.false">Text</div>';
		list($p) = $this->process_directives( $html );
		$this->assertEquals( 'other-class', $p->get_attribute( 'class' ) );
	}

	/**
	 * Tests that an empty class attribute is not removed even if a directive
	 * evaluates to false.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_class_doesnt_remove_empty_class_attribute() {
		$html    = '<div class data-wp-class--some-class="myPlugin::state.false">Text</div>';
		list($p) = $this->process_directives( $html );
		$this->assertTrue( $p->get_attribute( 'class' ) );
	}

	/**
	 * Tests that the class attribute remains unchanged if the data-wp-class
	 * suffix is empty.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_class_doesnt_change_class_attribute_with_empty_directive_suffix() {
		$html    = '<div class="other-class" data-wp-class="myPlugin::state.true">Text</div>';
		list($p) = $this->process_directives( $html );
		$this->assertEquals( 'other-class', $p->get_attribute( 'class' ) );
	}

	/**
	 * Tests that the class attribute is not altered if the value of the
	 * `data-wp-class` directive is empty.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_class_doesnt_change_class_attribute_with_empty_value() {
		$html    = '<div class="other-class" data-wp-class--some-class="">Text</div>';
		list($p) = $this->process_directives( $html );
		$this->assertEquals( 'other-class', $p->get_attribute( 'class' ) );
	}

	/**
	 * Tests that an existing class attribute is not affected by a `data-wp-class`
	 * directive without a value.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_class_doesnt_change_class_attribute_without_value() {
		$html    = '<div class="other-class" data-wp-class--some-class>Text</div>';
		list($p) = $this->process_directives( $html );
		$this->assertEquals( 'other-class', $p->get_attribute( 'class' ) );
	}

	/**
	 * Tests that multiple directives for the same class yield the correct result
	 * when the condition is true.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_class_works_with_multiple_directives() {
		$html    = '<div data-wp-class--some-class="myPlugin::state.true" data-wp-class--some-class="myPlugin::state.true">Text</div>';
		list($p) = $this->process_directives( $html );
		$this->assertEquals( 'some-class', $p->get_attribute( 'class' ) );
	}

	/**
	 * Tests setting class names based on truthy values other than just true
	 * booleans.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_class_sets_class_name_on_truthy_values() {
		$this->interactivity->state( 'myPlugin', array( 'text' => 'some text' ) );
		$html    = '<div data-wp-class--some-class="myPlugin::state.text">Text</div>';
		list($p) = $this->process_directives( $html );
		$this->assertEquals( 'some-class', $p->get_attribute( 'class' ) );

		$this->interactivity->state( 'myPlugin', array( 'array' => array( 1, 2 ) ) );
		$html    = '<div data-wp-class--some-class="myPlugin::state.array">Text</div>';
		list($p) = $this->process_directives( $html );
		$this->assertEquals( 'some-class', $p->get_attribute( 'class' ) );

		$this->interactivity->state( 'myPlugin', array( 'number' => 1 ) );
		$html    = '<div data-wp-class--some-class="myPlugin::state.number">Text</div>';
		list($p) = $this->process_directives( $html );
		$this->assertEquals( 'some-class', $p->get_attribute( 'class' ) );
	}

	/**
	 * Tests that class attributes aren't set for falsy values other than just
	 * false booleans.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_class_sets_class_name_on_falsy_values() {
		$this->interactivity->state( 'myPlugin', array( 'text' => '' ) );
		$html    = '<div data-wp-class--some-class="myPlugin::state.text">Text</div>';
		list($p) = $this->process_directives( $html );
		$this->assertNull( $p->get_attribute( 'class' ) );

		$this->interactivity->state( 'myPlugin', array( 'array' => array() ) );
		$html    = '<div data-wp-class--some-class="myPlugin::state.array">Text</div>';
		list($p) = $this->process_directives( $html );
		$this->assertNull( $p->get_attribute( 'class' ) );

		$this->interactivity->state( 'myPlugin', array( 'number' => 0 ) );
		$html    = '<div data-wp-class--some-class="myPlugin::state.number">Text</div>';
		list($p) = $this->process_directives( $html );
		$this->assertNull( $p->get_attribute( 'class' ) );

		$this->interactivity->state( 'myPlugin', array( 'null' => null ) );
		$html    = '<div data-wp-class--some-class="myPlugin::state.null">Text</div>';
		list($p) = $this->process_directives( $html );
		$this->assertNull( $p->get_attribute( 'class' ) );
	}
}
