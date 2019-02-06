/** @flow
 * @format */
import React from 'react';

import AppContainer from './AppContainer';
import initialHtml from './initial-html';

type PropsType = {
	initialData: string,
	initialHtmlModeEnabled: boolean,
};

const AppProvider = ( { initialData, initialHtmlModeEnabled }: PropsType ) => {
	if ( initialData === undefined ) {
		initialData = initialHtml;
	}
	return (
		<AppContainer initialHtml={ initialData } initialHtmlModeEnabled={ initialHtmlModeEnabled } />
	);
};

export default AppProvider;
