/**
 * WordPress dependencies
 */
import { Component, findDOMNode } from '@wordpress/element';

/**
 * Higher Order Component used to be used to wrap disposable elements like Sidebars, modals, dropdowns.
 * When mounting the wrapped component, we track a reference to the current active element
 * so we know where to restore focus when the component is unmounted
 *
 * @param {WPElement}  WrappedComponent  The disposable component
 *
 * @return {Component}                   Component with the focus restauration behaviour
 */
function withFocusReturn( WrappedComponent ) {
	return class extends Component {
		componentWillMount() {
			this.activeElement = document.activeElement;
		}

		componentWillUnmount() {
			const wrapper = findDOMNode( this );
			if (
				this.activeElement && (
					( document.activeElement && wrapper && wrapper.contains( document.activeElement ) ) ||
					( ! document.activeElement || document.body === document.activeElement )
				)
			) {
				this.activeElement.focus();
			}
		}

		render() {
			return (
				<WrappedComponent { ...this.props } />
			);
		}
	};
}

export default withFocusReturn;
