/**
 * WordPress dependencies
 */
import { Component, findDOMNode } from 'element';

/**
 * Higher Order Component used to be used to wrap disposable elements like Sidebars, modals, dropdowns.
 * When mounting the wrapped component, we track a reference to the current active element
 * so we know where to restore focus when the component is unmounted
 *
 * @param {WPElement}  WrappedComponent  The disposable component
 *
 * @return {Component}                   Component with the focus restauration behaviour
 */
function disposableFocus( WrappedComponent ) {
	return class extends Component {
		componentDidMount() {
			this.activeElement = document.activeElement;
		}

		componentWillUnmount() {
			const wrapper = findDOMNode( this );
			if (
				this.activeElement && (
					( document.activeElement && wrapper && wrapper.contains( document.activeElement ) ) ||
					! document.activeElement
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

export default disposableFocus;
