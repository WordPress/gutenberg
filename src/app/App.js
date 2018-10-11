/** @flow
 * @format */

import '../globals';

import React from 'react';
import { Provider } from 'react-redux';
import { setupStore, html2State } from '../store';
import AppContainer from './AppContainer';
import { Store } from 'redux';

type PropsType = {
	initialHtml: string,
};
type StateType = {};

export default class AppProvider extends React.Component<PropsType, StateType> {
	constructor( props ) {
		super( props );
		this.store = setupStore( html2State( this.props.initialHtml ) );
	}

	render() {
		return (
			<Provider store={ this.store }>
				<AppContainer />
			</Provider>
		);
	}
}
