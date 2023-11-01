<?php
/**
 * HTML for testing the directive `data-wp-bind`.
 *
 * @package gutenberg-test-interactive-blocks
 */

?>
<div
	data-wp-interactive
	data-wp-slot-provider
	data-wp-context='{ "text": "fill" }'
>
	<div data-testid="slots" data-wp-context='{ "text": "fill inside slots" }'>
		<div
			data-testid="slot-1"
			data-wp-key="slot-1"
			data-wp-slot="slot-1"
			data-wp-context='{ "text": "fill inside slot 1" }'
		>[1]</div>
		<div
			data-testid="slot-2"
			data-wp-key="slot-2"
			data-wp-slot='{ "name": "slot-2", "position": "before" }'
			data-wp-context='{ "text": "[2]" }'
			data-wp-text='context.text'
			data-wp-on--click="actions.updateSlotText"
		>[2]</div>
		<div
			data-testid="slot-3"
			data-wp-key="slot-3"
			data-wp-slot='{ "name": "slot-3", "position": "after" }'
			data-wp-context='{ "text": "[3]" }'
			data-wp-text='context.text'
			data-wp-on--click="actions.updateSlotText"
		>[3]</div>
		<div
			data-testid="slot-4"
			data-wp-key="slot-4"
			data-wp-slot='{ "name": "slot-4", "position": "children" }'
			data-wp-context='{ "text": "fill inside slot 4" }'
		>[4]</div>
		<div
			data-testid="slot-5"
			data-wp-key="slot-5"
			data-wp-slot='{ "name": "slot-5", "position": "replace" }'
			data-wp-context='{ "text": "fill inside slot 5" }'
		>[5]</div>
	</div>

	<div data-testid="fill-container">
		<span
			data-testid="fill"
			data-wp-fill="state.slot"
			data-wp-text="context.text"
		>initial</span>
	</div>

	<div data-wp-on--click="actions.changeSlot">
		<button data-testid="slot-1-button" data-slot="slot-1">slot-1</button>
		<button data-testid="slot-2-button" data-slot="slot-2">slot-2</button>
		<button data-testid="slot-3-button" data-slot="slot-3">slot-3</button>
		<button data-testid="slot-4-button" data-slot="slot-4">slot-4</button>
		<button data-testid="slot-5-button" data-slot="slot-5">slot-5</button>
		<button data-testid="reset" data-slot="">reset</button>
	</div>
</div>
