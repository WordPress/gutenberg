/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import {
	formSubmissionNotificationSuccess,
	formSubmissionNotificationError,
} from './utils.js';

const variations = [
	{
		name: 'comment-form',
		title: __( 'Experimental Comment form' ),
		description: __( 'A comment form for posts and pages.' ),
		attributes: {
			submissionMethod: 'custom',
			action: '{SITE_URL}/wp-comments-post.php',
			method: 'post',
			anchor: 'comment-form',
		},
		isDefault: false,
		innerBlocks: [
			[
				'core/form-input',
				{
					type: 'text',
					name: 'author',
					label: __( 'Name' ),
					required: true,
					visibilityPermissions: 'logged-out',
				},
			],
			[
				'core/form-input',
				{
					type: 'email',
					name: 'email',
					label: __( 'Email' ),
					required: true,
					visibilityPermissions: 'logged-out',
				},
			],
			[
				'core/form-input',
				{
					type: 'textarea',
					name: 'comment',
					label: __( 'Comment' ),
					required: true,
					visibilityPermissions: 'all',
				},
			],
			[ 'core/form-submit-button', {} ],
		],
		scope: [ 'inserter', 'transform' ],
		isActive: ( blockAttributes ) =>
			! blockAttributes?.type || blockAttributes?.type === 'text',
	},
	{
		name: 'wp-privacy-form',
		title: __( 'Experimental privacy request form' ),
		keywords: [ 'GDPR' ],
		description: __( 'A form to request data exports and/or deletion.' ),
		attributes: {
			submissionMethod: 'custom',
			action: '',
			method: 'post',
			anchor: 'gdpr-form',
		},
		isDefault: false,
		innerBlocks: [
			formSubmissionNotificationSuccess,
			formSubmissionNotificationError,
			[
				'core/paragraph',
				{
					content: __(
						'To request an export or deletion of your personal data on this site, please fill-in the form below. You can define the type of request you wish to perform, and your email address. Once the form is submitted, you will receive a confirmation email with instructions on the next steps.'
					),
				},
			],
			[
				'core/form-input',
				{
					type: 'email',
					name: 'email',
					label: __( 'Enter your email address.' ),
					required: true,
					visibilityPermissions: 'all',
				},
			],
			[
				'core/form-input',
				{
					type: 'checkbox',
					name: 'export_personal_data',
					label: __( 'Request data export' ),
					required: false,
					visibilityPermissions: 'all',
				},
			],
			[
				'core/form-input',
				{
					type: 'checkbox',
					name: 'remove_personal_data',
					label: __( 'Request data deletion' ),
					required: false,
					visibilityPermissions: 'all',
				},
			],
			[ 'core/form-submit-button', {} ],
			[
				'core/form-input',
				{
					type: 'hidden',
					name: 'wp-action',
					value: 'wp_privacy_send_request',
				},
			],
			[
				'core/form-input',
				{
					type: 'hidden',
					name: 'wp-privacy-request',
					value: '1',
				},
			],
		],
		scope: [ 'inserter', 'transform' ],
		isActive: ( blockAttributes ) =>
			! blockAttributes?.type || blockAttributes?.type === 'text',
	},
];

export default variations;
