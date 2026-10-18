<?php
/**
 * HTML for testing the directive `data-wp-html`.
 *
 * @package gutenberg-test-interactive-blocks
 */

wp_interactivity_state(
	'directive-html',
	array(
		'serverHtml' => array( 'wpServerHtml' => true ),
	)
);
?>

<div data-wp-interactive="directive-html">
	<span data-wp-text="state.hydration" data-testid="hydration">not hydrated</span>
	<button data-wp-on--click="actions.setTrustedHtml" data-testid="set trusted html">
		Set Trusted HTML
	</button>

	<div data-wp-html="state.html" data-testid="show state html">
		<p data-testid="fallback">Fallback content</p>
	</div>
	<div data-wp-html="state.rejected" data-testid="rejected html"><p>Rejected fallback</p></div>
	<div data-wp-html="state.serverHtml" data-testid="server html"><p>Server-rendered HTML</p></div>
	<button data-wp-on--click="actions.setServerHtml" data-testid="set server html">Set Server HTML</button>
	<ul data-testid="created items">
		<template data-wp-each="state.list"><li><div data-wp-html="state.empty"></div></li></template>
	</ul>
	<button data-wp-on--click="actions.setRejected" data-testid="set rejected html">Set Rejected HTML</button>

	<button data-wp-on--click="actions.setHtml" data-testid="set html">
		Set HTML
	</button>

	<button
		data-wp-on--click="actions.setLoading"
		data-testid="set loading"
	>
		Set Loading
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
