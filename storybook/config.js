/**
 * External dependencies
 */
import { addDecorator, configure } from '@storybook/react';
import { withA11y } from '@storybook/addon-a11y';
import { withKnobs } from '@storybook/addon-knobs';

/**
 * WordPress dependencies
 */
/* eslint-disable no-restricted-syntax */
import '@wordpress/components/build-style/style.css';
/* eslint-enable no-restricted-syntax */

/**
 * Internal dependencies
 */
import './style.scss';

addDecorator( withA11y );
addDecorator( withKnobs );
configure(
	[
		// StoryShots addon doesn't support MDX files at the moment.
		// It should ignore the playground in the initial pass as well.
		process.env.NODE_ENV !== 'test' && require.context( './stories/', true, /\/.+\.(js|mdx)$/ ),
		require.context( '../packages/components/src/', true, /\/stories\/.+\.js$/ ),
	].filter( Boolean ),
	module
);
