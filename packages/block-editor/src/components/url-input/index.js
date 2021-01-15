/**
 * External dependencies
 */
import { debounce } from 'lodash';
import classnames from 'classnames';
import scrollIntoView from 'dom-scroll-into-view';

/**
 * WordPress dependencies
 */
import { __, sprintf, _n } from '@wordpress/i18n';
import { useState, useEffect, useRef } from '@wordpress/element';
import { UP, DOWN, ENTER, TAB } from '@wordpress/keycodes';
import {
	BaseControl,
	Button,
	Spinner,
	withSpokenMessages,
	Popover,
} from '@wordpress/components';
import { useInstanceId, withSafeTimeout, compose } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { isURL } from '@wordpress/url';

const REQUEST_DEBOUNCE_DELAY = 200;

function defaultRenderControl( { controlProps, inputProps, isLoading } ) {
	return (
		<BaseControl { ...controlProps }>
			<input { ...inputProps } />
			{ isLoading && <Spinner /> }
		</BaseControl>
	);
}

function defaultRenderSuggestions( {
	suggestions,
	suggestionsListProps,
	handleSuggestionClick,
	buildSuggestionItemProps,
	className,
	selectedSuggestion,
} ) {
	return (
		<Popover position="bottom" noArrow focusOnMount={ false }>
			<div
				{ ...suggestionsListProps }
				className={ classnames(
					'block-editor-url-input__suggestions',
					`${ className }__suggestions`
				) }
			>
				{ suggestions.map( ( suggestion, index ) => (
					<Button
						{ ...buildSuggestionItemProps( suggestion, index ) }
						key={ suggestion.id }
						className={ classnames(
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

function URLInput( {
	value,
	onChange,
	label,
	className,
	isFullWidth,
	placeholder = __( 'Paste URL or type to search' ),
	disableSuggestions,
	speak,
	debouncedSpeak,
	__experimentalRenderControl: renderControl = defaultRenderControl,
	__experimentalRenderSuggestions: renderSuggestions = defaultRenderSuggestions,
	__experimentalFetchLinkSuggestions,
	__experimentalHandleURLSuggestions: handleURLSuggestions = false,
	__experimentalShowInitialSuggestions: showInitialSuggestions = false,
	setTimeout,
	autocompleteRef: parentAutocompleteRef,
} ) {
	const [ isLoading, setLoading ] = useState( false );
	const [ suggestions, setSuggestions ] = useState( [] );
	const [ showSuggestions, setShowSuggestions ] = useState( false );
	const [ selectedSuggestion, setSelectedSuggestion ] = useState( null );
	const [ prevInstanceId, setPrevInstanceId ] = useState( null );
	const [ suggestionsListboxId, setSuggestionsListboxId ] = useState( '' );
	const [ suggestionOptionIdPrefix, setSuggestionOptionIdPrefix ] = useState(
		''
	);
	const [ prevDisableSuggestions, setPrevDisableSuggestions ] = useState(
		null
	);
	const [ prevShowInitalSuggestions, setShowInitialSuggestions ] = useState(
		null
	);

	const autocompleteRef = useRef( parentAutocompleteRef );
	const inputRef = useRef( null );
	const pendingRequest = useRef( null );
	const scrollingIntoView = useRef( false );
	const suggestionNodes = useRef( [] );
	const instanceId = useInstanceId( URLInput );

	const { fetchLinkSuggestions } = useSelect(
		( select ) => {
			if ( typeof __experimentalFetchLinkSuggestions === 'function' ) {
				return {
					fetchLinkSuggestions: __experimentalFetchLinkSuggestions,
				};
			}

			const { getSettings } = select( 'core/block-editor' );
			const settings = getSettings();
			return {
				fetchLinkSuggestions:
					settings.__experimentalFetchLinkSuggestions,
			};
		},
		[ __experimentalFetchLinkSuggestions ]
	);

	useEffect( () => {
		// Only have to worry about scrolling selected suggestion into view when already expanded.
		const selectedSuggestionNode =
			suggestionNodes.current[ selectedSuggestion ];
		if (
			showSuggestions &&
			!! selectedSuggestionNode &&
			! scrollingIntoView.current
		) {
			scrollingIntoView.current = true;
			scrollIntoView( selectedSuggestionNode, autocompleteRef.current, {
				onlyScrollIfNeeded: true,
			} );

			setTimeout( () => {
				scrollingIntoView.current = false;
			}, 100 );
		}
	}, [ showSuggestions, value ] );

	useEffect( () => {
		const shouldShowInitialSuggestions =
			! isUpdatingSuggestions() &&
			showInitialSuggestions &&
			! value?.length &&
			! suggestions.length;

		if ( shouldShowInitialSuggestions ) {
			updateSuggestions();
		}
	}, [ value, showInitialSuggestions ] );

	useEffect(
		() =>
			function cleanup() {
				pendingRequest.current = null;
			},
		[]
	);

	if ( prevInstanceId !== instanceId ) {
		setSuggestionsListboxId(
			`block-editor-url-input-suggestions-${ instanceId }`
		);
		setSuggestionOptionIdPrefix(
			`block-editor-url-input-suggestion-${ instanceId }`
		);
		setPrevInstanceId( instanceId );
	}

	const disableSuggestionsChanged =
		prevDisableSuggestions !== disableSuggestions;
	const showInitialSuggestionsChanged =
		prevShowInitalSuggestions !== showInitialSuggestions;

	if ( disableSuggestionsChanged || showInitialSuggestionsChanged ) {
		if ( disableSuggestionsChanged ) {
			setPrevDisableSuggestions( disableSuggestions );
		}

		if ( showInitialSuggestionsChanged ) {
			setShowInitialSuggestions( showInitialSuggestions );
		}

		let shouldShowSuggestions = showSuggestions;

		if (
			! ( showInitialSuggestions || value?.length ) ||
			disableSuggestions
		) {
			shouldShowSuggestions = false;
		}

		setShowSuggestions( shouldShowSuggestions );
	}

	function isUpdatingSuggestions() {
		return !! pendingRequest.current;
	}

	function clearUpdateSuggestions() {
		setLoading( false );
		pendingRequest.current = null;
	}

	function allowSuggestionsRequest( search = '' ) {
		if ( ! fetchLinkSuggestions ) {
			return false;
		}

		// Prevent if configured to ignore urls and it's a URL.
		if ( ! handleURLSuggestions && isURL( search ) ) {
			return false;
		}

		// Allow if this is a manual search where serach input length is not required.
		if ( ! search.length ) {
			return true;
		}

		// Allow if the search query is over 2 characters long.
		return search.length >= 2;
	}

	function speakUpdateResult() {
		if ( ! suggestions.length ) {
			debouncedSpeak( __( 'No results' ), 'assertive' );
			return;
		}

		debouncedSpeak(
			sprintf(
				/// translators: %s: number of results.
				_n(
					'%d result found, use up and down arrow keys to navigate.',
					'%d results found, use up and down arrow keys to navigate.',
					suggestions.length
				),
				suggestions.length
			),
			'assertive'
		);
	}

	const updateSuggestions = debounce( async ( search = '' ) => {
		setSelectedSuggestion( null );

		if ( ! allowSuggestionsRequest( search ) ) {
			setShowSuggestions( false );
			setLoading( false );
			return;
		}
		setLoading( true );

		const request = fetchLinkSuggestions( search, {
			isInitialSuggestions: ! search.length,
		} );
		pendingRequest.current = request;

		try {
			const result = await request;
			if ( result && request === pendingRequest.current ) {
				setSuggestions( result );
				setShowSuggestions( !! result.length );
				speakUpdateResult();
				clearUpdateSuggestions();
			}
		} catch ( _error ) {
			// Release updating state if the current request fails.
			if ( pendingRequest.current === request ) {
				clearUpdateSuggestions();
			}
		}
	}, REQUEST_DEBOUNCE_DELAY );

	function onFocus() {
		// When opening the link editor, if there's a value present, we want to load the suggestions pane with the results for this input search value
		// Don't re-run the suggestions on focus if there are already suggestions present (prevents searching again when tabbing between the input and buttons)
		if (
			value &&
			! disableSuggestions &&
			! isUpdatingSuggestions() &&
			! suggestions.length
		) {
			// Ensure the suggestions are updated with the current input value
			updateSuggestions( value.trim() );
		}
	}

	function onKeyDown( event ) {
		// If the suggestions are not shown or loading, we shouldn't handle the arrow keys
		// We shouldn't preventDefault to allow block arrow keys navigation
		if ( ! showSuggestions || ! suggestions.length || isLoading ) {
			// In the Windows version of Firefox the up and down arrows don't move the caret
			// within an input field like they do for Mac Firefox/Chrome/Safari. This causes
			// a form of focus trapping that is disruptive to the user experience. This disruption
			// only happens if the caret is not in the first or last position in the text input.
			// See: https://github.com/WordPress/gutenberg/issues/5693#issuecomment-436684747
			switch ( event.keyCode ) {
				// When UP is pressed, if the caret is at the start of the text, move it to the 0
				// position.
				case UP: {
					if ( 0 !== event.target.selectionStart ) {
						event.stopPropagation();
						event.preventDefault();

						// Set the input caret to position 0
						event.target.setSelectionRange( 0, 0 );
					}
					break;
				}
				// When DOWN is pressed, if the caret is not at the end of the text, move it to the
				// last position.
				case DOWN: {
					if ( value?.length !== event.target.selectionStart ) {
						event.stopPropagation();
						event.preventDefault();

						// Set the input caret to the last position
						event.target.setSelectionRange(
							value?.length,
							value?.length
						);
					}
					break;
				}
			}

			return;
		}

		switch ( event.keyCode ) {
			case UP: {
				event.stopPropagation();
				event.preventDefault();
				const previousIndex = ! selectedSuggestion
					? suggestions.length - 1
					: selectedSuggestion - 1;
				setSelectedSuggestion( previousIndex );
				break;
			}
			case DOWN: {
				event.stopPropagation();
				event.preventDefault();
				const nextIndex =
					selectedSuggestion === null ||
					selectedSuggestion === suggestions.length - 1
						? 0
						: selectedSuggestion + 1;
				setSelectedSuggestion( nextIndex );
				break;
			}
			case TAB: {
				if ( selectedSuggestion !== null ) {
					selectLink( suggestions[ selectedSuggestion ] );
					// Announce a link has been selected when tabbing away from the input field.
					speak( __( 'Link selected.' ) );
				}
				break;
			}
			case ENTER: {
				if ( selectedSuggestion !== null ) {
					event.stopPropagation();
					selectLink( suggestions[ selectedSuggestion ] );
				}
				break;
			}
		}
	}

	function selectLink( suggestion ) {
		onChange( suggestion.url, suggestion );
		setSelectedSuggestion( null );
		setShowSuggestions( false );
	}

	function buildControlProps() {
		const controlProps = {
			id: `url-input-control-${ instanceId }`,
			label,
			className: classnames( 'block-editor-url-input', className, {
				'is-full-width': isFullWidth,
			} ),
		};

		const inputProps = {
			value,
			required: true,
			className: 'block-editor-url-input__input',
			type: 'text',
			onChange( event ) {
				const inputValue = event.target.value;

				onChange( inputValue );
				if ( ! disableSuggestions ) {
					updateSuggestions( inputValue.trim() );
				}
			},
			onFocus,
			placeholder,
			onKeyDown,
			role: 'combobox',
			'aria-label': __( 'URL' ),
			'aria-expanded': !! showSuggestions,
			'aria-autocomplete': 'list',
			'aria-owns': suggestionsListboxId,
			'aria-activedescendant':
				selectedSuggestion !== null
					? `${ suggestionOptionIdPrefix }-${ selectedSuggestion }`
					: undefined,
			ref: inputRef,
		};
		return {
			controlProps,
			inputProps,
			isLoading,
		};
	}

	function buildSuggestionsProps() {
		function buildSuggestionItemProps( _, index ) {
			return {
				role: 'option',
				tabIndex: '-1',
				id: `${ suggestionOptionIdPrefix }-${ index }`,
				ref: ( ref ) => {
					suggestionNodes.current[ index ] = ref;
				},
				'aria-selected': index === selectedSuggestion,
			};
		}

		return {
			suggestions,
			selectedSuggestion,
			suggestionsListProps: {
				id: suggestionsListboxId,
				ref: autocompleteRef,
				role: 'listbox',
			},
			buildSuggestionItemProps,
			handleSuggestionClick: ( suggestion ) => {
				selectLink( suggestion );
				// Move focus to the input field when a link suggestion is clicked.
				inputRef.current.focus();
			},
			isInitialSuggestions: ! value?.length && showInitialSuggestions,
			isLoading,
			className,
		};
	}

	const controlProps = buildControlProps();
	const suggestionProps = buildSuggestionsProps();

	return (
		<>
			{ renderControl( controlProps ) }
			{ showSuggestions &&
				!! suggestions?.length &&
				renderSuggestions( suggestionProps ) }
		</>
	);
}

/**
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/url-input/README.md
 */
export default compose( withSafeTimeout, withSpokenMessages )( URLInput );
