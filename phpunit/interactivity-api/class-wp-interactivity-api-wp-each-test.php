<?php
/**
 * Unit tests covering the data_wp_each_processor functionality of the
 * WP_Interactivity_API class.
 *
 * @package WordPress
 * @subpackage Interactivity API
 *
 * @group interactivity-api
 */
class Tests_WP_Interactivity_API_WP_Each extends WP_UnitTestCase {
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
		$this->interactivity->state( 'myPlugin', array( 'list' => array( 1, 2 ) ) );
		$this->interactivity->state( 'myPlugin', array( 'after' => 'after-wp-each' ) );
	}

	/**
	 * Tests that the `data-wp-each` directive doesn't do anything if it's not on
	 * a template tag.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_each_doesnt_do_anything_on_non_template_tags() {
		$original = '
			<div data-wp-each="myPlugin::state.list">
				<span data-wp-text="myPlugin::context.item"></span>
			</div>';
		$new      = $this->interactivity->process_directives( $original );
		$this->assertEquals( $original, $new );
	}

	/**
	 * Tests that the `data-wp-each` directive doesn't do anything if the array
	 * is associative instead of indexed.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_each_doesnt_do_anything_on_associative_arrays() {
		$this->interactivity->state(
			'myPlugin',
			array(
				'assoc' => array(
					'one' => 1,
					'two' => 2,
				),
			)
		);
		$original = '
			<template data-wp-each="myPlugin::state.assoc">
				<span data-wp-text="myPlugin::context.item"></span>
			</template>';
		$new      = $this->interactivity->process_directives( $original );
		$this->assertEquals( $original, $new );
	}

	/**
	 * Tests that the `data-wp-each` directive works with simple tags.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_each_simple_tags() {
		$original = '' .
			'<template data-wp-each="myPlugin::state.list">' .
				'<span data-wp-text="myPlugin::context.item"></span>' .
			'</template>' .
			'<div data-wp-bind--id="myPlugin::state.after">Text</div>';
		$expected = '' .
			'<template data-wp-each="myPlugin::state.list">' .
				'<span data-wp-text="myPlugin::context.item"></span>' .
			'</template>' .
			'<span data-wp-each-child data-wp-text="myPlugin::context.item">1</span>' .
			'<span data-wp-each-child data-wp-text="myPlugin::context.item">2</span>' .
			'<div id="after-wp-each" data-wp-bind--id="myPlugin::state.after">Text</div>';
		$new      = $this->interactivity->process_directives( $original );
		$this->assertEquals( $expected, $new );
	}

	/**
	 * Tests that the `data-wp-each` directive doesn't do anything if the array is
	 * empty.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_each_empty_array() {
		$this->interactivity->state( 'myPlugin', array( 'empty' => array() ) );
		$original = '' .
			'<template data-wp-each="myPlugin::state.empty">' .
				'<span data-wp-text="myPlugin::context.item"></span>' .
			'</template>' .
			'<div data-wp-bind--id="myPlugin::state.after">Text</div>';
		$expected = '' .
			'<template data-wp-each="myPlugin::state.empty">' .
				'<span data-wp-text="myPlugin::context.item"></span>' .
			'</template>' .
			'<div id="after-wp-each" data-wp-bind--id="myPlugin::state.after">Text</div>';
		$new      = $this->interactivity->process_directives( $original );
		$this->assertEquals( $expected, $new );
	}

	/**
	 * Tests that the `data-wp-each` directive merges the item with the previous
	 * context correctly.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_each_merges_context_correctly() {
		$original = '' .
			'<div data-wp-context=\'myPlugin::{ "item": "New text", "id": "some-id", "after": "after-wp-each" }\'>' .
				'<template data-wp-each="myPlugin::state.list">' .
					'<span data-wp-bind--id="myPlugin::context.id" data-wp-text="myPlugin::context.item"></span>' .
				'</template>' .
				'<div data-wp-bind--id="myPlugin::context.after" data-wp-text="myPlugin::context.item">Text</div>' .
			'</div>';
		$expected = '' .
			'<div data-wp-context=\'myPlugin::{ "item": "New text", "id": "some-id", "after": "after-wp-each" }\'>' .
				'<template data-wp-each="myPlugin::state.list">' .
					'<span data-wp-bind--id="myPlugin::context.id" data-wp-text="myPlugin::context.item"></span>' .
				'</template>' .
				'<span data-wp-each-child id="some-id" data-wp-bind--id="myPlugin::context.id" data-wp-text="myPlugin::context.item">1</span>' .
				'<span data-wp-each-child id="some-id" data-wp-bind--id="myPlugin::context.id" data-wp-text="myPlugin::context.item">2</span>' .
				'<div id="after-wp-each" data-wp-bind--id="myPlugin::context.after" data-wp-text="myPlugin::context.item">New text</div>' .
			'</div>';
		$new      = $this->interactivity->process_directives( $original );
		$this->assertEquals( $expected, $new );
	}

	/**
	 * Tests that the `data-wp-each` directive works with arrays from the context.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_each_gets_arrays_from_context() {
		$original = '' .
			'<div data-wp-context=\'myPlugin::{ "list": [ 1, 2 ] }\'>' .
				'<template data-wp-each="myPlugin::context.list">' .
					'<span data-wp-text="myPlugin::context.item"></span>' .
				'</template>' .
				'<div data-wp-bind--id="myPlugin::state.after">Text</div>' .
			'</div>';
		$expected = '' .
			'<div data-wp-context=\'myPlugin::{ "list": [ 1, 2 ] }\'>' .
				'<template data-wp-each="myPlugin::context.list">' .
					'<span data-wp-text="myPlugin::context.item"></span>' .
				'</template>' .
				'<span data-wp-each-child data-wp-text="myPlugin::context.item">1</span>' .
				'<span data-wp-each-child data-wp-text="myPlugin::context.item">2</span>' .
				'<div id="after-wp-each" data-wp-bind--id="myPlugin::state.after">Text</div>' .
			'</div>';
		$new      = $this->interactivity->process_directives( $original );
		$this->assertEquals( $expected, $new );
	}

	/**
	 * Tests that the `data-wp-each` directive works with the default namespace.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_each_default_namespace() {
		$original = '' .
			'<div data-wp-interactive=\'{ "namespace": "myPlugin" }\'>' .
				'<template data-wp-each="state.list">' .
					'<span data-wp-text="context.item"></span>' .
				'</template>' .
				'<div data-wp-bind--id="state.after">Text</div>' .
			'</div>';
		$expected = '' .
			'<div data-wp-interactive=\'{ "namespace": "myPlugin" }\'>' .
				'<template data-wp-each="state.list">' .
					'<span data-wp-text="context.item"></span>' .
				'</template>' .
				'<span data-wp-each-child data-wp-text="context.item">1</span>' .
				'<span data-wp-each-child data-wp-text="context.item">2</span>' .
				'<div id="after-wp-each" data-wp-bind--id="state.after">Text</div>' .
			'</div>';
		$new      = $this->interactivity->process_directives( $original );
		$this->assertEquals( $expected, $new );
	}

	/**
	 * Tests that the `data-wp-each` directive works with multiple tags per item.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_each_multiple_tags_per_item() {
		$original = '' .
			'<template data-wp-each="myPlugin::state.list">' .
				'<span data-wp-text="myPlugin::context.item"></span>' .
				'<span data-wp-text="myPlugin::context.item"></span>' .
			'</template>' .
			'<div data-wp-bind--id="myPlugin::state.after">Text</div>';
		$expected = '' .
			'<template data-wp-each="myPlugin::state.list">' .
				'<span data-wp-text="myPlugin::context.item"></span>' .
				'<span data-wp-text="myPlugin::context.item"></span>' .
			'</template>' .
			'<span data-wp-each-child data-wp-text="myPlugin::context.item">1</span>' .
			'<span data-wp-each-child data-wp-text="myPlugin::context.item">1</span>' .
			'<span data-wp-each-child data-wp-text="myPlugin::context.item">2</span>' .
			'<span data-wp-each-child data-wp-text="myPlugin::context.item">2</span>' .
			'<div id="after-wp-each" data-wp-bind--id="myPlugin::state.after">Text</div>';
		$new      = $this->interactivity->process_directives( $original );
		$this->assertEquals( $expected, $new );
	}

	/**
	 * Tests that the `data-wp-each` directive works with void tags.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_each_void_tags() {
		$original = '' .
			'<template data-wp-each="myPlugin::state.list">' .
				'<img data-wp-bind--id="myPlugin::context.item">' .
				'<img data-wp-bind--id="myPlugin::context.item">' .
			'</template>' .
			'<div data-wp-bind--id="myPlugin::state.after">Text</div>';
		$expected = '' .
			'<template data-wp-each="myPlugin::state.list">' .
				'<img data-wp-bind--id="myPlugin::context.item">' .
				'<img data-wp-bind--id="myPlugin::context.item">' .
			'</template>' .
			'<img data-wp-each-child id="1" data-wp-bind--id="myPlugin::context.item">' .
			'<img data-wp-each-child id="1" data-wp-bind--id="myPlugin::context.item">' .
			'<img data-wp-each-child id="2" data-wp-bind--id="myPlugin::context.item">' .
			'<img data-wp-each-child id="2" data-wp-bind--id="myPlugin::context.item">' .
			'<div id="after-wp-each" data-wp-bind--id="myPlugin::state.after">Text</div>';
		$new      = $this->interactivity->process_directives( $original );
		$this->assertEquals( $expected, $new );
	}

	/**
	 * Tests that the `data-wp-each` directive works with combinations of void and
	 * non-void tags.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_each_void_and_non_void_tags() {
		$original = '' .
			'<template data-wp-each="myPlugin::state.list">' .
				'<img data-wp-bind--id="myPlugin::context.item">' .
				'<span data-wp-text="myPlugin::context.item"></span>' .
			'</template>' .
			'<div data-wp-bind--id="myPlugin::state.after">Text</div>';
		$expected = '' .
			'<template data-wp-each="myPlugin::state.list">' .
				'<img data-wp-bind--id="myPlugin::context.item">' .
				'<span data-wp-text="myPlugin::context.item"></span>' .
			'</template>' .
			'<img data-wp-each-child id="1" data-wp-bind--id="myPlugin::context.item">' .
			'<span data-wp-each-child data-wp-text="myPlugin::context.item">1</span>' .
			'<img data-wp-each-child id="2" data-wp-bind--id="myPlugin::context.item">' .
			'<span data-wp-each-child data-wp-text="myPlugin::context.item">2</span>' .
			'<div id="after-wp-each" data-wp-bind--id="myPlugin::state.after">Text</div>';
		$new      = $this->interactivity->process_directives( $original );
		$this->assertEquals( $expected, $new );
	}

	/**
	 * Tests that the `data-wp-each` directive works with nested tags.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_each_nested_tags() {
		$original = '' .
			'<template data-wp-each="myPlugin::state.list">' .
				'<div data-wp-bind--id="myPlugin::context.item">' .
					'id: <span data-wp-text="myPlugin::context.item"></span>' .
				'</div>' .
			'</template>' .
			'<div data-wp-bind--id="myPlugin::state.after">Text</div>';
		$expected = '' .
			'<template data-wp-each="myPlugin::state.list">' .
				'<div data-wp-bind--id="myPlugin::context.item">' .
					'id: <span data-wp-text="myPlugin::context.item"></span>' .
				'</div>' .
			'</template>' .
			'<div data-wp-each-child id="1" data-wp-bind--id="myPlugin::context.item">' .
				'id: <span data-wp-text="myPlugin::context.item">1</span>' .
			'</div>' .
			'<div data-wp-each-child id="2" data-wp-bind--id="myPlugin::context.item">' .
				'id: <span data-wp-text="myPlugin::context.item">2</span>' .
			'</div>' .
			'<div id="after-wp-each" data-wp-bind--id="myPlugin::state.after">Text</div>';
		$new      = $this->interactivity->process_directives( $original );
		$this->assertEquals( $expected, $new );
	}

	/**
	 * Tests that the `data-wp-each` directive works with nested item properties.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_each_nested_item_properties() {
		$this->interactivity->state(
			'myPlugin',
			array(
				'list' => array(
					array(
						'id'   => 1,
						'name' => 'one',
					),
					array(
						'id'   => 2,
						'name' => 'two',
					),
				),
			)
		);
		$original = '' .
			'<template data-wp-each="myPlugin::state.list">' .
				'<span data-wp-text="myPlugin::context.item.id"></span>' .
				'<span data-wp-text="myPlugin::context.item.name"></span>' .
			'</template>' .
			'<div data-wp-bind--id="myPlugin::state.after">Text</div>';
		$expected = '' .
			'<template data-wp-each="myPlugin::state.list">' .
				'<span data-wp-text="myPlugin::context.item.id"></span>' .
				'<span data-wp-text="myPlugin::context.item.name"></span>' .
			'</template>' .
			'<span data-wp-each-child data-wp-text="myPlugin::context.item.id">1</span>' .
			'<span data-wp-each-child data-wp-text="myPlugin::context.item.name">one</span>' .
			'<span data-wp-each-child data-wp-text="myPlugin::context.item.id">2</span>' .
			'<span data-wp-each-child data-wp-text="myPlugin::context.item.name">two</span>' .
			'<div id="after-wp-each" data-wp-bind--id="myPlugin::state.after">Text</div>';
		$new      = $this->interactivity->process_directives( $original );
		$this->assertEquals( $expected, $new );
	}

	/**
	 * Tests that the `data-wp-each` directive works with different item names.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_each_different_item_names() {
		$original = '' .
			'<template data-wp-each--myitem="myPlugin::state.list">' .
				'<span data-wp-text="myPlugin::context.myitem"></span>' .
			'</template>' .
			'<div data-wp-bind--id="myPlugin::state.after">Text</div>';
		$expected = '' .
			'<template data-wp-each--myitem="myPlugin::state.list">' .
				'<span data-wp-text="myPlugin::context.myitem"></span>' .
			'</template>' .
			'<span data-wp-each-child data-wp-text="myPlugin::context.myitem">1</span>' .
			'<span data-wp-each-child data-wp-text="myPlugin::context.myitem">2</span>' .
			'<div id="after-wp-each" data-wp-bind--id="myPlugin::state.after">Text</div>';
		$new      = $this->interactivity->process_directives( $original );
		$this->assertEquals( $expected, $new );
	}

	/**
	 * Tests that the `data-wp-each` directive transforms kebab-case into
	 * camelCase.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_each_different_item_names_transforms_camelcase() {
		$original = '' .
			'<template data-wp-each--my-item="myPlugin::state.list">' .
				'<span data-wp-text="myPlugin::context.myItem"></span>' .
			'</template>' .
			'<div data-wp-bind--id="myPlugin::state.after">Text</div>';
		$expected = '' .
			'<template data-wp-each--my-item="myPlugin::state.list">' .
				'<span data-wp-text="myPlugin::context.myItem"></span>' .
			'</template>' .
			'<span data-wp-each-child data-wp-text="myPlugin::context.myItem">1</span>' .
			'<span data-wp-each-child data-wp-text="myPlugin::context.myItem">2</span>' .
			'<div id="after-wp-each" data-wp-bind--id="myPlugin::state.after">Text</div>';
		$new      = $this->interactivity->process_directives( $original );
		$this->assertEquals( $expected, $new );
	}

	/**
	 * Tests that the `data-wp-each` directive doesn't work with top-level texts.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_each_doesnt_work_with_top_level_text() {
		$original = '' .
			'<template data-wp-each="myPlugin::state.list">' .
				'id: <span data-wp-text="myPlugin::context.item"></span>' .
			'</template>';
		$new      = $this->interactivity->process_directives( $original );
		$this->assertEquals( $original, $new );

		$original = '' .
			'<template data-wp-each="myPlugin::state.list">' .
				'<span data-wp-text="myPlugin::context.item"></span>!' .
			'</template>';
		$new      = $this->interactivity->process_directives( $original );
		$this->assertEquals( $original, $new );

		// But it should work fine with spaces and linebreaks.
		$original = '
			<template data-wp-each="myPlugin::state.list">
				<span class="test" data-wp-bind--id="myPlugin::context.item"></span>
			</template>';
		$new      = $this->interactivity->process_directives( $original );
		$p        = new WP_HTML_Tag_Processor( $new );
		$p->next_tag( array( 'class_name' => 'test' ) );
		$p->next_tag( array( 'class_name' => 'test' ) );
		$this->assertEquals( '1', $p->get_attribute( 'id' ) );
		$p->next_tag( array( 'class_name' => 'test' ) );
		$this->assertEquals( '2', $p->get_attribute( 'id' ) );
	}

	/**
	 * Tests that the `data-wp-each` directive works with nested template tags.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_each_nested_template_tags() {
		$this->interactivity->state( 'myPlugin', array( 'list2' => array( 3, 4 ) ) );
		$original = '' .
			'<template data-wp-each--item1="myPlugin::state.list">' .
				'<span data-wp-text="myPlugin::context.item1"></span>' .
				'<template data-wp-each--item2="myPlugin::state.list2">' .
					'<span data-wp-text="myPlugin::context.item2"></span>' .
				'</template>' .
			'</template>' .
			'<div data-wp-bind--id="myPlugin::state.after">Text</div>';
		$expected = '' .
			'<template data-wp-each--item1="myPlugin::state.list">' .
				'<span data-wp-text="myPlugin::context.item1"></span>' .
				'<template data-wp-each--item2="myPlugin::state.list2">' .
					'<span data-wp-text="myPlugin::context.item2"></span>' .
				'</template>' .
			'</template>' .
			'<span data-wp-each-child data-wp-text="myPlugin::context.item1">1</span>' .
			'<template data-wp-each-child data-wp-each--item2="myPlugin::state.list2">' .
				'<span data-wp-text="myPlugin::context.item2"></span>' .
			'</template>' .
			'<span data-wp-each-child data-wp-text="myPlugin::context.item2">3</span>' .
			'<span data-wp-each-child data-wp-text="myPlugin::context.item2">4</span>' .
			'<span data-wp-each-child data-wp-text="myPlugin::context.item1">2</span>' .
			'<template data-wp-each-child data-wp-each--item2="myPlugin::state.list2">' .
				'<span data-wp-text="myPlugin::context.item2"></span>' .
			'</template>' .
			'<span data-wp-each-child data-wp-text="myPlugin::context.item2">3</span>' .
			'<span data-wp-each-child data-wp-text="myPlugin::context.item2">4</span>' .
			'<div id="after-wp-each" data-wp-bind--id="myPlugin::state.after">Text</div>';
		$new      = $this->interactivity->process_directives( $original );
		$this->assertEquals( $expected, $new );
	}

	/**
	 * Tests that the `data-wp-each` directive works with nestded template tags
	 * that use a previous item as a list.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_each_nested_template_tags_using_previous_item_as_list() {
		$this->interactivity->state( 'myPlugin', array( 'list2' => array( array( 1, 2 ), array( 3, 4 ) ) ) );
		$original = '' .
			'<template data-wp-each--list="myPlugin::state.list2">' .
				'<template data-wp-each--number="myPlugin::context.list">' .
					'<span data-wp-text="myPlugin::context.number"></span>' .
				'</template>' .
			'</template>' .
			'<div data-wp-bind--id="myPlugin::state.after">Text</div>';
		$expected = '' .
			'<template data-wp-each--list="myPlugin::state.list2">' .
				'<template data-wp-each--number="myPlugin::context.list">' .
					'<span data-wp-text="myPlugin::context.number"></span>' .
				'</template>' .
			'</template>' .
			'<template data-wp-each-child data-wp-each--number="myPlugin::context.list">' .
				'<span data-wp-text="myPlugin::context.number"></span>' .
			'</template>' .
			'<span data-wp-each-child data-wp-text="myPlugin::context.number">1</span>' .
			'<span data-wp-each-child data-wp-text="myPlugin::context.number">2</span>' .
			'<template data-wp-each-child data-wp-each--number="myPlugin::context.list">' .
				'<span data-wp-text="myPlugin::context.number"></span>' .
			'</template>' .
			'<span data-wp-each-child data-wp-text="myPlugin::context.number">3</span>' .
			'<span data-wp-each-child data-wp-text="myPlugin::context.number">4</span>' .
			'<div id="after-wp-each" data-wp-bind--id="myPlugin::state.after">Text</div>';
		$new      = $this->interactivity->process_directives( $original );
		$this->assertEquals( $expected, $new );
	}

	/**
	 * Tests that the `data-wp-each` directive doesn't process unbalanced tags.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_each_unbalanced_tags() {
		$original = '' .
			'<template data-wp-each="myPlugin::state.list">' .
				'<span data-wp-text="myPlugin::context.item">' .
			'</template>' .
			'<div data-wp-bind--id="myPlugin::state.after">Text</div>';
		$new      = $this->interactivity->process_directives( $original );
		$this->assertEquals( $original, $new );
	}

	/**
	 * Tests that the `data-wp-each` directive doesn't process unbalanced tags in
	 * nested templates.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_each_unbalanced_tags_in_nested_template_tags() {
		$this->interactivity->state( 'myPlugin', array( 'list2' => array( 3, 4 ) ) );
		$original = '' .
			'<template data-wp-each--item1="myPlugin::state.list">' .
				'<span data-wp-text="myPlugin::context.item1"></span>' .
				'<template data-wp-each--item2="myPlugin::state.list2">' .
					'<span data-wp-text="myPlugin::context.item2">' .
				'</template>' .
			'</template>' .
			'<div data-wp-bind--id="myPlugin::state.after">Text</div>';
		$new      = $this->interactivity->process_directives( $original );
		$this->assertEquals( $original, $new );
	}

	/**
	 * Tests that the `data-wp-each` directive doesn't process if it doesn't get
	 * an array.
	 *
	 * @covers ::process_directives
	 */
	public function test_wp_each_doesnt_process_if_not_array() {
		$original = '' .
			'<template data-wp-each="myPlugin::state.list">' .
				'<span data-wp-text="myPlugin::context.item"></span>' .
			'</template>' .
			'<div data-wp-bind--id="myPlugin::state.after">Text</div>';
		$expected = '' .
			'<template data-wp-each="myPlugin::state.list">' .
				'<span data-wp-text="myPlugin::context.item"></span>' .
			'</template>' .
			'<div id="after-wp-each" data-wp-bind--id="myPlugin::state.after">Text</div>';

		$this->interactivity->state( 'myPlugin', array( 'list' => null ) );
		$new = $this->interactivity->process_directives( $original );
		$this->assertEquals( $expected, $new );

		$this->interactivity->state( 'myPlugin', array( 'list' => 'Text' ) );
		$new = $this->interactivity->process_directives( $original );
		$this->assertEquals( $expected, $new );

		$this->interactivity->state( 'myPlugin', array( 'list' => 100 ) );
		$new = $this->interactivity->process_directives( $original );
		$this->assertEquals( $expected, $new );

		$this->interactivity->state( 'myPlugin', array( 'list' => false ) );
		$new = $this->interactivity->process_directives( $original );
		$this->assertEquals( $expected, $new );

		$this->interactivity->state( 'myPlugin', array( 'list' => true ) );
		$new = $this->interactivity->process_directives( $original );
		$this->assertEquals( $expected, $new );
	}
}
