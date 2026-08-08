<?php
/**
 * Block for testing `renderElement()` with router regions.
 *
 * Renders the same router region ID (`test/region`) that the
 * `test/render-element` block inserts via `renderElement()`, so navigating
 * between the two pages swaps the region's content.
 *
 * @package e2e-interactivity
 */
?>
<div
	data-wp-interactive="test/render-element"
	data-wp-router-region="test/region"
>
	<p data-testid="region-server">server content</p>
</div>
