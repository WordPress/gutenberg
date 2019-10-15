/**
 * WordPress dependencies
 */
import {
	IconButton,
	Icon,
	ToggleControl,
} from '@wordpress/components';
/**
 * External dependencies
 */
import classnames from 'classnames';
import { __ } from '@wordpress/i18n';
import { isFunction, partialRight } from 'lodash';

import {
	useCallback,
	useState,
	useRef,
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

import TextHighlight from './text-highlight';

function LinkControl( { currentLink, fetchSearchSuggestions, renderAdditionalSettings, onLinkChange } ) {
	// State
	const [ inputValue, setInputValue ] = useState( '' );
	const [ isEditingLink, setIsEditingLink ] = useState( true );

	// Refs
	const autocompleteRef = useRef( null );

	// Handlers
	const onInputChange = ( value = '' ) => {
		setInputValue( value );
	};

	const closeLinkUI = () => {
		resetInput();
	};

	const resetInput = useCallback( () => {
		setInputValue( '' );
	} );

	const onLinkSelect = ( event, suggestion ) => {
		event.preventDefault();
		event.stopPropagation();

		setIsEditingLink( false );

		if ( isFunction( onLinkChange ) ) {
			onLinkChange( suggestion );
		}
	};

	const onStartEditing = () => {
		setIsEditingLink( true );
	};

	const handleURLSearch = async ( value ) => {
		return [ {
			id: 1,
			title: value,
			type: 'URL',
			url: value,
		} ];
	};

	const stopPropagation = ( event ) => {
		event.stopPropagation();
	};

	const stopPropagationRelevantKeys = ( event ) => {
		if ( [ LEFT, DOWN, RIGHT, UP, BACKSPACE, ENTER ].indexOf( event.keyCode ) > -1 ) {
			// Stop the key event from propagating up to ObserveTyping.startTypingInTextField.
			stopPropagation( event );
		}
	};

	// Effects
	const getSearchHandler = useCallback( ( value ) => {
		return ( /^https?:/.test( value ) ) ? handleURLSearch( value ) : fetchSearchSuggestions( value );
	}, [ handleURLSearch, fetchSearchSuggestions ] );

	// Render Components
	const renderSearchResults = ( { suggestionsListProps, buildSuggestionItemProps, suggestions, selectedSuggestion } ) => {
		/* eslint-disable react/jsx-key */
		return (
			<div className="block-editor-link-control__search-results-wrapper">
				<div { ...suggestionsListProps } className="block-editor-link-control__search-results">
					{ suggestions.map( ( suggestion, index ) => (
						<button
							{ ...buildSuggestionItemProps( suggestion, index ) }
							onClick={ partialRight( onLinkSelect, suggestion ) }
							className={ classnames( 'block-editor-link-control__search-item', {
								'is-selected': index === selectedSuggestion,
							} ) }

						>
							{ suggestion.type.toLowerCase() === 'url' && (
								<Icon className="block-editor-link-control__search-item-icon" icon="admin-site-alt3" />
							) }
							<span className="block-editor-link-control__search-item-header">
								<span className="block-editor-link-control__search-item-title">
									<TextHighlight text={ suggestion.title } highlight={ inputValue } />
								</span>
								<span className="block-editor-link-control__search-item-info">{ suggestion.info || suggestion.url || '' }</span>
							</span>
							<span className="block-editor-link-control__search-item-type">{ suggestion.type.toLowerCase() || '' }</span>
						</button>
					) ) }
				</div>
			</div>
		);
		/* eslint-enable react/jsx-key */
	};

	const LinkControlAdditionalSettings = () => (
		<div className="block-editor-link-control__settings">
			<ToggleControl
				label={ __( 'Open in New Tab' ) }
				checked={ false } />
			{ isFunction( renderAdditionalSettings ) && renderAdditionalSettings() }
		</div>
	);

	return (
		<URLPopover
			className="block-editor-link-control"
			onClose={ closeLinkUI }
		>
			<div className="block-editor-link-control__popover-inner">
				<div className="block-editor-link-control__search">

					{ ! isEditingLink && (
						<div>
							<p>The link is { currentLink.title } { currentLink.url }</p>
							<button type="button" onClick={ onStartEditing }>Edit Link</button>
						</div>
					) }

					{ isEditingLink && (
						<form>
							<URLInput
								className="block-editor-link-control__search-input"
								value={ inputValue }
								onChange={ onInputChange }
								autocompleteRef={ autocompleteRef }
								onKeyDown={ stopPropagationRelevantKeys }
								onKeyPress={ stopPropagation }
								placeholder={ __( 'Search or type url' ) }
								renderSuggestions={ renderSearchResults }
								fetchLinkSuggestions={ getSearchHandler }
								handleURLSuggestions={ true }
							/>

							<IconButton
								disabled={ ! inputValue.length }
								type="reset"
								label={ __( 'Reset' ) }
								icon="no-alt"
								className="block-editor-link-control__search-reset"
								onClick={ resetInput }
							/>

							{ inputValue && <LinkControlAdditionalSettings /> }
						</form>
					) }
				</div>
			</div>
		</URLPopover>
	);
}

export default LinkControl;
