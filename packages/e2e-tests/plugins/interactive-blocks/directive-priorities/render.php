<?php
/**
 * HTML for testing priorities between directives.
 *
 * @package gutenberg-test-interactive-blocks
 */

?>
<div data-wp-interactive>
	<pre data-testid="execution order"></pre>

	<!-- Element with test directives -->
	<div
		data-testid="test directives"
		data-wp-test-attribute
		data-wp-test-children
		data-wp-test-text
		data-wp-test-context
	></div>
</div>

<div data-testid="non-existent-directives">
	<div data-wp-interactive ><div data-wp-non-existent-directive></div></div>
</div>
