/**
 * WordPress dependencies
 */
import { Component } from 'element';

function disposableFocus( WrappedComponent ) {
	return class extends Component {
		constructor() {
			super( ...arguments );
			this.bindWrapper = this.bindWrapper.bind( this );
		}

		componentDidMount() {
			this.activeElement = document.activeElement;
		}

		componentWillUnmount() {
			if (
				this.activeElement && (
					( document.activeElement && this.wrapper.contains( document.activeElement ) ) ||
					! document.activeElement
				)
			) {
				this.activeElement.focus();
			}
		}

		bindWrapper( ref ) {
			this.wrapper = ref;
		}

		render() {
			return (
				<div ref={ this.bindWrapper }>
					<WrappedComponent { ...this.props } />
				</div>
			);
		}
	};
}

export default disposableFocus;
