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
import { Modal, TextHighlight, Button } from '@wordpress/components';
import { Icon, chevronLeft } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { store as commandsStore } from '../store';

function CommandMenuLoader( { name, search, hook, setIsLoading, close } ) {
	const { isLoading, commands = [] } = hook( { search } ) ?? {};
	useEffect( () => {
		setIsLoading( name, isLoading );
	}, [ setIsLoading, name, isLoading ] );

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

export function CommandMenuLoaderWrapper( {
	loader,
	search,
	setIsLoading,
	close,
} ) {
	// The "hook" prop is actually a custom React hook
	// so to avoid breaking the rules of hooks
	// the CommandMenuLoaderWrapper component need to be
	// remounted on each hook prop change
	// We use the key state to make sure we do that properly.
	const currentLoader = useRef( loader.hook );
	const [ key, setKey ] = useState( 0 );
	useEffect( () => {
		if ( currentLoader.current !== loader.hook ) {
			currentLoader.current = loader.hook;
			setKey( ( prevKey ) => prevKey + 1 );
		}
	}, [ loader.hook ] );

	return (
		<CommandMenuLoader
			key={ key }
			name={ loader.name }
			hook={ currentLoader.current }
			search={ search }
			setIsLoading={ setIsLoading }
			close={ close }
		/>
	);
}

export function CommandMenuGroup( {
	group,
	search,
	setIsLoading,
	close,
	selectLoader,
} ) {
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
					value={ command.label }
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
			{ loaders.map( ( loader ) =>
				loader.isNested && ! search ? (
					<Command.Item
						key={ loader.name }
						value={ loader.placeholder }
						onSelect={ () => selectLoader( loader.name ) }
					>
						{ loader.placeholder }
					</Command.Item>
				) : (
					<CommandMenuLoaderWrapper
						key={ loader.name }
						loader={ loader }
						search={ search }
						setIsLoading={ setIsLoading }
						close={ close }
					/>
				)
			) }
		</Command.Group>
	);
}

function RootCommandMenu( { search, close, setIsLoading, selectLoader } ) {
	const { groups } = useSelect( ( select ) => {
		const { getGroups } = select( commandsStore );
		return {
			groups: getGroups(),
		};
	}, [] );

	return (
		<Command.List>
			{ groups.map( ( group ) => (
				<CommandMenuGroup
					key={ group }
					group={ group }
					search={ search }
					setIsLoading={ setIsLoading }
					close={ close }
					selectLoader={ selectLoader }
				/>
			) ) }
		</Command.List>
	);
}

export function CommandMenu() {
	const [ selectedLoader, selectLoader ] = useState( null );
	const [ search, setSearch ] = useState( '' );
	const [ open, setOpen ] = useState( false );
	const [ loadings, setLoadings ] = useState( {} );
	const { loader } = useSelect(
		( select ) => {
			const { getCommandLoader } = select( commandsStore );
			return {
				loader: selectedLoader
					? getCommandLoader( selectedLoader )
					: null,
			};
		},
		[ selectedLoader ]
	);

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

	const goBack = useCallback( () => {
		selectLoader( null );
	}, [ selectLoader ] );
	const setIsLoading = useCallback(
		( name, value ) =>
			setLoadings( ( current ) => ( {
				...current,
				[ name ]: value,
			} ) ),
		[]
	);
	const close = useCallback( () => {
		setSearch( '' );
		setOpen( false );
		selectLoader( null );
	}, [ setSearch, setOpen, selectLoader ] );

	if ( ! open ) {
		return false;
	}

	const isLoading = Object.values( loadings ).some( Boolean );

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
						{ !! loader && (
							<Button onClick={ goBack }>
								<Icon icon={ chevronLeft } size={ 24 } />
							</Button>
						) }
						<Command.Input
							// The input should be focused when the modal is opened.
							// eslint-disable-next-line jsx-a11y/no-autofocus
							autoFocus
							value={ search }
							onValueChange={ setSearch }
							placeholder={
								loader
									? loader.placeholder
									: __(
											'Search for content and templates, or try commands like "Add…"'
									  )
							}
							onKeyDown={ ( event ) => {
								if (
									event.key === 'Backspace' &&
									search === ''
								) {
									goBack();
								}
							} }
						/>
					</div>
					{ ! isLoading && (
						<Command.Empty>
							{ __( 'No results found.' ) }
						</Command.Empty>
					) }
					{ ! loader && (
						<RootCommandMenu
							search={ search }
							setIsLoading={ setIsLoading }
							close={ close }
							selectLoader={ selectLoader }
						/>
					) }
					{ loader && (
						<CommandMenuLoaderWrapper
							loader={ loader }
							search={ search }
							setIsLoading={ setIsLoading }
							close={ close }
						/>
					) }
				</Command>
			</div>
		</Modal>
	);
}
