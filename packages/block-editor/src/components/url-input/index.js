/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __, sprintf, _n } from '@wordpress/i18n';
import { Component, createRef } from '@wordpress/element';
import { UP, DOWN, ENTER, TAB } from '@wordpress/keycodes';
import {
	BaseControl,
	Button,
	__experimentalInputControl as InputControl,
	Spinner,
	withSpokenMessages,
	Popover,
} from '@wordpress/components';
import {
	compose,
	debounce,
	withInstanceId,
	withSafeTimeout,
} from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import { isURL } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

/**
 * Whether the argument is a function.
 *
 * @param {*} maybeFunc The argument to check.
 * @return {boolean} True if the argument is a function, false otherwise.
 */
function isFunction( maybeFunc ) {
	return typeof maybeFunc === 'function';
}

class URLInput extends Component {
	constructor( props ) {
		super( props );

		this.onChange = this.onChange.bind( this );
		this.onFocus = this.onFocus.bind( this );
		this.onKeyDown = this.onKeyDown.bind( this );
		this.selectLink = this.selectLink.bind( this );
		this.handleOnClick = this.handleOnClick.bind( this );
		this.bindSuggestionNode = this.bindSuggestionNode.bind( this );
		this.autocompleteRef = props.autocompleteRef || createRef();
		this.inputRef = createRef();
		this.updateSuggestions = debounce(
			this.updateSuggestions.bind( this ),
			200
		);

		this.suggestionNodes = [];

		this.suggestionsRequest = null;

		this.state = {
			suggestions: [],
			showSuggestions: false,
			suggestionsValue: null,
			selectedSuggestion: null,
			suggestionsListboxId: '',
			suggestionOptionIdPrefix: '',
		};
	}

	componentDidUpdate( prevProps ) {
		const { showSuggestions, selectedSuggestion } = this.state;
		const { value, __experimentalShowInitialSuggestions = false } =
			this.props;

		// Only have to worry about scrolling selected suggestion into view
		// when already expanded.
		if (
			showSuggestions &&
			selectedSuggestion !== null &&
			this.suggestionNodes[ selectedSuggestion ]
		) {
			this.suggestionNodes[ selectedSuggestion ].scrollIntoView( {
				behavior: 'instant',
				block: 'nearest',
				inline: 'nearest',
			} );
		}

		// Update suggestions when the value changes.
		if ( prevProps.value !== value && ! this.props.disableSuggestions ) {
			if ( value?.length ) {
				// If the new value is not empty we need to update with suggestions for it.
				this.updateSuggestions( value );
			} else if ( __experimentalShowInitialSuggestions ) {
				// If the new value is empty and we can show initial suggestions, then show initial suggestions.
				this.updateSuggestions();
			}
		}
	}

	componentDidMount() {
		if ( this.shouldShowInitialSuggestions() ) {
			this.updateSuggestions();
		}
	}

	componentWillUnmount() {
		this.suggestionsRequest?.cancel?.();
		this.suggestionsRequest = null;
	}

	bindSuggestionNode( index ) {
		return ( ref ) => {
			this.suggestionNodes[ index ] = ref;
		};
	}

	shouldShowInitialSuggestions() {
		const { __experimentalShowInitialSuggestions = false, value } =
			this.props;
		return (
			__experimentalShowInitialSuggestions && ! ( value && value.length )
		);
	}

