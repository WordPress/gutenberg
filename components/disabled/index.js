/**
 * External dependencies
 */
import { debounce } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { focus } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import './style.scss';

class Disabled extends Component {
	constructor() {
		super( ...arguments );

		this.bindNode = this.bindNode.bind( this );
		this.disable = this.disable.bind( this );

		// Debounce re-disable since disabling process itself will incur
		// additional mutations which should be ignored.
		this.debouncedDisable = debounce( this.disable, { leading: true } );
	}

	componentDidMount() {
		this.disable();

		this.observer = new window.MutationObserver( this.debouncedDisable );
		this.observer.observe( this.node, {
			childList: true,
			attributes: true,
			subtree: true,
		} );
	}

	componentWillUnmount() {
		this.observer.disconnect();
		this.debouncedDisable.cancel();
	}

	bindNode( node ) {
		this.node = node;
	}

	disable() {
		focus.focusable.find( this.node ).forEach( ( focusable ) => {
			if ( ! focusable.hasAttribute( 'disabled' ) ) {
				focusable.setAttribute( 'disabled', '' );
			}

			if ( focusable.hasAttribute( 'contenteditable' ) ) {
				focusable.setAttribute( 'contenteditable', 'false' );
			}
		} );
	}

	render() {
		return (
			<div ref={ this.bindNode } className="components-disabled">
				{ this.props.children }
			</div>
		);
	}
}

export default Disabled;
