/**
 * External dependencies
 */
import initStoryshots from '@storybook/addon-storyshots';
import path from 'path';

/**
 * The list of components that should be skipped because they
 * don't work with the default Storyshots setup.
 *
 * @type {string[]}
 */
const skippedComponents = [
	'ClipboardButton',
];

initStoryshots( {
	configPath: path.resolve( __dirname, '../' ),
	suite: '@wordpress/components',
	storyKindRegex: new RegExp(
		`^((?!${ skippedComponents.join( '|' ) }).)*$`
	),
} );
