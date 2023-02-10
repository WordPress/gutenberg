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
import { __, _n, sprintf } from '@wordpress/i18n';
import {
	useInstanceId,
	useDebounce,
	useMergeRefs,
	useRefEffect,
} from '@wordpress/compose';
import {
	create,
	slice,
	insert,
	isCollapsed,
	getTextContent,
} from '@wordpress/rich-text';
import { speak } from '@wordpress/a11y';

/**
 * Internal dependencies
 */
import { getAutoCompleterUI } from './autocompleter-ui';
import { escapeRegExp } from '../utils/strings';

/**
 * A raw completer option.
 *
 * @typedef {*} CompleterOption
 */

/**
 * @callback FnGetOptions
 *
 * @return {(CompleterOption[]|Promise.<CompleterOption[]>)} The completer options or a promise for them.
 */

/**
 * @callback FnGetOptionKeywords
 * @param {CompleterOption} option a completer option.
 *
 * @return {string[]} list of key words to search.
 */

/**
 * @callback FnIsOptionDisabled
 * @param {CompleterOption} option a completer option.
 *
 * @return {string[]} whether or not the given option is disabled.
 */

/**
 * @callback FnGetOptionLabel
 * @param {CompleterOption} option a completer option.
 *
 * @return {(string|Array.<(string|WPElement)>)} list of react components to render.
 */

/**
 * @callback FnAllowContext
 * @param {string} before the string before the auto complete trigger and query.
 * @param {string} after  the string after the autocomplete trigger and query.
 *
 * @return {boolean} true if the completer can handle.
 */

/**
 * @typedef {Object} OptionCompletion
 * @property {'insert-at-caret'|'replace'} action the intended placement of the completion.
 * @property {OptionCompletionValue}       value  the completion value.
 */

/**
 * A completion value.
 *
 * @typedef {(string|WPElement|Object)} OptionCompletionValue
 */

/**
 * @callback FnGetOptionCompletion
 * @param {CompleterOption} value the value of the completer option.
 * @param {string}          query the text value of the autocomplete query.
 *
 * @return {(OptionCompletion|OptionCompletionValue)} the completion for the given option. If an
 * 													   OptionCompletionValue is returned, the
 * 													   completion action defaults to `insert-at-caret`.
 */

/**
 * @typedef {Object} WPCompleter
 * @property {string}                           name                a way to identify a completer, useful for selective overriding.
 * @property {?string}                          className           A class to apply to the popup menu.
 * @property {string}                           triggerPrefix       the prefix that will display the menu.
 * @property {(CompleterOption[]|FnGetOptions)} options             the completer options or a function to get them.
 * @property {?FnGetOptionKeywords}             getOptionKeywords   get the keywords for a given option.
 * @property {?FnIsOptionDisabled}              isOptionDisabled    get whether or not the given option is disabled.
 * @property {FnGetOptionLabel}                 getOptionLabel      get the label for a given option.
 * @property {?FnAllowContext}                  allowContext        filter the context under which the autocomplete activates.
 * @property {FnGetOptionCompletion}            getOptionCompletion get the completion associated with a given option.
 */

