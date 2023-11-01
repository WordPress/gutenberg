/**
 * Internal dependencies
 */
import { Children, createElement } from './react';

/** @typedef {{children: string} & import('react').ComponentPropsWithoutRef<'div'>} RawHTMLProps */

/**
 * Component used as equivalent of Fragment with unescaped HTML, in cases where
 * it is desirable to render dangerous HTML without needing a wrapper element.
 * To preserve additional props, a `div` wrapper _will_ be created if any props
 * aside from `children` are passed.
 *
 * @param {RawHTMLProps} props Children should be a string of HTML or an array
 *                             of strings. Other props will be passed through
 *                             to the div wrapper.
 *
 * @return {JSX.Element} Dangerously-rendering component.
 */
export default function RawHTML( { children, ...props } ) {
	let rawHtml = '';

	// Cast children as an array, and concatenate each element if it is a string.
	Children.toArray( children ).forEach( ( child ) => {
		if ( typeof child === 'string' && child.trim() !== '' ) {
			rawHtml += child;
		}
	} );

	// The `div` wrapper will be stripped by the `renderElement` serializer in
	// `./serialize.js` unless there are non-children props present.
	return createElement( 'div', {
		dangerouslySetInnerHTML: { __html: rawHtml },
		...props,
	} );
}
