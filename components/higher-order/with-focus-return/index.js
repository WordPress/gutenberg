/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Higher Order Component used to be used to wrap disposable elements like Sidebars, modals, dropdowns.
 * When mounting the wrapped component, we track a reference to the current active element
 * so we know where to restore focus when the component is unmounted
 *
 * @param {WPElement}  wrapperProps  props to apply to the wrapper div
 *
 * @param {WPElement}  OriginalComponent  The disposable component
 *
 * @return {Component}                   Component with the focus restauration behaviour
 */
export const withFocusReturnWrapperProps = ( wrapperProps ) => ( OriginalComponent ) =>
	class extends Component {
		constructor() {
			super( ...arguments );

			this.setIsFocusedTrue = () => this.isFocused = true;
			this.setIsFocusedFalse = () => this.isFocused = false;
		}

		componentWillMount() {
			this.activeElementOnMount = document.activeElement;
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

		render() {
			return (
				<div
					onFocus={ this.setIsFocusedTrue }
					onBlur={ this.setIsFocusedFalse }
					{ ...wrapperProps }
				>
					<OriginalComponent { ...this.props } />
				</div>
			);
		}
	};

export default withFocusReturnWrapperProps( {} );
