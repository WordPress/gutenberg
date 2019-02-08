/** @flow
 * @format */
import React from 'react';

import AppContainer from './AppContainer';
import initialHtml from './initial-html';

type PropsType = {
	initialData: string,
	initialHtmlModeEnabled: boolean,
	initialTitle: string,
};

const AppProvider = ( { initialTitle, initialData, initialHtmlModeEnabled }: PropsType ) => {
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
};

export default AppProvider;
