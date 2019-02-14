/** @flow
 * @format */
import React from 'react';

import AppContainer from './AppContainer';
import initialHtml from './initial-html';

type PropsType = {
	initialData: string,
	initialHtmlModeEnabled: boolean,
	initialTitle: string,
	focusTitle: boolean,
};

const AppProvider = ( { initialTitle, initialData, initialHtmlModeEnabled, focusTitle }: PropsType ) => {
	if ( initialData === undefined ) {
		initialData = initialHtml;
	}

	if ( initialTitle === undefined ) {
		initialTitle = 'Welcome to Gutenberg!';
	}

	if ( focusTitle === undefined ) {
		focusTitle = false;
	}

	return (
		<AppContainer
			initialHtml={ initialData }
			initialHtmlModeEnabled={ initialHtmlModeEnabled }
			initialTitle={ initialTitle }
			focusTitle={ focusTitle } />
	);
};

export default AppProvider;
