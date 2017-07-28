/**
 * External dependencies
 */
import { createProvider } from 'react-redux';

/**
 * WordPress dependencies
 */
import { Component } from 'element';
import { serialize, parse } from 'blocks';

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
		let blocks = getBlocks( this.store.getState() );
		this.store.subscribe( () => {
			const newBlocks = getBlocks( this.store.getState() );
			if ( blocks !== newBlocks ) {
				this.currentValue = serialize( newBlocks, this.props.config.blockTypes );
				this.props.onChange( this.currentValue );
				blocks = newBlocks;
			}
		} );
	}

	componentWillReceiveProps( newProps ) {
		// Rest blocks if the value changed from outside the editor
		if (
			newProps.value !== this.props.value &&
			newProps.value !== this.currentValue
		) {
			this.store.dispatch( {
				type: 'RESET_BLOCKS',
				blocks: parse(
					newProps.value,
					this.props.config.blockTypes,
					this.props.config.fallbackBlockType
				),
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
