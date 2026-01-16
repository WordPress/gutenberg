/**
 * External dependencies
 */
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { createElement } from 'react';
import { addons, types, useStorybookApi } from 'storybook/manager-api';
import { JumpToIcon } from '@storybook/icons';
import { Button } from 'storybook/internal/components';

const ADDON_ID = '@wordpress/storybook-addon-source-link';

const SourceLinkTool = () => {
	const api = useStorybookApi();
	const storyData = api.getCurrentStoryData();

	let sourcePath;
	if ( storyData?.parameters?.sourceLink ) {
		sourcePath = storyData.parameters.sourceLink;
	} else if ( storyData?.importPath ) {
		// importPath is like "../packages/components/src/button/stories/index.story.tsx"
		// Convert to component directory path: "packages/components/src/button"
		sourcePath = storyData.importPath
			.replace( /^\.\.\//, '' ) // Remove leading "../"
			.replace( /^\.\//, '' ) // Remove leading "./" (for stories in storybook folder)
			.replace( /\/stories\/.*$/, '' ); // Remove "/stories/..." suffix
	}

	if ( ! sourcePath ) {
		return null;
	}

	const href = `https://github.com/WordPress/gutenberg/blob/trunk/${ sourcePath }`;

	return createElement(
		Button,
		{
			ariaLabel: 'Open source file',
			title: 'Open source file',
			asChild: true,
		},
		createElement( 'a', { href }, createElement( JumpToIcon ) )
	);
};

addons.register( ADDON_ID, () => {
	addons.add( `${ ADDON_ID }/tool`, {
		type: types.TOOL,
		title: 'Source Link',
		render: SourceLinkTool,
	} );
} );
