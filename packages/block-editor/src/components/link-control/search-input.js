/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { LEFT, RIGHT, UP, DOWN, BACKSPACE, ENTER } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { URLInput } from '../';

const handleLinkControlOnKeyDown = ( event ) => {
	const { keyCode } = event;

	if ( [ LEFT, DOWN, RIGHT, UP, BACKSPACE, ENTER ].indexOf( keyCode ) > -1 ) {
		// Stop the key event from propagating up to ObserveTyping.startTypingInTextField.
		event.stopPropagation();
	}
};

const handleLinkControlOnKeyPress = ( event ) => {
	const { keyCode } = event;

	event.stopPropagation();

	if ( keyCode === ENTER ) {
	}
};

const LinkControlSearchInput = ( {
	value,
	onChange,
	onSelect,
	renderSuggestions,
	fetchSuggestions,
	showInitialSuggestions,
} ) => {
	const [ selectedSuggestion, setSelectedSuggestion ] = useState();

	const selectItemHandler = ( selection, suggestion ) => {
		onChange( selection );
		setSelectedSuggestion( suggestion );
	};

	function selectSuggestionOrCurrentInputValue( event ) {
		// Avoid default forms behavior, since it's being handled custom here.
		event.preventDefault();

		// Interpret the selected value as either the selected suggestion, if
		// exists, or otherwise the current input value as entered.
		onSelect( selectedSuggestion || { url: value } );
	}

	return (
		<form onSubmit={ selectSuggestionOrCurrentInputValue }>
			<URLInput
				className="block-editor-link-control__search-input"
				value={ value }
				onChange={ selectItemHandler }
				onKeyDown={ ( event ) => {
					if ( event.keyCode === ENTER ) {
						return;
					}
					handleLinkControlOnKeyDown( event );
				} }
				onKeyPress={ handleLinkControlOnKeyPress }
				placeholder={ __( 'Search or type url' ) }
				__experimentalRenderSuggestions={ renderSuggestions }
				__experimentalFetchLinkSuggestions={ fetchSuggestions }
				__experimentalHandleURLSuggestions={ true }
				__experimentalShowInitialSuggestions={ showInitialSuggestions }
			/>
			<div className="block-editor-link-control__search-actions">
				<Button
					type="submit"
					label={ __( 'Submit' ) }
					icon="editor-break"
					className="block-editor-link-control__search-submit"
				/>
			</div>
		</form>
	);
};

export default LinkControlSearchInput;
