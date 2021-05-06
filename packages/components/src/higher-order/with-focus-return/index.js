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
 * @param {*} object Object to test.
 *
 * @return {boolean} Whether object is component-like.
 */
function isComponentLike( object ) {
	return object instanceof Component || typeof object === 'function';
}

/**
 * Higher Order Component used to be used to wrap disposable elements like
 * sidebars, modals, dropdowns. When mounting the wrapped component, we track a
 * reference to the current active element so we know where to restore focus
 * when the component is unmounted.
 *
 * @param {(WPComponent|Object)} options The component to be enhanced with
 *                                      focus return behavior, or an object
 *                                      describing the component and the
 *                                      focus return characteristics.
 *
 * @return {Function} Higher Order Component with the focus restauration behaviour.
 */
export default createHigherOrderComponent( ( options ) => {
	const HoC = ( { onFocusReturn } = {} ) => ( WrappedComponent ) => {
		const WithFocusReturn = ( props ) => {
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
}, 'withFocusReturn' );

export const Provider = ( { children } ) => {
	deprecated( 'wp.components.FocusReturnProvider component', {
		since: '5.7',
		hint:
			'This provider is not used anymore. You can just remove it from your codebase',
	} );

	return children;
};
