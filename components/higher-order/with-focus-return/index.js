/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { focus } from '@wordpress/utils';

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
			this.bindContainer = this.bindContainer.bind( this );
		}

		componentWillMount() {
			this.activeElementOnMount = document.activeElement;
		}

		componentDidMount() {
			// Find first tabbable node within content and shift focus, falling
			// back to the popover panel itself.
			const firstTabbable = focus.tabbable.find( this.container )[ 0 ];
			if ( firstTabbable ) {
				firstTabbable.focus();
			} else {
				this.container.focus();
			}
		}

		componentWillUnmount() {
			const { activeElementOnMount, isFocused } = this;
			if ( ! activeElementOnMount ) {
				return;
			}

			const { body, activeElement } = document;
			if ( isFocused || null === activeElement || body === activeElement ) {
				activeElementOnMount.focus();
			}
		}

		bindContainer( ref ) {
			this.container = ref;
		}

		render() {
			return (
				<div
					onFocus={ this.setIsFocusedTrue }
					onBlur={ this.setIsFocusedFalse }
					ref={ this.bindContainer }
					tabIndex="-1"
				>
					<WrappedComponent { ...this.props } />
				</div>
			);
		}
	};
}

export default withFocusReturn;
