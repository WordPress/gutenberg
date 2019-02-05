/** @flow
 * @format */

import '../globals';

import React from 'react';

// Gutenberg imports
import { registerCoreBlocks } from '@wordpress/block-library';
import { registerBlockType, setUnregisteredTypeHandlerName, unregisterBlockType } from '@wordpress/blocks';
import { setLocaleData } from '@wordpress/i18n';

import AppContainer from './AppContainer';
import initialHtml from './initial-html';

import * as UnsupportedBlock from '../block-types/unsupported-block/';
import { getTranslation } from '../../i18n-cache';

registerCoreBlocks();
registerBlockType( UnsupportedBlock.name, UnsupportedBlock.settings );
setUnregisteredTypeHandlerName( UnsupportedBlock.name );

// disable Code and More blocks for release
if ( ! __DEV__ ) {
	unregisterBlockType( 'core/code' );
	unregisterBlockType( 'core/more' );
}

type PropsType = {
	initialData: string,
	initialHtmlModeEnabled: boolean,
	initialTitle: string,
	locale: string,
};

export default class AppProvider extends React.Component<PropsType> {
	constructor( props: PropsType ) {
		super( props );

		this.setLocale( props.locale );
	}

	componentDidUpdate( prevProps ) {
		if ( prevProps.locale !== this.props.locale ) {
			this.setLocale( this.props.locale )
		}
	}

	setLocale( locale ) {
		setLocaleData( getTranslation( locale ) );
	}

	render() {
		const { initialHtmlModeEnabled } = this.props;
		let initialData = this.props.initialData;
		let initialTitle = this.props.initialTitle;
		if ( initialData === undefined ) {
			initialData = initialHtml;
		}
		if ( initialTitle === undefined ) {
			initialTitle = 'Welcome to Gutenberg!';
		}
		return (
			<AppContainer
				initialHtml={ initialData }
				initialHtmlModeEnabled={ initialHtmlModeEnabled }
				initialTitle={ initialTitle } />
		);
	}
}

