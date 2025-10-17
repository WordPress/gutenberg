/**
 * WordPress dependencies
 */
import { useCommandLoader, useCommands } from '@wordpress/commands';
import { __, sprintf } from '@wordpress/i18n';
import { external } from '@wordpress/icons';
import { useMemo } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';

const getViewSiteCommand = () =>
	function useViewSiteCommand() {
		const homeUrl = useSelect( ( select ) => {
			// Site index.
			return select( coreStore ).getEntityRecord(
				'root',
				'__unstableBase'
			)?.home;
		}, [] );

		const commands = useMemo( () => {
			if ( ! homeUrl ) {
				return [];
			}

			return [
				{
					name: 'core/view-site',
					label: __( 'View site' ),
					icon: external,
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

export function useAdminNavigationCommands( menuCommands ) {
	const commands = useMemo( () => {
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
