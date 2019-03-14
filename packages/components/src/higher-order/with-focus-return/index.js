/**
 * WordPress dependencies
 */
import { Component, createContext } from '@wordpress/element';
import { createHigherOrderComponent } from '@wordpress/compose';

const { Provider, Consumer } = createContext( {
	onFocusLoss: () => {},
} );

Provider.displayName = 'FocusReturnProvider';
Consumer.displayName = 'FocusReturnConsumer';

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
 * Returns true if there is a focused element, or false otherwise.
 *
 * @return {boolean} Whether focused element exists.
 */
function hasFocusedElement() {
	return (
		null !== document.activeElement &&
		document.body !== document.activeElement
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

	return function( WrappedComponent ) {
		class FocusReturn extends Component {
			constructor() {
				super( ...arguments );

				this.setIsFocusedTrue = () => this.isFocused = true;
				this.setIsFocusedFalse = () => this.isFocused = false;
				this.activeElementOnMount = document.activeElement;
			}

			componentWillUnmount() {
				const { onFocusLoss = this.props.onFocusLoss } = options;
				const { activeElementOnMount, isFocused } = this;

				if ( activeElementOnMount && ( isFocused || ! hasFocusedElement() ) ) {
					activeElementOnMount.focus();
				}

				setTimeout( () => {
					if ( ! hasFocusedElement() ) {
						onFocusLoss();
					}
				}, 0 );
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
export { Provider, Consumer };
