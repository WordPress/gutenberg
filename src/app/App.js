/** @flow
 * @format */

import '../globals';

import React from 'react';
import { Provider } from 'react-redux';
import { setupStore } from '../store';
import AppContainer from './AppContainer';
import { Store } from 'redux';

type PropsType = {
	store: Store,
};
type StateType = {};

export class AppProvider extends React.Component<PropsType, StateType> {
	render() {
		return (
			<Provider store={ this.props.store }>
				<AppContainer />
			</Provider>
		);
	}
}

// eslint-disable-next-line react/display-name
export default () => <AppProvider store={ setupStore() } />;
