<?php
/**
 * Block for testing overlapping `renderHTML()` re-renders — a subset or a
 * superset of a previous call, across sibling containers.
 *
 * @package gutenberg-test-interactive-blocks
 *
 * @phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable
 */
?>
<div
	data-wp-interactive="test/render-element-array"
	data-wp-context='{ "count": 0 }'
>
	<button
		data-wp-on--click="actions.loadTwo"
		data-testid="load-two"
	>
		Load two
	</button>
	<button
		data-wp-on--click="actions.shrink"
		data-testid="shrink"
	>
		Re-render slot A
	</button>
	<button
		data-wp-on--click="actions.loadOne"
		data-testid="load-one"
	>
		Load one
	</button>
	<button
		data-wp-on--click="actions.grow"
		data-testid="grow"
	>
		Grow to two
	</button>
	<div data-testid="array-target">
		<div data-testid="slot-a"></div>
		<div data-testid="slot-b"></div>
	</div>
</div>
