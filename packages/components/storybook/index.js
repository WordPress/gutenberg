/**
 * External dependencies
 */
import { configure, getStorybookUI } from '@storybook/react-native';
import { AppRegistry } from 'react-native';

configure(
	[
		require.context( '../docs', true, /\/.+\.mdx$/ ),
		require.context( '../src', true, /\/stories\/.+\.js$/ ),
	],
	module
);

const StorybookUI = getStorybookUI();
AppRegistry.registerComponent( 'Gutenberg Design System', () => StorybookUI );

export default StorybookUI;
