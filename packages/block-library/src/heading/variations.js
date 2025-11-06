/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { justifyStretch, heading } from '@wordpress/icons';

const variations = [
	{
		name: 'paragraph',
		title: __( 'Heading' ),
		description: __(
			'Introduce new sections and organize content to help visitors (and search engines) understand the structure of your content.'
		),
		isDefault: true,
		scope: [ 'block', 'inserter', 'transform' ],
		attributes: { fitText: undefined },
		icon: heading,
	},
	{
		name: 'stretch-heading',
		title: __( 'Stretch Heading' ),
		description: __( 'Heading that resizes to fit its container.' ),
		icon: justifyStretch,
		attributes: { fitText: true },
		scope: [ 'inserter', 'transform' ],
		isActive: ( blockAttributes ) => blockAttributes.fitText === true,
	},
];

export default variations;
