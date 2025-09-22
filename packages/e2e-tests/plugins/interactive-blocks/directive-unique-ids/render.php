<?php
/**
 * HTML for testing directive unique IDs.
 *
 * @package gutenberg-test-interactive-blocks
 */
?>

<!-- Test 1: Multiple contexts with unique IDs merge correctly -->
<div data-wp-interactive='{"namespace": "directive-unique-ids-test"}'>
	<div
		data-wp-context---plugin-a='{"propA": "valueA", "shared": "fromA"}'
		data-wp-context---plugin-b='{"propB": "valueB", "shared": "fromB"}'
	>
		<pre data-testid="context-merge" data-wp-bind--children="state.renderContext"></pre>
	</div>
</div>

<!-- Test 2: Multiple contexts with different namespaces -->
<div>
	<div
		data-wp-interactive='{"namespace": "namespace-a"}'
		data-wp-context---id1='{"prop": "fromA"}'
	>
		<div
			data-wp-interactive='{"namespace": "namespace-b"}'
			data-wp-context---id2='{"prop": "fromB"}'
		>
			<span data-testid="ns-a" data-wp-text="namespace-a::context.prop"></span>
			<span data-testid="ns-b" data-wp-text="namespace-b::context.prop"></span>
		</div>
	</div>
</div>

<!-- Test 3: Multiple event handlers with unique IDs -->
<div data-wp-interactive='{"namespace": "directive-unique-ids-test"}'>
	<button
		data-testid="multi-click"
		data-wp-on--click---handler1="actions.clickHandler1"
		data-wp-on--click---handler2="actions.clickHandler2"
	>
		Click me
	</button>
	<span data-testid="click-handler1-count" data-wp-text="state.clickHandler1Count"></span>
	<span data-testid="click-handler2-count" data-wp-text="state.clickHandler2Count"></span>
</div>

<!-- Test 4: Multiple watch directives with unique IDs -->
<div
	data-wp-interactive='{"namespace": "directive-unique-ids-test"}'
	data-wp-context='{"counter": 0}'
	data-wp-watch---watcher1="callbacks.watcher1"
	data-wp-watch---watcher2="callbacks.watcher2"
>
	<button data-testid="increment-button" data-wp-on--click="actions.increment">Increment</button>
	<span data-testid="counter" data-wp-text="context.counter"></span>
	<span data-testid="watcher1-count" data-wp-text="state.watcher1Count"></span>
	<span data-testid="watcher2-count" data-wp-text="state.watcher2Count"></span>
</div>

<!-- Test 5: Multiple init directives with unique IDs -->
<div
	data-wp-interactive='{"namespace": "directive-unique-ids-test"}'
	data-wp-init---init1="actions.initHandler1"
	data-wp-init---init2="actions.initHandler2"
>
	<span data-testid="init1-count" data-wp-text="state.initHandler1Count"></span>
	<span data-testid="init2-count" data-wp-text="state.initHandler2Count"></span>
</div>

<!-- Test 6: Backward compatibility - directives without unique IDs -->
<div data-wp-interactive='{"namespace": "directive-unique-ids-test"}'>
	<div data-wp-context='{"backwardCompat": "working"}'>
		<button
			data-testid="backward-compat-button"
			data-wp-on--click="actions.clickHandler1"
		>
			Backward Compatible
		</button>
		<span data-testid="backward-compat-text" data-wp-text="context.backwardCompat"></span>
	</div>
</div>

<!-- Test 7: Complex suffixes with unique IDs -->
<div data-wp-interactive='{"namespace": "directive-unique-ids-test"}'>
	<button
		data-testid="complex-suffix"
		data-wp-on--click---unique-id="actions.clickHandler1"
	>
		Complex Suffix
	</button>
</div>