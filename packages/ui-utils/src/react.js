/**
 * Internal dependencies
 */
import { is } from './is';

/**
 * WordPress dependencies
 */
import { Children, isValidElement } from '@wordpress/element';

/**
 * Merges React `ref` together.
 */
export { default as mergeRefs } from 'react-merge-refs';

/**
 * Copies non-react specific statics from a child component to a parent component.
 * Similar to Object.assign, but with React static keywords prevented from being overridden.
 */
export { default as hoistNonReactStatics } from 'hoist-non-react-statics';

/**
 * Gets a collection of available children elements from a React component's children prop.
 *
 * @param {import('react').ReactNode} children
 *
 * @return {import('react').ReactNodeArray} An array of available children.
 */
export function getValidChildren( children ) {
	if ( is.string( children ) ) return [ children ];

	return Children.toArray( children ).filter( ( child ) =>
		isValidElement( child )
	);
}

/**
 * Gets the displayName of a React Component or element.
 *
 * @param {string | import('react').ComponentType} tagName
 *
 * @return {string} The display name of the Component / tagName.
 */
export function getDisplayName( tagName ) {
	const displayName = is.string( tagName )
		? tagName
		: tagName.displayName || tagName.name || 'Component';

	return displayName;
}

/**
 * Checks to see if a `children` prop is a render function prop.
 *
 * @param {*} children
 *
 * @return {boolean} True, if children is a render function prop.
 */
export function isRenderProp( children ) {
	return is.function( children );
}

/**
 * Handles the rendering of a React component's children prop, which
 * may be a render function prop.
 *
 * @param {*} children Children to render.
 * @param {*} props Props to pass into a (potential) children render function.
 *
 * @return {*} The rendered children.
 */
export function renderChildren( children, props = {} ) {
	if ( isRenderProp( children ) ) {
		// eslint-disable-next-line no-unused-vars
		const { children: _, ...rest } = props;
		return children( rest );
	}

	return children;
}
