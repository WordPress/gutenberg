/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

const variations = [
	{
		name: 'form-submission-success',
		title: __( 'Form Submission Success' ),
		description: __( 'Success message for form submissions.' ),
		attributes: {
			type: 'success',
		},
		isDefault: true,
		innerBlocks: [
			[
				'core/paragraph',
				{
					content: __( 'Your form has been submitted successfully.' ),
					backgroundColor: '#00D084',
					textColor: '#000000',
					style: {
						elements: { link: { color: { text: '#000000' } } },
					},
				},
			],
		],
		scope: [ 'inserter', 'transform' ],
		isActive: ( blockAttributes ) =>
			! blockAttributes?.type || blockAttributes?.type === 'success',
	},
	{
		name: 'form-submission-error',
		title: __( 'Form Submission Error' ),
		description: __( 'Error/failure message for form submissions.' ),
		attributes: {
			type: 'error',
		},
		isDefault: false,
		innerBlocks: [
			[
				'core/paragraph',
				{
					content: __( 'There was an error submitting your form.' ),
					backgroundColor: '#CF2E2E',
					textColor: '#FFFFFF',
					style: {
						elements: { link: { color: { text: '#FFFFFF' } } },
					},
				},
			],
		],
		scope: [ 'inserter', 'transform' ],
		isActive: ( blockAttributes ) =>
			! blockAttributes?.type || blockAttributes?.type === 'error',
	},
];

export default variations;
