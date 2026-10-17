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
		'lazy'       => static function () {
			return null;
		},
	)
);

add_filter(
	'script_module_data_@wordpress/interactivity',
	/**
	 * Marks client-only values as pending until their fixture actions register.
	 *
	 * @param array|null $data Serialized Interactivity API server data.
	 * @return array Server data with the pending fixture value declarations.
	 */
	static function ( $data ) {
		$data = $data ?? array();
		$data['derivedStateClosures']['directive-html'] = array_merge(
			$data['derivedStateClosures']['directive-html'] ?? array(),
			array( 'state.lazy' )
		);
		return $data;
	}
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
	<button data-wp-on--click="actions.addFallback" data-testid="add fallback">Add fallback</button>
	<button data-wp-on--click="actions.addTwoFallbacks" data-testid="add two fallbacks">Add two fallbacks</button>
	<button data-wp-on--click="actions.addLazyItem" data-testid="add lazy item">Add lazy item</button>
	<button data-wp-on--click="actions.registerLazy" data-testid="register lazy">Register lazy value</button>
	<button data-wp-on--click="actions.addScriptItems" data-testid="add script items">Add script items</button>
	<ul data-testid="fallback items">
		<template data-wp-each="state.fallbackItems"><li><div data-wp-html="context.item.html"><p>Loading</p></div></li></template>
	</ul>
	<ul data-testid="lazy items">
		<template data-wp-each="state.lazyItems"><li><div data-wp-html="state.lazy"><p>Loading</p></div></li></template>
	</ul>
	<ul data-testid="script items">
		<template data-wp-each="state.scriptItems"><li><div data-wp-html="context.item.html"><p>Loading</p><script>window.fallbackRuns = ( window.fallbackRuns || 0 ) + 1;</script></div></li></template>
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
