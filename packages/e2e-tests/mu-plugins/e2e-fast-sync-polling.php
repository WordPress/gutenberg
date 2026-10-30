<?php
/**
 * MU-plugin: Speed up collaboration sync polling in e2e tests.
 *
 * The sync module reads its polling intervals via applyFilters at load time.
 * The sync module is bundled into the wp-core-data script, so the filters
 * must be registered before that script executes.
 */
add_action(
	'enqueue_block_editor_assets',
	function () {
		wp_add_inline_script(
			'wp-core-data',
			<<<'JS'
wp.hooks.addFilter(
	'sync.pollingManager.pollingInterval',
	'e2e-tests',
	() => 500
);
wp.hooks.addFilter(
	'sync.pollingManager.pollingIntervalWithCollaborators',
	'e2e-tests',
	() => 100
);
JS,
			'before'
		);
	}
);
