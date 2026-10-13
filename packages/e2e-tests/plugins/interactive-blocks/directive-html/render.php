<?php
/**
 * HTML for testing the directive `data-wp-html`.
 *
 * @package gutenberg-test-interactive-blocks
 */
?>

<div data-wp-interactive="directive-html">
	<div data-wp-html="state.html" data-testid="show state html">
		<p data-testid="fallback">Fallback content</p>
	</div>

	<button data-wp-on--click="actions.setHtml" data-testid="set html">
		Set HTML
	</button>

	<button
		data-wp-on--click="actions.setLoading"
		data-testid="set loading"
	>
		Set Loading
	</button>

	<button
		data-wp-on--click="actions.setPlainString"
		data-testid="set plain string"
	>
		Set Plain String
	</button>

	<div data-wp-html--suffix="state.html" data-testid="ignores suffixes">
		<span data-testid="suffix-fallback">Suffix fallback</span>
	</div>

	<div
		data-wp-html---unique-id="state.html"
		data-testid="ignores unique-ids"
	>
		<span data-testid="unique-id-fallback">Unique ID fallback</span>
	</div>
</div>
