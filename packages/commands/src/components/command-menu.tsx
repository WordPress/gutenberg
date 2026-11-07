import { Autocomplete, Input, InputLayout, Stack } from '@wordpress/ui';
import type { JSX } from 'react';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	useState,
	useEffect,
	useRef,
	useMemo,
	useCallback,
	isValidElement,
} from '@wordpress/element';
import { __, isRTL } from '@wordpress/i18n';
import { Icon as WCIcon, Modal, TextHighlight } from '@wordpress/components';
import type { IconType } from '@wordpress/components';
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
import type { Command, CommandCategory, CommandConfig } from '../store/types';
import type {
	CommandGroup,
	CommandItemProps,
	LoaderRunnerProps,
	OnResolved,
	RunCommand,
} from './types';

const inputLabel = __( 'Search commands and settings' );
const EMPTY_ARRAY: string[] = [];
const EMPTY_COMMANDS: CommandConfig[] = [];
const EMPTY_GROUPS: CommandGroup[] = [];

/**
 * Fallback icons per command category, used when a command provides no icon of
 * its own. Navigating somewhere reads the same way across the palette, so `view`
 * commands are expected to rely on this rather than pass an icon.
 */
const CATEGORY_FALLBACK_ICONS: Partial<
	Record< CommandCategory, JSX.Element >
> = {
	view: arrowRight,
};

/**
 * Translatable labels for command categories.
 */
const CATEGORY_LABELS: Record< CommandCategory, string > = {
	command: __( 'Command' ),
	view: __( 'View' ),
	edit: __( 'Edit' ),
	action: __( 'Action' ),
	workflow: __( 'Workflow' ),
};

/**
 * Whether `WCIcon` can render the value. Plugins in plain JS may still pass
 * dashicon names or components, so this accepts more than the `icon` type.
 *
 * @param icon Value to check.
 *
 * @return Whether the value is a renderable icon.
 */
function isValidIcon( icon: unknown ): icon is IconType {
	return (
		( typeof icon === 'string' && icon !== '' ) ||
		typeof icon === 'function' ||
		isValidElement( icon )
	);
}

/**
 * Compares the parts of two commands the palette renders and ranks by, leaving
 * out functions that loader hooks rebuild on every render.
 *
 * @param a First command.
 * @param b Second command.
 *
 * @return Whether one command can stand in for the other.
 */
function isEquivalentCommand( a: Command, b: Command ) {
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
 * @param commands The commands to de-duplicate.
 *
 * @return The de-duplicated commands.
 */
function dedupeCommands( commands: Command[] ) {
	const seen = new Set< string >();
	const result: Command[] = [];
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
 * @param commands The commands to rank.
 * @param search   The search term.
 *
 * @return The matching commands, ordered by relevance.
 */
function rankCommands( commands: Command[], search: string ) {
	const scored: { command: Command; score: number }[] = [];
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

function CommandItem( { command, search, onRun }: CommandItemProps ) {
	const { close } = useDispatch( commandsStore );
	const { category } = command;
	const categoryLabel = category ? CATEGORY_LABELS[ category ] : undefined;
	const fallbackIcon = category
		? CATEGORY_FALLBACK_ICONS[ category ]
		: undefined;
	const icon = isValidIcon( command.icon ) ? command.icon : fallbackIcon;
	return (
		<Autocomplete.Item
			value={ command }
			onClick={ () => onRun( command, close ) }
		>
			<Autocomplete.ItemLabel>
				<Stack
					render={ <span /> }
					direction="row"
					align="center"
					gap="sm"
					className={
						icon
							? 'commands-command-menu__item has-icon'
							: 'commands-command-menu__item'
					}
				>
					{ icon && <WCIcon icon={ icon } size={ 24 } /> }
					<span className="commands-command-menu__item-label">
						<TextHighlight
							text={ command.label }
							highlight={ search }
						/>
					</span>
					{ categoryLabel && (
						<span className="commands-command-menu__item-category">
							{ categoryLabel }
						</span>
					) }
				</Stack>
			</Autocomplete.ItemLabel>
		</Autocomplete.Item>
	);
}

// Renders nothing; it exists to call one loader hook in isolation, so that a
// varying number of loaders does not break the rules of hooks.
function LoaderRunner( { loader, search, onResolved }: LoaderRunnerProps ) {
	useLoaderCollector( {
		hook: loader.hook,
		name: loader.name,
		category: loader.category,
		search,
		onResolved,
	} );

	return null;
}

/*
 * The palette itself, mounted only while it is open. Everything it derives is
 * scoped to one session: the search term, the loaders and what they resolved to
 * all start clean on the next open.
 */
function CommandPalette( { onClose }: { onClose: () => void } ) {
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
				( select( preferencesStore ).get(
					'core/commands',
					'recentlyUsed'
				) as string[] | undefined ) ?? EMPTY_ARRAY,
		};
	}, [] );
	const hasRecentCommands = recentlyUsedNames.length > 0;

	const latestLoaderCommands = useRef( new Map< string, CommandConfig[] >() );
	const [ resolvedMap, setResolvedMap ] = useState(
		() => new Map< string, CommandConfig[] >()
	);

	const onResolved: OnResolved = useCallback( ( loaderName, commands ) => {
		if ( commands.length ) {
			latestLoaderCommands.current.set( loaderName, commands );
		} else {
			latestLoaderCommands.current.delete( loaderName );
		}
		setResolvedMap( ( prev ) => {
			const previous = prev.get( loaderName ) ?? EMPTY_COMMANDS;
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

	const runCommand: RunCommand = useCallback( ( command, closeMenu ) => {
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
		const all: CommandConfig[] = [];
		const contextual: CommandConfig[] = [];
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
				: EMPTY_GROUPS;
		}

		const result: CommandGroup[] = [];

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

	const inputRef = useRef< HTMLInputElement >( null );
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
								{ ( group: CommandGroup ) => (
									<Autocomplete.Group
										key={ group.key }
										items={ group.items }
									>
										<Autocomplete.GroupLabel>
											{ group.label }
										</Autocomplete.GroupLabel>
										<Autocomplete.Collection>
											{ ( command: Command ) => (
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
		withIgnoreIMEEvents( ( event: KeyboardEvent ) => {
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
		} )
	);

	return isOpen ? <CommandPalette onClose={ close } /> : null;
}
