/** @flow
 * @format */

import '../globals';

import React from 'react';
import { Provider } from 'react-redux';
import { setupStore } from '../store';
import AppContainer from './AppContainer';

const store = setupStore();

// eslint-disable-next-line react/display-name
export default () => (
	<Provider store={ store }>
		<AppContainer />
	</Provider>
);
