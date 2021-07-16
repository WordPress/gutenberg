/**
 * WordPress dependencies
 */
import { _x, __ } from '@wordpress/i18n';
import { archiveTitle } from '@wordpress/icons';
const variations = [
	{
		isDefault: true,
		name: 'archive-title',
		title: __( 'Archive Title' ),
		description: __(
			'Display the archive title based on the queried object.'
		),
		icon: archiveTitle,
		attributes: {
			type: 'archive',
			content: __( 'Archive' ),
		},
		scope: [ 'inserter' ],
	},
	{
		name: 'search-title',
		title: __( 'Search Title' ),
		description: __(
			'Displays a title in a search template, using search related format placeholders.'
		),
		attributes: {
			type: 'search',
			// translators: Title for search template with dynamic content placeholders.
			content: _x(
				'%total% results found for "%search%"',
				'search template title'
			),
		},
		scope: [ 'inserter' ],
	},
	{
		name: '404-title',
		title: __( '404 Title' ),
		description: __( 'Displays a title in a 404 template.' ),
		attributes: {
			type: '404',
			content: __( 'Nothing found' ),
		},
		scope: [ 'inserter' ],
	},
];

/**
 * Add `isActive` function to all `query-title` variations, if not defined.
 * `isActive` function is used to find a variation match from a created
 *  Block by providing its attributes.
 */
variations.forEach( ( variation ) => {
	if ( variation.isActive ) return;
	variation.isActive = ( blockAttributes, variationAttributes ) =>
		blockAttributes.type === variationAttributes.type;
} );

export default variations;
