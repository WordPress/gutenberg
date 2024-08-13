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

type AcceptsTwoArgs<
	F extends ( ...args: any ) => any,
	ErrorMessage = never,
> = Parameters< F >[ 'length' ] extends 2 ? {} : ErrorMessage;

type ContextConnectOptions = {
	forwardsRef?: boolean;
};

/**
 * Forwards ref (React.ForwardRef) and "Connects" (or registers) a component
 * within the Context system under a specified namespace.
 *
 * @param Component The component to register into the Context system.
 * @param namespace The namespace to register the component under.
 * @return The connected WordPressComponent
 */
export function contextConnect<
	C extends ( props: any, ref: ForwardedRef< any > ) => JSX.Element | null,
>(
	Component: C &
		AcceptsTwoArgs<
			C,
			'Warning: Your component function does not take a ref as the second argument. Did you mean to use `contextConnectWithoutRef`?'
		>,
	namespace: string
) {
	return _contextConnect( Component, namespace, { forwardsRef: true } );
}

/**
 * "Connects" (or registers) a component within the Context system under a specified namespace.
 * Does not forward a ref.
 *
 * @param Component The component to register into the Context system.
 * @param namespace The namespace to register the component under.
 * @return The connected WordPressComponent
 */
export function contextConnectWithoutRef< P >(
	Component: ( props: P ) => JSX.Element | null,
	namespace: string
) {
	return _contextConnect( Component, namespace );
}

// This is an (experimental) evolution of the initial connect() HOC.
// The hope is that we can improve render performance by removing functional
// component wrappers.
function _contextConnect<
	C extends ( props: any, ref: ForwardedRef< any > ) => JSX.Element | null,
	O extends ContextConnectOptions,
>(
	Component: C,
	namespace: string,
	options?: O
): WordPressComponentFromProps<
	Parameters< C >[ 0 ],
	O[ 'forwardsRef' ] extends true ? true : false
> {
	const WrappedComponent = options?.forwardsRef
		? forwardRef< any, Parameters< C >[ 0 ] >( Component )
		: Component;

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

	// @ts-expect-error We can't rely on inferred types here because of the
	// `as` prop polymorphism we're handling in https://github.com/WordPress/gutenberg/blob/4f3a11243c365f94892e479bff0b922ccc4ccda3/packages/components/src/context/wordpress-component.ts#L32-L33
	return Object.assign( WrappedComponent, {
		[ CONNECT_STATIC_NAMESPACE ]: [ ...new Set( mergedNamespace ) ],
		displayName: namespace,
		selector: `.${ getStyledClassNameFromKey( namespace ) }`,
	} );
}

/**
 * Attempts to retrieve the connected namespace from a component.
 *
 * @param Component The component to retrieve a namespace from.
 * @return The connected namespaces.
 */
export function getConnectNamespace(
	Component: ReactChild | undefined | {}
): string[] {
	if ( ! Component ) {
		return [];
	}

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
 * @param Component The component to retrieve a namespace from.
 * @param match     The namespace to check.
 */
export function hasConnectNamespace(
	Component: ReactNode,
	match: string[] | string
): boolean {
	if ( ! Component ) {
		return false;
	}

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
