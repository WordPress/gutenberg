/** @flow
 * @format */
import React from 'react';

import AppContainer from './AppContainer';
import initialHtml from './initial-html';

type PropsType = {
	initialData: string,
	initialHtmlModeEnabled: boolean,
	initialTitle: string,
	translations: mixed,
};

const AppProvider = ( { initialTitle, initialData, initialHtmlModeEnabled, translations }: PropsType ) => {
	if ( initialData === undefined ) {
		initialData = initialHtml;
	}

	if ( initialTitle === undefined ) {
		initialTitle = 'Welcome to Gutenberg!';
	}
	console.log( 'translations', translations );

	return (
		<AppContainer
			initialHtml={ initialData }
			initialHtmlModeEnabled={ initialHtmlModeEnabled }
			initialTitle={ initialTitle } />
	);
};

export default AppProvider;
