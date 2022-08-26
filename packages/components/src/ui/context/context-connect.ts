/**
 * External dependencies
 */
import type { ForwardedRef, ReactChild, ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';
import warn from '@wordpress/warning';

/**
 * Internal dependencies
 */
import { CONNECT_STATIC_NAMESPACE } from './constants';
import { getStyledClassNameFromKey } from './get-styled-class-name-from-key';
import type { WordPressComponentFromProps } from '.';

/**
 * Forwards ref (React.ForwardRef) and "Connects" (or registers) a component
 * within the Context system under a specified namespace.
 *
 * This is an (experimental) evolution of the initial connect() HOC.
 * The hope is that we can improve render performance by removing functional
 * component wrappers.
 *
 * @param  Component The component to register into the Context system.
 * @param  namespace The namespace to register the component under.
 * @return The connected WordPressComponent
 */
export function contextConnect< P >(
	Component: ( props: P, ref: ForwardedRef< any > ) => JSX.Element | null,
	namespace: string
): WordPressComponentFromProps< P > {
	const WrappedComponent = forwardRef< any, P >( Component );

	if ( typeof namespace === 'undefined' ) {
		warn( 'contextConnect: Please provide a namespace' );
	}

	// @ts-expect-error internal property
	let mergedNamespace = WrappedComponent[ CONNECT_STATIC_NAMESPACE ] || [
		namespace,
	];

	/**
	 * Consolidate (merge) namespaces before attaching it to the WrappedComponent.
	 */
	if ( Array.isArray( namespace ) ) {
		mergedNamespace = [ ...mergedNamespace, ...namespace ];
	}
	if ( typeof namespace === 'string' ) {
		mergedNamespace = [ ...mergedNamespace, namespace ];
	}

	WrappedComponent.displayName = namespace;

	// @ts-expect-error
	return Object.assign( WrappedComponent, {
		[ CONNECT_STATIC_NAMESPACE ]: [ ...new Set( mergedNamespace ) ],
		selector: `.${ getStyledClassNameFromKey( namespace ) }`,
	} );
}

/**
 * Attempts to retrieve the connected namespace from a component.
 *
 * @param  Component The component to retrieve a namespace from.
 * @return The connected namespaces.
 */
export function getConnectNamespace(
	Component: ReactChild | undefined | {}
): string[] {
	if ( ! Component ) return [];

	let namespaces = [];

	// @ts-ignore internal property
	if ( Component[ CONNECT_STATIC_NAMESPACE ] ) {
		// @ts-ignore internal property
		namespaces = Component[ CONNECT_STATIC_NAMESPACE ];
	}

	// @ts-ignore
	if ( Component.type && Component.type[ CONNECT_STATIC_NAMESPACE ] ) {
		// @ts-ignore
		namespaces = Component.type[ CONNECT_STATIC_NAMESPACE ];
	}

	return namespaces;
}

/**
 * Checks to see if a component is connected within the Context system.
 *
 * @param  Component The component to retrieve a namespace from.
 * @param  match     The namespace to check.
 */
export function hasConnectNamespace(
	Component: ReactNode,
	match: string[] | string
): boolean {
	if ( ! Component ) return false;

	if ( typeof match === 'string' ) {
		return getConnectNamespace( Component ).includes( match );
	}
	if ( Array.isArray( match ) ) {
		return match.some( ( result ) =>
			getConnectNamespace( Component ).includes( result )
		);
	}

	return false;
}
