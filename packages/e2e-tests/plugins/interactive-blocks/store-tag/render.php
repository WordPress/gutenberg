<?php
/**
 * HTML for testing the hydration of the serialized store.
 *
 * @package gutenberg-test-interactive-blocks
 *
 * @phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable
 */

wp_enqueue_script_module( 'store-tag-view' );

// These variables simulates SSR.
$test_store_tag_counter = 'ok' === $attributes['condition'] ? 3 : 0;
$test_store_tag_double  = $test_store_tag_counter * 2;
?>

<div data-wp-interactive='{ "namespace": "store-tag" }'>
	<div>
		Counter:
		<span
			data-wp-bind--children="state.counter.value"
			data-testid="counter value"
			><?php echo $test_store_tag_counter; ?></span
		>
		<br />
		Double:
		<span
			data-wp-bind--children="state.counter.double"
			data-testid="counter double"
			><?php echo $test_store_tag_double; ?></span
		>
		<br />
		<button
			data-wp-on--click="actions.counter.increment"
			data-testid="counter button"
		>
			+1
		</button>
		<span
			data-wp-bind--children="state.counter.clicks"
			data-testid="counter clicks"
			>0</span
		>
		clicks
	</div>
</div>
<?php

if ( 'missing' !== $attributes['condition'] ) {

	if ( 'ok' === $attributes['condition'] ) {
		$test_store_tag_json = '{ "state": { "store-tag": { "counter": { "value": 3 } } } }';
	}

	if ( 'corrupted-json' === $attributes['condition'] ) {
		$test_store_tag_json = 'this is not a JSON';
	}

	if ( 'invalid-state' === $attributes['condition'] ) {
		$test_store_tag_json = 'null';
	}

	echo <<<HTML
	<script type="application/json" id="wp-interactivity-data">
		$test_store_tag_json
	</script>
HTML;
}