	updateSuggestions( value = '' ) {
		const {
			__experimentalFetchLinkSuggestions: fetchLinkSuggestions,
			__experimentalHandleURLSuggestions: handleURLSuggestions,
		} = this.props;

		if ( ! fetchLinkSuggestions ) {
			return;
		}

		// Initial suggestions may only show if there is no value
		// (note: this includes whitespace).
		const isInitialSuggestions = ! value?.length;

		// Trim only now we've determined whether or not it originally had a "length"
		// (even if that value was all whitespace).
		value = value.trim();

		// Allow a suggestions request if:
		// - there are at least 2 characters in the search input (except manual searches where
		//   search input length is not required to trigger a fetch)
		// - this is a direct entry (eg: a URL)
		if (
			! isInitialSuggestions &&
			( value.length < 2 || ( ! handleURLSuggestions && isURL( value ) ) )
		) {
			this.suggestionsRequest?.cancel?.();
			this.suggestionsRequest = null;

			this.setState( {
				suggestions: [],
				showSuggestions: false,
				suggestionsValue: value,
				selectedSuggestion: null,
				loading: false,
			} );

			return;
		}

		this.setState( {
			selectedSuggestion: null,
			loading: true,
		} );

		const request = fetchLinkSuggestions( value, {
			isInitialSuggestions,
		} );

		request
			.then( ( suggestions ) => {
				// A fetch Promise doesn't have an abort option. It's mimicked by
				// comparing the request reference in on the instance, which is
				// reset or deleted on subsequent requests or unmounting.
				if ( this.suggestionsRequest !== request ) {
					return;
				}

				this.setState( {
					suggestions,
					suggestionsValue: value,
					loading: false,
					showSuggestions: !! suggestions.length,
				} );

				if ( !! suggestions.length ) {
					this.props.debouncedSpeak(
						sprintf(
							/* translators: %d: number of results. */
							_n(
								'%d result found, use up and down arrow keys to navigate.',
								'%d results found, use up and down arrow keys to navigate.',
								suggestions.length
							),
							suggestions.length
						),
						'assertive'
					);
				} else {
					this.props.debouncedSpeak(
						__( 'No results.' ),
						'assertive'
					);
				}
			} )
			.catch( () => {
				if ( this.suggestionsRequest !== request ) {
					return;
				}

				this.setState( {
					loading: false,
				} );
			} )
			.finally( () => {
				// If this is the current promise then reset the reference
				// to allow for checking if a new request is made.
				if ( this.suggestionsRequest === request ) {
					this.suggestionsRequest = null;
				}
			} );

		// Note that this assignment is handled *before* the async search request
		// as a Promise always resolves on the next tick of the event loop.
		this.suggestionsRequest = request;
	}

	onChange( newValue ) {
		this.props.onChange( newValue );
	}

	onFocus() {
		const { suggestions } = this.state;
		const { disableSuggestions, value } = this.props;

		// When opening the link editor, if there's a value present, we want to load the suggestions pane with the results for this input search value
		// Don't re-run the suggestions on focus if there are already suggestions present (prevents searching again when tabbing between the input and buttons)
		// or there is already a request in progress.
		if (
			value &&
			! disableSuggestions &&
			! ( suggestions && suggestions.length ) &&
			this.suggestionsRequest === null
		) {
			// Ensure the suggestions are updated with the current input value.
			this.updateSuggestions( value );
		}
	}

	onKeyDown( event ) {
		this.props.onKeyDown?.( event );
		const { showSuggestions, selectedSuggestion, suggestions, loading } =
			this.state;

		// If the suggestions are not shown or loading, we shouldn't handle the arrow keys
		// We shouldn't preventDefault to allow block arrow keys navigation.
		if ( ! showSuggestions || ! suggestions.length || loading ) {
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
						event.preventDefault();

						// Set the input caret to position 0.
						event.target.setSelectionRange( 0, 0 );
					}
					break;
				}
				// When DOWN is pressed, if the caret is not at the end of the text, move it to the
				// last position.
				case DOWN: {
					if (
						this.props.value.length !== event.target.selectionStart
					) {
						event.preventDefault();

						// Set the input caret to the last position.
						event.target.setSelectionRange(
							this.props.value.length,
							this.props.value.length
						);
					}
					break;
				}

