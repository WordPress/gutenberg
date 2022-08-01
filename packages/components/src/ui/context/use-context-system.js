/**
 * WordPress dependencies
 */
import warn from '@wordpress/warning';

/**
 * Internal dependencies
 */
import { useComponentsContext } from './context-system-provider';
import { getNamespace, getConnectedNamespace } from './utils';
import { getStyledClassNameFromKey } from './get-styled-class-name-from-key';
import { useCx } from '../../utils/hooks/use-cx';

/**
 * @template TProps
 * @typedef {TProps & { className: string }} ConnectedProps
 */

/**
 * Custom hook that derives registered props from the Context system.
 * These derived props are then consolidated with incoming component props.
 *
 * @template {{ className?: string }} P
 * @param {P}      props     Incoming props from the component.
 * @param {string} namespace The namespace to register and to derive context props from.
 * @return {ConnectedProps<P>} The connected props.
 */
export function useContextSystem( props, namespace ) {
	const contextSystemProps = useComponentsContext();
	if ( typeof namespace === 'undefined' ) {
		warn( 'useContextSystem: Please provide a namespace' );
	}

	const contextProps = contextSystemProps?.[ namespace ] || {};

	/* eslint-disable jsdoc/no-undefined-types */
	/** @type {ConnectedProps<P>} */
	// @ts-ignore We fill in the missing properties below
	const finalComponentProps = {
		...getConnectedNamespace(),
		...getNamespace( namespace ),
	};
	/* eslint-enable jsdoc/no-undefined-types */

	const { _overrides: overrideProps, ...otherContextProps } = contextProps;

	const initialMergedProps = Object.entries( otherContextProps ).length
		? Object.assign( {}, otherContextProps, props )
		: props;

	const cx = useCx();

	const classes = cx(
		getStyledClassNameFromKey( namespace ),
		props.className
	);

	// Provides the ability to customize the render of the component.
	const rendered =
		typeof initialMergedProps.renderChildren === 'function'
			? initialMergedProps.renderChildren( initialMergedProps )
			: initialMergedProps.children;

	for ( const key in initialMergedProps ) {
		// @ts-ignore filling in missing props
		finalComponentProps[ key ] = initialMergedProps[ key ];
	}

	for ( const key in overrideProps ) {
		// @ts-ignore filling in missing props
		finalComponentProps[ key ] = overrideProps[ key ];
	}

	// Setting an `undefined` explicitly can cause unintended overwrites
	// when a `cloneElement()` is involved.
	if ( rendered !== undefined ) {
		// @ts-ignore
		finalComponentProps.children = rendered;
	}

	finalComponentProps.className = classes;

	return finalComponentProps;
}
