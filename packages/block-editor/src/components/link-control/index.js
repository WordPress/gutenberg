/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	Button,
	Spinner,
	Notice,
	TextControl,
	__experimentalHStack as HStack,
	__experimentalInputControlSuffixWrapper as InputControlSuffixWrapper,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useRef, useState, useEffect, useMemo } from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';
import { focus } from '@wordpress/dom';
import { ENTER } from '@wordpress/keycodes';
import { isShallowEqualObjects } from '@wordpress/is-shallow-equal';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import { keyboardReturn, linkOff } from '@wordpress/icons';
import deprecated from '@wordpress/deprecated';
import { isURL, prependHTTPS } from '@wordpress/url';

/**
 * Internal dependencies
 */
import LinkControlSettingsDrawer from './settings-drawer';
import LinkControlSearchInput from './search-input';
import LinkPreview from './link-preview';
import LinkSettings from './settings';
import useCreatePage from './use-create-page';
import useInternalValue from './use-internal-value';
import { ViewerFill } from './viewer-slot';
import { DEFAULT_LINK_SETTINGS, LINK_ENTRY_TYPES } from './constants';
import isURLLike, { isHashLink, isRelativePath } from './is-url-like';

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
 * @property {(WPLinkControlSetting[])=}  settings                   An array of settings objects. Each object will used to
 *                                                                   render a `ToggleControl` for that setting.
 * @property {boolean=}                   forceIsEditingLink         If passed as either `true` or `false`, controls the
 *                                                                   internal editing state of the component to respective
 *                                                                   show or not show the URL input field.
 * @property {WPLinkControlValue=}        value                      Current link value.
 * @property {WPLinkControlOnChangeProp=} onChange                   Value change handler, called with the updated value if
 *                                                                   the user selects a new link or updates settings.
 * @property {Function=}                  onInputChange              Callback fired when the search input value changes.
 *                                                                   Use this for observation only (e.g., to track search state).
 * @property {string=}                    inputValue                 Initial value for the search input (uncontrolled).
 * @property {boolean=}                   noDirectEntry              Whether to allow turning a URL-like search query directly into a link.
 * @property {boolean=}                   showSuggestions            Whether to present suggestions when typing the URL.
 * @property {boolean=}                   showInitialSuggestions     Whether to present initial suggestions immediately.
 * @property {boolean=}                   withCreateSuggestion       Whether to allow creation of link value from suggestion.
 * @property {Object=}                    suggestionsQuery           Query parameters to pass along to wp.blockEditor.__experimentalFetchLinkSuggestions.
 * @property {boolean=}                   noURLSuggestion            Whether to add a fallback suggestion which treats the search query as a URL.
 * @property {boolean=}                   hasTextControl             Whether to add a text field to the UI to update the value.title.
 * @property {string|Function|undefined}  createSuggestionButtonText The text to use in the button that calls createSuggestion.
 * @property {Function}                   renderControlBottom        Optional controls to be rendered at the bottom of the component.
 * @property {boolean=}                   handleEntities             Whether to handle entity links (links with ID). When true and a link has an ID, the input will be disabled and show an unlink button.
 */

const noop = () => {};

const PREFERENCE_SCOPE = 'core/block-editor';
const PREFERENCE_KEY = 'linkControlSettingsDrawer';

/**
 * Renders a link control. A link control is a controlled input which maintains
 * a value associated with a link (HTML anchor element) and relevant settings
 * for how that link is expected to behave.
 * ## Usage Patterns
 *
 * The component does not support a fully controlled implementation,
 * but it does support an observable implementation.
 *
 * ### Uncontrolled (default)
 * The component manages its own search input state:
 * ```jsx
 * <LinkControl value={ link } onChange={ setLink } />
 * ```
 *
 * ### Observable
 * Observe input changes without controlling the value:
 * ```jsx
 * <LinkControl
 *   value={ link }
 *   onChange={ setLink }
 *   onInputChange={ ( newValue ) => console.log( newValue ) }
 * />
 * ```
 *
 * ### Uncontrolled with Initial Value
 * Pre-populate the search input with a default value:
 * ```jsx
 * <LinkControl
 *   value={ link }
 *   onChange={ setLink }
 *   inputValue="wordpress"
 *   onInputChange={ ( newValue ) => console.log( newValue ) }
 * />
 * ```
 *
 * @param {WPLinkControlProps} props Component props.
 */
