/** @flow
 * @format */

import '../globals';

import React from 'react';
import { Provider } from 'react-redux';
import { setupStore, html2State } from '../store';
import AppContainer from './AppContainer';
import { Store } from 'redux';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { BlockEdit } from '@wordpress/editor';

import initialHtml from './initial-html';


type PropsType = {
	initialData: string | Store,
};
type StateType = {
	store: Store,
};

class AppProvider extends React.Component<PropsType, StateType> {
	state: StateType;

	constructor( props: PropsType ) {
		super( props );

		this.state = {
			store:
				typeof props.initialData === 'object' ?
					props.initialData :
					setupStore( html2State( props.initialData !== undefined ? props.initialData : initialHtml ) ),
		};

		// initialize gutenberg store with local store
		props.onResetBlocks( this.state.store.getState().blocks );
	}

	render() {
		return (
			<Provider store={ this.state.store }>
				<AppContainer />
			</Provider>
		);
	}
}

export default withDispatch( ( dispatch ) => {
	const {
		resetBlocks,
	} = dispatch( 'core/editor' );
	return {
		onResetBlocks: resetBlocks,
	};
} )( AppProvider );