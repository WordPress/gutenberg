<?php
/**
 * HTML for testing the directive `data-wp-on`.
 *
 * @package gutenberg-test-interactive-blocks
 */

wp_enqueue_script_module( 'directive-on-view' );
?>

<div data-wp-interactive='{ "namespace": "directive-on" }'>
	<div>
		<p data-wp-text="state.counter" data-testid="counter">0</p>
		<button
			data-testid="button"
			data-wp-on--click="actions.clickHandler"
		>Click me!</button>
	</div>
	<div>
		<p data-wp-text="state.text" data-testid="text">initial</p>
		<input
			type="text"
			value="initial"
			data-testid="input"
			data-wp-on--input="actions.inputHandler"
		>
	</div>
	<div data-wp-context='{"option":"undefined"}'>
		<p data-wp-text="context.option" data-testid="option">0</p>
		<select
			name="pets"
			value="undefined"
			data-testid="select"
			data-wp-on--change="actions.selectHandler"
		>
			<option value="undefined">Choose an option...</option>
			<option value="dog">Dog</option>
			<option value="cat">Cat</option>
		</select>
	</div>
	<div
		data-wp-on--customevent="actions.customEventHandler"
		data-wp-context='{"customEvents":0}'
	>
		<p
			data-wp-text="context.customEvents"
			data-testid="custom events counter"
		>0</p>
		<button
			data-testid="custom events button"
			data-wp-on--click="actions.clickHandler"
		>Click me!</button>
	</div>
</div>
