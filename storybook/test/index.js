/**
 * External dependencies
 */
import initStoryshots from '@storybook/addon-storyshots';
import path from 'path';

initStoryshots( {
	configPath: path.resolve( __dirname, '../' ),
	suite: '@wordpress/components',
} );
