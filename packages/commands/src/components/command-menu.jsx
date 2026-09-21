import { Autocomplete, Input, InputLayout } from '@wordpress/ui';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	useState,
	useEffect,
	useRef,
	useMemo,
	useCallback,
	isValidElement,
	Component,
} from '@wordpress/element';
import { __, isRTL } from '@wordpress/i18n';
import { Modal, TextHighlight } from '@wordpress/components';
import {
	store as keyboardShortcutsStore,
	useShortcut,
} from '@wordpress/keyboard-shortcuts';
import { withIgnoreIMEEvents } from '@wordpress/keycodes';
import { Icon, search as inputIcon, arrowRight } from '@wordpress/icons';
import { store as preferencesStore } from '@wordpress/preferences';
import { store as commandsStore } from '../store';
import { unlock } from '../lock-unlock';
import { commandScore } from './command-score';
import {
	getRecentCommands,
	recordUsage,
	useLoaderCollector,
} from './use-recent-commands';

const inputLabel = __( 'Search commands and settings' );
const EMPTY_ARRAY = [];

/**
 * Fallback icons per command category, used when a command provides no icon of
 * its own. Navigating somewhere reads the same way across the palette, so `view`
 * commands are expected to rely on this rather than pass an icon.
 */
const CATEGORY_FALLBACK_ICONS = {
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

/**
 * Compares the parts of two commands that decide what the palette renders.
 * Functions are left out on purpose: loader hooks rebuild them on every render,
 * so comparing them by identity would never report a match.
 *
 * @param {Object} a First command.
 * @param {Object} b Second command.
 *
 * @return {boolean} Whether both commands render the same way.
 */
function rendersTheSame( a, b ) {
	const aKeywords = a.keywords ?? EMPTY_ARRAY;
	const bKeywords = b.keywords ?? EMPTY_ARRAY;
	return (
		a.name === b.name &&
		a.label === b.label &&
		a.searchLabel === b.searchLabel &&
		a.category === b.category &&
		aKeywords.length === bKeywords.length &&
		aKeywords.every( ( keyword, i ) => keyword === bKeywords[ i ] )
	);
}

/**
 * De-duplicates a list of commands by name, preserving order.
 *
 * @param {Object[]} commands The commands to de-duplicate.
 *
 * @return {Object[]} The de-duplicated commands.
 */
function dedupeCommands( commands ) {
	const seen = new Set();
	const result = [];
	for ( const command of commands ) {
		if ( seen.has( command.name ) ) {
			continue;
		}
		seen.add( command.name );
		result.push( command );
	}
	return result;
}

/**
 * Ranks commands against the search term, dropping the ones that do not match.
 *
 * @param {Object[]} commands The commands to rank.
 * @param {string}   search   The search term.
 *
 * @return {Object[]} The matching commands, ordered by relevance.
 */
function rankCommands( commands, search ) {
	const scored = [];
	for ( const command of dedupeCommands( commands ) ) {
		const score = commandScore(
			command.searchLabel ?? command.label,
			search,
			command.keywords
		);
		if ( score > 0 ) {
			scored.push( { command, score } );
		}
	}
	scored.sort( ( a, b ) => b.score - a.score );
	return scored.map( ( { command } ) => command );
}

function CommandItem( { command, search, onRun } ) {
	const { close } = useDispatch( commandsStore );
	const { category } = command;
	const icon = command.icon ?? CATEGORY_FALLBACK_ICONS[ category ];
	return (
		<Autocomplete.Item
			value={ command }
			className="commands-command-menu__item"
			onClick={ () => onRun( command, close ) }
		>
			{ isValidIcon( icon ) && <Icon icon={ icon } /> }
			<span className="commands-command-menu__item-label">
				<TextHighlight text={ command.label } highlight={ search } />
			</span>
			{ CATEGORY_LABELS[ category ] && (
				<span className="commands-command-menu__item-category">
					{ CATEGORY_LABELS[ category ] }
				</span>
			) }
		</Autocomplete.Item>
	);
}

// Renders nothing; it exists to call one loader hook in isolation, so that a
// varying number of loaders does not break the rules of hooks.
function LoaderRunner( { loader, search, onResolved } ) {
	useLoaderCollector( {
		hook: loader.hook,
		name: loader.name,
		category: loader.category,
		contextual: loader.contextual,
		search,
		onResolved,
	} );

	return null;
}

// The "hook" prop is actually a custom React hook, so to avoid breaking the
// rules of hooks the `LoaderRunner` needs to be remounted whenever the hook
// identity changes.
function LoaderRunnerWrapper( { loader, ...props } ) {
	const [ tracked, setTracked ] = useState( () => ( {
		hook: loader.hook,
		key: 0,
	} ) );

	if ( tracked.hook !== loader.hook ) {
		// Derive new state during render and skip this pass so the next render
		// mounts a fresh `LoaderRunner` for the new hook.
		setTracked( ( prev ) => ( { hook: loader.hook, key: prev.key + 1 } ) );
		return null;
	}

	return <LoaderRunner key={ tracked.key } loader={ loader } { ...props } />;
}

/**
 * @ignore
 */
export function CommandMenu() {
	const { registerShortcut } = useDispatch( keyboardShortcutsStore );
	const [ search, setSearch ] = useState( '' );
	const {
		isOpen: paletteIsOpen,
		loadersLoading,
		staticCommands,
		contextualCommands,
		staticLoaders,
		contextualLoaders,
		recentlyUsedNames,
	} = useSelect( ( select ) => {
		const { getCommands, getCommandLoaders, isOpen } =
			select( commandsStore );
		return {
			isOpen: isOpen(),
			loadersLoading: unlock( select( commandsStore ) ).isLoading(),
			staticCommands: getCommands( false ),
			contextualCommands: getCommands( true ),
			staticLoaders: getCommandLoaders( false ),
			contextualLoaders: getCommandLoaders( true ),
			recentlyUsedNames:
				select( preferencesStore ).get(
					'core/commands',
					'recentlyUsed'
				) ?? EMPTY_ARRAY,
		};
	}, [] );
	const { open, close } = useDispatch( commandsStore );
	const hasRecentCommands = recentlyUsedNames.length > 0;

	// Each loader runs in its own `LoaderRunner` and reports back here. State is
	// only replaced when `rendersTheSame` sees a difference, so a loader that
	// rebuilds equivalent commands on every render does not churn the list. The
	// ref still tracks the newest objects, whose callbacks the comparison
	// cannot see.
	const latestLoaderCommands = useRef( new Map() );
	const [ resolvedMap, setResolvedMap ] = useState( () => new Map() );
	const onResolved = useCallback( ( loaderName, entry ) => {
		latestLoaderCommands.current.set( loaderName, entry.commands );
		setResolvedMap( ( prev ) => {
			const previous = prev.get( loaderName );
			if (
				previous &&
				previous.contextual === entry.contextual &&
				previous.commands.length === entry.commands.length &&
				previous.commands.every( ( command, i ) =>
					rendersTheSame( command, entry.commands[ i ] )
				)
			) {
				return prev;
			}
			return new Map( prev ).set( loaderName, entry );
		} );
	}, [] );

	// The rendered object can predate the loader's latest report.
	const runCommand = useCallback( ( command, closeMenu ) => {
		recordUsage( command.name );
		let latest;
		for ( const cmds of latestLoaderCommands.current.values() ) {
			latest = cmds.find( ( c ) => c.name === command.name );
			if ( latest ) {
				break;
			}
		}
		( latest ?? command ).callback( { close: closeMenu } );
	}, [] );

	const loaders = useMemo(
		() => [
			...contextualLoaders.map( ( loader ) => ( {
				...loader,
				contextual: true,
			} ) ),
			...staticLoaders.map( ( loader ) => ( {
				...loader,
				contextual: false,
			} ) ),
		],
		[ contextualLoaders, staticLoaders ]
	);
	// Without a search term the non-contextual loaders only serve the Recent
	// group, and running them anyway makes those that ignore `search` fetch on
	// every open.
	const activeLoaders = useMemo(
		() =>
			search || hasRecentCommands
				? loaders
				: loaders.filter( ( loader ) => loader.contextual ),
		[ search, hasRecentCommands, loaders ]
	);

	const { allLoaderCommands, contextualLoaderCommands } = useMemo( () => {
		const all = [];
		const contextual = [];
		for ( const entry of resolvedMap.values() ) {
			all.push( ...entry.commands );
			if ( entry.contextual ) {
				contextual.push( ...entry.commands );
			}
		}
		return {
			allLoaderCommands: all,
			contextualLoaderCommands: contextual,
		};
	}, [ resolvedMap ] );

	const allCommands = useMemo(
		() => [
			...contextualCommands,
			...staticCommands,
			...allLoaderCommands,
		],
		[ contextualCommands, staticCommands, allLoaderCommands ]
	);

	const recentCommands = useMemo(
		() => getRecentCommands( recentlyUsedNames, allCommands ),
		[ recentlyUsedNames, allCommands ]
	);

	// Recent and Suggestions show without a search term, Results with one.
	const groups = useMemo( () => {
		if ( search ) {
			const results = rankCommands( allCommands, search );
			return results.length
				? [
						{
							key: 'results',
							label: __( 'Results' ),
							search,
							items: results,
						},
					]
				: EMPTY_ARRAY;
		}

		const result = [];

		// Recent.
		if ( recentCommands.length ) {
			result.push( {
				key: 'recent',
				label: __( 'Recent' ),
				search: '',
				items: recentCommands,
			} );
		}

		// Suggestions (contextual commands and loaders only).
		const suggestions = dedupeCommands( [
			...contextualCommands,
			...contextualLoaderCommands,
		] );
		if ( suggestions.length ) {
			result.push( {
				key: 'suggestions',
				label: __( 'Suggestions' ),
				search: '',
				items: suggestions,
			} );
		}

		return result;
	}, [
		search,
		allCommands,
		recentCommands,
		contextualCommands,
		contextualLoaderCommands,
	] );

	const inputRef = useRef();
	useEffect( () => {
		// Focus the command palette input when mounting the modal.
		if ( paletteIsOpen ) {
			inputRef.current?.focus();
		}
	}, [ paletteIsOpen ] );

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

	const showEmpty = !! search && ! loadersLoading && ! groups.length;

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
				<Autocomplete.Root
					items={ groups }
					mode="none"
					value={ search }
					onValueChange={ setSearch }
					open
					inline
					autoHighlight
				>
					{ activeLoaders.map( ( loader ) => (
						<LoaderRunnerWrapper
							key={ loader.name }
							loader={ loader }
							search={ search }
							onResolved={ onResolved }
						/>
					) ) }
					<Autocomplete.Input
						ref={ inputRef }
						placeholder={ inputLabel }
						aria-label={ inputLabel }
						className="commands-command-menu__input"
						render={
							<Input
								prefix={
									<InputLayout.Slot padding="minimal">
										<Icon
											icon={ inputIcon }
											style={
												isRTL()
													? undefined
													: {
															transform:
																'scaleX(-1)',
														}
											}
										/>
									</InputLayout.Slot>
								}
							/>
						}
					/>
					<Autocomplete.Empty className="commands-command-menu__empty">
						{ showEmpty ? __( 'No results found.' ) : null }
					</Autocomplete.Empty>
					<Autocomplete.List
						className="commands-command-menu__list"
						aria-label={ __( 'Command suggestions' ) }
					>
						<Autocomplete.ListBody className="commands-command-menu__list-body">
							<Autocomplete.Collection>
								{ ( group ) => (
									<Autocomplete.Group
										key={ group.key }
										items={ group.items }
									>
										<Autocomplete.GroupLabel>
											{ group.label }
										</Autocomplete.GroupLabel>
										<Autocomplete.Collection>
											{ ( command ) => (
												<CommandItem
													key={ command.name }
													command={ command }
													search={ group.search }
													onRun={ runCommand }
												/>
											) }
										</Autocomplete.Collection>
									</Autocomplete.Group>
								) }
							</Autocomplete.Collection>
						</Autocomplete.ListBody>
					</Autocomplete.List>
				</Autocomplete.Root>
			</div>
		</Modal>
	);
}
