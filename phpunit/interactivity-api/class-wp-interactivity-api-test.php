<?php
/**
 * Unit tests covering WP_Interactivity_API functionality.
 *
 * @package WordPress
 * @subpackage Interactivity API
 *
 * @group interactivity-api
 *
 * @coversDefaultClass WP_Interactivity_API
 */
class Tests_WP_Interactivity_API extends WP_UnitTestCase {
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
	}

	/**
	 * Tests that the state and config methods return an empty array at the
	 * beginning.
	 *
	 * @covers ::state
	 * @covers ::config
	 */
	public function test_state_and_config_should_be_empty() {
		$this->assertEquals( array(), $this->interactivity->state( 'myPlugin' ) );
		$this->assertEquals( array(), $this->interactivity->config( 'myPlugin' ) );
	}

	/**
	 * Tests that the state and config methods can change the state and
	 * configuration.
	 *
	 * @covers ::state
	 * @covers ::config
	 */
	public function test_state_and_config_can_be_changed() {
		$state  = array(
			'a'      => 1,
			'b'      => 2,
			'nested' => array( 'c' => 3 ),
		);
		$result = $this->interactivity->state( 'myPlugin', $state );
		$this->assertEquals( $state, $result );
		$result = $this->interactivity->config( 'myPlugin', $state );
		$this->assertEquals( $state, $result );
	}

	/**
	 * Tests that different initial states and configurations can be merged.
	 *
	 * @covers ::state
	 * @covers ::config
	 */
	public function test_state_and_config_can_be_merged() {
		$this->interactivity->state( 'myPlugin', array( 'a' => 1 ) );
		$this->interactivity->state( 'myPlugin', array( 'b' => 2 ) );
		$this->interactivity->state( 'otherPlugin', array( 'c' => 3 ) );
		$this->assertEquals(
			array(
				'a' => 1,
				'b' => 2,
			),
			$this->interactivity->state( 'myPlugin' )
		);
		$this->assertEquals(
			array( 'c' => 3 ),
			$this->interactivity->state( 'otherPlugin' )
		);

		$this->interactivity->config( 'myPlugin', array( 'a' => 1 ) );
		$this->interactivity->config( 'myPlugin', array( 'b' => 2 ) );
		$this->interactivity->config( 'otherPlugin', array( 'c' => 3 ) );
		$this->assertEquals(
			array(
				'a' => 1,
				'b' => 2,
			),
			$this->interactivity->config( 'myPlugin' )
		);
		$this->assertEquals(
			array( 'c' => 3 ),
			$this->interactivity->config( 'otherPlugin' )
		);  }

	/**
	 * Tests that existing keys in the initial state and configuration can be
	 * overwritten.
	 *
	 * @covers ::state
	 * @covers ::config
	 */
	public function test_state_and_config_existing_props_can_be_overwritten() {
		$this->interactivity->state( 'myPlugin', array( 'a' => 1 ) );
		$this->interactivity->state( 'myPlugin', array( 'a' => 2 ) );
		$this->assertEquals(
			array( 'a' => 2 ),
			$this->interactivity->state( 'myPlugin' )
		);

		$this->interactivity->config( 'myPlugin', array( 'a' => 1 ) );
		$this->interactivity->config( 'myPlugin', array( 'a' => 2 ) );
		$this->assertEquals(
			array( 'a' => 2 ),
			$this->interactivity->config( 'myPlugin' )
		);
	}

	/**
	 * Tests that existing indexed arrays in the initial state and configuration
	 * are replaced, not merged.
	 *
	 * @covers ::state
	 * @covers ::config
	 */
	public function test_state_and_config_existing_indexed_arrays_are_replaced() {
		$this->interactivity->state( 'myPlugin', array( 'a' => array( 1, 2 ) ) );
		$this->interactivity->state( 'myPlugin', array( 'a' => array( 3, 4 ) ) );
		$this->assertEquals(
			array( 'a' => array( 3, 4 ) ),
			$this->interactivity->state( 'myPlugin' )
		);

		$this->interactivity->config( 'myPlugin', array( 'a' => array( 1, 2 ) ) );
		$this->interactivity->config( 'myPlugin', array( 'a' => array( 3, 4 ) ) );
		$this->assertEquals(
			array( 'a' => array( 3, 4 ) ),
			$this->interactivity->config( 'myPlugin' )
		);
	}

	/**
	 * Invokes the private `print_client_interactivity` method of
	 * WP_Interactivity_API class.
	 *
	 * @return array|null The content of the JSON object printed on the client-side or null if nothings was printed.
	 */
	private function print_client_interactivity_data() {
		$interactivity_data_markup = get_echo( array( $this->interactivity, 'print_client_interactivity_data' ) );
		preg_match( '/<script type="application\/json" id="wp-interactivity-data">.*?(\{.*\}).*?<\/script>/s', $interactivity_data_markup, $interactivity_data_string );
		return isset( $interactivity_data_string[1] ) ? json_decode( $interactivity_data_string[1], true ) : null;
	}

	/**
	 * Tests that the initial state and config are correctly printed on the
	 * client-side.
	 *
	 * @covers ::print_client_interactivity_data
	 */
	public function test_state_and_config_is_correctly_printed() {
		$this->interactivity->state( 'myPlugin', array( 'a' => 1 ) );
		$this->interactivity->state( 'otherPlugin', array( 'b' => 2 ) );
		$this->interactivity->config( 'myPlugin', array( 'a' => 1 ) );
		$this->interactivity->config( 'otherPlugin', array( 'b' => 2 ) );

		$result = $this->print_client_interactivity_data();

		$data = array(
			'myPlugin'    => array( 'a' => 1 ),
			'otherPlugin' => array( 'b' => 2 ),
		);

		$this->assertEquals(
			array(
				'state'  => $data,
				'config' => $data,
			),
			$result
		);
	}

	/**
	 * Tests that the wp-interactivity-data script is not printed if both state
	 * and config are empty.
	 *
	 * @covers ::print_client_interactivity_data
	 */
	public function test_state_and_config_dont_print_when_empty() {
		$result = $this->print_client_interactivity_data();
		$this->assertNull( $result );
	}

	/**
	 * Tests that the config is not printed if it's empty.
	 *
	 * @covers ::print_client_interactivity_data
	 */
	public function test_config_not_printed_when_empty() {
		$this->interactivity->state( 'myPlugin', array( 'a' => 1 ) );
		$result = $this->print_client_interactivity_data();
		$this->assertEquals( array( 'state' => array( 'myPlugin' => array( 'a' => 1 ) ) ), $result );
	}

	/**
	 * Tests that the state is not printed if it's empty.
	 *
	 * @covers ::print_client_interactivity_data
	 */
	public function test_state_not_printed_when_empty() {
		$this->interactivity->config( 'myPlugin', array( 'a' => 1 ) );
		$result = $this->print_client_interactivity_data();
		$this->assertEquals( array( 'config' => array( 'myPlugin' => array( 'a' => 1 ) ) ), $result );
	}



	/**
	 * Tests that special characters in the initial state and configuration are
	 * properly escaped.
	 *
	 * @covers ::print_client_interactivity_data
	 */
	public function test_state_and_config_escape_special_characters() {
		$this->interactivity->state( 'myPlugin', array( 'amps' => 'http://site.test/?foo=1&baz=2' ) );
		$this->interactivity->config( 'myPlugin', array( 'tags' => 'Tags: <!-- <script>' ) );

		$interactivity_data_markup = get_echo( array( $this->interactivity, 'print_client_interactivity_data' ) );
		preg_match( '/<script type="application\/json" id="wp-interactivity-data">.*?(\{.*\}).*?<\/script>/s', $interactivity_data_markup, $interactivity_data_string );

		$this->assertEquals(
			'{"config":{"myPlugin":{"tags":"Tags: \u003C!-- \u003Cscript\u003E"}},"state":{"myPlugin":{"amps":"http:\/\/site.test\/?foo=1\u0026baz=2"}}}',
			$interactivity_data_string[1]
		);
	}

	/**
	 * Tests extracting directive values from different string formats.
	 *
	 * @covers ::extract_directive_value
	 */
	public function test_extract_directive_value() {
		$extract_directive_value = new ReflectionMethod( $this->interactivity, 'extract_directive_value' );
		$extract_directive_value->setAccessible( true );

		$result = $extract_directive_value->invoke( $this->interactivity, 'state.foo', 'myPlugin' );
		$this->assertEquals( array( 'myPlugin', 'state.foo' ), $result );

		$result = $extract_directive_value->invoke( $this->interactivity, 'otherPlugin::state.foo', 'myPlugin' );
		$this->assertEquals( array( 'otherPlugin', 'state.foo' ), $result );

		$result = $extract_directive_value->invoke( $this->interactivity, '{ "isOpen": false }', 'myPlugin' );
		$this->assertEquals( array( 'myPlugin', array( 'isOpen' => false ) ), $result );

		$result = $extract_directive_value->invoke( $this->interactivity, 'otherPlugin::{ "isOpen": false }', 'myPlugin' );
		$this->assertEquals( array( 'otherPlugin', array( 'isOpen' => false ) ), $result );

		$result = $extract_directive_value->invoke( $this->interactivity, 'true', 'myPlugin' );
		$this->assertEquals( array( 'myPlugin', true ), $result );

		$result = $extract_directive_value->invoke( $this->interactivity, 'false', 'myPlugin' );
		$this->assertEquals( array( 'myPlugin', false ), $result );

		$result = $extract_directive_value->invoke( $this->interactivity, 'null', 'myPlugin' );
		$this->assertEquals( array( 'myPlugin', null ), $result );

		$result = $extract_directive_value->invoke( $this->interactivity, '100', 'myPlugin' );
		$this->assertEquals( array( 'myPlugin', 100 ), $result );

		$result = $extract_directive_value->invoke( $this->interactivity, '1.2', 'myPlugin' );
		$this->assertEquals( array( 'myPlugin', 1.2 ), $result );

		$result = $extract_directive_value->invoke( $this->interactivity, '1.2.3', 'myPlugin' );
		$this->assertEquals( array( 'myPlugin', '1.2.3' ), $result );

		$result = $extract_directive_value->invoke( $this->interactivity, 'otherPlugin::true', 'myPlugin' );
		$this->assertEquals( array( 'otherPlugin', true ), $result );

		$result = $extract_directive_value->invoke( $this->interactivity, 'otherPlugin::false', 'myPlugin' );
		$this->assertEquals( array( 'otherPlugin', false ), $result );

		$result = $extract_directive_value->invoke( $this->interactivity, 'otherPlugin::null', 'myPlugin' );
		$this->assertEquals( array( 'otherPlugin', null ), $result );

		$result = $extract_directive_value->invoke( $this->interactivity, 'otherPlugin::100', 'myPlugin' );
		$this->assertEquals( array( 'otherPlugin', 100 ), $result );

		$result = $extract_directive_value->invoke( $this->interactivity, 'otherPlugin::1.2', 'myPlugin' );
		$this->assertEquals( array( 'otherPlugin', 1.2 ), $result );

		$result = $extract_directive_value->invoke( $this->interactivity, 'otherPlugin::1.2.3', 'myPlugin' );
		$this->assertEquals( array( 'otherPlugin', '1.2.3' ), $result );

		$result = $extract_directive_value->invoke( $this->interactivity, 'otherPlugin::[{"o":4}, null, 3e6]', 'myPlugin' );
		$this->assertEquals( array( 'otherPlugin', array( array( 'o' => 4 ), null, 3000000.0 ) ), $result );
	}

	/**
	 * Tests extracting directive values with empty or invalid input.
	 *
	 * @covers ::extract_directive_value
	 */
	public function test_extract_directive_value_empty_values() {
		$extract_directive_value = new ReflectionMethod( $this->interactivity, 'extract_directive_value' );
		$extract_directive_value->setAccessible( true );

		$result = $extract_directive_value->invoke( $this->interactivity, '', 'myPlugin' );
		$this->assertEquals( array( 'myPlugin', null ), $result );

		// This is a boolean attribute.
		$result = $extract_directive_value->invoke( $this->interactivity, true, 'myPlugin' );
		$this->assertEquals( array( 'myPlugin', null ), $result );

		$result = $extract_directive_value->invoke( $this->interactivity, false, 'myPlugin' );
		$this->assertEquals( array( 'myPlugin', null ), $result );

		$result = $extract_directive_value->invoke( $this->interactivity, null, 'myPlugin' );
		$this->assertEquals( array( 'myPlugin', null ), $result );

		// A string ending in `::` without any extra characters is not considered a
		// namespace.
		$result = $extract_directive_value->invoke( $this->interactivity, 'myPlugin::', 'myPlugin' );
		$this->assertEquals( array( 'myPlugin', 'myPlugin::' ), $result );

		// A namespace with invalid characters is not considered a valid namespace.
		$result = $extract_directive_value->invoke( $this->interactivity, '$myPlugin::state.foo', 'myPlugin' );
		$this->assertEquals( array( 'myPlugin', '$myPlugin::state.foo' ), $result );
	}

	/**
	 * Tests extracting directive values from invalid JSON strings.
	 *
	 * @covers ::extract_directive_value
	 */
	public function test_extract_directive_value_invalid_json() {
		$extract_directive_value = new ReflectionMethod( $this->interactivity, 'extract_directive_value' );
		$extract_directive_value->setAccessible( true );

		// Invalid JSON due to missing quotes. Returns the original value.
		$result = $extract_directive_value->invoke( $this->interactivity, '{ isOpen: false }', 'myPlugin' );
		$this->assertEquals( array( 'myPlugin', '{ isOpen: false }' ), $result );

		// Null string. Returns null.
		$result = $extract_directive_value->invoke( $this->interactivity, 'null', 'myPlugin' );
		$this->assertEquals( array( 'myPlugin', null ), $result );
	}

	/**
	 * Tests the ability to extract prefix and suffix from a directive attribute
	 * name.
	 *
	 * @covers ::extract_prefix_and_suffix
	 */
	public function test_extract_prefix_and_suffix() {
		$extract_prefix_and_suffix = new ReflectionMethod( $this->interactivity, 'extract_prefix_and_suffix' );
		$extract_prefix_and_suffix->setAccessible( true );

		$result = $extract_prefix_and_suffix->invoke( $this->interactivity, 'data-wp-interactive' );
		$this->assertEquals( array( 'data-wp-interactive' ), $result );

		$result = $extract_prefix_and_suffix->invoke( $this->interactivity, 'data-wp-bind--src' );
		$this->assertEquals( array( 'data-wp-bind', 'src' ), $result );

		$result = $extract_prefix_and_suffix->invoke( $this->interactivity, 'data-wp-foo--and--bar' );
		$this->assertEquals( array( 'data-wp-foo', 'and--bar' ), $result );
	}

	/**
	 * Tests that the `process_directives` method doesn't change the HTML if it
	 * doesn't contain directives.
	 *
	 * @covers ::process_directives
	 */
	public function test_process_directives_do_nothing_without_directives() {
		$html           = '<div>Inner content here</div>';
		$processed_html = $this->interactivity->process_directives( $html );
		$this->assertEquals( $html, $processed_html );

		$html           = '<div><span>Content</span><strong>More Content</strong></div>';
		$processed_html = $this->interactivity->process_directives( $html );
		$this->assertEquals( $html, $processed_html );
	}

	/**
	 * Tests that the `process_directives` method changes the HTML if it contains
	 * directives.
	 *
	 * @covers ::process_directives
	 */
	public function test_process_directives_changes_html_with_balanced_tags() {
		$this->interactivity->state( 'myPlugin', array( 'id' => 'some-id' ) );
		$html           = '<div data-wp-bind--id="myPlugin::state.id">Inner content</div>';
		$processed_html = $this->interactivity->process_directives( $html );
		$p              = new WP_HTML_Tag_Processor( $processed_html );
		$p->next_tag();
		$this->assertEquals( 'some-id', $p->get_attribute( 'id' ) );
	}

	/**
	 * Tests how `process_directives` handles HTML with unknown directives.
	 *
	 * @covers ::process_directives
	 */
	public function test_process_directives_doesnt_fail_with_unknown_directives() {
		$html           = '<div data-wp-uknown="">Text</div>';
		$processed_html = $this->interactivity->process_directives( $html );
		$this->assertEquals( $html, $processed_html );
	}

	/**
	 * Tests that directives are processed in the correct order.
	 *
	 * @covers ::process_directives
	 */
	public function test_process_directives_process_the_directives_in_the_correct_order() {
		$html           = '
			<div
				data-wp-interactive=\'{ "namespace": "test" }\'
				data-wp-context=\'{ "isClass": true, "id": "some-id", "text": "Updated", "display": "none" }\'
				data-wp-bind--id="context.id"
				data-wp-class--some-class="context.isClass"
				data-wp-style--display="context.display"
				data-wp-text="context.text"
			>Text</div>';
		$processed_html = $this->interactivity->process_directives( $html );
		$p              = new WP_HTML_Tag_Processor( $processed_html );
		$p->next_tag();
		$this->assertEquals( 'some-id', $p->get_attribute( 'id' ) );
		$this->assertEquals( 'some-class', $p->get_attribute( 'class' ) );
		$this->assertEquals( 'display:none;', $p->get_attribute( 'style' ) );
		$this->assertStringContainsString( 'Updated', $p->get_updated_html() );
		$this->assertStringNotContainsString( 'Text', $p->get_updated_html() );
	}

	/**
	 * Tests that the `process_directives` returns the same HTML if it contains
	 * unbalanced tags.
	 *
	 * @covers ::process_directives
	 */
	public function test_process_directives_doesnt_change_html_if_contains_unbalanced_tags() {
		$this->interactivity->state( 'myPlugin', array( 'id' => 'some-id' ) );

		$html_samples = array(
			'<div data-wp-bind--id="myPlugin::state.id">Inner content</div></div>',
			'<div data-wp-bind--id="myPlugin::state.id">Inner content</div><div>',
			'<div><div data-wp-bind--id="myPlugin::state.id">Inner content</div>',
			'</div><div data-wp-bind--id="myPlugin::state.id">Inner content</div>',
			'<div data-wp-bind--id="myPlugin::state.id">Inner<div>content</div>',
			'<div data-wp-bind--id="myPlugin::state.id">Inner</div>content</div>',
			'<div data-wp-bind--id="myPlugin::state.id"><span>Inner content</div>',
			'<div data-wp-bind--id="myPlugin::state.id">Inner content</div></span>',
			'<div data-wp-bind--id="myPlugin::state.id"><span>Inner content</div></span>',
			'<div data-wp-bind--id="myPlugin::state.id">Inner conntent</ ></div>',
		);

		foreach ( $html_samples as $html ) {
			$processed_html = $this->interactivity->process_directives( $html );
			$p              = new WP_HTML_Tag_Processor( $processed_html );
			$p->next_tag();
			$this->assertNull( $p->get_attribute( 'id' ) );
		}
	}

	/**
	 * Invokes the private `evaluate` method of WP_Interactivity_API class.
	 *
	 * @param string $directive_value The directive attribute value to evaluate.
	 * @return mixed The result of the evaluate method.
	 */
	private function evaluate( $directive_value ) {
		$generate_state = function ( $name ) {
			return array(
				'key'    => $name,
				'nested' => array( 'key' => $name . '-nested' ),
			);
		};
		$this->interactivity->state( 'myPlugin', $generate_state( 'myPlugin-state' ) );
		$this->interactivity->state( 'otherPlugin', $generate_state( 'otherPlugin-state' ) );
		$context  = array(
			'myPlugin'    => $generate_state( 'myPlugin-context' ),
			'otherPlugin' => $generate_state( 'otherPlugin-context' ),
		);
		$evaluate = new ReflectionMethod( $this->interactivity, 'evaluate' );
		$evaluate->setAccessible( true );
		return $evaluate->invokeArgs( $this->interactivity, array( $directive_value, 'myPlugin', $context ) );
	}

	/**
	 * Tests that the `evaluate` method operates correctly for valid expressions.
	 *
	 * @covers ::evaluate
	 */
	public function test_evaluate_value() {
		$result = $this->evaluate( 'state.key' );
		$this->assertEquals( 'myPlugin-state', $result );

		$result = $this->evaluate( 'context.key' );
		$this->assertEquals( 'myPlugin-context', $result );

		$result = $this->evaluate( 'otherPlugin::state.key' );
		$this->assertEquals( 'otherPlugin-state', $result );

		$result = $this->evaluate( 'otherPlugin::context.key' );
		$this->assertEquals( 'otherPlugin-context', $result );
	}

	/**
	 * Tests that the `evaluate` method operates correctly when used with negation
	 * (!).
	 *
	 * @covers ::evaluate
	 */
	public function test_evaluate_value_negation() {
		$result = $this->evaluate( '!state.key' );
		$this->assertFalse( $result );

		$result = $this->evaluate( '!context.key' );
		$this->assertFalse( $result );

		$result = $this->evaluate( 'otherPlugin::!state.key' );
		$this->assertFalse( $result );

		$result = $this->evaluate( 'otherPlugin::!context.key' );
		$this->assertFalse( $result );
	}

	/**
	 * Tests the `evaluate` method with non-existent paths.
	 *
	 * @covers ::evaluate
	 */
	public function test_evaluate_non_existent_path() {
		$result = $this->evaluate( 'state.nonExistentKey' );
		$this->assertNull( $result );

		$result = $this->evaluate( 'context.nonExistentKey' );
		$this->assertNull( $result );

		$result = $this->evaluate( 'otherPlugin::state.nonExistentKey' );
		$this->assertNull( $result );

		$result = $this->evaluate( 'otherPlugin::context.nonExistentKey' );
		$this->assertNull( $result );

		$result = $this->evaluate( ' state.key' ); // Extra space.
		$this->assertNull( $result );

		$result = $this->evaluate( 'otherPlugin:: state.key' ); // Extra space.
		$this->assertNull( $result );
	}

	/**
	 * Tests the `evaluate` method for retrieving nested values.
	 *
	 * @covers ::evaluate
	 */
	public function test_evaluate_nested_value() {
		$result = $this->evaluate( 'state.nested.key' );
		$this->assertEquals( 'myPlugin-state-nested', $result );

		$result = $this->evaluate( 'context.nested.key' );
		$this->assertEquals( 'myPlugin-context-nested', $result );

		$result = $this->evaluate( 'otherPlugin::state.nested.key' );
		$this->assertEquals( 'otherPlugin-state-nested', $result );

		$result = $this->evaluate( 'otherPlugin::context.nested.key' );
		$this->assertEquals( 'otherPlugin-context-nested', $result );
	}
}
