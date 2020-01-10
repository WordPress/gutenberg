/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { speak } from '@wordpress/a11y';
import { BaseControl, Spinner } from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { useState, useEffect, useRef } from '@wordpress/element';
import { UP, DOWN, ENTER, TAB } from '@wordpress/keycodes';
import { sprintf, __, _n } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useSuggestionListScrolling from './use-suggestion-list-scrolling';

// Since URLInput is rendered in the context of other inputs, but should be
// considered a separate modal node, prevent keyboard events from propagating
// as being considered from the input.
const stopEventPropagation = ( event ) => event.stopPropagation();

export default function BaseURLInput( props ) {
	const {
		loadingIndicator: LoadingIndicator = Spinner,
		suggestionListContainer: SuggestionListContainer,
		suggestionListItem: SuggestionListItem,
		value: inputValue,
		suggestions,
		isFetchingSuggestions,
		selectedSuggestionIndex,
		onChangeSelectedSuggestion,
		onChange,
		onKeyDown,
		disableSuggestions,
		autoFocus = true,
		className,
		label,
		isFullWidth,
		hasBorder,
		placeholder,
	} = props;

	const inputRef = useRef();
	const suggestionListRef = useRef();
	const [ showSuggestionsState, setShowSuggestions ] = useState( false );
	const hasValue = !! inputValue && inputValue.length;
	const showSuggestions = hasValue || ! disableSuggestions || showSuggestionsState;
	const instanceId = useInstanceId( BaseURLInput );
	const id = `url-input-control-${ instanceId }`;
	const suggestionListContainerId = `block-editor-url-input-suggestions-${ instanceId }`;
	const suggestionIdPrefix = `block-editor-url-input-suggestion-${ instanceId }`;
	const suggestionItemRefs = [];
	const selectedSuggestionItemRef = selectedSuggestionIndex ? suggestionItemRefs[ selectedSuggestionIndex ] : undefined;
	useSuggestionListScrolling( showSuggestions, selectedSuggestionItemRef, suggestionListRef );

	useEffect( () => {
		if ( suggestions.length ) {
			speak( sprintf( _n(
				'%d result found, use up and down arrow keys to navigate.',
				'%d results found, use up and down arrow keys to navigate.',
				suggestions.length
			), suggestions.length ), 'assertive' );
		} else {
			speak( __( 'No results.' ), 'assertive' );
		}
	}, [ suggestions ] );

	const handleKeyDown = ( event ) => {
		// If the suggestions are not shown or loading, we shouldn't handle the arrow keys
		// We shouldn't preventDefault to allow block arrow keys navigation
		if ( ( ! showSuggestions || ! suggestions.length || isFetchingSuggestions ) && inputValue ) {
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
					if ( inputValue.length !== event.target.selectionStart ) {
						event.stopPropagation();
						event.preventDefault();

						// Set the input caret to the last position
						event.target.setSelectionRange( inputValue.length, inputValue.length );
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
				const loopToLastIndex = ! selectedSuggestionIndex;
				onChangeSelectedSuggestion( loopToLastIndex ? suggestions.length - 1 : selectedSuggestionIndex - 1 );
				break;
			}
			case DOWN: {
				event.stopPropagation();
				event.preventDefault();
				const loopToFirstIndex = selectedSuggestionIndex === undefined || selectedSuggestionIndex === suggestions.length - 1;
				onChangeSelectedSuggestion( loopToFirstIndex ? 0 : selectedSuggestionIndex + 1 );

				break;
			}
			case TAB: {
				if ( selectedSuggestionIndex !== undefined ) {
					const suggestion = suggestions[ selectedSuggestionIndex ];
					onChange( suggestion.url, suggestion );
					setShowSuggestions( false );
					// Announce a link has been selected when tabbing away from the input field.
					speak( __( 'Link selected.' ) );
				}
				break;
			}
			case ENTER: {
				if ( selectedSuggestionIndex !== undefined ) {
					event.stopPropagation();
					const suggestion = suggestions[ selectedSuggestionIndex ];
					onChange( suggestion.url, suggestion );
					setShowSuggestions( false );
				}
				break;
			}
		}

		if ( onKeyDown ) {
			onKeyDown( event );
		}
	};

	// Disable reason: Historically URLInput was implemented with a hardcoded `autoFocus` value of true.
	// This is retained for backwards compatibilty.
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
				ref={ inputRef }
				id={ id }
				role="combobox"
				aria-label={ __( 'URL' ) }
				aria-expanded={ showSuggestions }
				aria-autocomplete="list"
				aria-owns={ suggestionListContainerId }
				aria-activedescendant={
					selectedSuggestionIndex !== undefined ? `${ suggestionIdPrefix }-${ selectedSuggestionIndex }` : undefined
				}
				autoFocus={ autoFocus }
				required
				onChange={ ( event ) => onChange( event.target.value ) }
				onKeyDown={ handleKeyDown }
				onInput={ stopEventPropagation }
				placeholder={ placeholder }
				value={ inputValue }
				type="text"
			/>

			{ isFetchingSuggestions && <LoadingIndicator /> }

			{ showSuggestions && !! suggestions.length && (
				<SuggestionListContainer
					id={ suggestionListContainerId }
					className={ className }
					ref={ suggestionListRef }
				>
					{ suggestions.map( ( suggestion, index ) => (
						<SuggestionListItem
							key={ suggestion.id }
							ref={ ( ref ) => suggestionItemRefs[ index ] = ref }
							id={ `${ suggestionIdPrefix }-${ index }` }
							isSelected={ index === selectedSuggestionIndex }
							suggestion={ suggestion }
							searchTerm={ inputValue }
							onClick={ () => {
								onChange( suggestion.url, suggestion );
								inputRef.current.focus();
							} }
						/>
					) ) }
				</SuggestionListContainer>
			) }
		</BaseControl>
	);
	/* eslint-enable jsx-a11y/no-autofocus */
}
