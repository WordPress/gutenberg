/**
 * External dependencies
 */
import { Command, useCommandState } from 'cmdk';
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	useSelect,
	useDispatch,
	select as globalSelect,
} from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import {
	useState,
	useEffect,
	useRef,
	useCallback,
	useMemo,
	createContext,
	useContext,
	isValidElement,
	Component,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	Modal,
	TextHighlight,
	__experimentalHStack as HStack,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import {
	store as keyboardShortcutsStore,
	useShortcut,
} from '@wordpress/keyboard-shortcuts';
import { Icon, search as inputIcon, arrowRight } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { store as commandsStore } from '../store';
import { unlock } from '../lock-unlock';

const { withIgnoreIMEEvents } = unlock( componentsPrivateApis );

const inputLabel = __( 'Search commands and settings' );
const MAX_RECENTLY_SAVED = 15;
const MAX_RECENTLY_DISPLAYED = 5;

/**
 * Icons enforced per command category.
 * Categories listed here will always use the specified icon,
 * ignoring whatever icon the command itself provides.
 */
const CATEGORY_ICONS = {
	view: arrowRight,
};

/**
 * Translatable labels for command categories.
 */
const CATEGORY_LABELS = {
	command: __( 'Command' ),
	view: __( 'View' ),
	edit: __( 'Edit' ),
	action: __( 'Action' ),
	workflow: __( 'Workflow' ),
};

/**
 * Function that checks if the parameter is a valid icon.
 * Taken from @wordpress/blocks/src/api/utils.js and copied
 * in case requirements diverge and to avoid a dependency on @wordpress/blocks.
 *
 * @param {*} icon Parameter to be checked.
 *
 * @return {boolean} True if the parameter is a valid icon and false otherwise.
 */

export function isValidIcon( icon ) {
	return (
		!! icon &&
		( typeof icon === 'string' ||
			isValidElement( icon ) ||
			typeof icon === 'function' ||
			icon instanceof Component )
	);
}

const CommandPaletteContext = createContext();

function useCommandPalette() {
	return useContext( CommandPaletteContext );
}

function useRecentCommands() {
	const { set: setPreference } = useDispatch( preferencesStore );

	const recordUsage = useCallback(
		( name ) => {
			const current =
				globalSelect( preferencesStore ).get(
					'core/commands',
					'recentlyUsed'
				) ?? [];
			const next = [
				name,
				...current.filter( ( n ) => n !== name ),
			].slice( 0, MAX_RECENTLY_SAVED );
			setPreference( 'core/commands', 'recentlyUsed', next );
		},
		[ setPreference ]
	);

	const removeFromRecent = useCallback(
		( commandName ) => {
			const current =
				globalSelect( preferencesStore ).get(
					'core/commands',
					'recentlyUsed'
				) ?? [];
			const next = current.filter( ( n ) => n !== commandName );
			setPreference( 'core/commands', 'recentlyUsed', next );
		},
		[ setPreference ]
	);

	return { recordUsage, removeFromRecent };
}

function useSelectedItemId() {
	const _value = useCommandState( ( state ) => state.value );
	return useMemo( () => {
		const item = document.querySelector(
			`[cmdk-item=""][data-value="${ _value }"]`
		);
		return item?.getAttribute( 'id' ) ?? null;
	}, [ _value ] );
}

function CommandItem( { command, category, valuePrefix } ) {
	const { search, close, recordUsage } = useCommandPalette();
	const commandCategory = category ?? command.category;
	const label = command.searchLabel ?? command.label;
	return (
		<Command.Item
			key={ command.name }
			value={ valuePrefix ? `${ valuePrefix }${ command.name }` : label }
			keywords={
				valuePrefix
					? [ ...( command.keywords ?? [] ), label ]
					: command.keywords
			}
			onSelect={ () => {
				recordUsage( command.name );
				command.callback( { close } );
			} }
		>
			<HStack
				alignment="left"
				className={ clsx( 'commands-command-menu__item', {
					'has-icon':
						CATEGORY_ICONS[ commandCategory ] || command.icon,
				} ) }
			>
				{ CATEGORY_ICONS[ commandCategory ] ? (
					<Icon icon={ CATEGORY_ICONS[ commandCategory ] } />
				) : (
					isValidIcon( command.icon ) && (
						<Icon icon={ command.icon } />
					)
				) }
				<span className="commands-command-menu__item-label">
					<TextHighlight
						text={ command.label }
						highlight={ search }
					/>
				</span>
				{ CATEGORY_LABELS[ commandCategory ] && (
					<span className="commands-command-menu__item-category">
						{ CATEGORY_LABELS[ commandCategory ] }
					</span>
				) }
			</HStack>
		</Command.Item>
	);
}

function CommandMenuLoader( {
	name,
	hook,
	category,
	filterNames,
	sortOrder,
	valuePrefix,
} ) {
	const { search, setLoader } = useCommandPalette();
	const { isLoading, commands = [] } = hook( { search } ) ?? {};
	useEffect( () => {
		setLoader( name, isLoading );
	}, [ setLoader, name, isLoading ] );

	let filtered = filterNames
		? commands.filter( ( command ) => filterNames.has( command.name ) )
		: commands;

	if ( sortOrder ) {
		const orderIndex = new Map( sortOrder.map( ( n, i ) => [ n, i ] ) );
		filtered = [ ...filtered ].sort(
			( a, b ) =>
				( orderIndex.get( a.name ) ?? Infinity ) -
				( orderIndex.get( b.name ) ?? Infinity )
		);
	}

	if ( ! filtered.length ) {
		return null;
	}

	return (
		<>
			{ filtered.map( ( command ) => (
				<CommandItem
					key={ command.name }
					command={ command }
					category={ command.category ?? category }
					valuePrefix={ valuePrefix }
				/>
			) ) }
		</>
	);
}

function CommandMenuLoaderWrapper( { hook, ...props } ) {
	// The "hook" prop is actually a custom React hook
	// so to avoid breaking the rules of hooks
	// the CommandMenuLoaderWrapper component need to be
	// remounted on each hook prop change.
	const currentLoaderRef = useRef( hook );
	const [ key, setKey ] = useState( 0 );
	useEffect( () => {
		if ( currentLoaderRef.current !== hook ) {
			currentLoaderRef.current = hook;
			setKey( ( prevKey ) => prevKey + 1 );
		}
	}, [ hook ] );

	return (
		<CommandMenuLoader
			key={ key }
			hook={ currentLoaderRef.current }
			{ ...props }
		/>
	);
}

function CommandList( {
	commands,
	loaders,
	valuePrefix,
	filterNames,
	sortOrder,
} ) {
	return (
		<>
			{ commands.map( ( command ) => (
				<CommandItem
					key={ command.name }
					command={ command }
					valuePrefix={ valuePrefix }
				/>
			) ) }
			{ loaders.map( ( loader ) => (
				<CommandMenuLoaderWrapper
					key={ loader.name }
					name={ loader.name }
					hook={ loader.hook }
					category={ loader.category }
					valuePrefix={ valuePrefix }
					filterNames={ filterNames }
					sortOrder={ sortOrder }
				/>
			) ) }
		</>
	);
}

function RecentGroup() {
	const {
		commands: allCommands,
		loaders,
		recentlyUsedNames,
	} = useSelect( ( select ) => {
		const { getCommands, getCommandLoaders } = select( commandsStore );
		return {
			commands: [ ...getCommands( true ), ...getCommands( false ) ],
			loaders: [
				...getCommandLoaders( true ),
				...getCommandLoaders( false ),
			],
			recentlyUsedNames:
				select( preferencesStore ).get(
					'core/commands',
					'recentlyUsed'
				) ?? [],
		};
	}, [] );

	if ( ! recentlyUsedNames.length ) {
		return null;
	}

	const displayNames = recentlyUsedNames.slice( 0, MAX_RECENTLY_DISPLAYED );
	const displaySet = new Set( displayNames );
	const commandsByName = new Map( allCommands.map( ( c ) => [ c.name, c ] ) );
	const recentCommands = displayNames
		.map( ( name ) => commandsByName.get( name ) )
		.filter( Boolean );

	if ( ! recentCommands.length && ! loaders.length ) {
		return null;
	}

	return (
		<Command.Group heading={ __( 'Recent' ) }>
			<CommandList
				commands={ recentCommands }
				loaders={ loaders }
				valuePrefix="recent-"
				filterNames={ displaySet }
				sortOrder={ displayNames }
			/>
		</Command.Group>
	);
}

function SuggestionsGroup() {
	const { commands, loaders } = useSelect( ( select ) => {
		const { getCommands, getCommandLoaders } = select( commandsStore );
		return {
			commands: getCommands( true ),
			loaders: getCommandLoaders( true ),
		};
	}, [] );

	return (
		<Command.Group heading={ __( 'Suggestions' ) }>
			<CommandList commands={ commands } loaders={ loaders } />
		</Command.Group>
	);
}

function ResultsGroup() {
	const { commands, contextualCommands, loaders, contextualLoaders } =
		useSelect( ( select ) => {
			const { getCommands, getCommandLoaders } = select( commandsStore );
			return {
				commands: getCommands( false ),
				contextualCommands: getCommands( true ),
				loaders: getCommandLoaders( false ),
				contextualLoaders: getCommandLoaders( true ),
			};
		}, [] );

	return (
		<Command.Group heading={ __( 'Results' ) }>
			<CommandList commands={ commands } loaders={ loaders } />
			<CommandList
				commands={ contextualCommands }
				loaders={ contextualLoaders }
			/>
		</Command.Group>
	);
}

function RemoveRecentHandler( { removeFromRecent } ) {
	const _value = useCommandState( ( state ) => state.value );

	useShortcut( 'core/commands/remove-recent', ( event ) => {
		if ( ! _value?.startsWith( 'recent-' ) ) {
			return;
		}

		event.preventDefault();
		const commandName = _value.slice( 'recent-'.length );
		removeFromRecent( commandName );
	} );

	return null;
}

function CommandInput( { isOpen, search, setSearch } ) {
	const commandMenuInput = useRef();
	const selectedItemId = useSelectedItemId();
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
			placeholder={ inputLabel }
			aria-activedescendant={ selectedItemId }
		/>
	);
}

