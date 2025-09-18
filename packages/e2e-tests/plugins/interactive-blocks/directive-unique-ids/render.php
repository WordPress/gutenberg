<?php
/**
 * HTML for testing directive unique IDs.
 *
 * @package gutenberg-test-interactive-blocks
 */
?>

<div data-wp-interactive='{"namespace": "directive-unique-ids"}'>
	<!-- Test multiple contexts with unique IDs -->
	<div
		data-wp-context='{ "prop1": "context1", "shared": "from-first" }'
		data-wp-context---second='{ "prop2": "context2", "shared": "from-second" }'
		data-wp-context---third='{ "prop3": "context3", "nested": { "value": "deep" } }'
	>
		<div data-testid="multiple contexts result" data-wp-text="state.contextResult"></div>
		<button data-testid="show context" data-wp-on--click="actions.showMergedContext">Show Context</button>
	</div>

	<!-- Test multiple watchers with unique IDs -->
	<div
		data-wp-context='{ "counter": 0, "watchCount1": 0, "watchCount2": 0 }'
		data-wp-watch="callbacks.watchCounter"
		data-wp-watch---second="callbacks.watchCounter2"
	>
		<div data-testid="counter" data-wp-text="context.counter"></div>
		<div data-testid="watch1 count" data-wp-text="context.watchCount1"></div>
		<div data-testid="watch2 count" data-wp-text="context.watchCount2"></div>
		<button data-testid="increment counter" data-wp-on--click="actions.incrementCounter">Increment</button>
	</div>

	<!-- Test multiple init functions with unique IDs -->
	<div
		data-wp-context='{ "init1Called": false, "init2Called": false, "init3Called": false }'
		data-wp-init="callbacks.init1"
		data-wp-init---second="callbacks.init2"
		data-wp-init---third="callbacks.init3"
	>
		<div data-testid="init1 called" data-wp-text="context.init1Called"></div>
		<div data-testid="init2 called" data-wp-text="context.init2Called"></div>
		<div data-testid="init3 called" data-wp-text="context.init3Called"></div>
	</div>

	<!-- Test unsupported directives with unique IDs (should show warnings) -->
	<div data-wp-context='{ "testStyle": true, "testClass": true, "testText": "sample", "testBind": "value" }'>
		<div
			data-testid="unsupported style"
			data-wp-style--color---unique="state.testStyle ? 'red' : 'blue'"
			data-wp-text="'Style directive with unique ID'"
		></div>
		<div
			data-testid="unsupported class"
			data-wp-class--active---unique="state.testClass"
			data-wp-text="'Class directive with unique ID'"
		></div>
		<div
			data-testid="unsupported text"
			data-wp-text---unique="state.testText"
		></div>
		<input
			data-testid="unsupported bind"
			data-wp-bind--value---unique="state.testBind"
			type="text"
		/>
	</div>

	<!-- Test mixed suffixes and unique IDs -->
	<div
		data-wp-context='{ "clickCount1": 0, "clickCount2": 0 }'
	>
		<button
			data-testid="mixed click handler"
			data-wp-on--click="actions.increment1"
			data-wp-on--click---second="actions.increment2"
			data-wp-text="context.clickCount1 + context.clickCount2"
		></button>
		<div data-testid="click1 count" data-wp-text="context.clickCount1"></div>
		<div data-testid="click2 count" data-wp-text="context.clickCount2"></div>
	</div>

	<!-- Test complex scenario: nested contexts with unique IDs -->
	<div
		data-wp-context='{ "level": "parent", "data": { "parent": true } }'
		data-wp-context---plugin1='{ "plugin1": "active", "data": { "plugin1": true } }'
	>
		<div data-testid="parent level" data-wp-text="context.level"></div>
		<div
			data-wp-context='{ "level": "child", "data": { "child": true } }'
			data-wp-context---plugin2='{ "plugin2": "active", "data": { "plugin2": true } }'
		>
			<div data-testid="child level" data-wp-text="context.level"></div>
			<div data-testid="merged data" data-wp-text="state.mergedDataResult"></div>
			<button data-testid="show merged data" data-wp-on--click="actions.showMergedData">Show Data</button>
		</div>
	</div>
</div>