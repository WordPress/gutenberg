/**
 * WordPress dependencies
 */
import { useCommands } from '@wordpress/commands';
import { __ } from '@wordpress/i18n';
import { login } from '@wordpress/icons';
import { useMemo } from '@wordpress/element';

/**
 * Registers global admin commands for the Command Palette.
 *
 * @param {string} logoutUrl The URL to log the user out.
 */
export function useAdminCommands( logoutUrl ) {
	const commands = useMemo( () => {
		if ( ! logoutUrl ) {
			return [];
		}

		return [
			{
				name: 'core/log-out',
				label: __( 'Log Out' ),
				icon: login,
				callback: ( { close } ) => {
					close();
					document.location.href = logoutUrl;
				},
			},
		];
	}, [ logoutUrl ] );

	useCommands( commands );
}
