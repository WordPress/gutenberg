import { useCommandLoader, useCommands } from '@wordpress/commands';
import { __, sprintf } from '@wordpress/i18n';
import { external } from '@wordpress/icons';
import { useMemo } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import type { CommandConfig } from '@wordpress/commands';
import type { BaseEntityRecords } from '@wordpress/core-data';
import type { AdminMenuCommand } from './types';

const getViewSiteCommand = () =>
	function useViewSiteCommand() {
		const homeUrl = useSelect( ( select ) => {
			// Site index.
			return select( coreStore ).getEntityRecord<
				BaseEntityRecords.Base< 'edit' >
			>( 'root', '__unstableBase' )?.home;
		}, [] );

		const commands = useMemo< CommandConfig[] >( () => {
			if ( ! homeUrl ) {
				return [];
			}

			return [
				{
					name: 'core/view-site',
					label: __( 'View site' ),
					icon: external,
					category: 'view',
					callback: ( { close } ) => {
						close();
						window.open( homeUrl, '_blank' );
					},
				},
			];
		}, [ homeUrl ] );

		return {
			isLoading: false,
			commands,
		};
	};

export function useAdminNavigationCommands(
	menuCommands?: AdminMenuCommand[] | null
) {
	const commands = useMemo< CommandConfig[] >( () => {
		return ( menuCommands ?? [] ).map( ( menuCommand ) => {
			const label = sprintf(
				/* translators: %s: menu label */
				__( 'Go to: %s' ),
				menuCommand.label
			);
			return {
				name: menuCommand.name,
				label,
				searchLabel: label,
				category: 'view',
				callback: ( { close } ) => {
					document.location = menuCommand.url;
					close();
				},
			};
		} );
	}, [ menuCommands ] );
	useCommands( commands );

	useCommandLoader( {
		name: 'core/view-site',
		hook: getViewSiteCommand(),
	} );
}
