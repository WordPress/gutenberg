/**
 * WordPress dependencies
 */
import {
	Button,
	IconButton,
	ExternalLink,
	Popover,
} from '@wordpress/components';

/**
 * External dependencies
 */
import classnames from 'classnames';
import { __ } from '@wordpress/i18n';
import { isFunction, partialRight, noop } from 'lodash';

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

import { safeDecodeURI, filterURLForDisplay, isURL } from '@wordpress/url';

/**
 * Internal dependencies
 */
import {
	URLInput,
} from '../';

import LinkControlSettingsDrawer from './settings-drawer';
import LinkControlSearchItem from './search-item';

function LinkControl( { currentLink, fetchSearchSuggestions, onLinkChange, onSettingChange = { noop }, linkSettings } ) {
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
		return ( isURL( value ) ) ? handleURLSearch( value ) : fetchSearchSuggestions( value );
	}, [ handleURLSearch, fetchSearchSuggestions ] );

	// Render Components
	const renderSearchResults = ( { suggestionsListProps, buildSuggestionItemProps, suggestions, selectedSuggestion } ) => {
		/* eslint-disable react/jsx-key */
		return (
			<div className="block-editor-link-control__search-results-wrapper">
				<div { ...suggestionsListProps } className="block-editor-link-control__search-results">
					{ suggestions.map( ( suggestion, index ) => (
						<LinkControlSearchItem
							key={ `${ suggestion.id }-${ index }` }
							itemProps={ buildSuggestionItemProps( suggestion, index ) }
							suggestion={ suggestion }
							onClick={ partialRight( onLinkSelect, suggestion ) }
							isSelected={ index === selectedSuggestion }
							isUrl={ suggestion.type.toLowerCase() === 'url' }
							searchTerm={ inputValue }
						/>
					) ) }
				</div>
			</div>
		);
		/* eslint-enable react/jsx-key */
	};

	return (
		<Popover
			className="block-editor-link-control"
			onClose={ closeLinkUI }
			position="bottom center"
			focusOnMount="firstElement"
		>
			<div className="block-editor-link-control__popover-inner">
				<div className="block-editor-link-control__search">

					{ ! isEditingLink && (
						<div
							className={ classnames( 'block-editor-link-control__search-item', {
								'is-current': true,
							} ) }
						>
							<span className="block-editor-link-control__search-item-header">

								<ExternalLink
									className="block-editor-link-control__search-item-title"
									href={ currentLink.url }
								>
									{ currentLink.title }
								</ExternalLink>
								<span className="block-editor-link-control__search-item-info">{ currentLink.info || filterURLForDisplay( safeDecodeURI( currentLink.url ) ) || '' }</span>
							</span>

							<Button isDefault onClick={ onStartEditing } className="block-editor-link-control__search-item-action block-editor-link-control__search-item-action--edit">
								Change
							</Button>
						</div>
					) }

					{ isEditingLink && (
						<form>
							<URLInput
								className="block-editor-link-control__search-input"
								value={ inputValue }
								onChange={ onInputChange }
								autocompleteRef={ autocompleteRef }
								onKeyDown={ ( event, suggestion ) => {
									stopPropagationRelevantKeys( event );
									if ( event.keyCode === ENTER ) {
										onLinkSelect( event, suggestion );
									}
								} }
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

						</form>
					) }

					{ ! isEditingLink && (
						<LinkControlSettingsDrawer settings={ linkSettings } onSettingChange={ onSettingChange } />
					) }
				</div>
			</div>
		</Popover>
	);
}

export default LinkControl;
