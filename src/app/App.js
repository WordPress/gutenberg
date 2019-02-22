/** @flow
 * @format */

import React from 'react';

// Gutenberg imports
import { setLocaleData } from '@wordpress/i18n';

import AppContainer from './AppContainer';
import initialHtml from './initial-html';

import { getTranslation } from '../../i18n-cache';

type PropsType = {
	initialData: string,
	initialHtmlModeEnabled: boolean,
	initialTitle: string,
	locale: string,
	translations: mixed,
};

export default class AppProvider extends React.Component<PropsType> {
	constructor( props: PropsType ) {
		super( props );

		this.setLocale( props.locale );
	}

	componentDidUpdate( prevProps: PropsType ) {
		if ( prevProps.locale !== this.props.locale ) {
			this.setLocale( this.props.locale );
		}
	}

	setLocale( locale: ?string ) {
		const translationsFromParentApp = this.props.translations;
		let gutenbergTranslations = getTranslation( locale );
		if ( locale && ! gutenbergTranslations ) {
			// Try stripping out the regional
			locale = locale.replace( /[-_][A-Za-z]+$/, '' );
			gutenbergTranslations = getTranslation( locale );
		}
		const translations = Object.assign( {}, gutenbergTranslations, translationsFromParentApp );
		// eslint-disable-next-line no-console
		console.log( 'locale', locale, translations );
		// Only change the locale if it's supported by gutenberg
		if ( gutenbergTranslations || translationsFromParentApp ) {
			setLocaleData( translations );
		}
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

