<?php
/**
 * HTML for testing the directive `data-wp-on`.
 *
 * @package gutenberg-test-interactive-blocks
 */
?>

<?php // A wrong directive name like "data-wp-on--" should not kill the interactivity. ?>
<div data-wp-interactive="directive-on" data-wp-on--="">
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
	<div data-wp-context='{"clicked":false,"clickCount":0,"isOpen":true}'>
		<p
			data-wp-text="context.clicked"
			data-testid="multiple handlers clicked"
		>false</p>
		<p
			data-wp-text="context.clickCount"
			data-testid="multiple handlers clickCount"
		>0</p>
		<p
			data-wp-text="context.isOpen"
			data-testid="multiple handlers isOpen"
		>true</p>
		<button
			data-testid="multiple handlers button"
			data-wp-on--click="actions.setClicked"
			data-wp-on--click--counter="actions.countClick"
			data-wp-on--click--toggle="actions.toggle"
		>Click me!</button>
	</div>
</div>
