import { privateApis } from '@wordpress/interactivity';

/** The runtime's directive attribute name parser for internal consumers. */
const { parseDirectiveName } = privateApis(
	'I acknowledge that using private APIs means my theme or plugin will inevitably break in the next version of WordPress.'
);

/** Prefix of attributes eligible for directive name parsing in `toVdom()`. */
const directivePrefix = 'data-wp-';

/**
 * Finds the closest element, starting with `element` itself, whose content is
 * inert `data-wp-html` content.
 *
 * Inside an interactive region, this mirrors `toVdom()`: the element has a
 * `data-wp-html` entry without a suffix (as parsed by `parseDirectiveName()`;
 * a unique ID is allowed), and no `data-wp-text`, `data-wp-each` or
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
			const { prefix, suffix } = parsed;
			if ( prefix === 'html' && suffix === null ) {
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
