<?php
/**
 * Block for testing `renderHTML()` with router regions.
 *
 * Renders the same router region ID (`test/region`) that the
 * `test/render-html` block inserts via `renderHTML()`, so navigating
 * between the two pages swaps the region's content.
 *
 * @package e2e-interactivity
 */
?>
<div
	data-wp-interactive="test/render-html"
	data-wp-router-region="test/region"
>
	<p data-testid="region-server">server content</p>
</div>
