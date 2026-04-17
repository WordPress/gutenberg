/**
 * Internal dependencies
 */
import { Children, createElement } from './react';

/**
 * Props for the RawHTML component.
 */
export type RawHTMLProps = {
	children: string | string[];
} & React.ComponentPropsWithoutRef< 'div' >;

/**
 * Component used to render unescaped HTML.
 *
 * Note: The `renderElement` serializer will remove the `div` wrapper
 * unless non-children props are present; typically when preparing a block for saving.
 *
 * @example
 * ```jsx
 * import { RawHTML } from '@wordpress/element';
 *
 * const Component = () => <RawHTML><h3>Hello world</h3></RawHTML>;
 * // Edit: <div><h3>Hello world</h3></div>
 * // save: <h3>Hello world</h3>
 * ```
 *
 * @param {RawHTMLProps} props Children should be a string of HTML or an array
 *                             of strings. Other props will be passed through
 *                             to the div wrapper.
 *
 * @return Dangerously-rendering component.
 */
export default function RawHTML( { children, ...props }: RawHTMLProps ) {
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
