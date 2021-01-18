/**
 * WordPress dependencies
 */
import { _x, __ } from '@wordpress/i18n';
import { archiveTitle } from '@wordpress/icons';
const variations = [
	{
		name: 'custom-query-title',
		title: __( 'Custom query Title' ),
		description: __( 'Display a custom query title.' ),
		icon: archiveTitle,
		attributes: { type: 'custom', content: '' },
		scope: [ 'inserter', 'transform' ],
		isDefault: true,
	},
	{
		name: 'archive-title',
		title: __( 'Archive Title' ),
		description: __(
			'Display the archive title based on the queried object.'
		),
		icon: archiveTitle,
		attributes: {
			type: 'archive',
			content: __( 'Archive title placeholder' ),
		},
		scope: [ 'inserter', 'transform' ],
	},
	{
		name: 'search-title',
		title: __( 'Search title' ),
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
		scope: [ 'inserter', 'transform' ],
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
