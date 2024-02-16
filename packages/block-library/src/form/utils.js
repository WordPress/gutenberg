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
				content:
					'<mark style="background-color:rgba(0, 0, 0, 0);color:#345C00" class="has-inline-color">' +
					__( 'Your form has been submitted successfully' ) +
					'</mark>',
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
				content:
					'<mark style="background-color:rgba(0, 0, 0, 0);color:#CF2E2E" class="has-inline-color">' +
					__( 'There was an error submitting your form.' ) +
					'</mark>',
			},
		],
	],
];
