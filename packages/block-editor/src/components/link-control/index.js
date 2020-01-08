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
	Fragment,
} from '@wordpress/element';

import {
	safeDecodeURI,
	filterURLForDisplay,
	isURL,
	prependHTTP,
	getProtocol,
} from '@wordpress/url';

import { withInstanceId, compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import LinkControlSettingsDrawer from './settings-drawer';
import LinkControlSearchItem from './search-item';
import LinkControlSearchInput from './search-input';

const MODE_EDIT = 'edit';
// const MODE_SHOW = 'show';

function LinkControl( {
	className,
	value,
	settings,
	fetchSearchSuggestions,
	instanceId,
	onClose = noop,
	onChange = noop,
} ) {
	// State
	const [ inputValue, setInputValue ] = useState( '' );
	const [ isEditingLink, setIsEditingLink ] = useState( ! value || ! value.url );

	// Handlers

	/**
	 * onChange LinkControlSearchInput event handler
	 *
	 * @param {string} val Current value returned by the search.
	 */
	const onInputChange = ( val = '' ) => {
		setInputValue( val );
	};

	// Utils

	/**
	 * Handler function which switches the mode of the component,
	 * between `edit` and `show` mode.
	 *
	 * @param {string} mode Component mode: `show` or `edit`.
	 */
	const setMode = ( mode = 'show' ) => () => {
		setIsEditingLink( MODE_EDIT === mode );

		// Populate input searcher whether
		// the current link has a title.
		if ( value && value.title && mode === 'edit' ) {
			setInputValue( value.title );
		}
	};

	const closeLinkUI = () => {
		resetInput();
		onClose();
	};

	const resetInput = () => {
		setInputValue( '' );
	};

	const handleDirectEntry = ( val ) => {
		let type = 'URL';

		const protocol = getProtocol( val ) || '';

		if ( protocol.includes( 'mailto' ) ) {
			type = 'mailto';
		}

		if ( protocol.includes( 'tel' ) ) {
			type = 'tel';
		}

		if ( startsWith( val, '#' ) ) {
			type = 'internal';
		}

		return Promise.resolve(
			[ {
				id: '-1',
				title: val,
				url: type === 'URL' ? prependHTTP( val ) : val,
				type,
			} ]
		);
	};

	const handleEntitySearch = async ( val ) => {
		const results = await Promise.all( [
			fetchSearchSuggestions( val ),
			handleDirectEntry( val ),
		] );

		const couldBeURL = ! val.includes( ' ' );

		// If it's potentially a URL search then concat on a URL search suggestion
		// just for good measure. That way once the actual results run out we always
		// have a URL option to fallback on.
		return couldBeURL ? results[ 0 ].concat( results[ 1 ] ) : results[ 0 ];
	};

	// Effects
	const getSearchHandler = useCallback( ( val ) => {
		const protocol = getProtocol( val ) || '';
		const isMailto = protocol.includes( 'mailto' );
		const isInternal = startsWith( val, '#' );
		const isTel = protocol.includes( 'tel' );

		const handleManualEntry = isInternal || isMailto || isTel || isURL( val ) || ( val && val.includes( 'www.' ) );

		return ( handleManualEntry ) ? handleDirectEntry( val ) : handleEntitySearch( val );
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
							onClick={ () => {
								setIsEditingLink( false );
								onChange( { ...value, ...suggestion } );
							} }
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

					{ ( ! isEditingLink ) && (
						<Fragment>
							<p className="screen-reader-text" id={ `current-link-label-${ instanceId }` }>
								{ __( 'Currently selected' ) }:
							</p>
							<div
								aria-labelledby={ `current-link-label-${ instanceId }` }
								aria-selected="true"
								className={ classnames( 'block-editor-link-control__search-item', {
									'is-current': true,
								} ) }
							>
								<span className="block-editor-link-control__search-item-header">
									<ExternalLink
										className="block-editor-link-control__search-item-title"
										href={ value.url }
									>
										{ value.title }
									</ExternalLink>
									<span className="block-editor-link-control__search-item-info">{ filterURLForDisplay( safeDecodeURI( value.url ) ) || '' }</span>
								</span>

								<Button isSecondary onClick={ setMode( MODE_EDIT ) } className="block-editor-link-control__search-item-action block-editor-link-control__search-item-action--edit">
									{ __( 'Edit' ) }
								</Button>
							</div>
						</Fragment>
					) }

					{ isEditingLink && (
						<LinkControlSearchInput
							value={ inputValue }
							onChange={ onInputChange }
							onSelect={ ( suggestion ) => {
								setIsEditingLink( false );
								onChange( { ...value, ...suggestion } );
							} }
							renderSuggestions={ renderSearchResults }
							fetchSuggestions={ getSearchHandler }
							onReset={ resetInput }
						/>
					) }

					{ ! isEditingLink && (
						<LinkControlSettingsDrawer value={ value } settings={ settings } onChange={ onChange } />
					) }
				</div>
			</div>
		</Popover>
	);
}

export default compose(
	withInstanceId,
	withSelect( ( select, ownProps ) => {
		if ( ownProps.fetchSearchSuggestions && isFunction( ownProps.fetchSearchSuggestions ) ) {
			return;
		}

		const { getSettings } = select( 'core/block-editor' );
		return {
			fetchSearchSuggestions: getSettings().__experimentalFetchLinkSuggestions,
		};
	} )
)( LinkControl );
