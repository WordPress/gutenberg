import {
	renderToString,
	useEffect,
	useMemo,
	useReducer,
	useRef,
} from '@wordpress/element';
import {
	useEvent,
	useInstanceId,
	useMergeRefs,
	useRefEffect,
} from '@wordpress/compose';
import {
	create,
	slice,
	insert,
	isCollapsed,
	getTextContent,
	privateApis as richTextPrivateApis,
} from '@wordpress/rich-text';
import { speak } from '@wordpress/a11y';
import { isAppleOS, withIgnoreIMEEvents } from '@wordpress/keycodes';
import type { RichTextValue } from '@wordpress/rich-text';
import { AutocompleterUI } from './autocompleter-ui';
import { getAutocompleteMatch } from './get-autocomplete-match';
import type {
	AutocompleteAction,
	AutocompleteProps,
	AutocompleteState,
	InsertOption,
	KeyedOption,
	ListedOptionCompleter,
	OptionCompletion,
	ReplaceOption,
	UseAutocompleteProps,
} from './types';
import getNodeText from '../utils/get-node-text';
import { unlock } from '../lock-unlock';

const { subscribeOwnedListener } = unlock( richTextPrivateApis );

const EMPTY_FILTERED_OPTIONS: KeyedOption[] = [];

// Used for generating the instance ID
const AUTOCOMPLETE_HOOK_REFERENCE = {};

function getCompletionObject< TReplacement >(
	completion: OptionCompletion< TReplacement >
): InsertOption | ReplaceOption< TReplacement > {
	if (
		completion !== null &&
		typeof completion === 'object' &&
		'action' in completion &&
		completion.action !== undefined &&
		'value' in completion &&
		completion.value !== undefined
	) {
		return completion;
	}
	return {
		action: 'insert-at-caret',
		value: completion as React.ReactNode,
	};
}

const initialState: AutocompleteState< never > = {
	selectedIndex: 0,
	optionKeys: [],
	filterValue: '',
	autocompleter: null,
};

function autocompleteReducer< TReplacement >(
	state: AutocompleteState< TReplacement >,
	action: AutocompleteAction< TReplacement >
): AutocompleteState< TReplacement > {
	switch ( action.type ) {
		case 'RESET':
			return initialState;
		case 'SELECT':
			return { ...state, selectedIndex: action.index };
		case 'OPTIONS':
			if (
				action.options.length === state.optionKeys.length &&
				action.options.every(
					( option, index ) =>
						option.key === state.optionKeys[ index ]
				)
			) {
				return state;
			}
			return {
				...state,
				optionKeys: action.options.map( ( option ) => option.key ),
				selectedIndex:
					action.options.length === state.optionKeys.length
						? state.selectedIndex
						: 0,
			};
		case 'MATCH':
			if (
				state.autocompleter &&
				state.autocompleter.name === action.completer.name &&
				state.autocompleter.triggerPrefix ===
					action.completer.triggerPrefix &&
				state.filterValue === action.query
			) {
				return state;
			}
			return {
				...state,
				autocompleter: action.completer,
				filterValue: action.query,
			};
	}
}