/**
 * @ignore
 */
export function CommandMenu() {
	const { registerShortcut } = useDispatch( keyboardShortcutsStore );
	const [ search, setSearch ] = useState( '' );
	const isOpen = useSelect(
		( select ) => select( commandsStore ).isOpen(),
		[]
	);
	const { open, close } = useDispatch( commandsStore );
	const { recordUsage, removeFromRecent } = useRecentCommands();
	const [ loaders, setLoaders ] = useState( {} );

	useEffect( () => {
		registerShortcut( {
			name: 'core/commands',
			category: 'global',
			description: __( 'Open the command palette.' ),
			keyCombination: {
				modifier: 'primary',
				character: 'k',
			},
		} );
		registerShortcut( {
			name: 'core/commands/remove-recent',
			category: 'global',
			description: __( 'Remove from recent commands.' ),
			keyCombination: {
				modifier: 'shift',
				character: 'Backspace',
			},
		} );
	}, [ registerShortcut ] );

	useShortcut(
		'core/commands',
		/** @type {React.KeyboardEventHandler} */
		withIgnoreIMEEvents( ( event ) => {
			// Bails to avoid obscuring the effect of the preceding handler(s).
			if ( event.defaultPrevented ) {
				return;
			}

			event.preventDefault();
			if ( isOpen ) {
				close();
			} else {
				open();
			}
		} ),
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

	const isLoading = Object.values( loaders ).some( Boolean );
	const contextValue = {
		search,
		setLoader,
		close: closeAndReset,
		recordUsage,
	};

	return (
		<Modal
			className="commands-command-menu"
			overlayClassName="commands-command-menu__overlay"
			onRequestClose={ closeAndReset }
			__experimentalHideHeader
			contentLabel={ __( 'Command palette' ) }
		>
			<div className="commands-command-menu__container">
				<CommandPaletteContext.Provider value={ contextValue }>
					<Command label={ inputLabel } loop>
						<RemoveRecentHandler
							removeFromRecent={ removeFromRecent }
						/>
						<div className="commands-command-menu__header">
							<Icon
								className="commands-command-menu__header-search-icon"
								icon={ inputIcon }
							/>
							<CommandInput
								search={ search }
								setSearch={ setSearch }
								isOpen={ isOpen }
							/>
						</div>
						<Command.List label={ __( 'Command suggestions' ) }>
							{ search && ! isLoading && (
								<Command.Empty>
									{ __( 'No results found.' ) }
								</Command.Empty>
							) }
							{ ! search && <RecentGroup /> }
							{ ! search && <SuggestionsGroup /> }
							{ search && <ResultsGroup /> }
						</Command.List>
					</Command>
				</CommandPaletteContext.Provider>
			</div>
		</Modal>
	);
}
