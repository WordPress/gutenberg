import warn from '@wordpress/warning';
import { useComponentsContext } from './context-system-provider';
import { getNamespace, getConnectedNamespace } from './utils';
import { getStyledClassNameFromKey } from './get-styled-class-name-from-key';
import { useCx } from '../utils/hooks/use-cx';

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

	/** @type {ConnectedProps<P>} */
	// @ts-expect-error The initial object cannot satisfy the generic `P`, whose props are copied in below.
	const finalComponentProps = {
		...getConnectedNamespace(),
		...getNamespace( namespace ),
	};

	const { _overrides, ...otherContextProps } = contextProps;
	/** @type {Record<string, unknown>} */
	const overrideProps = /** @type {Record<string, unknown>} */ ( _overrides );

	const initialMergedProps = Object.entries( otherContextProps ).length
		? Object.assign( {}, otherContextProps, props )
		: props;
	/**
	 * @type {P & {
	 *   children?: React.ReactNode,
	 *   renderChildren?: (props: P) => React.ReactNode
	 * }}
	 */
	const propsWithChildren = initialMergedProps;

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
		// @ts-expect-error A string key cannot index the merged props type.
		finalComponentProps[ key ] = initialMergedProps[ key ];
	}

	for ( const key in overrideProps ) {
		// @ts-expect-error A string key cannot index the merged props type.
		finalComponentProps[ key ] = overrideProps[ key ];
	}

	// Setting an `undefined` explicitly can cause unintended overwrites
	// when a `cloneElement()` is involved.
	if ( rendered !== undefined ) {
		// @ts-expect-error `children` does not exist on `ConnectedProps<P>`.
		finalComponentProps.children = rendered;
	}

	finalComponentProps.className = classes;

	return finalComponentProps;
}