function LinkControl( {
	searchInputPlaceholder,
	value,
	settings = DEFAULT_LINK_SETTINGS,
	onChange = noop,
	onInputChange,
	onRemove,
	onCancel,
	noDirectEntry = false,
	showSuggestions = true,
	showInitialSuggestions,
	forceIsEditingLink,
	createSuggestion,
	withCreateSuggestion,
	inputValue: propInputValue = '',
	suggestionsQuery = {},
	noURLSuggestion = false,
	createSuggestionButtonText,
	hasRichPreviews = false,
	hasTextControl = false,
	renderControlBottom = null,
	handleEntities = false,
} ) {
	if ( withCreateSuggestion === undefined && createSuggestion ) {
		withCreateSuggestion = true;
	}

	const [ settingsOpen, setSettingsOpen ] = useState( false );
	// Sets if the URL value is valid when submitted. The value could be set to
	// { type: 'invalid', message: 'Please enter a valid URL.' } or { type: 'valid' }.
	// When it is undefined, the URL value has not been validated.
	const [ customValidity, setCustomValidity ] = useState( undefined );

	const { advancedSettingsPreference } = useSelect( ( select ) => {
		const prefsStore = select( preferencesStore );

		return {
			advancedSettingsPreference:
				prefsStore.get( PREFERENCE_SCOPE, PREFERENCE_KEY ) ?? false,
		};
	}, [] );

	const { set: setPreference } = useDispatch( preferencesStore );

	/**
	 * Sets the open/closed state of the Advanced Settings Drawer,
	 * optionlly persisting the state to the user's preferences.
	 *
	 * Note that Block Editor components can be consumed by non-WordPress
	 * environments which may not have preferences setup.
	 * Therefore a local state is also  used as a fallback.
	 *
	 * @param {boolean} prefVal the open/closed state of the Advanced Settings Drawer.
	 */
	const setSettingsOpenWithPreference = ( prefVal ) => {
		if ( setPreference ) {
			setPreference( PREFERENCE_SCOPE, PREFERENCE_KEY, prefVal );
		}
		setSettingsOpen( prefVal );
	};

	// Block Editor components can be consumed by non-WordPress environments
	// which may not have these preferences setup.
	// Therefore a local state is used as a fallback.
	const isSettingsOpen = advancedSettingsPreference || settingsOpen;

	const isMountingRef = useRef( true );
	const wrapperNode = useRef();
	const textInputRef = useRef();
	const searchInputRef = useRef();
	// TODO: Remove entityUrlFallbackRef and previewValue in favor of value prop after taxonomy entity binding
	// is stable and returns the correct URL instead of null while resolving when creating the entity.
	//
	// Preserve the URL from entity suggestions before binding overrides it
	// This is due to entity binding not being available immediately after the suggestion is selected.
	// The URL can return null, especially for taxonomy entities, while entity binding is being resolved.
	// To avoid unnecessary rerenders and focus loss, we preserve the URL from the suggestion and use it
	// as a fallback until the entity binding is available.
	const entityUrlFallbackRef = useRef();

	const settingsKeys = settings.map( ( { id } ) => id );

	const [
		internalControlValue,
		setInternalControlValue,
		setInternalURLInputValue,
		setInternalTextInputValue,
		createSetInternalSettingValueHandler,
	] = useInternalValue( value );

	// Wrapper for input changes that calls both internal and external handlers
	const handleInputChange = ( newValue ) => {
		setInternalURLInputValue( newValue );
		onInputChange?.( newValue );
	};

	// Compute isEntity internally based on handleEntities prop and presence of ID
	const isEntity = handleEntities && !! internalControlValue?.id;

	// Generate help text ID for accessibility association
	const baseId = useInstanceId( LinkControl, 'link-control' );
	const helpTextId = isEntity ? `${ baseId }__help` : null;

	const valueHasChanges =
		value && ! isShallowEqualObjects( internalControlValue, value );

	const [ isEditingLink, setIsEditingLink ] = useState(
		forceIsEditingLink !== undefined
			? forceIsEditingLink
			: ! value || ! value.url
	);

	const { createPage, isCreatingPage, errorMessage } =
		useCreatePage( createSuggestion );

	useEffect( () => {
		if ( forceIsEditingLink === undefined ) {
			return;
		}

		setIsEditingLink( forceIsEditingLink );
	}, [ forceIsEditingLink ] );

	useEffect( () => {
		// We don't auto focus into the Link UI on mount
		// because otherwise using the keyboard to select text
		// *within* the link format is not possible.
		if ( isMountingRef.current ) {
			return;
		}

		// Scenario - when:
		// - switching between editable and non editable LinkControl
		// - clicking on a link
		// ...then move focus to the *first* element to avoid focus loss
		// and to ensure focus is *within* the Link UI.
		const nextFocusTarget =
			focus.focusable.find( wrapperNode.current )[ 0 ] ||
			wrapperNode.current;

		nextFocusTarget.focus();
	}, [ isEditingLink, isCreatingPage ] );

	// The component mounting reference is maintained separately
	// to correctly reset values in `StrictMode`.
	useEffect( () => {
		isMountingRef.current = false;

		return () => {
			isMountingRef.current = true;
		};
	}, [] );

	// Warn when inputValue changes after mount. inputValue only sets the
	// initial value. The component is uncontrolled and changes
	// from the parent will not update the search input.
	const prevInputValueRef = useRef();
	useEffect( () => {
		if ( prevInputValueRef.current === undefined ) {
			prevInputValueRef.current = propInputValue;
			return;
		}

		if ( prevInputValueRef.current !== propInputValue ) {
			// eslint-disable-next-line no-console
			console.warn(
				'LinkControl: The inputValue prop is uncontrolled and only sets the initial value. onInputChange is an observer for the input value. Changes to inputValue from the parent will not update the search input.'
			);
			prevInputValueRef.current = propInputValue;
		}
	}, [ propInputValue ] );

	// Trigger validation display when customValidity becomes invalid.
	// This effect runs after React has applied the customValidity state update
	// and ControlWithError's useEffect has set the native validity on the input.
	useEffect( () => {
		if ( customValidity?.type === 'invalid' ) {
			const inputElement = searchInputRef.current;
			if (
				inputElement &&
				typeof inputElement.reportValidity === 'function'
			) {
				inputElement.reportValidity();
			}
		}
	}, [ customValidity ] );

	const hasLinkValue = value?.url?.trim()?.length > 0;

	/**
	 * Cancels editing state.
	 */
	const stopEditing = () => {
		setIsEditingLink( false );
	};

	/**
	 * Validates a URL string using a multi-stage validation process.
	 * This helper consolidates URL validation logic used throughout the component.
	 *
	 * @param {string} urlToValidate - The URL string to validate
	 * @return {Object} Validation result with isValid boolean and optional errorMessage
	 */
	const validateUrl = ( urlToValidate ) => {
		const invalidResult = {
			type: 'invalid',
			message: __( 'Please enter a valid URL.' ),
		};

		const validResult = {
			type: 'valid',
		};

		const trimmedValue = urlToValidate?.trim();

		// If empty or not URL-like, return invalid
		if ( ! trimmedValue?.length || ! isURLLike( trimmedValue ) ) {
			return invalidResult;
		}

		// Hash links (internal anchor links) and relative paths (/, ./, ../) are
		// valid href values but cannot be validated by the native URL constructor
		// (which requires absolute URLs). These are already validated by isURLLike.
		// Skip URL constructor validation for these cases.
		if ( isHashLink( trimmedValue ) || isRelativePath( trimmedValue ) ) {
			return validResult;
		}

		// Perform URL validation using the native URL constructor as the authoritative source.
		// The native URL constructor is the standard for URL validity - if it accepts a URL,
		// we should allow it. For URLs without a protocol (e.g., "www.wordpress.org"),
		// prepend "http://" before validating, as the URL constructor requires a protocol.
		//
		// Note: Protocol URLs (mailto:, tel:, etc.) are also validated by the native
		// URL constructor, so we don't need special handling for them.
		//
		// Note: We rely on the native URL constructor rather than implementing custom TLD
		// validation to avoid blocking valid URLs. If a URL passes the native constructor,
		// it's technically valid according to web standards.
		const urlToCheck = prependHTTPS( trimmedValue );
		return isURL( urlToCheck ) ? validResult : invalidResult;
	};

	const handleSelectSuggestion = ( updatedValue ) => {
		// Validate URL suggestions (link, mailto, tel, internal) or manually entered URLs.
		// Entity suggestions (post, page, category, etc.) don't need validation as they come from the database.
		// However, URL suggestions (created from user input with types like 'link', 'mailto', etc.)
		// still need validation as they may contain invalid URLs like "www.wordp".
		const isEntitySuggestion =
			updatedValue &&
			updatedValue.id &&
			updatedValue.type &&
			! LINK_ENTRY_TYPES.includes( updatedValue.type );

		if ( ! isEntitySuggestion ) {
			// URL suggestion (link, mailto, tel, internal) or manually entered URL - validate before submitting
			// Use the URL from the suggestion, or fall back to currentUrlInputValue
			const urlToValidate = updatedValue?.url || currentUrlInputValue;

			// Validate the URL using the shared validation helper
			const validation = validateUrl( urlToValidate );
			if ( validation.type === 'invalid' ) {
				setCustomValidity( validation );
				return;
			}
		}

		// Preserve the URL for taxonomy entities before binding overrides it
		if ( updatedValue?.kind === 'taxonomy' && updatedValue?.url ) {
			entityUrlFallbackRef.current = updatedValue.url;
		}

		// Suggestions may contains "settings" values (e.g. `opensInNewTab`)
		// which should not override any existing settings values set by the
		// user. This filters out any settings values from the suggestion.
		const nonSettingsChanges = Object.keys( updatedValue ).reduce(
			( acc, key ) => {
				if ( ! settingsKeys.includes( key ) ) {
					acc[ key ] = updatedValue[ key ];
				}
				return acc;
			},
			{}
		);

		onChange( {
			...internalControlValue,
			...nonSettingsChanges,
			// As title is not a setting, it must be manually applied
			// in such a way as to preserve the users changes over
			// any "title" value provided by the "suggestion".
			title: internalControlValue?.title || updatedValue?.title,
		} );

		// Reset validation state when a suggestion is selected
		setCustomValidity( undefined );

		stopEditing();
	};

	// Centralized validation function
	const validateAndSetValidity = () => {
		if ( currentInputIsEmpty ) {
			return false;
		}

		const trimmedValue = currentUrlInputValue.trim();

		// If the current value is an entity link (has id and type not in LINK_ENTRY_TYPES)
		// and the URL hasn't changed from the original value, skip validation.
		// This allows entity links with permalink formats like "?p=2" to work without
		// requiring URL validation when only settings are being changed.
		const isEntityLink =
			internalControlValue &&
			internalControlValue.id &&
			internalControlValue.type &&
			! LINK_ENTRY_TYPES.includes( internalControlValue.type );
		const urlUnchanged = value?.url === trimmedValue;

		if ( isEntityLink && urlUnchanged ) {
			// Entity link with unchanged URL - skip validation
			setCustomValidity( undefined );
			return true;
		}

		// Validate the URL using the shared validation helper
		const validation = validateUrl( currentUrlInputValue );

		if ( validation.type === 'invalid' ) {
			setCustomValidity( validation );
			return false;
		}

		// Valid URL
		setCustomValidity( undefined );
		return true;
	};

	// Centralized submission function
	const submitUrlValue = () => {
		if ( valueHasChanges ) {
			// Submit the original value with new stored values applied
			// on top. URL is a special case as it may also be a prop.
			onChange( {
				...value,
				...internalControlValue,
				url: currentUrlInputValue,
			} );
		}
		stopEditing();
		setCustomValidity( undefined );
	};

	const handleSubmit = () => {
		// Validate URL before submitting
		if ( ! validateAndSetValidity() ) {
			return;
		}

		// Validation passed - proceed with submission
		submitUrlValue();
	};

	const handleSubmitWithEnter = ( event ) => {
		const { keyCode } = event;

		if (
			keyCode === ENTER &&
			! currentInputIsEmpty // Disallow submitting empty values.
		) {
			event.preventDefault();
			handleSubmit();
		}
	};

	const resetInternalValues = () => {
		setInternalControlValue( value );
	};

	const handleCancel = ( event ) => {
		event.preventDefault();
		event.stopPropagation();

		// Ensure that any unsubmitted input changes are reset.
		resetInternalValues();

		// Reset validation state
		setCustomValidity( undefined );

		if ( hasLinkValue ) {
			// If there is a link then exist editing mode and show preview.
			stopEditing();
		} else {
			// If there is no link value, then remove the link entirely.
			onRemove?.();
		}

		onCancel?.();
	};

	const [ shouldFocusSearchInput, setShouldFocusSearchInput ] =
		useState( false );

	const handleUnlink = () => {
		// Clear the internal state to remove the ID and re-enable the field
		// Explicitly set id, kind, and type to undefined so they override
		// the original values when spread in handleSubmit. This ensures that
		// when the user types a custom URL and submits, the entity link is
		// properly severed (not just when selecting a different entity from suggestions).
		const { id, kind, type, ...restValue } = internalControlValue;
		setInternalControlValue( {
			...restValue,
			id: undefined,
			kind: undefined,
			type: undefined,
			url: undefined,
		} );

		// Request focus after the component re-renders with the cleared state
		// We can't focus immediately because the input might still be disabled
		setShouldFocusSearchInput( true );
	};

	// Focus the search input when requested, once the component has re-rendered
	// This ensures the input is enabled and ready to receive focus
	useEffect( () => {
		if ( shouldFocusSearchInput ) {
			searchInputRef.current?.focus();
			setShouldFocusSearchInput( false );
		}
	}, [ shouldFocusSearchInput ] );

	// Prioritize internal value (even if empty string), but allow propInputValue to set
	// the initial default value.
	const currentUrlInputValue =
		internalControlValue?.url !== undefined
			? internalControlValue.url
			: propInputValue || '';

	const currentInputIsEmpty = ! currentUrlInputValue?.trim()?.length;

	// Reset validation state when the URL value changes
	useEffect( () => {
		setCustomValidity( undefined );
	}, [ currentUrlInputValue ] );

	const isUrlValid = ! customValidity;
	const shownUnlinkControl =
		onRemove && value && ! isEditingLink && ! isCreatingPage;

	const showActions = isEditingLink && hasLinkValue;

	// Only show text control once a URL value has been committed
	// and it isn't just empty whitespace.
	// See https://github.com/WordPress/gutenberg/pull/33849/#issuecomment-932194927.
	const showTextControl = hasLinkValue && hasTextControl;

	const isEditing = ( isEditingLink || ! value ) && ! isCreatingPage;
	// When creating a new link (no existing value), allow submission if input is not empty and URL is valid
	// When editing an existing link, also require that the value has changed
	const isDisabled =
		currentInputIsEmpty || ! isUrlValid || ( value && ! valueHasChanges );
	const showSettings = !! settings?.length && isEditingLink && hasLinkValue;

	const previewValue = useMemo( () => {
		// There is a chance that the value is not yet set from the entity binding, so we use the preserved URL.
		if (
			value?.kind === 'taxonomy' &&
			! value?.url &&
			entityUrlFallbackRef.current
		) {
			// combine the value prop with the preserved URL from the suggestion
			return {
				...value,
				url: entityUrlFallbackRef.current,
			};
		}

		// If we don't have a fallback URL, use the value prop.
		return value;
	}, [ value ] );

	return (
		<div
			tabIndex={ -1 }
			ref={ wrapperNode }
			className="block-editor-link-control"
		>
			{ isCreatingPage && (
				<div className="block-editor-link-control__loading">
					<Spinner /> { __( 'Creating' ) }…
				</div>
			) }

			{ isEditing && (
				<>
					<div
						className={ clsx( {
							'block-editor-link-control__search-input-wrapper': true,
							'has-text-control': showTextControl,
							'has-actions': showActions,
						} ) }
					>
						{ showTextControl && (
							<TextControl
								ref={ textInputRef }
								className="block-editor-link-control__field block-editor-link-control__text-content"
								label={ __( 'Text' ) }
								value={ internalControlValue?.title }
								onChange={ setInternalTextInputValue }
								onKeyDown={ handleSubmitWithEnter }
								__next40pxDefaultSize
							/>
						) }
						<LinkControlSearchInput
							ref={ searchInputRef }
							currentLink={ value }
							className="block-editor-link-control__field block-editor-link-control__search-input"
							placeholder={ searchInputPlaceholder }
							value={ currentUrlInputValue }
							withCreateSuggestion={ withCreateSuggestion }
							onCreateSuggestion={ createPage }
							onChange={ handleInputChange }
							onSelect={ handleSelectSuggestion }
							showInitialSuggestions={ showInitialSuggestions }
							allowDirectEntry={ ! noDirectEntry }
							showSuggestions={ showSuggestions }
							suggestionsQuery={ suggestionsQuery }
							withURLSuggestion={ ! noURLSuggestion }
							createSuggestionButtonText={
								createSuggestionButtonText
							}
							hideLabelFromVision={ ! showTextControl }
							isEntity={ isEntity }
							customValidity={ customValidity }
							suffix={
								<SearchSuffixControl
									isEntity={ isEntity }
									showActions={ showActions }
									isDisabled={ isDisabled }
									onUnlink={ handleUnlink }
									onSubmit={ handleSubmit }
									helpTextId={ helpTextId }
								/>
							}
						/>
						{ isEntity && helpTextId && (
							<p
								id={ helpTextId }
								className="block-editor-link-control__help"
							>
								{ sprintf(
									/* translators: %s: entity type (e.g., page, post) */
									__( 'Synced with the selected %s.' ),
									internalControlValue?.type || 'item'
								) }
							</p>
						) }
					</div>
					{ errorMessage && (
						<Notice
							className="block-editor-link-control__search-error"
							status="error"
							isDismissible={ false }
						>
							{ errorMessage }
						</Notice>
					) }
				</>
			) }

			{ value && ! isEditingLink && ! isCreatingPage && (
				<LinkPreview
					key={ previewValue?.url } // force remount when URL changes to avoid race conditions for rich previews
					value={ previewValue }
					onEditClick={ () => setIsEditingLink( true ) }
					hasRichPreviews={ hasRichPreviews }
					hasUnlinkControl={ shownUnlinkControl }
					onRemove={ () => {
						onRemove();
						setIsEditingLink( true );
					} }
				/>
			) }

			{ showSettings && (
				<div className="block-editor-link-control__tools">
					{ ! currentInputIsEmpty && (
						<LinkControlSettingsDrawer
							settingsOpen={ isSettingsOpen }
							setSettingsOpen={ setSettingsOpenWithPreference }
						>
							<LinkSettings
								value={ internalControlValue }
								settings={ settings }
								onChange={ createSetInternalSettingValueHandler(
									settingsKeys
								) }
							/>
						</LinkControlSettingsDrawer>
					) }
				</div>
			) }

			{ showActions && (
				<HStack
					justify="right"
					className="block-editor-link-control__search-actions"
				>
					<Button
						__next40pxDefaultSize
						variant="tertiary"
						onClick={ handleCancel }
					>
						{ __( 'Cancel' ) }
					</Button>
					<Button
						__next40pxDefaultSize
						variant="primary"
						onClick={ isDisabled ? noop : handleSubmit }
						className="block-editor-link-control__search-submit"
						aria-disabled={ isDisabled }
					>
						{ __( 'Apply' ) }
					</Button>
				</HStack>
			) }

			{ ! isCreatingPage && renderControlBottom && renderControlBottom() }
		</div>
	);
}

