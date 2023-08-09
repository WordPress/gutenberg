/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

export const formSubmissionNotificationSuccess = [
	'core/form-submission-notification',
	{
		type: 'success',
	},
	[
		[
			'core/paragraph',
			{
				content: __( 'Your form has been submitted successfully.' ),
				backgroundColor: '#00D084',
				textColor: '#000000',
				style: {
					elements: {
						link: { color: { text: '#000000' } },
					},
				},
			},
		],
	],
];
export const formSubmissionNotificationError = [
	'core/form-submission-notification',
	{
		type: 'error',
	},
	[
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
];
