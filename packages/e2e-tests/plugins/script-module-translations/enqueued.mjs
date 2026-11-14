/**
 * Script module that the test page enqueues.
 */

const { __ } = window.wp.i18n;

export function render( element ) {
	// eslint-disable-next-line @wordpress/i18n-text-domain -- Like any plugin, this one uses its own text domain.
	element.textContent = __(
		'This string comes from an enqueued script module.',
		'gutenberg-test-script-module-translations'
	);
}

render(
	document.getElementById(
		'gutenberg-test-script-module-translations-enqueued'
	)
);
