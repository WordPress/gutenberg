/**
 * Internal dependencies
 */
import { createElement } from './react';

// Disable reason: JSDoc linter doesn't seem to parse the union (`&`) correctly.
/* eslint-disable jsdoc/valid-types */
/** @typedef {{children: string} & import('react').ComponentPropsWithoutRef<'div'>} RawHTMLProps */
/* eslint-enable jsdoc/valid-types */

/**
 * Component used as equivalent of Fragment with unescaped HTML, in cases where
 * it is desirable to render dangerous HTML without needing a wrapper element.
 * To preserve additional props, a `div` wrapper _will_ be created if any props
 * aside from `children` are passed.
 *
 * @param {RawHTMLProps} props
 *
 * @return {JSX.Element} Dangerously-rendering component.
 */
export default function RawHTML( { children, ...props } ) {
	// The DIV wrapper will be stripped by serializer, unless there are
	// non-children props present.
	return createElement( 'div', {
		dangerouslySetInnerHTML: { __html: children },
		...props,
	} );
}
