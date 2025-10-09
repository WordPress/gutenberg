/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { textColor } from '@wordpress/icons';

const variations = [
	{
		name: 'Stretchy Heading',
		title: __( 'Stretchy Heading' ),
		description: __(
			'Heading text automatically resizes to fit the container width.'
		),
		attributes: { fitText: true },
		scope: [ 'inserter' ],
		isActive: ( blockAttributes ) => blockAttributes.fitText,
		icon: textColor,
		example: {
			attributes: {
				content: __(
					'This heading will automatically resize to fit its container width.'
				),
				fitText: true,
			},
		},
	},
];

export default variations;
