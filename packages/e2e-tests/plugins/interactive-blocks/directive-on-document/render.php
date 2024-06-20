<?php
/**
 * HTML for testing the directive `data-wp-on`.
 *
 * @package gutenberg-test-interactive-blocks
 */
?>

<div data-wp-interactive="directive-on-document">
	<button
		data-testid="visibility"
		data-wp-on--click="actions.visibilityHandler"
	>
		Switch visibility
	</button>

	<div data-wp-text="state.isEventAttached" data-testid="isEventAttached">no</div>

	<div data-wp-show-mock="state.isVisible">
		<div
			data-wp-on-document--keydown="callbacks.keydownHandler"
			data-wp-init="callbacks.init"
		>
			<p data-wp-text="state.counter" data-testid="counter">0</p>
		</div>
	</div>
	<div data-wp-on-document--keydown="actions.keydownHandler" data-wp-on-document--keydown--second="actions.keydownSecondHandler">
		<p data-wp-text="state.keydownHandler" data-testid="keydownHandler">no</p>
		<p data-wp-text="state.keydownSecondHandler" data-testid="keydownSecondHandler">no</p>
	</div>
</div>
