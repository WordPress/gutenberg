import clsx from 'clsx';
import { speak } from '@wordpress/a11y';
import { __, sprintf, _n } from '@wordpress/i18n';
import { useEffect, useRef, useState } from '@wordpress/element';
import { UP, DOWN, ENTER, TAB } from '@wordpress/keycodes';
import {
	BaseControl,
	Button,
	__experimentalInputControl as WCInputControl,
	Spinner,
	Popover,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { useDebounce, useEvent, useInstanceId } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { isURL } from '@wordpress/url';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

const { ValidatedInputControl } = unlock( componentsPrivateApis );

const noop = () => {};

/**
 * Whether the argument is a function.
 *
 * @param {*} maybeFunc The argument to check.
 * @return {boolean} True if the argument is a function, false otherwise.
 */
function isFunction( maybeFunc ) {
	return typeof maybeFunc === 'function';
}

/**
 * Text field for entering a URL, with an autocomplete list of matching posts,
 * pages and other link suggestions.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/url-input/README.md
 *
 * @param {Object} props Component props.
 */
export default function URLInput( props ) {
	const {
		__experimentalFetchLinkSuggestions: fetchLinkSuggestionsProp,
		__experimentalHandleURLSuggestions: handleURLSuggestions,
		__experimentalRenderControl: renderControl,
		__experimentalRenderSuggestions: renderSuggestions,
		__experimentalShowInitialSuggestions: showInitialSuggestions = false,
		autocompleteRef,
		className,
		customValidity,
		disableSuggestions,
		disabled = false,
		help = null,
		hideLabelFromVision = false,
		inputRef,
		isFullWidth,
		label = null,
		markWhenOptional,
		onChange,
		onKeyDown,
		onSubmit,
		placeholder = __( 'Paste URL or type to search' ),
		required = true,
		suffix,
		value = '',
	} = props;

	const instanceId = useInstanceId( URLInput );
	const { getSettings } = useSelect( blockEditorStore );
	const debouncedSpeak = useDebounce( speak, 500 );

	const [ suggestions, setSuggestions ] = useState( [] );
	const [ suggestionsValue, setSuggestionsValue ] = useState( null );
	const [ selectedSuggestion, setSelectedSuggestion ] = useState( null );
	const [ isSuggestionsListOpen, setIsSuggestionsListOpen ] =
		useState( false );
	const [ isLoading, setIsLoading ] = useState( false );
	const [ isComposing, setIsComposing ] = useState( false );

	const fallbackInputRef = useRef();
	const suggestionNodesRef = useRef( [] );
	// A fetch Promise can't be aborted. It's mimicked by holding on to the
	// pending request so that responses of superseded requests can be ignored.
	const suggestionsRequestRef = useRef( null );

	const controlInputRef = inputRef ?? fallbackInputRef;

	const inputId = `url-input-control-${ instanceId }`;
	const suggestionsListboxId = `block-editor-url-input-suggestions-${ instanceId }`;
	const suggestionOptionIdPrefix = `block-editor-url-input-suggestion-${ instanceId }`;

	// The suggestions are hidden rather than discarded, so that returning focus
	// to a field that already has results doesn't trigger a new search.
	const showSuggestions =
		isSuggestionsListOpen &&
		disableSuggestions !== true &&
		( showInitialSuggestions || !! value.length );

	const updateSuggestions = useEvent( ( searchValue = '' ) => {
		const fetchLinkSuggestions = isFunction( fetchLinkSuggestionsProp )
			? fetchLinkSuggestionsProp
			: getSettings().__experimentalFetchLinkSuggestions;

		if ( ! fetchLinkSuggestions ) {
			return;
		}

		// Initial suggestions may only show if there is no value
		// (note: this includes whitespace).
		const isInitialSuggestions = ! searchValue?.length;

		// Trim only now we've determined whether or not it originally had a "length"
		// (even if that value was all whitespace).
		const search = searchValue.trim();

		// Allow a suggestions request if:
		// - there are at least 2 characters in the search input (except manual searches where
		//   search input length is not required to trigger a fetch)
		// - this is a direct entry (eg: a URL)
		if (
			! isInitialSuggestions &&
			( search.length < 2 ||
				( ! handleURLSuggestions && isURL( search ) ) )
		) {
			suggestionsRequestRef.current?.cancel?.();
			suggestionsRequestRef.current = null;

			setSuggestions( [] );
			setIsSuggestionsListOpen( false );
			setSuggestionsValue( search );
			setSelectedSuggestion( null );
			setIsLoading( false );

			return;
		}

		setSelectedSuggestion( null );
		setIsLoading( true );

		const request = fetchLinkSuggestions( search, {
			isInitialSuggestions,
		} );
		suggestionsRequestRef.current = request;

		request
			.then( ( nextSuggestions ) => {
				if ( suggestionsRequestRef.current !== request ) {
					return;
				}

				setSuggestions( nextSuggestions );
				setSuggestionsValue( search );
				setIsLoading( false );
				setIsSuggestionsListOpen( !! nextSuggestions.length );

				if ( nextSuggestions.length ) {
					debouncedSpeak(
						sprintf(
							/* translators: %d: number of results. */
							_n(
								'%d result found, use up and down arrow keys to navigate.',
								'%d results found, use up and down arrow keys to navigate.',
								nextSuggestions.length
							),
							nextSuggestions.length
						),
						'assertive'
					);
				} else {
					debouncedSpeak( __( 'No results.' ), 'assertive' );
				}
			} )
			.catch( () => {
				if ( suggestionsRequestRef.current !== request ) {
					return;
				}

				setIsLoading( false );
			} )
			.finally( () => {
				if ( suggestionsRequestRef.current === request ) {
					suggestionsRequestRef.current = null;
				}
			} );
	} );

	const debouncedUpdateSuggestions = useDebounce( updateSuggestions, 200 );

	// Keep the suggestions in sync with the value being searched for. An empty
	// value requests the initial suggestions, when those are enabled.
	// Composition state is a dependency, so the composed value is picked up
	// whether the browser reports it before or after `compositionend`.
	useEffect( () => {
		if (
			! disableSuggestions &&
			! isComposing &&
			( value.length || showInitialSuggestions )
		) {
			debouncedUpdateSuggestions( value );
		}
	}, [
		value,
		isComposing,
		disableSuggestions,
		showInitialSuggestions,
		debouncedUpdateSuggestions,
	] );

	// Persist the hidden state, so that the list can't reappear with stale
	// results once the value or the props allow suggestions again.
	useEffect( () => {
		if ( ! showSuggestions ) {
			setIsSuggestionsListOpen( false );
		}
	}, [ showSuggestions ] );

	useEffect( () => {
		if ( showSuggestions && selectedSuggestion !== null ) {
			suggestionNodesRef.current[ selectedSuggestion ]?.scrollIntoView( {
				behavior: 'instant',
				block: 'nearest',
				inline: 'nearest',
			} );
		}
	}, [ showSuggestions, selectedSuggestion ] );

	useEffect( () => {
		return () => {
			suggestionsRequestRef.current?.cancel?.();
			suggestionsRequestRef.current = null;
		};
	}, [] );

	function selectLink( suggestion ) {
		onChange( suggestion.url, suggestion );
		setSelectedSuggestion( null );
		setIsSuggestionsListOpen( false );
	}

	function handleSuggestionClick( suggestion ) {
		selectLink( suggestion );
		// Move focus to the input field when a link suggestion is clicked.
		controlInputRef.current.focus();
	}

	function handleChange( newValue ) {
		// `InputControl` passes an `{ event }` object as its second argument,
		// which callers would mistake for a selected suggestion.
		onChange( newValue );
	}

	function handleCompositionStart() {
		setIsComposing( true );
		// Cancel any debounced suggestions update scheduled before the
		// composition started so no request fires while composing.
		debouncedUpdateSuggestions.cancel();
	}

	function handleCompositionEnd() {
		setIsComposing( false );
	}

	function handleFocus() {
		// When opening the link editor, if there's a value present, we want to load the suggestions pane with the results for this input search value
		// Don't re-run the suggestions on focus if there are already suggestions present (prevents searching again when tabbing between the input and buttons)
		// or there is already a request in progress.
		if (
			value &&
			! disableSuggestions &&
			! suggestions.length &&
			suggestionsRequestRef.current === null
		) {
			debouncedUpdateSuggestions( value );
		}
	}

	function handleKeyDown( event ) {
		onKeyDown?.( event );

		// Unless the list can consume them, the keys must reach the editor for
		// block navigation, so they mustn't be prevented.
		if ( ! showSuggestions || ! suggestions.length || isLoading ) {
			// Holding Shift extends the selection, which the browser handles.
			if (
				! event.shiftKey &&
				( event.keyCode === UP || event.keyCode === DOWN )
			) {
				// Firefox on Windows leaves the caret in place, trapping focus,
				// since the editor only navigates away from an edge.
				// See: https://github.com/WordPress/gutenberg/issues/5693#issuecomment-436684747
				const caret =
					event.keyCode === UP ? 0 : event.target.value.length;

				// UP moves the caret to the start of the text, DOWN to the end.
				// Once it is already there, with nothing selected, the key is
				// left to the editor to navigate out of the field.
				if (
					event.target.selectionStart !== caret ||
					event.target.selectionEnd !== caret
				) {
					event.preventDefault();
					event.target.setSelectionRange( caret, caret );
				}
			} else if ( event.keyCode === ENTER && onSubmit ) {
				event.preventDefault();
				onSubmit( null, event );
			}

			return;
		}

		const suggestion = suggestions[ selectedSuggestion ] ?? null;

		switch ( event.keyCode ) {
			case UP:
			case DOWN: {
				event.preventDefault();

				const offset = event.keyCode === UP ? -1 : 1;
				// An unselected list is entered from the end nearest the key,
				// and the ends wrap into each other.
				const from = selectedSuggestion ?? ( offset === -1 ? 0 : -1 );

				setSelectedSuggestion(
					( from + offset + suggestions.length ) % suggestions.length
				);
				break;
			}
			case TAB: {
				if ( suggestion ) {
					selectLink( suggestion );
					speak( __( 'Link selected.' ) );
				}
				break;
			}
			case ENTER: {
				event.preventDefault();
				if ( suggestion ) {
					selectLink( suggestion );
				}

				onSubmit?.( suggestion, event );
				break;
			}
		}
	}

	const controlProps = {
		id: inputId, // Passes attribute to label for the for attribute
		label,
		className: clsx( 'block-editor-url-input', className, {
			'is-full-width': isFullWidth,
		} ),
		hideLabelFromVision,
	};

	const inputProps = {
		id: inputId,
		value,
		required,
		type: 'text',
		name: inputId,
		autoComplete: 'off',
		onChange: disabled ? noop : handleChange,
		onCompositionStart: disabled ? noop : handleCompositionStart,
		onCompositionEnd: disabled ? noop : handleCompositionEnd,
		onFocus: disabled ? noop : handleFocus,
		onKeyDown: disabled ? noop : handleKeyDown,
		placeholder,
		role: 'combobox',
		'aria-label': label ? undefined : __( 'URL' ), // Ensure input always has an accessible label
		'aria-expanded': showSuggestions,
		'aria-autocomplete': 'list',
		'aria-owns': suggestionsListboxId,
		'aria-activedescendant':
			selectedSuggestion !== null
				? `${ suggestionOptionIdPrefix }-${ selectedSuggestion }`
				: undefined,
		ref: controlInputRef,
		disabled,
		suffix,
		help,
	};

	return (
		<>
			<Control
				controlProps={ controlProps }
				inputProps={ inputProps }
				isLoading={ isLoading }
				customValidity={ customValidity }
				markWhenOptional={ markWhenOptional }
				renderControl={ renderControl }
			/>
			{ showSuggestions && suggestions.length > 0 && (
				<Suggestions
					autocompleteRef={ autocompleteRef }
					className={ className }
					handleSuggestionClick={ handleSuggestionClick }
					isLoading={ isLoading }
					renderSuggestions={ renderSuggestions }
					selectedSuggestion={ selectedSuggestion }
					suggestionNodesRef={ suggestionNodesRef }
					suggestionOptionIdPrefix={ suggestionOptionIdPrefix }
					suggestions={ suggestions }
					suggestionsListboxId={ suggestionsListboxId }
					suggestionsValue={ suggestionsValue }
				/>
			) }
		</>
	);
}

function Control( {
	controlProps,
	inputProps,
	isLoading,
	customValidity,
	markWhenOptional,
	renderControl,
} ) {
	// Once a validity has been reported, keep using the validated control, so
	// that clearing the validity doesn't remount (and blur) the input.
	const [ isValidated, setIsValidated ] = useState(
		customValidity !== undefined
	);

	if ( customValidity !== undefined && ! isValidated ) {
		setIsValidated( true );
	}

	if ( renderControl ) {
		return renderControl( controlProps, inputProps, isLoading );
	}

	const MaybeValidatedInputControl = isValidated
		? ValidatedInputControl
		: WCInputControl;

	return (
		<BaseControl { ...controlProps }>
			<MaybeValidatedInputControl
				{ ...inputProps }
				{ ...( isValidated && {
					customValidity,
					// Suppress the "(Required)" indicator in the label.
					// The field is still required for validation, but the indicator
					// can be hidden when markWhenOptional is set to true.
					...( markWhenOptional !== undefined && {
						markWhenOptional,
					} ),
				} ) }
			/>
			{ isLoading && <Spinner /> }
		</BaseControl>
	);
}

function Suggestions( {
	autocompleteRef,
	className,
	handleSuggestionClick,
	isLoading,
	renderSuggestions,
	selectedSuggestion,
	suggestionNodesRef,
	suggestionOptionIdPrefix,
	suggestions,
	suggestionsListboxId,
	suggestionsValue,
} ) {
	const suggestionsListProps = {
		id: suggestionsListboxId,
		ref: autocompleteRef,
		role: 'listbox',
	};

	const buildSuggestionItemProps = ( suggestion, index ) => {
		return {
			role: 'option',
			tabIndex: '-1',
			id: `${ suggestionOptionIdPrefix }-${ index }`,
			ref: ( node ) => {
				suggestionNodesRef.current[ index ] = node;
			},
			'aria-selected': index === selectedSuggestion ? true : undefined,
		};
	};

	if ( isFunction( renderSuggestions ) ) {
		return renderSuggestions( {
			suggestions,
			selectedSuggestion,
			suggestionsListProps,
			buildSuggestionItemProps,
			isLoading,
			handleSuggestionClick,
			isInitialSuggestions: ! suggestionsValue?.length,
			currentInputValue: suggestionsValue,
		} );
	}

	return (
		<Popover placement="bottom" focusOnMount={ false }>
			<div
				{ ...suggestionsListProps }
				className={ clsx( 'block-editor-url-input__suggestions', {
					[ `${ className }__suggestions` ]: className,
				} ) }
			>
				{ suggestions.map( ( suggestion, index ) => (
					<Button
						__next40pxDefaultSize
						{ ...buildSuggestionItemProps( suggestion, index ) }
						key={ suggestion.id }
						className={ clsx(
							'block-editor-url-input__suggestion',
							{
								'is-selected': index === selectedSuggestion,
							}
						) }
						onClick={ () => handleSuggestionClick( suggestion ) }
					>
						{ suggestion.title }
					</Button>
				) ) }
			</div>
		</Popover>
	);
}
