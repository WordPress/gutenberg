/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Button, Spinner, Notice, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useRef, useState, useEffect } from '@wordpress/element';
import { focus } from '@wordpress/dom';
import { ENTER } from '@wordpress/keycodes';
import { isShallowEqualObjects } from '@wordpress/is-shallow-equal';

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
import { DEFAULT_LINK_SETTINGS } from './constants';

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
 * @property {boolean=}                   noDirectEntry              Whether to allow turning a URL-like search query directly into a link.
 * @property {boolean=}                   showSuggestions            Whether to present suggestions when typing the URL.
 * @property {boolean=}                   showInitialSuggestions     Whether to present initial suggestions immediately.
 * @property {boolean=}                   withCreateSuggestion       Whether to allow creation of link value from suggestion.
 * @property {Object=}                    suggestionsQuery           Query parameters to pass along to wp.blockEditor.__experimentalFetchLinkSuggestions.
 * @property {boolean=}                   noURLSuggestion            Whether to add a fallback suggestion which treats the search query as a URL.
 * @property {boolean=}                   hasTextControl             Whether to add a text field to the UI to update the value.title.
 * @property {string|Function|undefined}  createSuggestionButtonText The text to use in the button that calls createSuggestion.
 * @property {Function}                   renderControlBottom        Optional controls to be rendered at the bottom of the component.
 */

const noop = () => {};

/**
 * Renders a link control. A link control is a controlled input which maintains
 * a value associated with a link (HTML anchor element) and relevant settings
 * for how that link is expected to behave.
 *
 * @param {WPLinkControlProps} props Component props.
 */
function LinkControl( {
	searchInputPlaceholder,
	value,
	settings = DEFAULT_LINK_SETTINGS,
	onChange = noop,
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
} ) {
	if ( withCreateSuggestion === undefined && createSuggestion ) {
		withCreateSuggestion = true;
	}

	const isMounting = useRef( true );
	const wrapperNode = useRef();
	const textInputRef = useRef();
	const isEndingEditWithFocus = useRef( false );

	const settingsKeys = settings.map( ( { id } ) => id );

	const [ settingsOpen, setSettingsOpen ] = useState( false );

	const [
		internalControlValue,
		setInternalControlValue,
		setInternalURLInputValue,
		setInternalTextInputValue,
		createSetInternalSettingValueHandler,
	] = useInternalValue( value );

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
		if (
			forceIsEditingLink !== undefined &&
			forceIsEditingLink !== isEditingLink
		) {
			setIsEditingLink( forceIsEditingLink );
		}
		// Todo: bug if the missing dep is introduced. Will need a fix.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ forceIsEditingLink ] );

	useEffect( () => {
		// We don't auto focus into the Link UI on mount
		// because otherwise using the keyboard to select text
		// *within* the link format is not possible.
		if ( isMounting.current ) {
			isMounting.current = false;
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

		isEndingEditWithFocus.current = false;
	}, [ isEditingLink, isCreatingPage ] );

	const hasLinkValue = value?.url?.trim()?.length > 0;

	/**
	 * Cancels editing state and marks that focus may need to be restored after
	 * the next render, if focus was within the wrapper when editing finished.
	 */
	const stopEditing = () => {
		isEndingEditWithFocus.current = !! wrapperNode.current?.contains(
			wrapperNode.current.ownerDocument.activeElement
		);

		setSettingsOpen( false );
		setIsEditingLink( false );
	};

	const handleSelectSuggestion = ( updatedValue ) => {
		// Suggestions may contains "settings" values (e.g. `opensInNewTab`)
		// which should not overide any existing settings values set by the
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

		stopEditing();
	};

	const handleSubmit = () => {
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

		if ( hasLinkValue ) {
			// If there is a link then exist editing mode and show preview.
			stopEditing();
		} else {
			// If there is no link value, then remove the link entirely.
			onRemove?.();
		}

		onCancel?.();
	};

	const currentUrlInputValue =
		propInputValue || internalControlValue?.url || '';

	const currentInputIsEmpty = ! currentUrlInputValue?.trim()?.length;

	const shownUnlinkControl =
		onRemove && value && ! isEditingLink && ! isCreatingPage;

	const showSettings = !! settings?.length;

	// Only show text control once a URL value has been committed
	// and it isn't just empty whitespace.
	// See https://github.com/WordPress/gutenberg/pull/33849/#issuecomment-932194927.
	const showTextControl = hasLinkValue && hasTextControl;

	const isEditing = ( isEditingLink || ! value ) && ! isCreatingPage;
	const isDisabled = ! valueHasChanges || currentInputIsEmpty;

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
						className={ classnames( {
							'block-editor-link-control__search-input-wrapper': true,
							'has-text-control': showTextControl,
						} ) }
					>
						<LinkControlSearchInput
							currentLink={ value }
							className="block-editor-link-control__field block-editor-link-control__search-input"
							placeholder={ searchInputPlaceholder }
							value={ currentUrlInputValue }
							withCreateSuggestion={ withCreateSuggestion }
							onCreateSuggestion={ createPage }
							onChange={ setInternalURLInputValue }
							onSelect={ handleSelectSuggestion }
							showInitialSuggestions={ showInitialSuggestions }
							allowDirectEntry={ ! noDirectEntry }
							showSuggestions={ showSuggestions }
							suggestionsQuery={ suggestionsQuery }
							withURLSuggestion={ ! noURLSuggestion }
							createSuggestionButtonText={
								createSuggestionButtonText
							}
							useLabel={ showTextControl }
						/>
						{ showTextControl && (
							<TextControl
								__nextHasNoMarginBottom
								ref={ textInputRef }
								className="block-editor-link-control__field block-editor-link-control__text-content"
								label={ __( 'Text' ) }
								value={ internalControlValue?.title }
								onChange={ setInternalTextInputValue }
								onKeyDown={ handleSubmitWithEnter }
							/>
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
					key={ value?.url } // force remount when URL changes to avoid race conditions for rich previews
					value={ value }
					onEditClick={ () => setIsEditingLink( true ) }
					hasRichPreviews={ hasRichPreviews }
					hasUnlinkControl={ shownUnlinkControl }
					onRemove={ onRemove }
				/>
			) }

			{ isEditing && (
				<div className="block-editor-link-control__tools">
					{ showSettings && (
						<LinkControlSettingsDrawer
							settingsOpen={ settingsOpen }
							setSettingsOpen={ setSettingsOpen }
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

					<div className="block-editor-link-control__search-actions">
						<Button
							variant="primary"
							onClick={ isDisabled ? noop : handleSubmit }
							className="block-editor-link-control__search-submit"
							aria-disabled={ isDisabled }
						>
							{ __( 'Save' ) }
						</Button>
						<Button variant="tertiary" onClick={ handleCancel }>
							{ __( 'Cancel' ) }
						</Button>
					</div>
				</div>
			) }

			{ renderControlBottom && renderControlBottom() }
		</div>
	);
}

LinkControl.ViewerFill = ViewerFill;

export default LinkControl;
