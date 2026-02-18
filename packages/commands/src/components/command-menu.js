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
const MAX_RECENTLY_USED = 5;

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

function CommandItem( {
	command,
	search,
	close,
	category,
	recordUsage,
	valuePrefix,
} ) {
	const commandCategory = category ?? command.category;
	const label = command.searchLabel ?? command.label;
	return (
		<Command.Item
			key={ command.name }
			value={ valuePrefix ? `${ valuePrefix }${ label }` : label }
			keywords={ command.keywords }
			onSelect={ () => {
				recordUsage?.( command.name );
				command.callback( { close } );
			} }
			id={ command.name }
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
	search,
	hook,
	setLoader,
	close,
	category,
	filterNames,
	recordUsage,
	valuePrefix,
} ) {
	const { isLoading, commands = [] } = hook( { search } ) ?? {};
	useEffect( () => {
		setLoader( name, isLoading );
	}, [ setLoader, name, isLoading ] );

	const filtered = filterNames
		? commands.filter( ( command ) => filterNames.has( command.name ) )
		: commands;

	if ( ! filtered.length ) {
		return null;
	}

	return (
		<>
			{ filtered.map( ( command ) => (
				<CommandItem
					key={ command.name }
					command={ command }
					search={ search }
					close={ close }
					category={ command.category ?? category }
					recordUsage={ recordUsage }
					valuePrefix={ valuePrefix }
				/>
			) ) }
		</>
	);
}

export function CommandMenuLoaderWrapper( {
	hook,
	search,
	setLoader,
	close,
	category,
	filterNames,
	recordUsage,
	valuePrefix,
} ) {
	// The "hook" prop is actually a custom React hook
	// so to avoid breaking the rules of hooks
	// the CommandMenuLoaderWrapper component need to be
	// remounted on each hook prop change
	// We use the key state to make sure we do that properly.
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
			search={ search }
			setLoader={ setLoader }
			close={ close }
			category={ category }
			filterNames={ filterNames }
			recordUsage={ recordUsage }
			valuePrefix={ valuePrefix }
		/>
	);
}

export function CommandMenuGroup( {
	isContextual,
	search,
	setLoader,
	close,
	recordUsage,
	heading,
} ) {
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
		<>
			{ heading && (
				<div
					className="commands-command-menu__section-heading"
					aria-hidden="true"
				>
					{ heading }
				</div>
			) }
			<Command.Group>
				{ commands.map( ( command ) => (
					<CommandItem
						key={ command.name }
						command={ command }
						search={ search }
						close={ close }
						recordUsage={ recordUsage }
					/>
				) ) }
				{ loaders.map( ( loader ) => (
					<CommandMenuLoaderWrapper
						key={ loader.name }
						hook={ loader.hook }
						search={ search }
						setLoader={ setLoader }
						close={ close }
						category={ loader.category }
						recordUsage={ recordUsage }
					/>
				) ) }
			</Command.Group>
		</>
	);
}

function RecentlyUsedGroup( { search, setLoader, close, recordUsage } ) {
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

	const recentlyUsedSet = new Set( recentlyUsedNames );
	const recentStaticCommands = allCommands.filter( ( command ) =>
		recentlyUsedSet.has( command.name )
	);

	if ( ! recentStaticCommands.length && ! loaders.length ) {
		return null;
	}

	return (
		<>
			<div
				className="commands-command-menu__section-heading"
				aria-hidden="true"
			>
				{ __( 'Recent' ) }
			</div>
			<Command.Group>
				{ recentStaticCommands.map( ( command ) => (
					<CommandItem
						key={ command.name }
						command={ command }
						search={ search }
						close={ close }
						recordUsage={ recordUsage }
						valuePrefix="recent-"
					/>
				) ) }
				{ loaders.map( ( loader ) => (
					<CommandMenuLoaderWrapper
						key={ loader.name }
						hook={ loader.hook }
						search={ search }
						setLoader={ setLoader }
						close={ close }
						category={ loader.category }
						filterNames={ recentlyUsedSet }
						recordUsage={ recordUsage }
						valuePrefix="recent-"
					/>
				) ) }
			</Command.Group>
		</>
	);
}

function SearchResultsHeading() {
	const filteredCount = useCommandState( ( state ) => state.filtered.count );

	if ( filteredCount === 0 ) {
		return null;
	}

	return (
		<div
			className="commands-command-menu__section-heading"
			aria-hidden="true"
		>
			{ __( 'Results' ) }
		</div>
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
	const { set: setPreference } = useDispatch( preferencesStore );
	const [ loaders, setLoaders ] = useState( {} );

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
			].slice( 0, MAX_RECENTLY_USED );
			setPreference( 'core/commands', 'recentlyUsed', next );
		},
		[ setPreference ]
	);

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

	return (
		<Modal
			className="commands-command-menu"
			overlayClassName="commands-command-menu__overlay"
			onRequestClose={ closeAndReset }
			__experimentalHideHeader
			contentLabel={ __( 'Command palette' ) }
		>
			<div className="commands-command-menu__container">
				<Command label={ inputLabel }>
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
						{ ! search && (
							<RecentlyUsedGroup
								search={ search }
								setLoader={ setLoader }
								close={ closeAndReset }
								recordUsage={ recordUsage }
							/>
						) }
						{ search && <SearchResultsHeading /> }
						<CommandMenuGroup
							search={ search }
							setLoader={ setLoader }
							close={ closeAndReset }
							isContextual
							recordUsage={ recordUsage }
							heading={
								! search ? __( 'Suggestions' ) : undefined
							}
						/>
						{ search && (
							<CommandMenuGroup
								search={ search }
								setLoader={ setLoader }
								close={ closeAndReset }
								recordUsage={ recordUsage }
							/>
						) }
					</Command.List>
				</Command>
			</div>
		</Modal>
	);
}
