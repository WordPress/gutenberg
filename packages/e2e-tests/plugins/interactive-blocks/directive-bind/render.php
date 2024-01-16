<?php
/**
 * HTML for testing the directive `data-wp-bind`.
 *
 * @package gutenberg-test-interactive-blocks
 */

wp_enqueue_script_module( 'directive-bind-view' );
?>

<div data-wp-interactive='{ "namespace": "directive-bind" }'>
	<a
		data-wp-bind--href="state.url"
		data-testid="add missing href at hydration"
	></a>

	<a
		href="/other-url"
		data-wp-bind--href="state.url"
		data-testid="change href at hydration"
	></a>

	<input
		type="checkbox"
		data-wp-bind--checked="state.checked"
		data-testid="add missing checked at hydration"
	/>

	<input
		type="checkbox"
		checked
		data-wp-bind--checked="!state.checked"
		data-testid="remove existing checked at hydration"
	/>

	<a
		href="/other-url"
		data-wp-bind--href="state.url"
		data-testid="nested binds - 1"
	>
		<img
			width="1"
			data-wp-bind--width="state.width"
			data-testid="nested binds - 2"
		/>
	</a>

	<button data-testid="toggle" data-wp-on--click="actions.toggle">
		Update
	</button>

	<p
		data-wp-bind--hidden="!state.show"
		data-wp-bind--aria-hidden="!state.show"
		data-wp-bind--aria-expanded="state.show"
		data-wp-bind--data-some-value="state.show"
		data-testid="check enumerated attributes with true/false exist and have a string value"
	>
		Some Text
	</p>

	<?php
	$hydration_cases = array(
		'false'       => '{ "value": false }',
		'true'        => '{ "value": true }',
		'null'        => '{ "value": null }',
		'undef'       => '{ "__any": "any" }',
		'emptyString' => '{ "value": "" }',
		'anyString'   => '{ "value": "any" }',
		'number'      => '{ "value": 10 }',
	);
	?>

	<?php foreach ( $hydration_cases as $type => $context ) : ?>
	<div
		data-testid='hydrating <?php echo $type; ?>'
		data-wp-context='<?php echo $context; ?>'
	>
		<img
			alt="Red dot"
			data-testid="image"
			data-wp-bind--width="context.value"
			src="data:image/png;base64, iVBORw0KGgoAAAANSUhEUgAAAAUA
			AAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO
			9TXL0Y4OHwAAAABJRU5ErkJggg=="
		>
		<input
			type="text"
			data-testid="input"
			data-wp-bind--name="context.value"
			data-wp-bind--value="context.value"
			data-wp-bind--disabled="context.value"
			data-wp-bind--aria-disabled="context.value"
		>
		<button
			data-testid="toggle value"
			data-wp-on--click="actions.toggleValue"
		>Toggle</button>
	</div>
	<?php endforeach; ?>
</div>
