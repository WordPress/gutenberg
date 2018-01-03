import React from 'react';

import Layout from '../../edit-post/layout';
import { EditorProvider, ErrorBoundary } from '..';

class Editor extends React.Component {
	render() {
		const { settings, onError, post, recovery } = this.props;
		return (
			<EditorProvider settings={ settings } post={ post } recovery={ recovery }>
				<ErrorBoundary onError={ onError }>
					<Layout />
				</ErrorBoundary>
			</EditorProvider>
		);
	}
}

export default Editor;
