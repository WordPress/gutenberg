/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	SyncConnectionErrorType,
	type SyncConnectionMetadata,
} from './connection-status';

const SyncConnectionErrorMessages: Map<
	string,
	{ title: string; description: string }
> = new Map( [
	[
		SyncConnectionErrorType.TOO_MANY_CONNECTIONS,
		{
			title: __( 'Connection Limit Reached' ),
			description: __(
				'The collaborative editing server has reached its maximum connection capacity. ' +
					'Please try again later or contact your site administrator.'
			),
		},
	],
] );

/**
 * Get title and description for a connection error.
 *
 * Returns default messages based on error type, with custom title/description
 * taking precedence if provided.
 *
 * @param metadata Connection metadata with error information.
 * @return Object containing title and description strings.
 */
export function getConnectionStatusMessage(
	metadata?: SyncConnectionMetadata
): {
	title: string;
	description: string;
} {
	// Default message for all other error types
	let defaultTitle: string = __( 'Disconnected' );
	let defaultDescription: string = __(
		'You are currently disconnected from the collaborative editing server. ' +
			'Editing is temporarily disabled to prevent conflicts with other users.'
	);

	if ( metadata?.errorType ) {
		const errorMessage = SyncConnectionErrorMessages.get(
			metadata.errorType
		);
		if ( errorMessage ) {
			defaultTitle = errorMessage.title;
			defaultDescription = errorMessage.description;
		}
	}

	return {
		title: metadata?.title || defaultTitle,
		description: metadata?.description || defaultDescription,
	};
}
