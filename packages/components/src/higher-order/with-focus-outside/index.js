/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import DetectFocusOutside from '../../detect-focus-outside';

export default createHigherOrderComponent( ( WrappedComponent ) => {
	return class extends Component {
		constructor() {
			super( ...arguments );

			this.bindNode = this.bindNode.bind( this );
			this.onFocusOutside = this.onFocusOutside.bind( this );
		}

		bindNode( node ) {
			this.node = node;
		}

		onFocusOutside( event ) {
			if (
				this.node &&
				'function' === typeof this.node.handleFocusOutside
			) {
				this.node.handleFocusOutside( event );
			}
		}

		render() {
			return (
				<DetectFocusOutside onFocusOutside={ this.onFocusOutside }>
					<WrappedComponent ref={ this.bindNode } { ...this.props } />
				</DetectFocusOutside>
			);
		}
	};
}, 'withFocusOutside' );
