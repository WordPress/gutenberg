/**
 * WordPress dependencies
 */
import {
	IconButton,
	Icon,
} from '@wordpress/components';
/**
 * External dependencies
 */
import classnames from 'classnames';
import { __ } from '@wordpress/i18n';

import { uniqueId } from 'lodash';

import {
	useCallback,
	useState,
	useRef,
	Fragment,
} from '@wordpress/element';

import {
	LEFT,
	RIGHT,
	UP,
	DOWN,
	BACKSPACE,
	ENTER,
} from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import {
	URLPopover,
	URLInput,
} from '../';

function LinkControl( { defaultOpen = false } ) {
	// State
	const [ isOpen, setIsOpen ] = useState( defaultOpen );
	const [ inputValue, setInputValue ] = useState( '' );

	// Refs
	const autocompleteRef = useRef( null );

	// Effects
	const openLinkUI = useCallback( () => {
		setIsOpen( true );
	} );

	// Handlers
	const onInputChange = ( value = '' ) => {
		setInputValue( value );
	};

	const onSubmitLinkChange = ( value ) => {
		setInputValue( value );
	};

	const stopPropagation = ( event ) => {
		event.stopPropagation();
	};

	const stopPropagationRelevantKeys = ( event ) => {
		if ( [ LEFT, DOWN, RIGHT, UP, BACKSPACE, ENTER ].indexOf( event.keyCode ) > -1 ) {
			// Stop the key event from propagating up to ObserveTyping.startTypingInTextField.
			event.stopPropagation();
		}
	};

	const fetchFauxSuggestions = async () => ( [
		{
			id: uniqueId(),
			title: 'WordPress',
			type: 'URL',
			url: 'make.wordpress.com',
		},
		{
			id: uniqueId(),
			title: 'Hello World',
			type: 'Page',
			info: '2 days ago',
			url: '?p=1234',
		},
	] );

	// Render Components
	const renderSearchResults = function renderSearchResults( { suggestions, suggestionsListboxId, suggestionOptionIdPrefix, selectedSuggestion, bindSuggestionNode, handleSuggestionClick } ) {
		return (
			<div id={ suggestionsListboxId } role="listbox" ref={ autocompleteRef } className="block-editor-link-control__search-results">
				{ suggestions.map( ( suggestion, index ) => (
					<button
						key={ suggestion.id }
						role="option"
						tabIndex="-1"
						id={ `${ suggestionOptionIdPrefix }-${ index }` }
						ref={ bindSuggestionNode( index ) }
						className={ classnames( 'block-editor-link-control__search-item', {
							'is-selected': index === selectedSuggestion,
						} ) }
						onClick={ () => handleSuggestionClick( suggestion ) }
						aria-selected={ index === selectedSuggestion }
					>
						<Icon icon="wordpress" />
						<span className="block-editor-link-control__search-item-header">
							<span className="block-editor-link-control__search-item-title">{ suggestion.title }</span>
							<span className="block-editor-link-control__search-item-info">{ suggestion.info || suggestion.url || '' }</span>
						</span>
						<span className="block-editor-link-control__search-item-type">{ suggestion.type || '' }</span>
					</button>
				) ) }
			</div>
		);
	};

	return (
		<Fragment>
			<IconButton
				icon="insert"
				className="components-toolbar__control"
				label={ __( 'Insert link' ) }
				onClick={ openLinkUI }
			/>

			{ isOpen && (

				<URLPopover>
					<div className="block-editor-link-control__popover-inner">
						<div className="block-editor-link-control__search">

							<form
								onSubmit={ onSubmitLinkChange }
							>

								<URLInput
									className="block-editor-link-control__search-input"
									value={ inputValue }
									onChange={ onInputChange }
									autocompleteRef={ autocompleteRef }
									onKeyDown={ stopPropagationRelevantKeys }
									onKeyPress={ stopPropagation }
									placeholder={ __( 'Search or type url' ) }
									renderSuggestions={ renderSearchResults }
									fetchLinkSuggestions={ fetchFauxSuggestions }
								/>
								<IconButton
									className="screen-reader-text"
									icon="editor-break"
									label={ __( 'Apply' ) }
									type="submit"
								/>
								<IconButton
									type="reset"
									label={ __( 'Reset' ) }
									icon="no-alt"
									className="block-editor-link-control__search-reset"
									onClick={ () => onInputChange() }
								/>
							</form>
						</div>
					</div>
				</URLPopover>

			) }
		</Fragment>
	);
}

export default LinkControl;
