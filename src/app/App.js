/** @flow
 * @format */

import '../globals';

import React from 'react';
import { Provider } from 'react-redux';
import { setupStore, html2State } from '../store';
import AppContainer from './AppContainer';
import { Store } from 'redux';

import initialHtml from './initial-html';

type PropsType = {
	initialData: string | Store,
};
type StateType = {
	store: Store,
};

export default class AppProvider extends React.Component<PropsType, StateType> {
	state: StateType;

	constructor( props: PropsType ) {
		super( props );

		this.state = {
			store:
				typeof props.initialData === 'object' ?
					props.initialData :
					setupStore( html2State( props.initialData !== undefined ? props.initialData : initialHtml ) ),
		};
	}

	render() {
		return (
			<Provider store={ this.state.store }>
				<AppContainer />
			</Provider>
		);
	}
}
