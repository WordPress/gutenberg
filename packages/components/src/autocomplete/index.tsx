/**
 * External dependencies
 */
import removeAccents from 'remove-accents';

/**
 * WordPress dependencies
 */
import {
	renderToString,
	useEffect,
	useState,
	useRef,
	useMemo,
} from '@wordpress/element';
import { __, _n } from '@wordpress/i18n';
import { useInstanceId, useMergeRefs, useRefEffect } from '@wordpress/compose';
import {
	create,
	slice,
	insert,
	isCollapsed,
	getTextContent,
} from '@wordpress/rich-text';
import { speak } from '@wordpress/a11y';
import { isAppleOS } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { getAutoCompleterUI } from './autocompleter-ui';
import { escapeRegExp } from '../utils/strings';
import { withIgnoreIMEEvents } from '../utils/with-ignore-ime-events';
import type {
	AutocompleteProps,
	AutocompleterUIProps,
	InsertOption,
	KeyedOption,
	OptionCompletion,
	ReplaceOption,
	UseAutocompleteProps,
	WPCompleter,
} from './types';

const getNodeText = ( node: React.ReactNode ): string => {
	if ( node === null ) {
		return '';
	}

	switch ( typeof node ) {
		case 'string':
		case 'number':
			return node.toString();
			break;
		case 'boolean':
			return '';
			break;
		case 'object': {
			if ( node instanceof Array ) {
				return node.map( getNodeText ).join( '' );
			}
			if ( 'props' in node ) {
				return getNodeText( node.props.children );
			}
			break;
		}
		default:
			return '';
	}

	return '';
};

const EMPTY_FILTERED_OPTIONS: KeyedOption[] = [];

