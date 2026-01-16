/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { SyncConnectionState } from '../types';

const SyncConnectionErrorMessages: Map<
	string,
	{ title: string; description: string }
> = new Map( [
	[
		'too-many-connections',
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
 * @param connectionState Connection state with error information.
 * @return Object containing title and description strings.
 */
export function getConnectionStatusMessage(
	connectionState?: SyncConnectionState
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

	if ( connectionState?.errorType ) {
		const errorMessage = SyncConnectionErrorMessages.get(
			connectionState.errorType
		);
		if ( errorMessage ) {
			defaultTitle = errorMessage.title;
			defaultDescription = errorMessage.description;
		}
	}

	return {
		title: connectionState?.title || defaultTitle,
		description: connectionState?.description || defaultDescription,
	};
}
