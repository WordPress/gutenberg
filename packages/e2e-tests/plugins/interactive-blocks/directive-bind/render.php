<?php
/**
 * HTML for testing the directive `data-wp-bind`.
 *
 * @package gutenberg-test-interactive-blocks
 */

?>
<div data-wp-interactive>
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
			'false'          => '{ "disabled": false }',
			'true'           => '{ "disabled": true }',
			'string "false"' => '{ "disabled": "false" }',
			'string "true"'  => '{ "disabled": "true" }',
			'null'           => '{ "disabled": null }',
			'undefined'      => '{ "other": "other" }',
			'empty string'   => '{ "disabled": "" }',
			'any string'     => '{ "disabled": "any" }',
		);
	?>

	<?php foreach( $hydration_cases as $type => $context ): ?>
	<div
		data-testid='hydrating <?php echo $type; ?>'
		data-wp-context='<?php echo $context; ?>'
	>
		<input
			type="text"
			data-testid="input"
			data-wp-bind--disabled="context.disabled"
			data-wp-bind--aria-disabled="context.disabled"
			data-wp-bind--data-disabled="context.disabled"
		>
		<button
			data-testid="toggle-prop"
			data-wp-on--click="actions.toggleDisabled"
		>Toggle</button>
	</div>
	<?php endforeach; ?>
</div>
