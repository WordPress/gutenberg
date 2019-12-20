/**
 * Internal dependencies
 */
import { createElement } from './react';

/**
 * Component used as equivalent of Fragment with unescaped HTML, in cases where
 * it is desirable to render dangerous HTML without needing a wrapper element.
 * To preserve additional props, a `div` wrapper _will_ be created if any props
 * aside from `children` are passed.
 *
 * @param {Object} props
 * @param {string} props.children HTML to render.
 * @param {Object} props.props    Any additonal props to be set on the containing div.
 *
 * @return {WPComponent} Dangerously-rendering component.
 */
export default function RawHTML( { children, ...props } ) {
	// The DIV wrapper will be stripped by serializer, unless there are
	// non-children props present.
	return createElement( 'div', {
		dangerouslySetInnerHTML: { __html: children },
		...props,
	} );
}
