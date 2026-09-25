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
 * Compares the parts of two commands the palette renders and ranks by, leaving
 * out functions that loader hooks rebuild on every render.
 *
 * @param {Object} a First command.
 * @param {Object} b Second command.
 *
 * @return {boolean} Whether one command can stand in for the other.
 */
function isEquivalentCommand( a, b ) {
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
	for ( const command of commands ) {
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
		search,
		onResolved,
	} );

	return null;
}

/**
 * The palette itself, mounted only while it is open. Everything it derives is
 * scoped to one session: the search term, the loaders and what they resolved to
 * all start clean on the next open.
 *
 * @param {Object}   props
 * @param {Function} props.onClose Closes the palette.
 */
function CommandPalette( { onClose } ) {
	const [ search, setSearch ] = useState( '' );
	const {
		loadersLoading,
		staticCommands,
		contextualCommands,
		staticLoaders,
		contextualLoaders,
		recentlyUsedNames,
	} = useSelect( ( select ) => {
		const { getCommands, getCommandLoaders } = select( commandsStore );
		return {
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
	const hasRecentCommands = recentlyUsedNames.length > 0;

	const latestLoaderCommands = useRef( new Map() );
	const [ resolvedMap, setResolvedMap ] = useState( () => new Map() );

	const onResolved = useCallback( ( loaderName, commands ) => {
		if ( commands.length ) {
			latestLoaderCommands.current.set( loaderName, commands );
		} else {
			latestLoaderCommands.current.delete( loaderName );
		}
		setResolvedMap( ( prev ) => {
			const previous = prev.get( loaderName ) ?? EMPTY_ARRAY;
			if (
				previous.length === commands.length &&
				previous.every( ( command, i ) =>
					isEquivalentCommand( command, commands[ i ] )
				)
			) {
				return prev;
			}
			const next = new Map( prev );
			if ( commands.length ) {
				next.set( loaderName, commands );
			} else {
				next.delete( loaderName );
			}
			return next;
		} );
	}, [] );

	const runCommand = useCallback( ( command, closeMenu ) => {
		recordUsage( command.name );
		const latest = [ ...latestLoaderCommands.current.values() ]
			.flat()
			.find( ( { name } ) => name === command.name );
		( latest ?? command ).callback( { close: closeMenu } );
	}, [] );

	const activeLoaders =
		search || hasRecentCommands
			? [ ...contextualLoaders, ...staticLoaders ]
			: contextualLoaders;

	const contextualLoaderNames = useMemo(
		() => new Set( contextualLoaders.map( ( { name } ) => name ) ),
		[ contextualLoaders ]
	);

	const { allLoaderCommands, contextualLoaderCommands } = useMemo( () => {
		const all = [];
		const contextual = [];
		for ( const [ name, commands ] of resolvedMap ) {
			all.push( ...commands );
			if ( contextualLoaderNames.has( name ) ) {
				contextual.push( ...commands );
			}
		}
		return {
			allLoaderCommands: all,
			contextualLoaderCommands: contextual,
		};
	}, [ resolvedMap, contextualLoaderNames ] );

	const allCommands = useMemo(
		() =>
			dedupeCommands( [
				...contextualCommands,
				...staticCommands,
				...allLoaderCommands,
			] ),
		[ contextualCommands, staticCommands, allLoaderCommands ]
	);

	const groups = useMemo( () => {
		if ( search ) {
			const results = rankCommands( allCommands, search );
			return results.length
				? [
						{
							key: 'results',
							label: __( 'Results' ),
							items: results,
						},
					]
				: EMPTY_ARRAY;
		}

		const result = [];

		const recentCommands = getRecentCommands(
			recentlyUsedNames,
			allCommands
		);
		if ( recentCommands.length ) {
			result.push( {
				key: 'recent',
				label: __( 'Recent' ),
				items: recentCommands,
			} );
		}

		const suggestions = dedupeCommands( [
			...contextualCommands,
			...contextualLoaderCommands,
		] );
		if ( suggestions.length ) {
			result.push( {
				key: 'suggestions',
				label: __( 'Suggestions' ),
				items: suggestions,
			} );
		}

		return result;
	}, [
		search,
		allCommands,
		recentlyUsedNames,
		contextualCommands,
		contextualLoaderCommands,
	] );

	const inputRef = useRef();
	useEffect( () => {
		// Focus the command palette input when mounting the modal.
		inputRef.current?.focus();
	}, [] );

	const showEmpty = !! search && ! loadersLoading && ! groups.length;

	return (
		<Modal
			className="commands-command-menu"
			overlayClassName="commands-command-menu__overlay"
			onRequestClose={ onClose }
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
						<LoaderRunner
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
													search={ search }
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

/**
 * @ignore
 */
export function CommandMenu() {
	const { registerShortcut } = useDispatch( keyboardShortcutsStore );
	const isOpen = useSelect(
		( select ) => select( commandsStore ).isOpen(),
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

	return isOpen ? <CommandPalette onClose={ close } /> : null;
}
