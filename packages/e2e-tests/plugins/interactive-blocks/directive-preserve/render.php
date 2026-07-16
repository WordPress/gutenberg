<?php
/**
 * HTML for testing the directive `data-wp-preserve`.
 *
 * @package gutenberg-test-interactive-blocks
 */
?>

<div
	data-wp-interactive="directive-preserve"
	data-wp-router-region="test/directive-preserve"
>
	<p data-testid="page-label">Page 1</p>
	<div id="preserved-widget" data-wp-preserve>
		<p data-testid="original-content">Original server content</p>
	</div>
	<button data-testid="navigate" data-wp-on--click="actions.navigate">
		Navigate
	</button>
</div>
