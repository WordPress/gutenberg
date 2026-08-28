import { Autocomplete } from '@wordpress/ui';
import commandScore from 'command-score';
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
import { __ } from '@wordpress/i18n';
import { Modal, TextHighlight } from '@wordpress/components';
import {
	store as keyboardShortcutsStore,
	useShortcut,
} from '@wordpress/keyboard-shortcuts';
import { withIgnoreIMEEvents } from '@wordpress/keycodes';
import { Icon, search as inputIcon, arrowRight } from '@wordpress/icons';
import { store as commandsStore } from '../store';
import { unlock } from '../lock-unlock';
import {
	recordUsage,
	useHasRecentCommands,
	useLoaderCollector,
	useRecentCommands,
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
 * Appends a command's keywords to the string that gets scored. The published
 * `command-score` package only takes `( string, abbreviation )`; the copy
 * vendored in `cmdk` accepted a third `aliases` argument and folded it into the
 * scored string exactly like this, so keyword matches keep working.
 *
 * @param {string}    value    The command's searchable label.
 * @param {string[]=} keywords The command's keywords.
 *
 * @return {string} The string to score against the search term.
 */
function withKeywords( value, keywords ) {
	return keywords?.length ? `${ value } ${ keywords.join( ' ' ) }` : value;
}

/**
 * Compares the parts of two commands that decide what the palette renders.
 *
 * Loader hooks are free to rebuild their commands on every render, so functions
 * and other non-primitives are deliberately left out: comparing them by
 * identity would report a change on every render and re-render endlessly.
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
 * Ranks and filters a list of commands against the search term using the same
 * fuzzy scoring algorithm previously provided by `cmdk` (`command-score`).
 * Score-0 matches are dropped and the result is sorted by descending relevance.
 *
 * @param {Object[]} commands The commands to rank.
 * @param {string}   search   The search term.
 *
 * @return {Object[]} The matching commands, ordered by relevance.
 */
function rankCommands( commands, search ) {
	const scored = [];
	for ( const command of dedupeCommands( commands ) ) {
		const value = command.searchLabel ?? command.label;
		const score = commandScore(
			withKeywords( value, command.keywords ),
			search
		);
		if ( score > 0 ) {
			scored.push( { command, score } );
		}
	}
	scored.sort( ( a, b ) => b.score - a.score );
	return scored.map( ( { command } ) => command );
}

function CommandItem( { command, search, category, onRun } ) {
	const { close } = useDispatch( commandsStore );
	const commandCategory = category ?? command.category;
	const icon = command.icon ?? CATEGORY_FALLBACK_ICONS[ commandCategory ];
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
			{ CATEGORY_LABELS[ commandCategory ] && (
				<span className="commands-command-menu__item-category">
					{ CATEGORY_LABELS[ commandCategory ] }
				</span>
			) }
		</Autocomplete.Item>
	);
}

