import type { ReactNode } from 'react';
import warn from '@wordpress/warning';
import { useComponentsContext } from './context-system-provider';
import { getNamespace, getConnectedNamespace } from './utils';
import { getStyledClassNameFromKey } from './get-styled-class-name-from-key';
import { useCx } from '../utils/hooks/use-cx';
import type { ConnectedProps } from './types';

/**
 * Custom hook that derives registered props from the Context system.
 * These derived props are then consolidated with incoming component props.
 *
 * @param props     Incoming props from the component.
 * @param namespace The namespace to register and to derive context props from.
 * @return The connected props.
 */
export function useContextSystem< P extends { className?: string } >(
	props: P,
	namespace: string
) {
	const contextSystemProps = useComponentsContext();
	if ( typeof namespace === 'undefined' ) {
		warn( 'useContextSystem: Please provide a namespace' );
	}

	const contextProps = contextSystemProps?.[ namespace ] || {};

	const finalComponentProps = {
		...getConnectedNamespace(),
		...getNamespace( namespace ),
	} as ConnectedProps< P >;

	const { _overrides, ...otherContextProps } = contextProps;
	const overrideProps = _overrides as Record< string, unknown >;

	const initialMergedProps = Object.entries( otherContextProps ).length
		? Object.assign( {}, otherContextProps, props )
		: props;
	const propsWithChildren: P & {
		children?: ReactNode;
		renderChildren?: ( props: P ) => ReactNode;
	} = initialMergedProps;

	const cx = useCx();

	const classes = cx(
		getStyledClassNameFromKey( namespace ),
		props.className
	);

	// Provides the ability to customize the render of the component.
	const rendered =
		typeof propsWithChildren.renderChildren === 'function'
			? propsWithChildren.renderChildren( initialMergedProps )
			: propsWithChildren.children;

	for ( const key in initialMergedProps ) {
		( finalComponentProps as Record< string, unknown > )[ key ] =
			initialMergedProps[ key ];
	}

	for ( const key in overrideProps ) {
		( finalComponentProps as Record< string, unknown > )[ key ] =
			overrideProps[ key ];
	}

	// Setting an `undefined` explicitly can cause unintended overwrites
	// when a `cloneElement()` is involved.
	if ( rendered !== undefined ) {
		( finalComponentProps as Record< string, unknown > ).children =
			rendered;
	}

	finalComponentProps.className = classes;

	return finalComponentProps;
}
