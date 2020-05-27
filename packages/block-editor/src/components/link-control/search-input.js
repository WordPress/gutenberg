/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Notice } from '@wordpress/components';
import { keyboardReturn } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { URLInput } from '../';

const LinkControlSearchInput = ( {
	placeholder,
	value,
	onChange,
	onSelect,
	renderSuggestions,
	fetchSuggestions,
	showInitialSuggestions,
	errorMessage,
} ) => {
	const [ selectedSuggestion, setSelectedSuggestion ] = useState();

	/**
	 * Handles the user moving between different suggestions. Does not handle
	 * choosing an individual item.
	 *
	 * @param {string} selection the url of the selected suggestion.
	 * @param {Object} suggestion the suggestion object.
	 */
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
					placeholder={ placeholder ?? __( 'Search or type url' ) }
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
						icon={ keyboardReturn }
						className="block-editor-link-control__search-submit"
					/>
				</div>
			</div>

			{ errorMessage && (
				<Notice
					className="block-editor-link-control__search-error"
					status="error"
					isDismissible={ false }
				>
					{ errorMessage }
				</Notice>
			) }
		</form>
	);
};

export default LinkControlSearchInput;