export function useAutocomplete< TReplacement = RichTextValue >( {
	record,
	onChange,
	onReplace,
	completers,
	contentRef,
}: UseAutocompleteProps< TReplacement > ) {
	const instanceId = useInstanceId( AUTOCOMPLETE_HOOK_REFERENCE );
	const [ state, dispatch ] = useReducer(
		autocompleteReducer< TReplacement >,
		initialState
	);
	const {
		selectedIndex,
		optionKeys,
		filterValue,
		autocompleter: matchedCompleter,
	} = state;
	const autocompleter = matchedCompleter
		? ( completers.find(
				( candidate ) =>
					candidate.name === matchedCompleter.name &&
					candidate.triggerPrefix === matchedCompleter.triggerPrefix
			) ?? null )
		: null;

	// Keep committed option data with its provider. State only needs the keys,
	// so refreshed data with the same keys does not retrigger provider renders.
	const optionsRef = useRef< {
		options: KeyedOption[];
		completer: ListedOptionCompleter< TReplacement >;
	} | null >( null );
	const reset = useEvent( () => {
		optionsRef.current = null;
		dispatch( { type: 'RESET' } );
	} );
	const backspacingRef = useRef( false );
	const prevRecordTextRef = useRef( '' );
	const lastCompletionRef = useRef< {
		name: string;
		value: string;
	} | null >( null );

	function insertCompletion( replacement: React.ReactNode ) {
		if ( autocompleter === null ) {
			return '';
		}
		const end = record.start;
		const start =
			end - autocompleter.triggerPrefix.length - filterValue.length;
		const toInsert = create( { html: renderToString( replacement ) } );

		onChange( insert( record, toInsert, start, end ) );
		return getTextContent( toInsert );
	}

	function select( option: KeyedOption ) {
		const optionCompleter = optionsRef.current?.completer;
		if ( option.isDisabled || ! autocompleter || ! optionCompleter ) {
			return;
		}

		const { getOptionCompletion } = optionCompleter;
		if ( ! getOptionCompletion ) {
			reset();
			contentRef.current?.focus();
			return;
		}

		const completionObject = getCompletionObject(
			getOptionCompletion( option.value, filterValue )
		);

		if ( 'replace' === completionObject.action ) {
			onReplace( [ completionObject.value ] );
			// When replacing, the component will unmount, so don't reset
			// state (below) on an unmounted component.
			return;
		}

		if ( 'insert-at-caret' === completionObject.action ) {
			const completionText = insertCompletion( completionObject.value );
			// When the completion value starts with the trigger prefix
			// (e.g. @username), the trigger stays in the text and would
			// re-activate the autocompleter. Store the completed text so
			// the effect can suppress the stale re-match.
			if ( completionText.startsWith( autocompleter.triggerPrefix ) ) {
				const afterPrefix = completionText.slice(
					autocompleter.triggerPrefix.length
				);
				if ( afterPrefix ) {
					lastCompletionRef.current = {
						name: autocompleter.name,
						value: afterPrefix,
					};
				}
			}
		}

		// Reset autocomplete state after insertion rather than before
		// so insertion events don't cause the completion menu to redisplay.
		reset();

		// Make sure that the content remains focused after making a selection
		// and that the text cursor position is not lost.
		contentRef.current?.focus();
	}

	const onChangeOptions = useEvent(
		(
			options: KeyedOption[],
			completer: ListedOptionCompleter< TReplacement >
		) => {
			optionsRef.current = { options, completer };
			dispatch( { type: 'OPTIONS', options } );
		}
	);

	function handleKeyDown( event: KeyboardEvent ) {
		const currentOptions =
			optionsRef.current?.options ?? EMPTY_FILTERED_OPTIONS;
		backspacingRef.current = event.key === 'Backspace';

		if ( ! autocompleter ) {
			return;
		}
		if ( currentOptions.length === 0 ) {
			return;
		}

		if ( event.defaultPrevented ) {
			return;
		}

		switch ( event.key ) {
			case 'ArrowUp':
			case 'ArrowDown': {
				const offset = event.key === 'ArrowUp' ? -1 : 1;
				const newIndex =
					( selectedIndex + offset + currentOptions.length ) %
					currentOptions.length;
				dispatch( { type: 'SELECT', index: newIndex } );
				// See the related PR as to why this is necessary: https://github.com/WordPress/gutenberg/pull/54902.
				if ( isAppleOS() ) {
					speak(
						getNodeText( currentOptions[ newIndex ].label ),
						'assertive'
					);
				}
				break;
			}

			case 'Escape':
				reset();
				event.preventDefault();
				break;

			case 'Enter':
				select( currentOptions[ selectedIndex ] );
				break;

			case 'ArrowLeft':
			case 'ArrowRight':
				reset();
				return;

			default:
				return;
		}

		// Any handled key should prevent original behavior. This relies on
		// the early return in the default case.
		event.preventDefault();
	}

	// textContent is a primitive (string), memoizing is not strictly necessary
	// but this is a preemptive performance improvement, since the autocompleter
	// is a potential bottleneck for the editor type metric.
	const textContent = useMemo( () => {
		if ( isCollapsed( record ) ) {
			return getTextContent( slice( record, 0 ) );
		}
		return '';
	}, [ record ] );

	const refreshMatch = useEvent( () => {
		const isTextChange = record.text !== prevRecordTextRef.current;
		prevRecordTextRef.current = record.text;

		function getTextAfterSelection() {
			return textContent
				? getTextContent(
						slice(
							record,
							undefined,
							getTextContent( record ).length
						)
					)
				: '';
		}

		const match = getAutocompleteMatch( textContent, completers, {
			matchCount: optionKeys.length,
			isBackspacing: backspacingRef.current,
			getTextAfterSelection,
			lastCompletion: lastCompletionRef.current,
		} );

		if ( ! match ) {
			if ( matchedCompleter ) {
				reset();
			}
			return;
		}

		const { completer, filterValue: query } = match;

		// Don't re-activate a dismissed autocompleter on cursor-only
		// movement. `textContent` (text before cursor) changes with the
		// caret, so the effect re-runs, but `record.text` does not.
		// Complements the render-time `didUserInput` gate in
		// `useAutocompleteProps` for callers using this hook directly.
		if ( ! matchedCompleter && ! isTextChange ) {
			return;
		}

		// Clear stale completion ref when the user types a new trigger
		// for the same completer (the previous completion is no longer
		// relevant). Must be after the cursor-only check so that mere
		// cursor movement doesn't discard the suppression state.
		if (
			lastCompletionRef.current &&
			lastCompletionRef.current.name === completer.name
		) {
			lastCompletionRef.current = null;
		}

		dispatch( { type: 'MATCH', completer, query } );
	} );
	useEffect( () => {
		refreshMatch();
	}, [ textContent, completers, refreshMatch ] );

	const selectedKey = optionKeys[ selectedIndex ] ?? '';
	const { className } = autocompleter || {};
	const isExpanded = !! autocompleter && optionKeys.length > 0;
	const listBoxId = isExpanded
		? `components-autocomplete-listbox-${ instanceId }`
		: undefined;
	const activeId = isExpanded
		? `components-autocomplete-item-${ instanceId }-${ selectedKey }`
		: null;
	const hasSelection = record.start !== undefined;
	const showPopover = !! textContent && hasSelection && !! autocompleter;

	return {
		listBoxId,
		activeId,
		onKeyDown: withIgnoreIMEEvents( handleKeyDown ),
		popover: showPopover && (
			<AutocompleterUI
				key={
					autocompleter.name +
					autocompleter.triggerPrefix +
					( autocompleter.useItems ? ':custom' : ':default' )
				}
				autocompleter={ autocompleter }
				className={ className }
				filterValue={ filterValue }
				instanceId={ instanceId }
				listBoxId={ listBoxId }
				selectedIndex={ selectedIndex }
				onChangeOptions={ onChangeOptions }
				onSelect={ select }
				onHover={ ( index ) => dispatch( { type: 'SELECT', index } ) }
				contentRef={ contentRef }
				reset={ reset }
			/>
		),
	};
}

