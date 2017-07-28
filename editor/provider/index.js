/**
 * External dependencies
 */
import { createProvider } from 'react-redux';

/**
 * WordPress dependencies
 */
import { Component } from 'element';

/**
 * Internal dependencies
 */
import createReduxStore from '../state';
import { getBlocks } from '../selectors';

class Provider extends Component {
	constructor() {
		super( ...arguments );
		// Trigger onChange if blocks change
		this.provider = createProvider( 'editor' );
		this.store = createReduxStore();
		this.store.dispatch( {
			type: 'INIT_EDITOR',
			config: this.props.config,
		} );
		this.blocks = getBlocks( this.store.getState() );
		this.store.subscribe( () => {
			const newBlocks = getBlocks( this.store.getState() );
			if ( this.blocks !== newBlocks ) {
				this.props.onChange( newBlocks );
				this.blocks = newBlocks;
			}
		} );
	}

	componentDidUpdate() {
		if ( this.props.value !== this.blocks ) {
			this.store.dispatch( {
				type: 'RESET_BLOCKS',
				blocks: this.props.value,
			} );
		}
	}

	render() {
		const ReduxProvider = this.provider;
		return (
			<ReduxProvider store={ this.store }>
				{ this.props.children }
			</ReduxProvider>
		);
	}
}

export default Provider;
