/**
 * External dependencies
 */
import { addDecorator, configure } from '@storybook/react';
import { withKnobs } from '@storybook/addon-knobs';
import { withA11y } from '@storybook/addon-a11y';

/**
 * Internal dependencies
 */
import '../build-style/style.css';

addDecorator( withKnobs );
addDecorator( withA11y );
configure(
	[
		require.context( '../docs', true, /\/.+\.mdx$/ ),
		require.context( '../src', true, /\/stories\/.+\.js$/ ),
	],
	module
);