export function useAutocomplete( {
	record,
	onChange,
	onReplace,
	completers,
	contentRef,
}: UseAutocompleteProps ) {
	const instanceId = useInstanceId( useAutocomplete );
	const [ selectedIndex, setSelectedIndex ] = useState( 0 );

	const [ filteredOptions, setFilteredOptions ] = useState<
		Array< KeyedOption >
	>( EMPTY_FILTERED_OPTIONS );
	const [ filterValue, setFilterValue ] =
		useState< AutocompleterUIProps[ 'filterValue' ] >( '' );
	const [ autocompleter, setAutocompleter ] = useState< WPCompleter | null >(
		null
	);
	const [ AutocompleterUI, setAutocompleterUI ] = useState<
		( ( props: AutocompleterUIProps ) => JSX.Element | null ) | null
	>( null );

	const backspacing = useRef( false );

	function insertCompletion( replacement: React.ReactNode ) {
		if ( autocompleter === null ) {
			return;
		}
		const end = record.start;
		const start =
			end - autocompleter.triggerPrefix.length - filterValue.length;
		const toInsert = create( { html: renderToString( replacement ) } );

		onChange( insert( record, toInsert, start, end ) );
	}

	function select( option: KeyedOption ) {
		const { getOptionCompletion } = autocompleter || {};

		if ( option.isDisabled ) {
			return;
		}

		if ( getOptionCompletion ) {
			const completion = getOptionCompletion( option.value, filterValue );

			const isCompletionObject = (
				obj: OptionCompletion
			): obj is InsertOption | ReplaceOption => {
				return (
					obj !== null &&
					typeof obj === 'object' &&
					'action' in obj &&
					obj.action !== undefined &&
					'value' in obj &&
					obj.value !== undefined
				);
			};

			const completionObject = isCompletionObject( completion )
				? completion
				: ( {
						action: 'insert-at-caret',
						value: completion,
				  } as InsertOption );

			if ( 'replace' === completionObject.action ) {
				onReplace( [ completionObject.value ] );
				// When replacing, the component will unmount, so don't reset
				// state (below) on an unmounted component.
				return;
			} else if ( 'insert-at-caret' === completionObject.action ) {
				insertCompletion( completionObject.value );
			}
		}

		// Reset autocomplete state after insertion rather than before
		// so insertion events don't cause the completion menu to redisplay.
		reset();
	}

	function reset() {
		setSelectedIndex( 0 );
		setFilteredOptions( EMPTY_FILTERED_OPTIONS );
		setFilterValue( '' );
		setAutocompleter( null );
		setAutocompleterUI( null );
	}

	/**
	 * Load options for an autocompleter.
	 *
	 * @param {Array} options
	 */
	function onChangeOptions( options: Array< KeyedOption > ) {
		setSelectedIndex(
			options.length === filteredOptions.length ? selectedIndex : 0
		);
		setFilteredOptions( options );
	}

	function handleKeyDown( event: KeyboardEvent ) {
		backspacing.current = event.key === 'Backspace';

		if ( ! autocompleter ) {
			return;
		}
		if ( filteredOptions.length === 0 ) {
			return;
		}

		if ( event.defaultPrevented ) {
			return;
		}

		switch ( event.key ) {
			case 'ArrowUp': {
				const newIndex =
					( selectedIndex === 0
						? filteredOptions.length
						: selectedIndex ) - 1;
				setSelectedIndex( newIndex );
				// See the related PR as to why this is necessary: https://github.com/WordPress/gutenberg/pull/54902.
				if ( isAppleOS() ) {
					speak(
						getNodeText( filteredOptions[ newIndex ].label ),
						'assertive'
					);
				}
				break;
			}

			case 'ArrowDown': {
				const newIndex = ( selectedIndex + 1 ) % filteredOptions.length;
				setSelectedIndex( newIndex );
				if ( isAppleOS() ) {
					speak(
						getNodeText( filteredOptions[ newIndex ].label ),
						'assertive'
					);
				}
				break;
			}

			case 'Escape':
				setAutocompleter( null );
				setAutocompleterUI( null );
				event.preventDefault();
				break;

			case 'Enter':
				select( filteredOptions[ selectedIndex ] );
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

	useEffect( () => {
		if ( ! textContent ) {
			if ( autocompleter ) {
				reset();
			}
			return;
		}

		// Find the completer with the highest triggerPrefix index in the
		// textContent.
		const completer = completers.reduce< WPCompleter | null >(
			( lastTrigger, currentCompleter ) => {
				const triggerIndex = textContent.lastIndexOf(
					currentCompleter.triggerPrefix
				);
				const lastTriggerIndex =
					lastTrigger !== null
						? textContent.lastIndexOf( lastTrigger.triggerPrefix )
						: -1;

				return triggerIndex > lastTriggerIndex
					? currentCompleter
					: lastTrigger;
			},
			null
		);

		if ( ! completer ) {
			if ( autocompleter ) {
				reset();
			}
			return;
		}

		const { allowContext, triggerPrefix } = completer;
		const triggerIndex = textContent.lastIndexOf( triggerPrefix );
		const textWithoutTrigger = textContent.slice(
			triggerIndex + triggerPrefix.length
		);

		const tooDistantFromTrigger = textWithoutTrigger.length > 50; // 50 chars seems to be a good limit.
		// This is a final barrier to prevent the effect from completing with
		// an extremely long string, which causes the editor to slow-down
		// significantly. This could happen, for example, if `matchingWhileBackspacing`
		// is true and one of the "words" end up being too long. If that's the case,
		// it will be caught by this guard.
		if ( tooDistantFromTrigger ) {
			return;
		}

		const mismatch = filteredOptions.length === 0;
		const wordsFromTrigger = textWithoutTrigger.split( /\s/ );
		// We need to allow the effect to run when not backspacing and if there
		// was a mismatch. i.e when typing a trigger + the match string or when
		// clicking in an existing trigger word on the page. We do that if we
		// detect that we have one word from trigger in the current textual context.
		//
		// Ex.: "Some text @a" <-- "@a" will be detected as the trigger word and
		// allow the effect to run. It will run until there's a mismatch.
		const hasOneTriggerWord = wordsFromTrigger.length === 1;
		// This is used to allow the effect to run when backspacing and if
		// "touching" a word that "belongs" to a trigger. We consider a "trigger
		// word" any word up to the limit of 3 from the trigger character.
		// Anything beyond that is ignored if there's a mismatch. This allows
		// us to "escape" a mismatch when backspacing, but still imposing some
		// sane limits.
		//
		// Ex: "Some text @marcelo sekkkk" <--- "kkkk" caused a mismatch, but
		// if the user presses backspace here, it will show the completion popup again.
		const matchingWhileBackspacing =
			backspacing.current && wordsFromTrigger.length <= 3;

		if ( mismatch && ! ( matchingWhileBackspacing || hasOneTriggerWord ) ) {
			if ( autocompleter ) {
				reset();
			}
			return;
		}

		const textAfterSelection = getTextContent(
			slice( record, undefined, getTextContent( record ).length )
		);

		if (
			allowContext &&
			! allowContext(
				textContent.slice( 0, triggerIndex ),
				textAfterSelection
			)
		) {
			if ( autocompleter ) {
				reset();
			}
			return;
		}

		if (
			/^\s/.test( textWithoutTrigger ) ||
			/\s\s+$/.test( textWithoutTrigger )
		) {
			if ( autocompleter ) {
				reset();
			}
			return;
		}

		if ( ! /[\u0000-\uFFFF]*$/.test( textWithoutTrigger ) ) {
			if ( autocompleter ) {
				reset();
			}
			return;
		}

		const safeTrigger = escapeRegExp( completer.triggerPrefix );
		const text = removeAccents( textContent );
		const match = text
			.slice( text.lastIndexOf( completer.triggerPrefix ) )
			.match( new RegExp( `${ safeTrigger }([\u0000-\uFFFF]*)$` ) );
		const query = match && match[ 1 ];

		setAutocompleter( completer );
		setAutocompleterUI( () =>
			completer !== autocompleter
				? getAutoCompleterUI( completer )
				: AutocompleterUI
		);
		setFilterValue( query === null ? '' : query );
		// Temporarily disabling exhaustive-deps to avoid introducing unexpected side effecst.
		// See https://github.com/WordPress/gutenberg/pull/41820
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ textContent ] );

	const { key: selectedKey = '' } = filteredOptions[ selectedIndex ] || {};
	const { className } = autocompleter || {};
	const isExpanded = !! autocompleter && filteredOptions.length > 0;
	const listBoxId = isExpanded
		? `components-autocomplete-listbox-${ instanceId }`
		: undefined;
	const activeId = isExpanded
		? `components-autocomplete-item-${ instanceId }-${ selectedKey }`
		: null;
	const hasSelection = record.start !== undefined;

	return {
		listBoxId,
		activeId,
		onKeyDown: withIgnoreIMEEvents( handleKeyDown ),
		popover: hasSelection && AutocompleterUI && (
			<AutocompleterUI
				className={ className }
				filterValue={ filterValue }
				instanceId={ instanceId }
				listBoxId={ listBoxId }
				selectedIndex={ selectedIndex }
				onChangeOptions={ onChangeOptions }
				onSelect={ select }
				value={ record }
				contentRef={ contentRef }
				reset={ reset }
			/>
		),
	};
}

function useLastDifferentValue( value: UseAutocompleteProps[ 'record' ] ) {
	const history = useRef< Set< typeof value > >( new Set() );

	history.current.add( value );

	// Keep the history size to 2.
	if ( history.current.size > 2 ) {
		history.current.delete( Array.from( history.current )[ 0 ] );
	}

	return Array.from( history.current )[ 0 ];
}

export function useAutocompleteProps( options: UseAutocompleteProps ) {
	const ref = useRef< HTMLElement >( null );
	const onKeyDownRef = useRef< ( event: KeyboardEvent ) => void >();
	const { record } = options;
	const previousRecord = useLastDifferentValue( record );
	const { popover, listBoxId, activeId, onKeyDown } = useAutocomplete( {
		...options,
		contentRef: ref,
	} );
	onKeyDownRef.current = onKeyDown;

	const mergedRefs = useMergeRefs( [
		ref,
		useRefEffect( ( element: HTMLElement ) => {
			function _onKeyDown( event: KeyboardEvent ) {
				onKeyDownRef.current?.( event );
			}
			element.addEventListener( 'keydown', _onKeyDown );
			return () => {
				element.removeEventListener( 'keydown', _onKeyDown );
			};
		}, [] ),
	] );

	// We only want to show the popover if the user has typed something.
	const didUserInput = record.text !== previousRecord?.text;

	if ( ! didUserInput ) {
		return { ref: mergedRefs };
	}

	return {
		ref: mergedRefs,
		children: popover,
		'aria-autocomplete': listBoxId ? 'list' : undefined,
		'aria-owns': listBoxId,
		'aria-activedescendant': activeId,
	};
}

export default function Autocomplete( {
	children,
	isSelected,
	...options
}: AutocompleteProps ) {
	const { popover, ...props } = useAutocomplete( options );
	return (
		<>
			{ children( props ) }
			{ isSelected && popover }
		</>
	);
}
