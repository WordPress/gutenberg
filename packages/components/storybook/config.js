/**
 * External dependencies
 */
import { addDecorator, configure } from '@storybook/react';
import { withA11y } from '@storybook/addon-a11y';
import { withInfo } from '@storybook/addon-info';

/**
 * Internal dependencies
 */
import '../build-style/style.css';

// global info settings
addDecorator( withInfo( {
	inline: true, // show source inline, not clicking a button
} ) );

addDecorator( withA11y );
configure(
	[
		require.context( '../docs', true, /\/.+\.mdx$/ ),
		require.context( '../src', true, /\/stories\/.+\.js$/ ),
	],
	module
);
