/**
 * External dependencies
 */
import { Command } from 'cmdk';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useState, useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Modal } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { store as commandsStore } from '../store';

function CommandMenuLoader( { search, hook } ) {
	const { isLoading, commands = [] } = hook( { search } ) ?? {};

	return (
		<>
			<Command.List>
				{ isLoading && (
					<Command.Loading>{ __( 'Searching…' ) }</Command.Loading>
				) }
				{ ! isLoading && ! commands?.length && (
					<Command.Empty>{ __( 'No results found.' ) }</Command.Empty>
				) }

				{ commands.map( ( command ) => (
					<Command.Item
						key={ command.name }
						value={ command.name }
						onSelect={ () => command.callback() }
					>
						{ command.label }
					</Command.Item>
				) ) }
			</Command.List>
		</>
	);
}

export function CommandMenuLoaderWrapper( { hook, search } ) {
	// loader is actually a custom hook
	// so to avoid breaking the rules of hooks
	// the CommandsPerPage component need to be
	// remounted on each loader change
	// We use the key state to make sure we do that properly.
	const currentLoader = useRef( hook );
	const [ key, setKey ] = useState( 0 );
	useEffect( () => {
		if ( currentLoader.current !== hook ) {
			currentLoader.current = hook;
			setKey( ( prevKey ) => prevKey + 1 );
		}
	}, [ hook ] );

	return (
		<CommandMenuLoader
			key={ key }
			hook={ currentLoader.current }
			search={ search }
		/>
	);
}

export function CommandMenuGroup( { group, search } ) {
	const { commands, loaders } = useSelect(
		( select ) => {
			const { getCommands, getCommandLoaders } = select( commandsStore );
			return {
				commands: getCommands( group ),
				loaders: getCommandLoaders( group ),
			};
		},
		[ group ]
	);

	return (
		<Command.Group heading={ group }>
			{ commands.map( ( command ) => (
				<Command.Item
					key={ command.name }
					value={ command.name }
					onSelect={ () => command.callback() }
				>
					{ command.label }
				</Command.Item>
			) ) }
			{ loaders.map( ( loader ) => (
				<CommandMenuLoaderWrapper
					key={ loader.name }
					hook={ loader.hook }
					search={ search }
				/>
			) ) }
		</Command.Group>
	);
}

export function CommandMenu() {
	const [ search, setSearch ] = useState( '' );
	const [ open, setOpen ] = useState( false );
	const { groups } = useSelect( ( select ) => {
		const { getGroups } = select( commandsStore );
		return {
			groups: getGroups(),
		};
	}, [] );

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

	if ( ! open ) {
		return false;
	}

	return (
		<Modal
			className="commands-command-menu"
			onRequestClose={ () => setOpen( false ) }
			__experimentalHideHeader
		>
			<div className="commands-command-menu__container">
				<Command label={ __( 'Global Command Menu' ) }>
					<div className="commands-command-menu__header">
						<Command.Input
							// The input should be focused when the modal is opened.
							// eslint-disable-next-line jsx-a11y/no-autofocus
							autoFocus
							value={ search }
							onValueChange={ setSearch }
							placeholder={ __(
								'Search for content and templates, or try commands like "Create…"'
							) }
						/>
					</div>
					<Command.List>
						{ groups.map( ( group ) => (
							<CommandMenuGroup
								key={ group }
								group={ group }
								search={ search }
							/>
						) ) }
					</Command.List>
				</Command>
			</div>
		</Modal>
	);
}
