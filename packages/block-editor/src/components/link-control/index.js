/**
 * External dependencies
 */
import classnames from 'classnames';
import { isFunction, partialRight, noop } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	Button,
	ExternalLink,
	Popover,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import {
	useCallback,
	useState,
} from '@wordpress/element';

import { safeDecodeURI, filterURLForDisplay, isURL, prependHTTP } from '@wordpress/url';

/**
 * Internal dependencies
 */
import LinkControlSettingsDrawer from './settings-drawer';
import LinkControlSearchItem from './search-item';
import LinkControlInputSearch from './input-search';

function LinkControl( { currentLink, fetchSearchSuggestions, onLinkChange, onSettingChange = { noop }, linkSettings } ) {
	// State
	const [ inputValue, setInputValue ] = useState( '' );
	const [ isEditingLink, setIsEditingLink ] = useState( true );

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
			id: '1',
			title: value,
			type: 'URL',
			url: prependHTTP( value ),
		} ];
	};

	const handleEntitySearch = async ( value ) => {
		const results = await Promise.all( [
			fetchSearchSuggestions( value ),
			handleURLSearch( value ),
		] );

		const couldBeURL = ! value.includes( ' ' );

		// If it's potentially a URL search then concat on a URL search suggestion
		// just for good measure. That way once the actual results run out we always
		// have a URL option to fallback on.
		return couldBeURL ? results[ 0 ].concat( results[ 1 ] ) : results[ 0 ];
	};

	// Effects
	const getSearchHandler = useCallback( ( value ) => {
		return ( isURL( value ) || value.includes( 'www.' ) ) ? handleURLSearch( value ) : handleEntitySearch( value );
	}, [ handleURLSearch, fetchSearchSuggestions ] );

	// Render Components
	const renderSearchResults = ( { suggestionsListProps, buildSuggestionItemProps, suggestions, selectedSuggestion, isLoading } ) => {
		const resultsListClasses = classnames( 'block-editor-link-control__search-results', {
			'is-loading': isLoading,
		} );
		/* eslint-disable react/jsx-key */
		return (
			<div className="block-editor-link-control__search-results-wrapper">
				<div { ...suggestionsListProps } className={ resultsListClasses }>
					{ suggestions.map( ( suggestion, index ) => (
						<LinkControlSearchItem
							key={ `${ suggestion.id }-${ index }` }
							itemProps={ buildSuggestionItemProps( suggestion, index ) }
							suggestion={ suggestion }
							onClick={ partialRight( onLinkSelect, suggestion ) }
							isSelected={ index === selectedSuggestion }
							isURL={ suggestion.type.toLowerCase() === 'url' }
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
								<span className="block-editor-link-control__search-item-info">{ filterURLForDisplay( safeDecodeURI( currentLink.url ) ) || '' }</span>
							</span>

							<Button isDefault onClick={ onStartEditing } className="block-editor-link-control__search-item-action block-editor-link-control__search-item-action--edit">
								{ __( 'Change' ) }
							</Button>
						</div>
					) }

					{ isEditingLink && (
						<LinkControlInputSearch
							value={ inputValue }
							onChange={ onInputChange }
							onSelect={ onLinkSelect }
							renderSuggestions={ renderSearchResults }
							fetchSuggestions={ getSearchHandler }
							onReset={ resetInput }
						/>
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
