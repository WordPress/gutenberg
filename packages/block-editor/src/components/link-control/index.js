/**
 * External dependencies
 */
import classnames from 'classnames';
import { noop, startsWith } from 'lodash';

/**
 * WordPress dependencies
 */
import { Button, ExternalLink, VisuallyHidden } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import {
	useRef,
	useCallback,
	useState,
	Fragment,
	useEffect,
} from '@wordpress/element';
import {
	safeDecodeURI,
	filterURLForDisplay,
	isURL,
	prependHTTP,
	getProtocol,
} from '@wordpress/url';
import { useInstanceId } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { focus } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import LinkControlSettingsDrawer from './settings-drawer';
import LinkControlSearchItem from './search-item';
import LinkControlSearchInput from './search-input';

/**
 * Default properties associated with a link control value.
 *
 * @typedef WPLinkControlDefaultValue
 *
 * @property {string}   url           Link URL.
 * @property {string=}  title         Link title.
 * @property {boolean=} opensInNewTab Whether link should open in a new browser
 *                                    tab. This value is only assigned if not
 *                                    providing a custom `settings` prop.
 */

/**
 * Custom settings values associated with a link.
 *
 * @typedef {{[setting:string]:any}} WPLinkControlSettingsValue
 */

/**
 * Custom settings values associated with a link.
 *
 * @typedef WPLinkControlSetting
 *
 * @property {string} id    Identifier to use as property for setting value.
 * @property {string} title Human-readable label to show in user interface.
 */

/**
 * Properties associated with a link control value, composed as a union of the
 * default properties and any custom settings values.
 *
 * @typedef {WPLinkControlDefaultValue&WPLinkControlSettingsValue} WPLinkControlValue
 */

/** @typedef {(nextValue:WPLinkControlValue)=>void} WPLinkControlOnChangeProp */

/**
 * @typedef WPLinkControlProps
 *
 * @property {(WPLinkControlSetting[])=}  settings               An array of settings objects. Each object will used to
 *                                                               render a `ToggleControl` for that setting.
 * @property {boolean=}                   forceIsEditingLink     If passed as either `true` or `false`, controls the
 *                                                               internal editing state of the component to respective
 *                                                               show or not show the URL input field.
 * @property {WPLinkControlValue=}        value                  Current link value.
 * @property {WPLinkControlOnChangeProp=} onChange               Value change handler, called with the updated value if
 *                                                               the user selects a new link or updates settings.
 * @property {boolean=}                   showInitialSuggestions Whether to present initial suggestions immediately.
 */

/**
 * Renders a link control. A link control is a controlled input which maintains
 * a value associated with a link (HTML anchor element) and relevant settings
 * for how that link is expected to behave.
 *
 * @param {WPLinkControlProps} props Component props.
 */
