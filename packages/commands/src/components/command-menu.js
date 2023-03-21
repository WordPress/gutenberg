/**
 * External dependencies
 */
import { Command } from 'cmdk';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as commandsStore } from '../store';

export function CommandMenu() {
	const commands = useSelect( ( select ) =>
		select( commandsStore ).getCommands()
	);

	const [ open, setOpen ] = useState( false );

	// Toggle the menu when ⌘K is pressed
	useEffect( () => {
		const down = ( e ) => {
			if ( e.key === 'k' && e.metaKey ) {
				setOpen( ( prevOpen ) => ! prevOpen );
			}
		};

		document.addEventListener( 'keydown', down );
		return () => document.removeEventListener( 'keydown', down );
	}, [] );

	return (
		<Command.Dialog
			open={ open }
			onOpenChange={ setOpen }
			label={ __( 'Global Command Menu' ) }
		>
			<Command.Input />
			<Command.List>
				<Command.Empty>No results found.</Command.Empty>

				<Command.Item>Apple</Command.Item>
				{ commands.map( ( command ) => (
					<Command.Item
						key={ command.name }
						value={ command.name }
						onClick={ command.callback }
					>
						{ command.label }
					</Command.Item>
				) ) }
			</Command.List>
		</Command.Dialog>
	);
}
