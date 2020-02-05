/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { LEFT, RIGHT, UP, DOWN, BACKSPACE, ENTER } from '@wordpress/keycodes';
import { chevronDown, chevronUp } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { URLInput } from '../';
import LinkControlSettingsDrawer from './settings-drawer';

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
	inputValue,
	onChange,
	onSelect,
	settings,
	renderSuggestions,
	fetchSuggestions,
	showInitialSuggestions,
} ) => {
	const [ selectedSuggestion, setSelectedSuggestion ] = useState();
	const [ isSettingsExpanded, setIsSettingsExpanded ] = useState( false );
	const [ pendingSettingsChanges, setPendingSettingsChanges ] = useState();

	const selectItemHandler = ( selection, suggestion ) => {
		onChange( selection );
		setSelectedSuggestion( suggestion );
	};

	function selectSuggestionOrCurrentInputValue( event ) {
		// Avoid default forms behavior, since it's being handled custom here.
		event.preventDefault();

		// Interpret the selected value as either the selected suggestion, if
		// exists, or otherwise the current input value as entered. Settings
		// changes are held in state and merged into the changed value.
		onSelect( {
			...pendingSettingsChanges,
			...( selectedSuggestion || { url: inputValue } ),
		} );
	}

	return (
		<form onSubmit={ selectSuggestionOrCurrentInputValue }>
			<URLInput
				className="block-editor-link-control__search-input"
				value={ inputValue }
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
			<Button
				isPrimary
				type="submit"
				className="block-editor-link-control__search-action"
			>
				{ __( 'Apply' ) }
			</Button>
			<Button
				className="block-editor-link-control__search-action"
				icon={ isSettingsExpanded ? chevronUp : chevronDown }
				label={ __( 'Link settings' ) }
				onClick={ () => setIsSettingsExpanded( ! isSettingsExpanded ) }
				aria-expanded={ isSettingsExpanded }
			/>
			{ isSettingsExpanded && (
				<LinkControlSettingsDrawer
					value={ { ...value, ...pendingSettingsChanges } }
					settings={ settings }
					onChange={ setPendingSettingsChanges }
				/>
			) }
		</form>
	);
};

export default LinkControlSearchInput;
