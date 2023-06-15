<?php
/**
 * HTML for testing the directive `data-wp-show`.
 *
 * @package gutenberg-test-interactive-blocks
 */

?>
<div data-wp-interactive>
	<button
		data-wp-on--click="actions.toggleTrueValue"
		data-testid="toggle trueValue"
	>
		Toggle trueValue
	</button>

	<button
		data-wp-on--click="actions.toggleFalseValue"
		data-testid="toggle falseValue"
	>
		Toggle falseValue
	</button>

	<div
		data-wp-show="state.trueValue"
		id="truthy-div"
		data-testid="show if callback returns truthy value"
	>
		<p>trueValue children</p>
	</div>

	<div
		data-wp-show="state.falseValue"
		data-testid="do not show if callback returns false value"
	>
		<p>falseValue children</p>
	</div>

	<div data-wp-context='{ "falseValue": false }'>
		<div
			data-wp-show="context.falseValue"
			data-testid="can use context values"
		>
			falseValue
		</div>
		<button
			data-wp-on--click="actions.toggleContextFalseValue"
			data-testid="toggle context false value"
		>
			Toggle context falseValue
		</button>
	</div>
</div>
