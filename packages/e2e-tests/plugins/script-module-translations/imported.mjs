/**
 * Script module that only a classic script imports, through its
 * `module_dependencies`.
 */

const { __ } = window.wp.i18n;

export function render( element ) {
	// eslint-disable-next-line @wordpress/i18n-text-domain -- Like any plugin, this one uses its own text domain.
	element.textContent = __(
		'This string comes from a script module that a classic script imports.',
		'gutenberg-test-script-module-translations'
	);
}
