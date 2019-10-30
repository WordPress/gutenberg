/**
 * External dependencies
 */
import { addDecorator, configure } from '@storybook/react';
import { withA11y } from '@storybook/addon-a11y';
import { withKnobs } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import '@wordpress/components/build-style/style.css';

addDecorator( withA11y );
addDecorator( withKnobs );
configure(
	[
		require.context( './docs/', true, /\/.+\.mdx$/ ),
		require.context( './playground/', true, /index\.js$/ ),
		require.context( '../packages/components/src/', true, /\/stories\/.+\.js$/ ),
	],
	module
);
