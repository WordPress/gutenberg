import { privateApis } from '@wordpress/interactivity';

/** The runtime's directive attribute name parser for internal consumers. */
const { parseDirectiveName } = privateApis(
	'I acknowledge that using private APIs means my theme or plugin will inevitably break in the next version of WordPress.'
);

/** Prefix of attributes eligible for directive name parsing in `toVdom()`. */
const directivePrefix = 'data-wp-';

/** Keep host eligibility aligned with `interactivity/src/html.ts`. */
const unsupportedHtmlElements = new Set( [
	'area',
	'base',
	'basefont',
	'bgsound',
	'br',
	'col',
	'embed',
	'frame',
	'hr',
	'img',
	'input',
	'keygen',
	'link',
	'meta',
	'param',
	'source',
	'track',
	'wbr',
	'textarea',
	'title',
	'script',
	'style',
	'iframe',
	'xmp',
	'noembed',
	'noframes',
] );

/**
 * Finds the closest element, starting with `element` itself, whose content is
 * inert `data-wp-html` content.
 *
 * Inside an interactive region, this mirrors `toVdom()`: the host supports HTML
 * content, has a `data-wp-html` entry without a suffix or unique ID (as parsed
 * by `parseDirectiveName()`), and no `data-wp-text`, `data-wp-each` or
 * `data-wp-router-region` entry with any suffix or unique ID. Keep both in
 * sync; `test/html-directive-element.jsdom.test.ts` compares them.
 *
 * @param element The element to start from, or null.
 * @return The closest such element, or null when there is none.
 */
export function closestHtmlDirectiveElement(
	element: Element | null
): Element | null {
	for ( let current = element; current; current = current.parentElement ) {
		if ( ! current.closest( '[data-wp-interactive]' ) ) {
			return null;
		}
		if ( unsupportedHtmlElements.has( current.localName ) ) {
			continue;
		}
		let hasDefaultHtmlDirective = false;
		let hasConflict = false;
		for ( const { name } of current.attributes ) {
			if (
				! name[ directivePrefix.length ] ||
				! name.startsWith( directivePrefix )
			) {
				continue;
			}
			const parsed = parseDirectiveName( name );
			if ( ! parsed ) {
				continue;
			}
			const { prefix, suffix, uniqueId } = parsed;
			if ( prefix === 'html' && suffix === null && uniqueId === null ) {
				hasDefaultHtmlDirective = true;
			}
			if ( [ 'text', 'each', 'router-region' ].includes( prefix ) ) {
				hasConflict = true;
			}
		}
		if ( hasDefaultHtmlDirective && ! hasConflict ) {
			return current;
		}
	}
	return null;
}
