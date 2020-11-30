/**
 * Internal dependencies
 */
import { is } from './is';
/**
 * WordPress dependencies
 */
import { Children, isValidElement } from '@wordpress/element';

export { default as mergeRefs } from 'react-merge-refs';
export { default as hoistNonReactStatics } from 'hoist-non-react-statics';

/**
 * @param {import('react').ReactNode} children
 * @return {import('react').ReactNodeArray}
 */
export function getValidChildren( children ) {
	if ( is.string( children ) ) return [ children ];

	return Children.toArray( children ).filter( ( child ) =>
		isValidElement( child )
	);
}

/**
 * @template T
 * @param {import('react').MutableRefObject<T>} ref
 * @param {T} value
 */
export function assignRef( ref, value ) {
	if ( ref === null ) return;

	if ( is.function( ref ) ) {
		ref( value );
		return;
	}

	try {
		ref.current = value;
	} catch ( error ) {
		throw new Error( `Cannot assign value '${ value }' to ref '${ ref }'` );
	}
}

/**
 * @param {string | React.ComponentType} tagName
 * @return {string}
 */
export function getDisplayName( tagName ) {
	const displayName = is.string( tagName )
		? tagName
		: tagName.displayName || tagName.name || 'Component';

	return displayName;
}

export function isRenderProp( children ) {
	return is.function( children );
}

export function renderChildren( children, props = {} ) {
	if ( isRenderProp( children ) ) {
		const { children: _, ...rest } = props;
		return children( rest );
	}

	return children;
}
