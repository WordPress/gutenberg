/**
 * External dependencies
 */
import { Command, useCommandState } from 'cmdk';
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import {
	useState,
	useEffect,
	useRef,
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
import {
	recordUsage,
	useLoaderCollector,
	useRecentCommands,
} from './use-recent-commands';

const { withIgnoreIMEEvents } = unlock( componentsPrivateApis );

// Namespaces item ids to avoid collisions with other elements on the page.
const ITEM_ID_PREFIX = 'command-palette-item-';
const inputLabel = __( 'Search commands and settings' );

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

function CommandItem( { command, search, category, valuePrefix } ) {
	const { close } = useDispatch( commandsStore );
	const commandCategory = category ?? command.category;
	const label = command.searchLabel ?? command.label;
	const value = valuePrefix ? `${ valuePrefix }${ command.name }` : label;
	return (
		<Command.Item
			key={ command.name }
			id={ `${ ITEM_ID_PREFIX }${ value.toLowerCase() }` }
			value={ value }
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

function CommandMenuLoader( { name, search, hook, category, valuePrefix } ) {
	const { setLoaderLoading } = unlock( useDispatch( commandsStore ) );
	const { isLoading: loading, commands = [] } = hook( { search } ) ?? {};
	useEffect( () => {
		setLoaderLoading( name, loading );
	}, [ setLoaderLoading, name, loading ] );

	if ( ! commands.length ) {
		return null;
	}

	return (
		<>
			{ commands.map( ( command ) => (
				<CommandItem
					key={ command.name }
					command={ command }
					search={ search }
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

function CommandList( { search, commands, loaders, valuePrefix } ) {
	return (
		<>
			{ commands.map( ( command ) => (
				<CommandItem
					key={ command.name }
					command={ command }
					search={ search }
					valuePrefix={ valuePrefix }
				/>
			) ) }
			{ loaders.map( ( loader ) => (
				<CommandMenuLoaderWrapper
					key={ loader.name }
					name={ loader.name }
					search={ search }
					hook={ loader.hook }
					category={ loader.category }
					valuePrefix={ valuePrefix }
				/>
			) ) }
		</>
	);
}

function RecentLoaderRunner( { hook, name, filterNames, onResolved } ) {
	useLoaderCollector( hook, name, filterNames, onResolved );
	return null;
}

function RecentGroup() {
	const { commands, loaders, recentSet, onResolved } = useRecentCommands();

	if ( ! commands.length && ! loaders.length ) {
		return null;
	}

	return (
		<Command.Group heading={ __( 'Recent' ) }>
			{ loaders.map( ( loader ) => (
				<RecentLoaderRunner
					key={ loader.name }
					name={ loader.name }
					hook={ loader.hook }
					filterNames={ recentSet }
					onResolved={ onResolved }
				/>
			) ) }
			{ commands.map( ( command ) => (
				<CommandItem
					key={ command.name }
					command={ command }
					search=""
					valuePrefix="recent-"
				/>
			) ) }
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
			<CommandList search="" commands={ commands } loaders={ loaders } />
		</Command.Group>
	);
}

function ResultsGroup( { search } ) {
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
			<CommandList
				search={ search }
				commands={ commands }
				loaders={ loaders }
			/>
			<CommandList
				search={ search }
				commands={ contextualCommands }
				loaders={ contextualLoaders }
			/>
		</Command.Group>
	);
}

function CommandInput( { search, setSearch } ) {
	const commandMenuInput = useRef();
	const _value = useCommandState( ( state ) => state.value );
	const selectedItemId = _value ? `${ ITEM_ID_PREFIX }${ _value }` : null;
	useEffect( () => {
		// Focus the command palette input when mounting the modal.
		commandMenuInput.current.focus();
	}, [] );
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
	const { isOpen: paletteIsOpen, loadersLoading } = useSelect(
		( select ) => ( {
			isOpen: select( commandsStore ).isOpen(),
			loadersLoading: unlock( select( commandsStore ) ).isLoading(),
		} ),
		[]
	);
	const { open, close } = useDispatch( commandsStore );

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
			if ( paletteIsOpen ) {
				close();
			} else {
				open();
			}
		} ),
		{
			bindGlobal: true,
		}
	);

	const closeAndReset = () => {
		setSearch( '' );
		close();
	};

	if ( ! paletteIsOpen ) {
		return false;
	}

	return (
		<Modal
			className="commands-command-menu"
			overlayClassName="commands-command-menu__overlay"
			onRequestClose={ closeAndReset }
			__experimentalHideHeader
			size="medium"
			contentLabel={ __( 'Command palette' ) }
		>
			<div className="commands-command-menu__container">
				<Command label={ inputLabel } loop>
					<div className="commands-command-menu__header">
						<Icon
							className="commands-command-menu__header-search-icon"
							icon={ inputIcon }
						/>
						<CommandInput
							search={ search }
							setSearch={ setSearch }
						/>
					</div>
					<Command.List label={ __( 'Command suggestions' ) }>
						{ search && ! loadersLoading && (
							<Command.Empty>
								{ __( 'No results found.' ) }
							</Command.Empty>
						) }
						{ ! search && <RecentGroup /> }
						{ ! search && <SuggestionsGroup /> }
						{ search && <ResultsGroup search={ search } /> }
					</Command.List>
				</Command>
			</div>
		</Modal>
	);
}
