/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Higher Order Component used to be used to wrap disposable elements like
 * sidebars, modals, dropdowns. When mounting the wrapped component, we track a
 * reference to the current active element so we know where to restore focus
 * when the component is unmounted.
 *
 * @param {WPElement} WrappedComponent The disposable component.
 *
 * @return {Component} Component with the focus restauration behaviour.
 */
function withFocusReturn( WrappedComponent ) {
	return class extends Component {
		constructor() {
			super( ...arguments );

			this.setIsFocusedTrue = () => this.isFocused = true;
			this.setIsFocusedFalse = () => this.isFocused = false;
		}

		componentWillMount() {
			this.activeElementOnMount = document.activeElement;
		}

		componentWillUnmount() {
			this.returnFocus();
		}

		/**
		 * Upon component unmount, verify whether focus is within the element
		 * and, if it is, return focus to the element where focus had existed
		 * at the point of component mount.
		 */
		returnFocus() {
			const { activeElementOnMount, isFocused } = this;

			// Verify there is an element to which focus should return, and
			// that focus is within the wrapped element while unmount occurs.
			if ( activeElementOnMount && isFocused ) {
				activeElementOnMount.focus();
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
	};
}

export default withFocusReturn;