/**
 * Checks whether two records represent the same user-visible state
 * (same text content and cursor position).
 */
function recordValuesMatch(
	a: UseAutocompleteProps[ 'record' ],
	b: UseAutocompleteProps[ 'record' ]
) {
	return a.text === b.text && a.start === b.start && a.end === b.end;
}

/**
 * Tracks the last record whose value differed from the current one.
 * Used to determine whether the user has actually typed something
 */
export function useLastDifferentValue(
	value: UseAutocompleteProps[ 'record' ]
) {
	const history = useRef< Array< typeof value > >( [] );

	const lastEntry = history.current[ history.current.length - 1 ];

	// Only add to history if the value is meaningfully different from
	// the most recent entry (analogous to Set.add being a no-op for
	// duplicate references in the original implementation).
	if ( ! lastEntry || ! recordValuesMatch( value, lastEntry ) ) {
		history.current.push( value );
	}

	// Keep the history size to 2.
	if ( history.current.length > 2 ) {
		history.current.shift();
	}

	return history.current[ 0 ];
}

// The popover is anchored to the element this hook's own `ref` lands on, so it
// owns `contentRef` and callers don't provide one.
export function useAutocompleteProps< TReplacement = RichTextValue >(
	options: Omit< UseAutocompleteProps< TReplacement >, 'contentRef' >
) {
	const ref = useRef< HTMLElement >( null );
	const { record } = options;
	const previousRecord = useLastDifferentValue( record );
	const { popover, listBoxId, activeId, onKeyDown } = useAutocomplete( {
		...options,
		contentRef: ref,
	} );
	const onKeyDownEvent = useEvent( onKeyDown );

	const mergedRefs = useMergeRefs( [
		ref,
		useRefEffect(
			( element: HTMLElement ) => {
				function _onKeyDown( event: Event ) {
					onKeyDownEvent( event as KeyboardEvent );
				}
				// Capture phase. When the autocomplete popover is open,
				// Up/Down/Enter/Escape must navigate the completion list —
				// they shouldn't be consumed by ancestor handlers (e.g.
				// block-editor's writing-flow) for block navigation, block
				// splitting, or "move out of parent" actions. Those handlers
				// fire at bubble phase and gate on `event.defaultPrevented`,
				// so firing in capture lets us preventDefault first when the
				// popover is active.
				return subscribeOwnedListener(
					element,
					'keydown',
					_onKeyDown,
					true
				);
			},
			[ onKeyDownEvent ]
		),
	] );

	// We only want to show the popover if the user has typed something.
	const didUserInput = record.text !== previousRecord?.text;

	if ( ! didUserInput ) {
		return { ref: mergedRefs };
	}

	// `aria-owns` and `aria-controls` point at the same list: either one lets
	// `aria-activedescendant` resolve to an option rendered outside this
	// element, and assistive technology support differs between them.
	//
	// No `aria-expanded`: consumers are `textbox` elements, which don't
	// support it; that would mean `role="combobox"`, which in turn doesn't
	// support the `aria-multiline` these fields set.
	return {
		ref: mergedRefs,
		children: popover,
		'aria-autocomplete': listBoxId ? ( 'list' as const ) : undefined,
		'aria-haspopup': listBoxId ? ( 'listbox' as const ) : undefined,
		'aria-controls': listBoxId,
		'aria-owns': listBoxId,
		'aria-activedescendant': activeId ?? undefined,
	};
}

export default function Autocomplete< TReplacement = RichTextValue >( {
	children,
	isSelected,
	...options
}: AutocompleteProps< TReplacement > ) {
	const { popover, ...props } = useAutocomplete( options );
	return (
		<>
			{ children( props ) }
			{ isSelected && popover }
		</>
	);
}
