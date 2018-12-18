/** @flow
 * @format */

import '../globals';

import React from 'react';

// Gutenberg imports
import { registerCoreBlocks } from '@wordpress/block-library';
import { registerBlockType, setUnregisteredTypeHandlerName } from '@wordpress/blocks';
import RNReactNativeGutenbergBridge from 'react-native-gutenberg-bridge';

import AppContainer from './AppContainer';
import initialHtml from './initial-html';

import * as UnsupportedBlock from '../block-types/unsupported-block/';

registerCoreBlocks();
registerBlockType( UnsupportedBlock.name, UnsupportedBlock.settings );
setUnregisteredTypeHandlerName( UnsupportedBlock.name );

type PropsType = {
	initialData: string,
	initialHtmlModeEnabled: boolean,
};

class AppProvider extends React.Component<PropsType> {

	componentDidMount() {
		RNReactNativeGutenbergBridge.moduleDidMount();
	}

	render() {
		var { initialData } = this.props;

		if ( initialData === undefined ) {
			initialData = initialHtml;
		}

		return (
			<AppContainer initialHtml={ initialData } initialHtmlModeEnabled={ this.props.initialHtmlModeEnabled } />
		);
	}
};

export default AppProvider;