/**
 * Suffix control component for LinkControl search input.
 * Handles the display of unlink button for entities and submit button for regular links.
 *
 * @param {Object}   props             - Component props
 * @param {boolean}  props.isEntity    - Whether the link is bound to an entity
 * @param {boolean}  props.showActions - Whether to show action buttons
 * @param {boolean}  props.isDisabled  - Whether the submit button should be disabled
 * @param {Function} props.onUnlink    - Callback when unlink button is clicked
 * @param {Function} props.onSubmit    - Callback when submit button is clicked
 * @param {string}   props.helpTextId  - ID of the help text element for accessibility
 */
function SearchSuffixControl( {
	isEntity,
	showActions,
	isDisabled,
	onUnlink,
	onSubmit,
	helpTextId,
} ) {
	if ( isEntity ) {
		return (
			<Button
				icon={ linkOff }
				onClick={ onUnlink }
				aria-describedby={ helpTextId }
				showTooltip
				label={ __( 'Unsync and edit' ) }
				__next40pxDefaultSize
			/>
		);
	}

	if ( showActions ) {
		return undefined;
	}

	return (
		<InputControlSuffixWrapper variant="control">
			<Button
				onClick={ isDisabled ? noop : onSubmit }
				label={ __( 'Submit' ) }
				icon={ keyboardReturn }
				className="block-editor-link-control__search-submit"
				aria-disabled={ isDisabled }
				size="small"
			/>
		</InputControlSuffixWrapper>
	);
}

LinkControl.ViewerFill = ViewerFill;
LinkControl.DEFAULT_LINK_SETTINGS = DEFAULT_LINK_SETTINGS;

const DeprecatedExperimentalLinkControl = ( props ) => {
	deprecated( 'wp.blockEditor.__experimentalLinkControl', {
		since: '6.8',
		alternative: 'wp.blockEditor.LinkControl',
	} );

	return <LinkControl { ...props } />;
};

DeprecatedExperimentalLinkControl.ViewerFill = LinkControl.ViewerFill;
DeprecatedExperimentalLinkControl.DEFAULT_LINK_SETTINGS =
	LinkControl.DEFAULT_LINK_SETTINGS;

export { DeprecatedExperimentalLinkControl };
export default LinkControl;
