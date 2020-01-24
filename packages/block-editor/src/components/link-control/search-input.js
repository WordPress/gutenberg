/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { URLInput } from '../';

const LinkControlSearchInput = ( {
	value,
	onChange,
	onSelect,
	renderSuggestions,
	fetchSuggestions,
	onReset,
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
				placeholder={ __( 'Search or type url' ) }
				__experimentalRenderSuggestions={ renderSuggestions }
				__experimentalFetchLinkSuggestions={ fetchSuggestions }
				__experimentalHandleURLSuggestions={ true }
				__experimentalShowInitialSuggestions={ showInitialSuggestions }
			/>

			<Button
				disabled={ ! value.length }
				type="reset"
				label={ __( 'Reset' ) }
				icon="no-alt"
				className="block-editor-link-control__search-reset"
				onClick={ onReset }
			/>

		</form>
	);
};

export default LinkControlSearchInput;
