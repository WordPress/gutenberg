/**
 * External dependencies
 */
import { throttle, isFunction } from 'lodash';
import classnames from 'classnames';
import scrollIntoView from 'dom-scroll-into-view';

/**
 * WordPress dependencies
 */
import { __, sprintf, _n } from '@wordpress/i18n';
import { Component, createRef } from '@wordpress/element';
import { UP, DOWN, ENTER, TAB } from '@wordpress/keycodes';
import {
	BaseControl,
	Button,
	Spinner,
	withSpokenMessages,
	Popover,
} from '@wordpress/components';
import { withInstanceId, withSafeTimeout, compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import { isURL } from '@wordpress/url';

// Since URLInput is rendered in the context of other inputs, but should be
// considered a separate modal node, prevent keyboard events from propagating
// as being considered from the input.
const stopEventPropagation = ( event ) => event.stopPropagation();

class URLInput extends Component {
	constructor( props ) {
		super( props );

		this.onChange = this.onChange.bind( this );
		this.onKeyDown = this.onKeyDown.bind( this );
		this.selectLink = this.selectLink.bind( this );
		this.handleOnClick = this.handleOnClick.bind( this );
		this.bindSuggestionNode = this.bindSuggestionNode.bind( this );
		this.autocompleteRef = props.autocompleteRef || createRef();
		this.inputRef = createRef();
		this.updateSuggestions = throttle(
			this.updateSuggestions.bind( this ),
			200
		);

		this.suggestionNodes = [];

		this.isUpdatingSuggestions = false;

		this.state = {
			suggestions: [],
			showSuggestions: false,
			selectedSuggestion: null,
		};
	}

	componentDidUpdate() {
		const { showSuggestions, selectedSuggestion } = this.state;

		// only have to worry about scrolling selected suggestion into view
		// when already expanded
		if (
			showSuggestions &&
			selectedSuggestion !== null &&
			! this.scrollingIntoView
		) {
			this.scrollingIntoView = true;

			scrollIntoView(
				this.suggestionNodes[ selectedSuggestion ],
				this.autocompleteRef.current,
				{
					onlyScrollIfNeeded: true,
				}
			);

			this.props.setTimeout( () => {
				this.scrollingIntoView = false;
			}, 100 );
		}

		if ( this.shouldShowInitialSuggestions() ) {
			this.updateSuggestions();
		}
	}

	componentDidMount() {
		if ( this.shouldShowInitialSuggestions() ) {
			this.updateSuggestions();
		}
	}

	componentWillUnmount() {
		delete this.suggestionsRequest;
	}

	bindSuggestionNode( index ) {
		return ( ref ) => {
			this.suggestionNodes[ index ] = ref;
		};
	}

	shouldShowInitialSuggestions() {
		const { suggestions } = this.state;
		const {
			__experimentalShowInitialSuggestions = false,
			value,
		} = this.props;
		return (
			! this.isUpdatingSuggestions &&
			__experimentalShowInitialSuggestions &&
			! ( value && value.length ) &&
			! ( suggestions && suggestions.length )
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

		const isInitialSuggestions = ! ( value && value.length );

		// Allow a suggestions request if:
		// - there are at least 2 characters in the search input (except manual searches where
		//   search input length is not required to trigger a fetch)
		// - this is a direct entry (eg: a URL)
		if (
			! isInitialSuggestions &&
			( value.length < 2 || ( ! handleURLSuggestions && isURL( value ) ) )
		) {
			this.setState( {
				showSuggestions: false,
				selectedSuggestion: null,
				loading: false,
			} );

			return;
		}

		this.isUpdatingSuggestions = true;

		this.setState( {
			showSuggestions: true,
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
					loading: false,
				} );

				if ( !! suggestions.length ) {
					this.props.debouncedSpeak(
						sprintf(
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
				this.isUpdatingSuggestions = false;
			} )
			.catch( () => {
				if ( this.suggestionsRequest === request ) {
					this.setState( {
						loading: false,
					} );
					this.isUpdatingSuggestions = false;
				}
			} );

		// Note that this assignment is handled *before* the async search request
		// as a Promise always resolves on the next tick of the event loop.
		this.suggestionsRequest = request;
	}

	onChange( event ) {
		const inputValue = event.target.value;

		this.props.onChange( inputValue );
		if ( ! this.props.disableSuggestions ) {
			this.updateSuggestions( inputValue );
		}
	}

	onKeyDown( event ) {
		const {
			showSuggestions,
			selectedSuggestion,
			suggestions,
			loading,
		} = this.state;

		// If the suggestions are not shown or loading, we shouldn't handle the arrow keys
		// We shouldn't preventDefault to allow block arrow keys navigation
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
					if (
						this.props.value.length !== event.target.selectionStart
					) {
						event.stopPropagation();
						event.preventDefault();

						// Set the input caret to the last position
						event.target.setSelectionRange(
							this.props.value.length,
							this.props.value.length
						);
					}
					break;
				}
			}

			return;
		}

		const suggestion = this.state.suggestions[
			this.state.selectedSuggestion
		];

		switch ( event.keyCode ) {
			case UP: {
				event.stopPropagation();
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
				event.stopPropagation();
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
				if ( this.state.selectedSuggestion !== null ) {
					event.stopPropagation();
					this.selectLink( suggestion );
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
		};
	}

	render() {
		const {
			label,
			instanceId,
			className,
			isFullWidth,
			hasBorder,
			__experimentalRenderSuggestions: renderSuggestions,
			placeholder = __( 'Paste URL or type to search' ),
			value = '',
			autoFocus = true,
			__experimentalShowInitialSuggestions = false,
		} = this.props;

		const {
			showSuggestions,
			suggestions,
			selectedSuggestion,
			loading,
		} = this.state;

		const id = `url-input-control-${ instanceId }`;

		const suggestionsListboxId = `block-editor-url-input-suggestions-${ instanceId }`;
		const suggestionOptionIdPrefix = `block-editor-url-input-suggestion-${ instanceId }`;

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
				'aria-selected': index === selectedSuggestion,
			};
		};

		/* eslint-disable jsx-a11y/no-autofocus */
		return (
			<BaseControl
				label={ label }
				id={ id }
				className={ classnames( 'block-editor-url-input', className, {
					'is-full-width': isFullWidth,
					'has-border': hasBorder,
				} ) }
			>
				<input
					autoFocus={ autoFocus }
					type="text"
					aria-label={ __( 'URL' ) }
					required
					value={ value }
					onChange={ this.onChange }
					onInput={ stopEventPropagation }
					placeholder={ placeholder }
					onKeyDown={ this.onKeyDown }
					role="combobox"
					aria-expanded={ showSuggestions }
					aria-autocomplete="list"
					aria-owns={ suggestionsListboxId }
					aria-activedescendant={
						selectedSuggestion !== null
							? `${ suggestionOptionIdPrefix }-${ selectedSuggestion }`
							: undefined
					}
					ref={ this.inputRef }
				/>

				{ loading && <Spinner /> }

				{ isFunction( renderSuggestions ) &&
					showSuggestions &&
					!! suggestions.length &&
					renderSuggestions( {
						suggestions,
						selectedSuggestion,
						suggestionsListProps,
						buildSuggestionItemProps,
						isLoading: loading,
						handleSuggestionClick: this.handleOnClick,
						isInitialSuggestions:
							__experimentalShowInitialSuggestions &&
							! ( value && value.length ),
					} ) }

				{ ! isFunction( renderSuggestions ) &&
					showSuggestions &&
					!! suggestions.length && (
						<Popover
							position="bottom"
							noArrow
							focusOnMount={ false }
						>
							<div
								{ ...suggestionsListProps }
								className={ classnames(
									'block-editor-url-input__suggestions',
									`${ className }__suggestions`
								) }
							>
								{ suggestions.map( ( suggestion, index ) => (
									<Button
										{ ...buildSuggestionItemProps(
											suggestion,
											index
										) }
										key={ suggestion.id }
										className={ classnames(
											'block-editor-url-input__suggestion',
											{
												'is-selected':
													index ===
													selectedSuggestion,
											}
										) }
										onClick={ () =>
											this.handleOnClick( suggestion )
										}
									>
										{ suggestion.title }
									</Button>
								) ) }
							</div>
						</Popover>
					) }
			</BaseControl>
		);
		/* eslint-enable jsx-a11y/no-autofocus */
	}
}

/**
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/url-input/README.md
 */
export default compose(
	withSafeTimeout,
	withSpokenMessages,
	withInstanceId,
	withSelect( ( select, props ) => {
		// If a link suggestions handler is already provided then
		// bail
		if ( isFunction( props.__experimentalFetchLinkSuggestions ) ) {
			return;
		}
		const { getSettings } = select( 'core/block-editor' );
		return {
			__experimentalFetchLinkSuggestions: getSettings()
				.__experimentalFetchLinkSuggestions,
		};
	} )
)( URLInput );
