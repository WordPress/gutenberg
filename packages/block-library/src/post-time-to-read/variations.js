/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import icon from './icon';

const variations = [
	{
		name: 'time-to-read',
		title: __( 'Time to Read' ),
		description: __( 'Show minutes required to finish reading the post.' ),
		attributes: {
			displayMode: 'time',
		},
		scope: [ 'inserter', 'transform' ],
		isActive: ( blockAttributes ) =>
			blockAttributes?.displayMode === 'time',
		icon,
		isDefault: true,
	},
	{
		name: 'word-count',
		title: __( 'Word Count' ),
		description: __( 'Show the number of words in the post.' ),
		attributes: {
			displayMode: 'words',
		},
		scope: [ 'inserter', 'transform' ],
		isActive: ( blockAttributes ) =>
			blockAttributes?.displayMode === 'words',
		icon,
	},
];

export default variations;
