/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { createHigherOrderComponent, useFocusReturn } from '@wordpress/compose';
import deprecated from '@wordpress/deprecated';

/**
 * Returns true if the given object is component-like. An object is component-
 * like if it is an instance of wp.element.Component, or is a function.
 *
 * @param object Object to test.
 *
 * @return Whether object is component-like.
 */
function isComponentLike( object: any ): object is React.ComponentType {
	return object instanceof Component || typeof object === 'function';
}

type Props = {
	onFocusReturn?: () => void;
};

/**
 * Higher Order Component used to be used to wrap disposable elements like
 * sidebars, modals, dropdowns. When mounting the wrapped component, we track a
 * reference to the current active element so we know where to restore focus
 * when the component is unmounted.
 *
 * @param options The component to be enhanced with
 *                focus return behavior, or an object
 *                describing the component and the
 *                focus return characteristics.
 *
 * @return Higher Order Component with the focus restauration behaviour.
 */
export default createHigherOrderComponent(
	// @ts-expect-error TODO: Reconcile with intended `createHigherOrderComponent` types
	( options: WPComponent | Record< string, unknown > ) => {
		const HoC =
			( { onFocusReturn }: Props = {} ) =>
			( WrappedComponent: React.ComponentType ) => {
				const WithFocusReturn = (
					props: Record< string, unknown >
				) => {
					const ref = useFocusReturn( onFocusReturn );
					return (
						<div ref={ ref }>
							<WrappedComponent { ...props } />
						</div>
					);
				};

				return WithFocusReturn;
			};

		if ( isComponentLike( options ) ) {
			const WrappedComponent = options;
			return HoC()( WrappedComponent );
		}

		return HoC( options );
	},
	'withFocusReturn'
);

export const Provider = ( { children }: { children: React.ReactNode } ) => {
	deprecated( 'wp.components.FocusReturnProvider component', {
		since: '5.7',
		hint: 'This provider is not used anymore. You can just remove it from your codebase',
	} );

	return children;
};
