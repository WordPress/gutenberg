/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import Layout from './layout';
import Markdown from './markdown';
import Page from './page';

export default function Document( props ) {
	const { isLoaded, markdown, headerSlot, footerSlot } = props;

	return (
		<Layout.Content>
			<Page isLoaded={ isLoaded }>
				{ headerSlot }
				<Markdown markdown={ markdown } />
				{ footerSlot }
			</Page>
		</Layout.Content>
	);
}

Document.defaultProps = {
	headerSlot: null,
	footerSlot: null,
};
