/**
 * External dependencies
 */
import { stubTrue } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, useContext, useEffect, useRef } from '@wordpress/element';
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import context, { Provider } from './context';

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
 * @return {WPComponent} Component with the focus restauration behaviour.
 */
function withFocusReturn( options ) {
	// Normalize as overloaded form `withFocusReturn( options )( Component )`
	// or as `withFocusReturn( Component )`.
	if ( isComponentLike( options ) ) {
		const WrappedComponent = options;
		return withFocusReturn( {} )( WrappedComponent );
	}

	const { onFocusReturn = stubTrue } = options;

	return ( WrappedComponent ) => ( props ) => {
		const ref = useRef();
		const stack = useRef();
		const focusHistory = useContext( context );

		useEffect( () => {
			const { ownerDocument } = ref.current;

			// The focus history is a mutating array. Take a snapshot on mount
			// to use later on unmount.
			stack.current = focusHistory
				? [ ...focusHistory ]
				: [ ownerDocument.activeElement ];

			return () => {
				if ( ! ref.current.contains( ownerDocument.activeElement ) ) {
					return;
				}

				// Defer to the component's own explicit focus return behavior,
				// if specified. The function should return `false` to prevent
				// the default behavior otherwise occurring here. This allows
				// for support that the `onFocusReturn` decides to allow the
				// default behavior to occur under some conditions.
				if ( onFocusReturn() === false ) {
					return;
				}

				let candidate;

				while ( ( candidate = stack.current.pop() ) ) {
					if ( ownerDocument.body.contains( candidate ) ) {
						candidate.focus();
						return;
					}
				}
			};
		}, [] );

		return (
			<div ref={ ref }>
				<WrappedComponent { ...props } />
			</div>
		);
	};
}

export default createHigherOrderComponent( withFocusReturn, 'withFocusReturn' );
export { Provider };
