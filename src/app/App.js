/** @format */

import '../globals';

import { Provider } from 'react-redux';
import { setupStore } from '../store';
import AppContainer from './AppContainer';
import { parse } from '@wordpress/blocks';
const store = setupStore();

// eslint-disable-next-line react/display-name
export default () => (
	<Provider store={ store }>
		<AppContainer parser={ parse } />
	</Provider>
);
