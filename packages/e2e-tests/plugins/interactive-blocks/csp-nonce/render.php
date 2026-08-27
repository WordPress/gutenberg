<?php
/**
 * HTML for testing CSP nonce — inline expressions without unsafe-eval.
 *
 * @package gutenberg-test-interactive-blocks
 */
?>

<div data-wp-interactive="csp-nonce">
	<div>
		<span
			data-wp-text="state.count &gt; 0 ? 'yes' : 'no'"
			data-testid="csp text"
		></span>
		<button
			data-wp-on--click="actions.inc"
			data-testid="csp inc"
		>
			Inc
		</button>
		<span
			data-wp-text="state.count"
			data-testid="csp count"
		></span>
		<button
			data-wp-on--click="state.count = state.count + 1"
			data-testid="csp inline inc"
		>
			Inline Inc
		</button>
	</div>
</div>
