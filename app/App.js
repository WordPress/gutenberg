/** @format */

import React from 'react';
import { Provider } from 'react-redux';
import { setupStore } from '../store';
import AppContainer from './AppContainer';

const store = setupStore();

export default () => (
	<Provider store={ store }>
		<AppContainer />
	</Provider>
);