function LinkControl( {
	value,
	settings,
	onChange = noop,
	showInitialSuggestions,
	forceIsEditingLink,
} ) {
	const wrapperNode = useRef();
	const instanceId = useInstanceId( LinkControl );
	const [ inputValue, setInputValue ] = useState(
		( value && value.url ) || ''
	);
	const [ isEditingLink, setIsEditingLink ] = useState(
		forceIsEditingLink !== undefined
			? forceIsEditingLink
			: ! value || ! value.url
	);
	const isEndingEditWithFocus = useRef( false );
	const { fetchSearchSuggestions } = useSelect( ( select ) => {
		const { getSettings } = select( 'core/block-editor' );
		return {
			fetchSearchSuggestions: getSettings()
				.__experimentalFetchLinkSuggestions,
		};
	}, [] );
	const displayURL =
		( value && filterURLForDisplay( safeDecodeURI( value.url ) ) ) || '';

	useEffect( () => {
		if (
			forceIsEditingLink !== undefined &&
			forceIsEditingLink !== isEditingLink
		) {
			setIsEditingLink( forceIsEditingLink );
		}
	}, [ forceIsEditingLink ] );

	useEffect( () => {
		// When `isEditingLink` is set to `false`, a focus loss could occur
		// since the link input may be removed from the DOM. To avoid this,
		// reinstate focus to a suitable target if focus has in-fact been lost.
		// Note that the check is necessary because while typically unsetting
		// edit mode would render the read-only mode's link element, it isn't
		// guaranteed. The link input may continue to be shown if the next value
		// is still unassigned after calling `onChange`.
		const hadFocusLoss =
			isEndingEditWithFocus.current &&
			wrapperNode.current &&
			! wrapperNode.current.contains( document.activeElement );

		if ( hadFocusLoss ) {
			// Prefer to focus a natural focusable descendent of the wrapper,
			// but settle for the wrapper if there are no other options.
			const nextFocusTarget =
				focus.focusable.find( wrapperNode.current )[ 0 ] ||
				wrapperNode.current;

			nextFocusTarget.focus();
		}

		isEndingEditWithFocus.current = false;
	}, [ isEditingLink ] );

	/**
	 * onChange LinkControlSearchInput event handler
	 *
	 * @param {string} val Current value returned by the search.
	 */
	const onInputChange = ( val = '' ) => {
		setInputValue( val );
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

		return Promise.resolve( [
			{
				id: '-1',
				title: val,
				url: type === 'URL' ? prependHTTP( val ) : val,
				type,
			},
		] );
	};

	const handleEntitySearch = async ( val, args ) => {
		const results = await Promise.all( [
			fetchSearchSuggestions( val, {
				...( args.isInitialSuggestions ? { perPage: 3 } : {} ),
			} ),
			handleDirectEntry( val ),
		] );

		const couldBeURL = ! val.includes( ' ' );

		// If it's potentially a URL search then concat on a URL search suggestion
		// just for good measure. That way once the actual results run out we always
		// have a URL option to fallback on.
		return couldBeURL && ! args.isInitialSuggestions
			? results[ 0 ].concat( results[ 1 ] )
			: results[ 0 ];
	};

	/**
	 * Cancels editing state and marks that focus may need to be restored after
	 * the next render, if focus was within the wrapper when editing finished.
	 */
	function stopEditing() {
		isEndingEditWithFocus.current =
			!! wrapperNode.current &&
			wrapperNode.current.contains( document.activeElement );

		setIsEditingLink( false );
	}

	// Effects
	const getSearchHandler = useCallback(
		( val, args ) => {
			const isInternal = startsWith( val, '#' );

			const handleManualEntry =
				isInternal || isURL( val ) || ( val && val.includes( 'www.' ) );

			return handleManualEntry
				? handleDirectEntry( val, args )
				: handleEntitySearch( val, args );
		},
		[ handleDirectEntry, fetchSearchSuggestions ]
	);

	// Render Components
	const renderSearchResults = ( {
		suggestionsListProps,
		buildSuggestionItemProps,
		suggestions,
		selectedSuggestion,
		isLoading,
		isInitialSuggestions,
	} ) => {
		const resultsListClasses = classnames(
			'block-editor-link-control__search-results',
			{
				'is-loading': isLoading,
			}
		);

		const manualLinkEntryTypes = [ 'url', 'mailto', 'tel', 'internal' ];
		const searchResultsLabelId = isInitialSuggestions
			? `block-editor-link-control-search-results-label-${ instanceId }`
			: undefined;
		const labelText = isInitialSuggestions
			? __( 'Recently updated' )
			: sprintf( __( 'Search results for %s' ), inputValue );
		// According to guidelines aria-label should be added if the label
		// itself is not visible.
		// See: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/listbox_role
		const ariaLabel = isInitialSuggestions ? undefined : labelText;
		const SearchResultsLabel = (
			<span
				className="block-editor-link-control__search-results-label"
				id={ searchResultsLabelId }
				aria-label={ ariaLabel }
			>
				{ labelText }
			</span>
		);

		return (
			<div className="block-editor-link-control__search-results-wrapper">
				{ isInitialSuggestions ? (
					SearchResultsLabel
				) : (
					<VisuallyHidden>{ SearchResultsLabel }</VisuallyHidden>
				) }

				<div
					{ ...suggestionsListProps }
					className={ resultsListClasses }
					aria-labelledby={ searchResultsLabelId }
				>
					{ suggestions.map( ( suggestion, index ) => (
						<LinkControlSearchItem
							key={ `${ suggestion.id }-${ suggestion.type }` }
							itemProps={ buildSuggestionItemProps(
								suggestion,
								index
							) }
							suggestion={ suggestion }
							onClick={ () => {
								onChange( { ...value, ...suggestion } );
								stopEditing();
							} }
							isSelected={ index === selectedSuggestion }
							isURL={ manualLinkEntryTypes.includes(
								suggestion.type.toLowerCase()
							) }
							searchTerm={ inputValue }
						/>
					) ) }
				</div>
			</div>
		);
	};

	return (
		<div
			tabIndex={ -1 }
			ref={ wrapperNode }
			className="block-editor-link-control"
		>
			{ isEditingLink || ! value ? (
				<LinkControlSearchInput
					value={ inputValue }
					onChange={ onInputChange }
					onSelect={ ( suggestion ) => {
						onChange( { ...value, ...suggestion } );
						stopEditing();
					} }
					renderSuggestions={ renderSearchResults }
					fetchSuggestions={ getSearchHandler }
					showInitialSuggestions={ showInitialSuggestions }
				/>
			) : (
				<Fragment>
					<p
						className="screen-reader-text"
						id={ `current-link-label-${ instanceId }` }
					>
						{ __( 'Currently selected' ) }:
					</p>
					<div
						aria-labelledby={ `current-link-label-${ instanceId }` }
						aria-selected="true"
						className={ classnames(
							'block-editor-link-control__search-item',
							{
								'is-current': true,
							}
						) }
					>
						<span className="block-editor-link-control__search-item-header">
							<ExternalLink
								className="block-editor-link-control__search-item-title"
								href={ value.url }
							>
								{ ( value && value.title ) || displayURL }
							</ExternalLink>
							{ value && value.title && (
								<span className="block-editor-link-control__search-item-info">
									{ displayURL }
								</span>
							) }
						</span>

						<Button
							isSecondary
							onClick={ () => setIsEditingLink( true ) }
							className="block-editor-link-control__search-item-action"
						>
							{ __( 'Edit' ) }
						</Button>
					</div>
				</Fragment>
			) }
			<LinkControlSettingsDrawer
				value={ value }
				settings={ settings }
				onChange={ onChange }
			/>
		</div>
	);
}

export default LinkControl;
