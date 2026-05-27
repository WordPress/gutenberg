/**
 * External dependencies
 */
// @ts-ignore
export { attr, prop, text, query } from 'hpq';

/**
 * WordPress dependencies
 */
import { RichTextData } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
export { matcher as node } from './node';
export { matcher as children } from './children';

export function html(
	selector?: string,
	multilineTag?: string
): ( domNode: Element ) => string {
	return ( domNode: Element ): string => {
		let match: Element | null = domNode;

		if ( selector ) {
			match = domNode.querySelector( selector );
		}

		if ( ! match ) {
			return '';
		}

		if ( multilineTag ) {
			let value = '';
			const length = match.children.length;

			for ( let index = 0; index < length; index++ ) {
				const child = match.children[ index ];

				if ( child.nodeName.toLowerCase() !== multilineTag ) {
					continue;
				}

				value += child.outerHTML;
			}

			return value;
		}

		return match.innerHTML;
	};
}

export const richText =
	( selector?: string, preserveWhiteSpace?: boolean ) =>
	( el: Element ): RichTextData => {
		const target = selector ? el.querySelector( selector ) : el;
		return target
			? RichTextData.fromHTMLElement( target as HTMLElement, {
					preserveWhiteSpace,
			  } )
			: RichTextData.empty();
	};
