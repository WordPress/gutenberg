/**
 * External dependencies
 */
import classnames from 'classnames';
import { isFunction, noop, startsWith } from 'lodash';

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

import {
	safeDecodeURI,
	filterURLForDisplay,
	isURL,
	prependHTTP,
	getProtocol,
} from '@wordpress/url';

/**
 * Internal dependencies
 */
import LinkControlSettingsDrawer from './settings-drawer';
import LinkControlSearchItem from './search-item';
import LinkControlInputSearch from './input-search';

function LinkControl( {
	currentLink,
	className,
	fetchSearchSuggestions,
	onLinkChange,
	onSettingsChange = { noop },
	currentSettings,
	onKeyDown = noop,
	onKeyPress = noop,
} ) {
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

	const resetInput = () => {
		setInputValue( '' );
	};

	const onLinkSelect = ( suggestion ) => ( event ) => {
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

	const handleDirectEntry = async ( value ) => {
		let type = 'URL';

		const protocol = getProtocol( value ) || '';

		if ( protocol.includes( 'mailto' ) ) {
			type = 'mailto';
		}

		if ( protocol.includes( 'tel' ) ) {
			type = 'tel';
		}

		if ( startsWith( value, '#' ) ) {
			type = 'internal';
		}

		return [ {
			id: '1',
			title: value,
			url: type === 'URL' ? prependHTTP( value ) : value,
			type,
		} ];
	};

	const handleEntitySearch = async ( value ) => {
		const results = await Promise.all( [
			fetchSearchSuggestions( value ),
			handleDirectEntry( value ),
		] );

		const couldBeURL = ! value.includes( ' ' );

		// If it's potentially a URL search then concat on a URL search suggestion
		// just for good measure. That way once the actual results run out we always
		// have a URL option to fallback on.
		return couldBeURL ? results[ 0 ].concat( results[ 1 ] ) : results[ 0 ];
	};

	// Effects
	const getSearchHandler = useCallback( ( value ) => {
		const protocol = getProtocol( value ) || '';
		const isMailto = protocol.includes( 'mailto' );
		const isInternal = startsWith( value, '#' );
		const isTel = protocol.includes( 'tel' );

		const handleManualEntry = isInternal || isMailto || isTel || isURL( value ) || ( value && value.includes( 'www.' ) );

		return ( handleManualEntry ) ? handleDirectEntry( value ) : handleEntitySearch( value );
	}, [ handleDirectEntry, fetchSearchSuggestions ] );

	// Render Components
	const renderSearchResults = ( { suggestionsListProps, buildSuggestionItemProps, suggestions, selectedSuggestion, isLoading } ) => {
		const resultsListClasses = classnames( 'block-editor-link-control__search-results', {
			'is-loading': isLoading,
		} );

		const manualLinkEntryTypes = [ 'url', 'mailto', 'tel', 'internal' ];

		return (
			<div className="block-editor-link-control__search-results-wrapper">
				<div { ...suggestionsListProps } className={ resultsListClasses }>
					{ suggestions.map( ( suggestion, index ) => (
						<LinkControlSearchItem
							key={ `${ suggestion.id }-${ suggestion.type }` }
							itemProps={ buildSuggestionItemProps( suggestion, index ) }
							suggestion={ suggestion }
							onClick={ onLinkSelect( suggestion ) }
							isSelected={ index === selectedSuggestion }
							isURL={ manualLinkEntryTypes.includes( suggestion.type.toLowerCase() ) }
							searchTerm={ inputValue }
						/>
					) ) }
				</div>
			</div>
		);
	};

	return (
		<Popover
			className={ classnames( 'block-editor-link-control', className ) }
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
							onKeyDown={ onKeyDown }
							onKeyPress={ onKeyPress }
						/>
					) }

					{ ! isEditingLink && (
						<LinkControlSettingsDrawer settings={ currentSettings } onSettingChange={ onSettingsChange } />
					) }
				</div>
			</div>
		</Popover>
	);
}

export default LinkControl;
