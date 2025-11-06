/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { justifyStretch } from '@wordpress/icons';

const variations = [
	{
		name: 'stretch-text',
		title: __( 'Stretch Text' ),
		description: __( 'Text that resizes to fit its container.' ),
		icon: justifyStretch,
		attributes: { fitText: true },
		scope: [ 'inserter', 'transform' ],
		isActive: ( blockAttributes ) => blockAttributes.fitText === true,
	},
];

export default variations;
