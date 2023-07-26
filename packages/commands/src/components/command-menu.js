/**
 * External dependencies
 */
import { Command, useCommandState } from 'cmdk';

/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import {
	useState,
	useEffect,
	useRef,
	useCallback,
	useMemo,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	Modal,
	TextHighlight,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import {
	store as keyboardShortcutsStore,
	useShortcut,
} from '@wordpress/keyboard-shortcuts';
import { Icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { store as commandsStore } from '../store';

function CommandMenuLoader( { name, search, hook, setLoader, close } ) {
	const { isLoading, commands = [] } = hook( { search } ) ?? {};
	useEffect( () => {
		setLoader( name, isLoading );
	}, [ setLoader, name, isLoading ] );

	if ( ! commands.length ) {
		return null;
	}

	return (
		<>
			<Command.List>
				{ commands.map( ( command ) => (
					<Command.Item
						key={ command.name }
						value={ command.searchLabel ?? command.label }
						onSelect={ () => command.callback( { close } ) }
						id={ command.name }
					>
						<HStack
							alignment="left"
							className="commands-command-menu__item"
						>
							<Icon icon={ command.icon } />
							<span>
								<TextHighlight
									text={ command.label }
									highlight={ search }
								/>
							</span>
						</HStack>
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

export function CommandMenuGroup( { isContextual, search, setLoader, close } ) {
	const { commands, loaders } = useSelect(
		( select ) => {
			const { getCommands, getCommandLoaders } = select( commandsStore );
			return {
				commands: getCommands( isContextual ),
				loaders: getCommandLoaders( isContextual ),
			};
		},
		[ isContextual ]
	);

	if ( ! commands.length && ! loaders.length ) {
		return null;
	}

	return (
		<Command.Group>
			{ commands.map( ( command ) => (
				<Command.Item
					key={ command.name }
					value={ command.searchLabel ?? command.label }
					onSelect={ () => command.callback( { close } ) }
					id={ command.name }
				>
					<HStack
						alignment="left"
						className="commands-command-menu__item"
					>
						<Icon icon={ command.icon } />
						<span>
							<TextHighlight
								text={ command.label }
								highlight={ search }
							/>
						</span>
					</HStack>
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

function CommandInput( { isOpen, search, setSearch } ) {
	const commandMenuInput = useRef();
	const _value = useCommandState( ( state ) => state.value );
	const selectedItemId = useMemo( () => {
		const item = document.querySelector(
			`[cmdk-item=""][data-value="${ _value }"]`
		);
		return item?.getAttribute( 'id' );
	}, [ _value ] );
	useEffect( () => {
		// Focus the command palette input when mounting the modal.
		if ( isOpen ) {
			commandMenuInput.current.focus();
		}
	}, [ isOpen ] );
	return (
		<Command.Input
			ref={ commandMenuInput }
			value={ search }
			onValueChange={ setSearch }
			placeholder={ __( 'Type a command or search' ) }
			aria-activedescendant={ selectedItemId }
		/>
	);
}

export function CommandMenu() {
	const { registerShortcut } = useDispatch( keyboardShortcutsStore );
	const [ search, setSearch ] = useState( '' );
	const isOpen = useSelect(
		( select ) => select( commandsStore ).isOpen(),
		[]
	);
	const { open, close } = useDispatch( commandsStore );
	const [ loaders, setLoaders ] = useState( {} );

	useEffect( () => {
		registerShortcut( {
			name: 'core/commands',
			category: 'global',
			description: __( 'Open the command palette' ),
			keyCombination: {
				modifier: 'primary',
				character: 'k',
			},
		} );
	}, [ registerShortcut ] );

	useShortcut(
		'core/commands',
		( event ) => {
			event.preventDefault();
			if ( isOpen ) {
				close();
			} else {
				open();
			}
		},
		{
			bindGlobal: true,
		}
	);

	const setLoader = useCallback(
		( name, value ) =>
			setLoaders( ( current ) => ( {
				...current,
				[ name ]: value,
			} ) ),
		[]
	);
	const closeAndReset = () => {
		setSearch( '' );
		close();
	};

	if ( ! isOpen ) {
		return false;
	}

	const onKeyDown = ( event ) => {
		if (
			// Ignore keydowns from IMEs
			event.nativeEvent.isComposing ||
			// Workaround for Mac Safari where the final Enter/Backspace of an IME composition
			// is `isComposing=false`, even though it's technically still part of the composition.
			// These can only be detected by keyCode.
			event.keyCode === 229
		) {
			event.preventDefault();
		}
	};

	const isLoading = Object.values( loaders ).some( Boolean );

	return (
		<Modal
			className="commands-command-menu"
			overlayClassName="commands-command-menu__overlay"
			onRequestClose={ closeAndReset }
			__experimentalHideHeader
		>
			<div className="commands-command-menu__container">
				<Command
					label={ __( 'Command palette' ) }
					onKeyDown={ onKeyDown }
				>
					<div className="commands-command-menu__header">
						<CommandInput
							search={ search }
							setSearch={ setSearch }
							isOpen={ isOpen }
						/>
					</div>
					<Command.List>
						{ search && ! isLoading && (
							<Command.Empty>
								{ __( 'No results found.' ) }
							</Command.Empty>
						) }
						<CommandMenuGroup
							search={ search }
							setLoader={ setLoader }
							close={ closeAndReset }
							isContextual
						/>
						{ search && (
							<CommandMenuGroup
								search={ search }
								setLoader={ setLoader }
								close={ closeAndReset }
							/>
						) }
					</Command.List>
				</Command>
			</div>
		</Modal>
	);
}
