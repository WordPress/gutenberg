/**
 * External dependencies
 */
import { stubTrue } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import Provider, { Consumer } from './context';

/**
 * Returns true if the given object is component-like. An object is component-
 * like if it is an instance of wp.element.Component, or is a function.
 *
 * @param {*} object Object to test.
 *
 * @return {boolean} Whether object is component-like.
 */
function isComponentLike( object ) {
	return (
		object instanceof Component ||
		typeof object === 'function'
	);
}

/**
 * Higher Order Component used to be used to wrap disposable elements like
 * sidebars, modals, dropdowns. When mounting the wrapped component, we track a
 * reference to the current active element so we know where to restore focus
 * when the component is unmounted.
 *
 * @param {(WPComponent|Object)} options The component to be enhanced with
 *                                       focus return behavior, or an object
 *                                       describing the component and the
 *                                       focus return characteristics.
 *
 * @return {Component} Component with the focus restauration behaviour.
 */
function withFocusReturn( options ) {
	// Normalize as overloaded form `withFocusReturn( options )( Component )`
	// or as `withFocusReturn( Component )`.
	if ( isComponentLike( options ) ) {
		return withFocusReturn( {} )( options );
	}

	const { onFocusReturn = stubTrue } = options;

	return function( WrappedComponent ) {
		class FocusReturn extends Component {
			constructor() {
				super( ...arguments );

				this.setIsFocusedTrue = () => this.isFocused = true;
				this.setIsFocusedFalse = () => this.isFocused = false;
				this.activeElementOnMount = document.activeElement;
			}

			componentWillUnmount() {
				const { activeElementOnMount, isFocused } = this;

				if ( ! isFocused ) {
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

				const stack = [
					...this.props.focusHistory,
					activeElementOnMount,
				];

				let candidate;
				while ( ( candidate = stack.pop() ) ) {
					if ( document.body.contains( candidate ) ) {
						candidate.focus();
						return;
					}
				}
			}

			render() {
				return (
					<div
						onFocus={ this.setIsFocusedTrue }
						onBlur={ this.setIsFocusedFalse }
					>
						<WrappedComponent { ...this.props } />
					</div>
				);
			}
		}

		return ( props ) => (
			<Consumer>
				{ ( context ) => <FocusReturn { ...props } { ...context } /> }
			</Consumer>
		);
	};
}

export default createHigherOrderComponent( withFocusReturn, 'withFocusReturn' );
export { Provider };