function useAutocomplete( {
	record,
	onChange,
	onReplace,
	completers,
	contentRef,
} ) {
	const debouncedSpeak = useDebounce( speak, 500 );
	const instanceId = useInstanceId( useAutocomplete );
	const [ selectedIndex, setSelectedIndex ] = useState( 0 );
	const [ filteredOptions, setFilteredOptions ] = useState( [] );
	const [ filterValue, setFilterValue ] = useState( '' );
	const [ autocompleter, setAutocompleter ] = useState( null );
	const [ AutocompleterUI, setAutocompleterUI ] = useState( null );
	const backspacing = useRef( false );

	function insertCompletion( replacement ) {
		const end = record.start;
		const start =
			end - autocompleter.triggerPrefix.length - filterValue.length;
		const toInsert = create( { html: renderToString( replacement ) } );

		onChange( insert( record, toInsert, start, end ) );
	}

	function select( option ) {
		const { getOptionCompletion } = autocompleter || {};

		if ( option.isDisabled ) {
			return;
		}

		if ( getOptionCompletion ) {
			const completion = getOptionCompletion( option.value, filterValue );

			const { action, value } =
				undefined === completion.action ||
				undefined === completion.value
					? { action: 'insert-at-caret', value: completion }
					: completion;

			if ( 'replace' === action ) {
				onReplace( [ value ] );
				// When replacing, the component will unmount, so don't reset
				// state (below) on an unmounted component.
				return;
			} else if ( 'insert-at-caret' === action ) {
				insertCompletion( value );
			}
		}

		// Reset autocomplete state after insertion rather than before
		// so insertion events don't cause the completion menu to redisplay.
		reset();
	}

	function reset() {
		setSelectedIndex( 0 );
		setFilteredOptions( [] );
		setFilterValue( '' );
		setAutocompleter( null );
		setAutocompleterUI( null );
	}

	function announce( options ) {
		if ( ! debouncedSpeak ) {
			return;
		}
		if ( !! options.length ) {
			debouncedSpeak(
				sprintf(
					/* translators: %d: number of results. */
					_n(
						'%d result found, use up and down arrow keys to navigate.',
						'%d results found, use up and down arrow keys to navigate.',
						options.length
					),
					options.length
				),
				'assertive'
			);
		} else {
			debouncedSpeak( __( 'No results.' ), 'assertive' );
		}
	}

	/**
	 * Load options for an autocompleter.
	 *
	 * @param {Array} options
	 */
	function onChangeOptions( options ) {
		setSelectedIndex(
			options.length === filteredOptions.length ? selectedIndex : 0
		);
		setFilteredOptions( options );
		announce( options );
	}

	function handleKeyDown( event ) {
		backspacing.current = event.key === 'Backspace';

		if ( ! autocompleter ) {
			return;
		}
		if ( filteredOptions.length === 0 ) {
			return;
		}

		if (
			event.defaultPrevented ||
			// Ignore keydowns from IMEs
			event.isComposing ||
			// Workaround for Mac Safari where the final Enter/Backspace of an IME composition
			// is `isComposing=false`, even though it's technically still part of the composition.
			// These can only be detected by keyCode.
			event.keyCode === 229
		) {
			return;
		}
		switch ( event.key ) {
			case 'ArrowUp':
				setSelectedIndex(
					( selectedIndex === 0
						? filteredOptions.length
						: selectedIndex ) - 1
				);
				break;

			case 'ArrowDown':
				setSelectedIndex(
					( selectedIndex + 1 ) % filteredOptions.length
				);
				break;

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
	}, [ record ] );

	useEffect( () => {
		if ( ! textContent ) {
			reset();
			return;
		}

		const text = removeAccents( textContent );
		const textAfterSelection = getTextContent(
			slice( record, undefined, getTextContent( record ).length )
		);
		const completer = completers?.find(
			( { triggerPrefix, allowContext } ) => {
				const index = text.lastIndexOf( triggerPrefix );

				if ( index === -1 ) {
					return false;
				}

				const textWithoutTrigger = text.slice(
					index + triggerPrefix.length
				);

				const tooDistantFromTrigger = textWithoutTrigger.length > 50; // 50 chars seems to be a good limit.
				// This is a final barrier to prevent the effect from completing with
				// an extremely long string, which causes the editor to slow-down
				// significantly. This could happen, for example, if `matchingWhileBackspacing`
				// is true and one of the "words" end up being too long. If that's the case,
				// it will be caught by this guard.
				if ( tooDistantFromTrigger ) return false;

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
					backspacing.current &&
					textWithoutTrigger.split( /\s/ ).length <= 3;

				if (
					mismatch &&
					! ( matchingWhileBackspacing || hasOneTriggerWord )
				) {
					return false;
				}

				if (
					allowContext &&
					! allowContext( text.slice( 0, index ), textAfterSelection )
				) {
					return false;
				}

				if (
					/^\s/.test( textWithoutTrigger ) ||
					/\s\s+$/.test( textWithoutTrigger )
				) {
					return false;
				}

				return /[\u0000-\uFFFF]*$/.test( textWithoutTrigger );
			}
		);

		if ( ! completer ) {
			reset();
			return;
		}

		const safeTrigger = escapeRegExp( completer.triggerPrefix );
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
		setFilterValue( query );
		// Temporarily disabling exhaustive-deps to avoid introducing unexpected side effecst.
		// See https://github.com/WordPress/gutenberg/pull/41820
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ textContent ] );

	const { key: selectedKey = '' } = filteredOptions[ selectedIndex ] || {};
	const { className } = autocompleter || {};
	const isExpanded = !! autocompleter && filteredOptions.length > 0;
	const listBoxId = isExpanded
		? `components-autocomplete-listbox-${ instanceId }`
		: null;
	const activeId = isExpanded
		? `components-autocomplete-item-${ instanceId }-${ selectedKey }`
		: null;
	const hasSelection = record.start !== undefined;

	return {
		listBoxId,
		activeId,
		onKeyDown: handleKeyDown,
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

export function useAutocompleteProps( options ) {
	const [ isVisible, setIsVisible ] = useState( false );
	const ref = useRef();
	const recordAfterInput = useRef();
	const onKeyDownRef = useRef();
	const { popover, listBoxId, activeId, onKeyDown } = useAutocomplete( {
		...options,
		contentRef: ref,
	} );
	onKeyDownRef.current = onKeyDown;

	useEffect( () => {
		if ( isVisible ) {
			if ( ! recordAfterInput.current ) {
				recordAfterInput.current = options.record;
			} else if (
				recordAfterInput.current.start !== options.record.start ||
				recordAfterInput.current.end !== options.record.end
			) {
				setIsVisible( false );
				recordAfterInput.current = null;
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ options.record ] );

	const mergedRefs = useMergeRefs( [
		ref,
		useRefEffect( ( element ) => {
			function _onKeyDown( event ) {
				onKeyDownRef.current( event );
			}
			function _onInput() {
				// Only show auto complete UI if the user is inputting text.
				setIsVisible( true );
				recordAfterInput.current = null;
			}
			element.addEventListener( 'keydown', _onKeyDown );
			element.addEventListener( 'input', _onInput );
			return () => {
				element.removeEventListener( 'keydown', _onKeyDown );
				element.removeEventListener( 'input', _onInput );
			};
		}, [] ),
	] );

	if ( ! isVisible ) {
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

export default function Autocomplete( { children, isSelected, ...options } ) {
	const { popover, ...props } = useAutocomplete( options );
	return (
		<>
			{ children( props ) }
			{ isSelected && popover }
		</>
	);
}
