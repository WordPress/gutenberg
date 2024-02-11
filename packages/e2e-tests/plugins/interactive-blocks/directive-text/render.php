<?php
/**
 * HTML for testing the directive `data-wp-text`.
 *
 * @package gutenberg-test-interactive-blocks
 */

wp_enqueue_script_module( 'directive-text-view' );
?>

<div data-wp-interactive='{ "namespace": "directive-context" }'>
	<div>
		<span
			data-wp-text="state.text"
			data-testid="show state text"
		></span>
		<button
			data-wp-on--click="actions.toggleStateText"
			data-testid="toggle state text"
		>
			Toggle State Text
		</button>
	</div>

	<div data-wp-context='{ "text": "Text 1" }'>
		<span
			data-wp-text="context.text"
			data-testid="show context text"
		></span>
		<button
			data-wp-on--click="actions.toggleContextText"
			data-testid="toggle context text"
		>
			Toggle Context Text
		</button>
	</div>
	<div>
		<span
			data-wp-text="state.component"
			data-testid="show state component"
		></span>
		<span
			data-wp-text="state.number"
			data-testid="show state number"
		></span>
		<span
			data-wp-text="state.boolean"
			data-testid="show state boolean"
		></span>
	</div>
</div>