// Runs a single command loader and reports its resolved commands up to the
// parent via `onResolved`. Renders nothing; it exists solely to call the
// loader hook in isolation (respecting the rules of hooks) and to aggregate
// dynamic commands into the shared item list.
function LoaderRunner( { loader, search, onResolved } ) {
	useLoaderCollector( {
		hook: loader.hook,
		name: loader.name,
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
		};
	}, [] );
	const { open, close } = useDispatch( commandsStore );
	const hasRecentCommands = useHasRecentCommands();

	// Aggregate the commands resolved by each dynamic loader. Each loader runs
	// in its own `LoaderRunner` component and reports back here. Re-rendering is
	// driven by `rendersTheSame`, so a loader that rebuilds equivalent commands
	// on every render does not churn the list. The newest objects are still kept
	// in a ref, because their callbacks close over state that the compared
	// fields do not reflect.
	const latestLoaderCommands = useRef( new Map() );
	const [ resolvedMap, setResolvedMap ] = useState( () => new Map() );
	const onResolved = useCallback( ( loaderName, cmds ) => {
		latestLoaderCommands.current.set( loaderName, cmds );
		setResolvedMap( ( prev ) => {
			const prevCmds = prev.get( loaderName );
			if (
				prevCmds &&
				prevCmds.length === cmds.length &&
				prevCmds.every( ( c, i ) => rendersTheSame( c, cmds[ i ] ) )
			) {
				return prev;
			}
			const next = new Map( prev );
			next.set( loaderName, cmds );
			return next;
		} );
	}, [] );

	// The rendered command object can predate the loader's latest report, so
	// look the command up again before running it.
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
		() => [ ...contextualLoaders, ...staticLoaders ],
		[ contextualLoaders, staticLoaders ]
	);
	// Only run the loaders whose results can actually be shown. With no search
	// term the non-contextual ones matter solely for resolving recently used
	// commands, and running them anyway makes the loaders that ignore `search`
	// fetch on every open.
	const activeLoaders = useMemo(
		() => ( search || hasRecentCommands ? loaders : contextualLoaders ),
		[ search, hasRecentCommands, loaders, contextualLoaders ]
	);
	const contextualLoaderNames = useMemo(
		() => new Set( contextualLoaders.map( ( loader ) => loader.name ) ),
		[ contextualLoaders ]
	);
	// Commands returned by a loader hook never pass through `registerCommand`,
	// so they have no category of their own unless the hook sets one. The
	// loader's category stands in for them.
	const loaderCategories = useMemo(
		() =>
			new Map(
				loaders.map( ( loader ) => [ loader.name, loader.category ] )
			),
		[ loaders ]
	);

	const { allLoaderCommands, contextualLoaderCommands } = useMemo( () => {
		const all = [];
		const contextual = [];
		for ( const [ name, cmds ] of resolvedMap ) {
			const loaderCategory = loaderCategories.get( name );
			const categorized = cmds.map( ( command ) =>
				command.category
					? command
					: { ...command, category: loaderCategory }
			);
			all.push( ...categorized );
			if ( contextualLoaderNames.has( name ) ) {
				contextual.push( ...categorized );
			}
		}
		return {
			allLoaderCommands: all,
			contextualLoaderCommands: contextual,
		};
	}, [ resolvedMap, contextualLoaderNames, loaderCategories ] );

	const allCommands = useMemo(
		() => [
			...contextualCommands,
			...staticCommands,
			...allLoaderCommands,
		],
		[ contextualCommands, staticCommands, allLoaderCommands ]
	);

	const recentCommands = useRecentCommands( allCommands );

	// Build the grouped item list passed to `Autocomplete`. The groups shown
	// depend on whether a search term is present, mirroring the previous
	// Recent / Suggestions / Results behavior.
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
					// Also turns off the built-in substring filter, leaving
					// `rankCommands` in charge. Any other mode would filter the
					// ranked results again and drop non-substring matches.
					mode="none"
					value={ search }
					onValueChange={ setSearch }
					open
					inline
					// `true` only highlights once a query is typed, which
					// leaves Enter dead right after opening the palette.
					autoHighlight="always"
				>
					{ activeLoaders.map( ( loader ) => (
						<LoaderRunnerWrapper
							key={ loader.name }
							loader={ loader }
							search={ search }
							onResolved={ onResolved }
						/>
					) ) }
					<div className="commands-command-menu__header">
						<Icon
							className="commands-command-menu__header-search-icon"
							icon={ inputIcon }
						/>
						<Autocomplete.Input
							ref={ inputRef }
							placeholder={ inputLabel }
							aria-label={ inputLabel }
							className="commands-command-menu__input"
							// Render a plain input so the palette keeps its
							// borderless appearance instead of the design
							// system's bordered input control.
							render={ <input /> }
						/>
					</div>
					<Autocomplete.List
						className="commands-command-menu__list"
						aria-label={ __( 'Command suggestions' ) }
					>
						{ /* This element is the `role="status"` live region:
						     unmounting it would drop the announcement. */ }
						<Autocomplete.Empty className="commands-command-menu__empty">
							{ showEmpty ? __( 'No results found.' ) : null }
						</Autocomplete.Empty>
						<Autocomplete.ListBody className="commands-command-menu__list-scrollable-container">
							<Autocomplete.Collection>
								{ ( group ) => (
									<Autocomplete.Group
										key={ group.key }
										items={ group.items }
										className="commands-command-menu__group"
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
													category={
														command.category
													}
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
