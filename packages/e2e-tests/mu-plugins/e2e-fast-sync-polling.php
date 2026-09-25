<?php
/**
 * MU-plugin: Speed up collaboration sync polling in e2e tests.
 *
 * The sync module reads its polling intervals via applyFilters at load time,
 * so the filters must be registered before the wp-sync script executes.
 * Hooked to admin_init so the wp-sync handle is already registered.
 */
add_action(
	'enqueue_block_editor_assets',
	function () {
		wp_add_inline_script(
			'wp-sync',
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
