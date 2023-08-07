<?php
/**
 * HTML for testing the directive `data-wp-effect`.
 *
 * @package gutenberg-test-interactive-blocks
 */

?>
<div data-wp-interactive>
	<div data-wp-show-mock="state.isOpen">
		<input
			data-testid="input"
			data-wp-effect="effects.elementAddedToTheDOM"
		/>
	</div>

	<div
		data-wp-text="selectors.elementInTheDOM"
		data-testid="element in the DOM"
	></div>

	<div data-wp-effect="effects.changeFocus"></div>

	<button data-testid="toggle" data-wp-on--click="actions.toggle">
		Update
	</button>
</div>
