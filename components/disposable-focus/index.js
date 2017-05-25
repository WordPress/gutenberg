/**
 * WordPress dependencies
 */
import { Component, findDOMNode } from 'element';

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
