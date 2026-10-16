import { privateApis } from '@wordpress/interactivity';

/** The runtime's directive attribute name parser for internal consumers. */
const { parseDirectiveName } = privateApis(
	'I acknowledge that using private APIs means my theme or plugin will inevitably break in the next version of WordPress.'
);

/** Prefix of attributes eligible for directive name parsing in `toVdom()`. */
const directivePrefix = 'data-wp-';

/**
 * Finds the nearest inclusive ancestor whose content belongs to `data-wp-html`.
 * Inside an interactive region, a default HTML entry owns content only when no
 * text, each or router-region entry takes precedence, as in `toVdom()`.
 *
 * @param element The element to start from, or null.
 * @return The nearest qualifying element, or null when none exists.
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
