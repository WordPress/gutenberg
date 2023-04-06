/**
 * External dependencies
 */
import { Command } from 'cmdk';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useState, useEffect, useRef, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Modal, TextHighlight } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { store as commandsStore } from '../store';

function CommandMenuLoader( { name, search, hook, setLoader, close } ) {
	const { isLoading, commands = [] } = hook( { search } ) ?? {};
	useEffect( () => {
		setLoader( name, isLoading );
	}, [ setLoader, name, isLoading ] );

	return (
		<>
			<Command.List>
				{ isLoading && (
					<Command.Loading>{ __( 'Searching…' ) }</Command.Loading>
				) }

				{ commands.map( ( command ) => (
					<Command.Item
						key={ command.name }
						value={ command.name }
						onSelect={ () => command.callback( { close } ) }
					>
						<span className="commands-command-menu__item">
							<TextHighlight
								text={ command.label }
								highlight={ search }
							/>
						</span>
					</Command.Item>
				) ) }
			</Command.List>
		</>
	);
}

export function CommandMenuLoaderWrapper( { hook, search, setLoader, close } ) {
	// The "hook" prop is actually a custom React hook
	// so to avoid breaking the rules of hooks
	// the CommandMenuLoaderWrapper component need to be
	// remounted on each hook prop change
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
			setLoader={ setLoader }
			close={ close }
		/>
	);
}

export function CommandMenuGroup( { group, search, setLoader, close } ) {
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
					onSelect={ () => command.callback( { close } ) }
				>
					<span className="commands-command-menu__item">
						<TextHighlight
							text={ command.label }
							highlight={ search }
						/>
					</span>
				</Command.Item>
			) ) }
			{ loaders.map( ( loader ) => (
				<CommandMenuLoaderWrapper
					key={ loader.name }
					hook={ loader.hook }
					search={ search }
					setLoader={ setLoader }
					close={ close }
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
	const [ loaders, setLoaders ] = useState( {} );

	// Toggle the menu when Meta-K is pressed
	useEffect( () => {
		const toggleOnMetaK = ( e ) => {
			if ( e.key === 'k' && e.metaKey ) {
				setOpen( ( prevOpen ) => ! prevOpen );
				e.preventDefault();
			}
		};

		document.addEventListener( 'keydown', toggleOnMetaK );
		return () => document.removeEventListener( 'keydown', toggleOnMetaK );
	}, [] );

	const setLoader = useCallback(
		( name, value ) =>
			setLoaders( ( current ) => ( {
				...current,
				[ name ]: value,
			} ) ),
		[]
	);
	const close = () => {
		setSearch( '' );
		setOpen( false );
	};

	if ( ! open ) {
		return false;
	}
	const isLoading = Object.values( loaders ).some( Boolean );

	return (
		<Modal
			className="commands-command-menu"
			overlayClassName="commands-command-menu__overlay"
			onRequestClose={ close }
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
								'Search for content and templates, or try commands like "Add…"'
							) }
						/>
					</div>
					<Command.List>
						{ ! isLoading && (
							<Command.Empty>
								{ __( 'No results found.' ) }
							</Command.Empty>
						) }
						{ groups.map( ( group ) => (
							<CommandMenuGroup
								key={ group }
								group={ group }
								search={ search }
								setLoader={ setLoader }
								close={ close }
							/>
						) ) }
					</Command.List>
				</Command>
			</div>
		</Modal>
	);
}
