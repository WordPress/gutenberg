<?php
/**
 * HTML for testing the directive `data-wp-key`.
 *
 * @package gutenberg-test-interactive-blocks
 */
?>

<div
	data-wp-interactive="directive-key"
	data-wp-router-region="some-id"
>
	<ul>
		<li data-wp-key="id-2" data-testid="first-item">2</li>
		<li data-wp-key="id-3">3</li>
	</ul>
	<button data-testid="navigate" data-wp-on--click="actions.navigate">
		Navigate
	</button>
</div>
