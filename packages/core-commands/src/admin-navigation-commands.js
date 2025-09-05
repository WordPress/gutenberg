/**
 * WordPress dependencies
 */
import { useCommandLoader } from '@wordpress/commands';
import { __, sprintf } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';

const getAdminNavigationCommands = ( menuCommands ) =>
	function useAdminBasicNavigationCommands() {
		const commands = useMemo( () => {
			return ( menuCommands ?? [] ).map( ( menuCommand ) => {
				const label = sprintf(
					/* translators: %s: menu label */
					__( 'Go to: %s' ),
					menuCommand.label
				);
				return {
					label,
					searchLabel: label,
					name: menuCommand.name,
					url: menuCommand.url,
					callback: ( { close } ) => {
						document.location = menuCommand.url;
						close();
					},
				};
			} );
		}, [] );

		return {
			commands,
			isLoading: false,
		};
	};

export function useAdminNavigationCommands( menuCommands ) {
	useCommandLoader( {
		name: 'core/admin-navigation',
		hook: getAdminNavigationCommands( menuCommands ),
	} );
}
