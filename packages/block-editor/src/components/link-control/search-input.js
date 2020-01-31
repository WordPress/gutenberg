/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Notice } from '@wordpress/components';
import { LEFT, RIGHT, UP, DOWN, BACKSPACE, ENTER } from '@wordpress/keycodes';
import { keyboardReturn } from '@wordpress/icons';

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


const LinkControlSearchInput = ( {
	value,
	onChange,
	onSelect,
	renderSuggestions,
	fetchSuggestions,
	showInitialSuggestions,
	errorMsg,
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
			<div className="block-editor-link-control__search-input-wrapper">
				<URLInput
					className="block-editor-link-control__search-input"
					value={ value }
					onChange={ selectItemHandler }
					onFocus={ selectItemHandler }
					onKeyDown={ ( event ) => {
						if ( event.keyCode === ENTER ) {
							return;
						}
						handleLinkControlOnKeyDown( event );
					} }
					placeholder={ __( 'Search or type url' ) }
					__experimentalRenderSuggestions={ renderSuggestions }
					__experimentalFetchLinkSuggestions={ fetchSuggestions }
					__experimentalHandleURLSuggestions={ true }
					__experimentalShowInitialSuggestions={
						showInitialSuggestions
					}
				/>
				<div className="block-editor-link-control__search-actions">
					<Button
						type="submit"
						label={ __( 'Submit' ) }
						icon={keyboardReturn}
						className="block-editor-link-control__search-submit"
					/>
				</div>
				<div role="alert" aria-live="assertive">
					{ errorMsg && (
						<Notice
							className="block-editor-link-control__search-error"
							status="error"
							isDismissible={ false }
						>
							{ errorMsg }
						</Notice>
					) }
				</div>
			</div>
		</form>
	);
};

export default LinkControlSearchInput;
