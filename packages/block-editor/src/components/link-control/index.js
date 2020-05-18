/**
 * External dependencies
 */
import classnames from 'classnames';
import { noop, startsWith } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	Button,
	ExternalLink,
	Spinner,
	VisuallyHidden,
	createSlotFill,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import {
	useRef,
	useCallback,
	useState,
	Fragment,
	useEffect,
	createElement,
	useMemo,
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
import LinkControlSearchCreate from './search-create-button';

const { Slot: ViewerSlot, Fill: ViewerFill } = createSlotFill(
	'BlockEditorLinkControlViewer'
);

// Used as a unique identifier for the "Create" option within search results.
// Used to help distinguish the "Create" suggestion within the search results in
// order to handle it as a unique case.
const CREATE_TYPE = '__CREATE__';

/**
 * Creates a wrapper around a promise which allows it to be programmatically
 * cancelled.
 * See: https://reactjs.org/blog/2015/12/16/ismounted-antipattern.html
 *
 * @param {Promise} promise the Promise to make cancelable
 */
const makeCancelable = ( promise ) => {
	let hasCanceled_ = false;

	const wrappedPromise = new Promise( ( resolve, reject ) => {
		promise.then(
			( val ) =>
				hasCanceled_ ? reject( { isCanceled: true } ) : resolve( val ),
			( error ) =>
				hasCanceled_ ? reject( { isCanceled: true } ) : reject( error )
		);
	} );

	return {
		promise: wrappedPromise,
		cancel() {
			hasCanceled_ = true;
		},
	};
};
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

/* eslint-disable jsdoc/valid-types */
/**
 * Custom settings values associated with a link.
 *
 * @typedef {{[setting:string]:any}} WPLinkControlSettingsValue
 */
/* eslint-enable */

/**
 * Custom settings values associated with a link.
 *
 * @typedef WPLinkControlSetting
 *
 * @property {string} id    Identifier to use as property for setting value.
 * @property {string} title Human-readable label to show in user interface.
 */

/* eslint-disable jsdoc/valid-types */
/**
 * Properties associated with a link control value, composed as a union of the
 * default properties and any custom settings values.
 *
 * @typedef {WPLinkControlDefaultValue&WPLinkControlSettingsValue} WPLinkControlValue
 */
/* eslint-enable */

/** @typedef {(nextValue:WPLinkControlValue)=>void} WPLinkControlOnChangeProp */

/**
 * Properties associated with a search suggestion used within the LinkControl.
 *
 * @typedef WPLinkControlSuggestion
 *
 * @property {string} id    Identifier to use to uniquely identify the suggestion.
 * @property {string} type  Identifies the type of the suggestion (eg: `post`,
 *                          `page`, `url`...etc)
 * @property {string} title Human-readable label to show in user interface.
 * @property {string} url   A URL for the suggestion.
 */

/** @typedef {(title:string)=>WPLinkControlSuggestion} WPLinkControlCreateSuggestionProp */

/**
 * @typedef WPLinkControlProps
 *
 * @property {(WPLinkControlSetting[])=}            settings               An array of settings objects. Each object will used to
 *                                                                         render a `ToggleControl` for that setting.
 * @property {boolean=}                             forceIsEditingLink     If passed as either `true` or `false`, controls the
 *                                                                         internal editing state of the component to respective
 *                                                                         show or not show the URL input field.
 * @property {WPLinkControlValue=}                  value                  Current link value.
 * @property {WPLinkControlOnChangeProp=}           onChange               Value change handler, called with the updated value if
 *                                                                         the user selects a new link or updates settings.
 * @property {boolean=}                             showSuggestions        Whether to present suggestions when typing the URL.
 * @property {boolean=}                             showInitialSuggestions Whether to present initial suggestions immediately.
 * @property {WPLinkControlCreateSuggestionProp=}   createSuggestion       Handler to manage creation of link value from suggestion.
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
	showSuggestions = true,
	showInitialSuggestions,
	forceIsEditingLink,
	createSuggestion,
} ) {
	const cancelableOnCreate = useRef();
	const cancelableCreateSuggestion = useRef();

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
	const [ isResolvingLink, setIsResolvingLink ] = useState( false );
	const [ errorMessage, setErrorMessage ] = useState( null );
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
	 * Handles cancelling any pending Promises that have been made cancelable.
	 */
	useEffect( () => {
		return () => {
			// componentDidUnmount
			if ( cancelableOnCreate.current ) {
				cancelableOnCreate.current.cancel();
			}
			if ( cancelableCreateSuggestion.current ) {
				cancelableCreateSuggestion.current.cancel();
			}
		};
	}, [] );

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
				id: val,
				title: val,
				url: type === 'URL' ? prependHTTP( val ) : val,
				type,
			},
		] );
	};

	const handleEntitySearch = async ( val, args ) => {
		let results = await Promise.all( [
			fetchSearchSuggestions( val, {
				...( args.isInitialSuggestions ? { perPage: 3 } : {} ),
			} ),
			handleDirectEntry( val ),
		] );

		const couldBeURL = ! val.includes( ' ' );

		// If it's potentially a URL search then concat on a URL search suggestion
		// just for good measure. That way once the actual results run out we always
		// have a URL option to fallback on.
		results =
			couldBeURL && ! args.isInitialSuggestions
				? results[ 0 ].concat( results[ 1 ] )
				: results[ 0 ];

		// Here we append a faux suggestion to represent a "CREATE" option. This
		// is detected in the rendering of the search results and handled as a
		// special case. This is currently necessary because the suggestions
		// dropdown will only appear if there are valid suggestions and
		// therefore unless the create option is a suggestion it will not
		// display in scenarios where there are no results returned from the
		// API. In addition promoting CREATE to a first class suggestion affords
		// the a11y benefits afforded by `URLInput` to all suggestions (eg:
		// keyboard handling, ARIA roles...etc).
		//
		// Note also that the value of the `title` and `url` properties must correspond
		// to the text value of the `<input>`. This is because `title` is used
		// when creating the suggestion. Similarly `url` is used when using keyboard to select
		// the suggestion (the <form> `onSubmit` handler falls-back to `url`).
		return isURLLike( val )
			? results
			: results.concat( {
					// the `id` prop is intentionally ommitted here because it
					// is never exposed as part of the component's public API.
					// see: https://github.com/WordPress/gutenberg/pull/19775#discussion_r378931316.
					title: val, // must match the existing `<input>`s text value
					url: val, // must match the existing `<input>`s text value
					type: CREATE_TYPE,
			  } );
	};

	/**
	 * Cancels editing state and marks that focus may need to be restored after
	 * the next render, if focus was within the wrapper when editing finished.
	 */
	function stopEditing() {
		isEndingEditWithFocus.current = !! wrapperNode.current?.contains(
			document.activeElement
		);

		setIsEditingLink( false );
	}

	/**
	 * Determines whether a given value could be a URL. Note this does not
	 * guarantee the value is a URL only that it looks like it might be one. For
	 * example, just because a string has `www.` in it doesn't make it a URL,
	 * but it does make it highly likely that it will be so in the context of
	 * creating a link it makes sense to treat it like one.
	 *
	 * @param {string} val the candidate for being URL-like (or not).
	 * @return {boolean}   whether or not the value is potentially a URL.
	 */
	function isURLLike( val ) {
		const isInternal = startsWith( val, '#' );
		return isURL( val ) || ( val && val.includes( 'www.' ) ) || isInternal;
	}

	// Effects
	const getSearchHandler = useCallback(
		( val, args ) => {
			if ( ! showSuggestions ) {
				return Promise.resolve( [] );
			}

			return isURLLike( val )
				? handleDirectEntry( val, args )
				: handleEntitySearch( val, args );
		},
		[ handleDirectEntry, fetchSearchSuggestions ]
	);

	const handleOnCreate = async ( suggestionTitle ) => {
		setIsResolvingLink( true );
		setErrorMessage( null );

		try {
			// Make cancellable in order that we can avoid setting State
			// if the component unmounts during the call to `createSuggestion`
			cancelableCreateSuggestion.current = makeCancelable(
				// Using Promise.resolve to allow createSuggestion to return a
				// non-Promise based value.
				Promise.resolve( createSuggestion( suggestionTitle ) )
			);

			const newSuggestion = await cancelableCreateSuggestion.current
				.promise;

			// ********
			// NOTE: if the above Promise rejects then code below here will never run
			// ********
			setIsResolvingLink( false );

			// Only set link if request is resolved, otherwise enable edit mode.
			if ( newSuggestion ) {
				onChange( newSuggestion );
				stopEditing();
			} else {
				setIsEditingLink( true );
			}
		} catch ( error ) {
			if ( error && error.isCanceled ) {
				return; // bail if canceled to avoid setting state
			}

			setErrorMessage(
				error.message ||
					__(
						'An unknown error occurred during creation. Please try again.'
					)
			);
			setIsResolvingLink( false );
			setIsEditingLink( true );
		}
	};

	const handleSelectSuggestion = ( suggestion, _value = {} ) => {
		setIsEditingLink( false );
		onChange( { ..._value, ...suggestion } );
	};

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

		const directLinkEntryTypes = [ 'url', 'mailto', 'tel', 'internal' ];
		const isSingleDirectEntryResult =
			suggestions.length === 1 &&
			directLinkEntryTypes.includes(
				suggestions[ 0 ].type.toLowerCase()
			);
		const shouldShowCreateSuggestion =
			createSuggestion &&
			! isSingleDirectEntryResult &&
			! isInitialSuggestions;

		// According to guidelines aria-label should be added if the label
		// itself is not visible.
		// See: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/listbox_role
		const searchResultsLabelId = `block-editor-link-control-search-results-label-${ instanceId }`;
		const labelText = isInitialSuggestions
			? __( 'Recently updated' )
			: sprintf(
					/* translators: %s: search term. */
					__( 'Search results for "%s"' ),
					inputValue
			  );

		// VisuallyHidden rightly doesn't accept custom classNames
		// so we conditionally render it as a wrapper to visually hide the label
		// when that is required.
		const searchResultsLabel = createElement(
			isInitialSuggestions ? Fragment : VisuallyHidden,
			{}, // empty props
			<span
				className="block-editor-link-control__search-results-label"
				id={ searchResultsLabelId }
			>
				{ labelText }
			</span>
		);

		return (
			<div className="block-editor-link-control__search-results-wrapper">
				{ searchResultsLabel }
				<div
					{ ...suggestionsListProps }
					className={ resultsListClasses }
					aria-labelledby={ searchResultsLabelId }
				>
					{ suggestions.map( ( suggestion, index ) => {
						if (
							shouldShowCreateSuggestion &&
							CREATE_TYPE === suggestion.type
						) {
							return (
								<LinkControlSearchCreate
									searchTerm={ inputValue }
									onClick={ async () => {
										await handleOnCreate(
											suggestion.title
										);
									} }
									// Intentionally only using `type` here as
									// the constant is enough to uniquely
									// identify the single "CREATE" suggestion.
									key={ suggestion.type }
									itemProps={ buildSuggestionItemProps(
										suggestion,
										index
									) }
									isSelected={ index === selectedSuggestion }
								/>
							);
						}

						// If we're not handling "Create" suggestions above then
						// we don't want them in the main results so exit early
						if ( CREATE_TYPE === suggestion.type ) {
							return null;
						}

						return (
							<LinkControlSearchItem
								key={ `${ suggestion.id }-${ suggestion.type }` }
								itemProps={ buildSuggestionItemProps(
									suggestion,
									index
								) }
								suggestion={ suggestion }
								index={ index }
								onClick={ () => {
									stopEditing();
									onChange( { ...value, ...suggestion } );
								} }
								isSelected={ index === selectedSuggestion }
								isURL={ directLinkEntryTypes.includes(
									suggestion.type.toLowerCase()
								) }
								searchTerm={ inputValue }
							/>
						);
					} ) }
				</div>
			</div>
		);
	};

	const viewerSlotFillProps = useMemo(
		() => ( { url: value && value.url } ),
		[ value && value.url ]
	);
	return (
		<div
			tabIndex={ -1 }
			ref={ wrapperNode }
			className="block-editor-link-control"
		>
			{ isResolvingLink && (
				<div className="block-editor-link-control__loading">
					<Spinner /> { __( 'Creating' ) }…
				</div>
			) }

			{ ( isEditingLink || ! value ) && ! isResolvingLink && (
				<LinkControlSearchInput
					value={ inputValue }
					onChange={ onInputChange }
					onSelect={ async ( suggestion ) => {
						if ( CREATE_TYPE === suggestion.type ) {
							await handleOnCreate( inputValue );
						} else {
							handleSelectSuggestion( suggestion, value );
							stopEditing();
						}
					} }
					renderSuggestions={
						showSuggestions ? renderSearchResults : null
					}
					fetchSuggestions={ getSearchHandler }
					showInitialSuggestions={ showInitialSuggestions }
					errorMessage={ errorMessage }
				/>
			) }

			{ value && ! isEditingLink && ! isResolvingLink && (
				<Fragment>
					<div
						aria-label={ __( 'Currently selected' ) }
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
						<ViewerSlot fillProps={ viewerSlotFillProps } />
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

LinkControl.ViewerFill = ViewerFill;

export default LinkControl;
