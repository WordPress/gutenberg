/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { textColor } from '@wordpress/icons';

const variations = [
	{
		name: 'Stretchy Paragraph',
		title: __( 'Stretchy Paragraph' ),
		description: __(
			'Text automatically resizes to fit the container width.'
		),
		attributes: { fitText: true },
		scope: [ 'inserter' ],
		isActive: ( blockAttributes ) => blockAttributes.fitText,
		icon: textColor,
		example: {
			attributes: {
				content: __(
					'This text will automatically resize to fit its container width.'
				),
				fitText: true,
			},
		},
	},
];

export default variations;