				// Submitting while loading should trigger onSubmit.
				case ENTER: {
					if ( this.props.onSubmit ) {
						event.preventDefault();
						this.props.onSubmit( null, event );
					}
					break;
				}
			}

			return;
		}

		const suggestion =
			this.state.suggestions[ this.state.selectedSuggestion ];

		switch ( event.keyCode ) {
			case UP: {
				event.preventDefault();
				const previousIndex = ! selectedSuggestion
					? suggestions.length - 1
					: selectedSuggestion - 1;
				this.setState( {
					selectedSuggestion: previousIndex,
				} );
				break;
			}
			case DOWN: {
				event.preventDefault();
				const nextIndex =
					selectedSuggestion === null ||
					selectedSuggestion === suggestions.length - 1
						? 0
						: selectedSuggestion + 1;
				this.setState( {
					selectedSuggestion: nextIndex,
				} );
				break;
			}
			case TAB: {
				if ( this.state.selectedSuggestion !== null ) {
					this.selectLink( suggestion );
					// Announce a link has been selected when tabbing away from the input field.
					this.props.speak( __( 'Link selected.' ) );
				}
				break;
			}
			case ENTER: {
				event.preventDefault();
				if ( this.state.selectedSuggestion !== null ) {
					this.selectLink( suggestion );

					if ( this.props.onSubmit ) {
						this.props.onSubmit( suggestion, event );
					}
				} else if ( this.props.onSubmit ) {
					this.props.onSubmit( null, event );
				}

				break;
			}
		}
	}

	selectLink( suggestion ) {
		this.props.onChange( suggestion.url, suggestion );
		this.setState( {
			selectedSuggestion: null,
			showSuggestions: false,
		} );
	}

	handleOnClick( suggestion ) {
		this.selectLink( suggestion );
		// Move focus to the input field when a link suggestion is clicked.
		this.inputRef.current.focus();
	}

	static getDerivedStateFromProps(
		{
			value,
			instanceId,
			disableSuggestions,
			__experimentalShowInitialSuggestions = false,
		},
		{ showSuggestions }
	) {
		let shouldShowSuggestions = showSuggestions;

		const hasValue = value && value.length;

		if ( ! __experimentalShowInitialSuggestions && ! hasValue ) {
			shouldShowSuggestions = false;
		}

		if ( disableSuggestions === true ) {
			shouldShowSuggestions = false;
		}

		return {
			showSuggestions: shouldShowSuggestions,
			suggestionsListboxId: `block-editor-url-input-suggestions-${ instanceId }`,
			suggestionOptionIdPrefix: `block-editor-url-input-suggestion-${ instanceId }`,
		};
	}

	render() {
		return (
			<>
				{ this.renderControl() }
				{ this.renderSuggestions() }
			</>
		);
	}

	renderControl() {
		const {
			label = null,
			className,
			isFullWidth,
			instanceId,
			placeholder = __( 'Paste URL or type to search' ),
			__experimentalRenderControl: renderControl,
			value = '',
			hideLabelFromVision = false,
		} = this.props;

		const {
			loading,
			showSuggestions,
			selectedSuggestion,
			suggestionsListboxId,
			suggestionOptionIdPrefix,
		} = this.state;

		const inputId = `url-input-control-${ instanceId }`;

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
			required: true,
			type: 'text',
			onChange: this.onChange,
			onFocus: this.onFocus,
			placeholder,
			onKeyDown: this.onKeyDown,
			role: 'combobox',
			'aria-label': label ? undefined : __( 'URL' ), // Ensure input always has an accessible label
			'aria-expanded': showSuggestions,
			'aria-autocomplete': 'list',
			'aria-owns': suggestionsListboxId,
			'aria-activedescendant':
				selectedSuggestion !== null
					? `${ suggestionOptionIdPrefix }-${ selectedSuggestion }`
					: undefined,
			ref: this.inputRef,
			suffix: this.props.suffix,
		};

		if ( renderControl ) {
			return renderControl( controlProps, inputProps, loading );
		}

		return (
			<BaseControl __nextHasNoMarginBottom { ...controlProps }>
				<InputControl { ...inputProps } __next40pxDefaultSize />
				{ loading && <Spinner /> }
			</BaseControl>
		);
	}

	renderSuggestions() {
		const {
			className,
			__experimentalRenderSuggestions: renderSuggestions,
		} = this.props;

		const {
			showSuggestions,
			suggestions,
			suggestionsValue,
			selectedSuggestion,
			suggestionsListboxId,
			suggestionOptionIdPrefix,
			loading,
		} = this.state;

		if ( ! showSuggestions || suggestions.length === 0 ) {
			return null;
		}

		const suggestionsListProps = {
			id: suggestionsListboxId,
			ref: this.autocompleteRef,
			role: 'listbox',
		};

		const buildSuggestionItemProps = ( suggestion, index ) => {
			return {
				role: 'option',
				tabIndex: '-1',
				id: `${ suggestionOptionIdPrefix }-${ index }`,
				ref: this.bindSuggestionNode( index ),
				'aria-selected':
					index === selectedSuggestion ? true : undefined,
			};
		};

		if ( isFunction( renderSuggestions ) ) {
			return renderSuggestions( {
				suggestions,
				selectedSuggestion,
				suggestionsListProps,
				buildSuggestionItemProps,
				isLoading: loading,
				handleSuggestionClick: this.handleOnClick,
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
							onClick={ () => this.handleOnClick( suggestion ) }
						>
							{ suggestion.title }
						</Button>
					) ) }
				</div>
			</Popover>
		);
	}
}

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/url-input/README.md
 */
export default compose(
	withSafeTimeout,
	withSpokenMessages,
	withInstanceId,
	withSelect( ( select, props ) => {
		// If a link suggestions handler is already provided then
		// bail.
		if ( isFunction( props.__experimentalFetchLinkSuggestions ) ) {
			return;
		}
		const { getSettings } = select( blockEditorStore );
		return {
			__experimentalFetchLinkSuggestions:
				getSettings().__experimentalFetchLinkSuggestions,
		};
	} )
)( URLInput );
