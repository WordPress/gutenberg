<?php
/**
 * HTML for testing `afterLoad` callbacks added to the store.
 *
 * @package gutenberg-test-interactive-blocks
 */

?>
<div data-wp-interactive>
	<h3>Store statuses</h3>
	<p data-store-status data-wp-text="state.status1">waiting</p>
	<p data-store-status data-wp-text="state.status2">waiting</p>
	<p data-store-status data-wp-text="state.status3">waiting</p>
	<p data-store-status data-wp-text="state.status4">waiting</p>

	<h3><code>afterLoad</code> executions</h3>
	<p>All stores ready:&#20;
		<span
			data-testid="all-stores-ready"
			data-wp-text="state.allStoresReady">
		>waiting</span>
	</p>
	<p>vDOM ready:&#20;
		<span
			data-testid="vdom-ready"
			data-wp-text="state.vdomReady">
		>waiting</span>
	</p>
	<p><code>afterLoad</code> exec times:&#20;
		<span
			data-testid="after-load-exec-times"
			data-wp-text="state.execTimes.afterLoad">
		>0</span>
	</p>
	<p><code>sharedAfterLoad</code> exec times:&#20;
		<span
			data-testid="shared-after-load-exec-times"
			data-wp-text="state.execTimes.sharedAfterLoad">
		>0</span>
	</p>
</div>
