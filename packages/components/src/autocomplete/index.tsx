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
import { getAutocompleteMatch } from './get-autocomplete-match';
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
import getNodeText from '../utils/get-node-text';

const EMPTY_FILTERED_OPTIONS: KeyedOption[] = [];

// Used for generating the instance ID
const AUTOCOMPLETE_HOOK_REFERENCE = {};

export function useAutocomplete( {
	record,
	onChange,
	onReplace,
	completers,
	contentRef,
}: UseAutocompleteProps ) {
	const instanceId = useInstanceId( AUTOCOMPLETE_HOOK_REFERENCE );
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
		( ( props: AutocompleterUIProps ) => React.JSX.Element | null ) | null
	>( null );

	const backspacingRef = useRef( false );

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

		// Make sure that the content remains focused after making a selection
		// and that the text cursor position is not lost.
		contentRef.current?.focus();
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
		backspacingRef.current = event.key === 'Backspace';

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

		const match = getAutocompleteMatch(
			textContent,
			completers,
			filteredOptions.length,
			backspacingRef.current,
			getTextAfterSelection
		);

		if ( ! match ) {
			if ( autocompleter ) {
				reset();
			}
			return;
		}

		const { completer, filterValue: query } = match;

		setAutocompleter( completer );
		setAutocompleterUI( () =>
			completer !== autocompleter
				? getAutoCompleterUI( completer )
				: AutocompleterUI
		);
		setFilterValue( query );
		// We want to avoid introducing unexpected side effects.
		// See https://github.com/WordPress/gutenberg/pull/41820
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
	const showPopover = !! textContent && hasSelection && !! AutocompleterUI;

	return {
		listBoxId,
		activeId,
		onKeyDown: withIgnoreIMEEvents( handleKeyDown ),
		popover: showPopover && (
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
	const onKeyDownRef =
		useRef< ( event: KeyboardEvent ) => void >( undefined );
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
