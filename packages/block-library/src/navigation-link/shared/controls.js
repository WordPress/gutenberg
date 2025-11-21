/**
 * WordPress dependencies
 */
import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	Button,
	CheckboxControl,
	TextControl,
	TextareaControl,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useRef, useEffect, useState } from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';
import { safeDecodeURI } from '@wordpress/url';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
import { linkOff as unlinkIcon } from '@wordpress/icons';
import { useDispatch } from '@wordpress/data';
import {
	store as blockEditorStore,
	__experimentalLinkControlSearchInput as LinkControlSearchInput,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../../utils/hooks';
import { updateAttributes } from './update-attributes';
import { useEntityBinding } from './use-entity-binding';

/**
 * Given the Link block's type attribute, return the query params for link suggestions.
 *
 * @param {string} type - Link block's type attribute
 * @param {string} kind - Link block's entity kind (post-type|taxonomy)
 * @return {Object} Search query params
 */
function getSuggestionsQuery( type, kind ) {
	switch ( type ) {
		case 'post':
		case 'page':
			return { type: 'post', subtype: type };
		case 'category':
			return { type: 'term', subtype: 'category' };
		case 'tag':
			return { type: 'term', subtype: 'post_tag' };
		case 'post_format':
			return { type: 'post-format' };
		default:
			if ( kind === 'taxonomy' ) {
				return { type: 'term', subtype: type };
			}
			if ( kind === 'post-type' ) {
				return { type: 'post', subtype: type };
			}
			return {};
	}
}

/**
 * Get a human-readable entity type name.
 *
 * @param {string} type - The entity type
 * @param {string} kind - The entity kind
 * @return {string} Human-readable entity type name
 */
function getEntityTypeName( type, kind ) {
	if ( kind === 'post-type' ) {
		switch ( type ) {
			case 'post':
				return __( 'post' );
			case 'page':
				return __( 'page' );
			default:
				return type || __( 'post' );
		}
	}
	if ( kind === 'taxonomy' ) {
		switch ( type ) {
			case 'category':
				return __( 'category' );
			case 'tag':
				return __( 'tag' );
			default:
				return type || __( 'term' );
		}
	}
	return type || __( 'item' );
}

/**
 * Shared Controls component for Navigation Link and Navigation Submenu blocks.
 *
 * This component provides the inspector controls (ToolsPanel) that are identical
 * between both navigation blocks.
 *
 * @param {Object}   props               - Component props
 * @param {Object}   props.attributes    - Block attributes
 * @param {Function} props.setAttributes - Function to update block attributes
 * @param {string}   props.clientId      - Block client ID
 */
export function Controls( { attributes, setAttributes, clientId } ) {
	const { label, url, description, rel, opensInNewTab } = attributes;
	const lastURLRef = useRef( url );
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	const shouldFocusURLInputRef = useRef( false );
	const shouldFocusUnsyncButtonRef = useRef( false );
	const linkContainerRef = useRef();
	const unsyncButtonRef = useRef();
	const inputId = useInstanceId( Controls, 'link-input' );
	const helpTextId = `${ inputId }__help`;

	// Local state to control the input value
	const [ inputValue, setInputValue ] = useState( url );

	// Track focus state to control suggestion visibility
	const [ isInputFocused, setIsInputFocused ] = useState( false );
	const blurTimeoutRef = useRef();

	// Sync local state when url prop changes (e.g., from undo/redo or external updates)
	useEffect( () => {
		setInputValue( url );
		lastURLRef.current = url;
	}, [ url ] );

	// Use the entity binding hook internally
	const {
		hasUrlBinding,
		isBoundEntityAvailable,
		clearBinding,
		createBinding,
	} = useEntityBinding( {
		clientId,
		attributes,
	} );

	// Get direct store dispatch to bypass setBoundAttributes wrapper
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const unsyncBoundLink = () => {
		// Clear the binding first
		clearBinding();

		// Use direct store dispatch to bypass block bindings safeguards
		// which prevent updates to bound attributes when calling setAttributes.
		// setAttributes is actually setBoundAttributes, a wrapper function that
		// processes attributes through the binding system.
		// See: packages/block-editor/src/components/block-edit/edit.js
		updateBlockAttributes( clientId, {
			url: lastURLRef.current, // set the lastURLRef as the new editable value so we avoid bugs from empty link states
			id: undefined,
		} );
	};

	// Focus the input field after unsyncing
	useEffect( () => {
		if ( ! hasUrlBinding && shouldFocusURLInputRef.current ) {
			// Query for the input within the link container since
			// ref is not available on LinkControlSearchInput experimental export
			const input =
				linkContainerRef.current?.querySelector( 'input[type="text"]' );
			input?.focus();
			input?.select();
		}
		shouldFocusURLInputRef.current = false;
	}, [ hasUrlBinding ] );

	// Focus the unsync button after creating a binding
	useEffect( () => {
		if ( hasUrlBinding && shouldFocusUnsyncButtonRef.current ) {
			unsyncButtonRef.current?.focus();
		}
		shouldFocusUnsyncButtonRef.current = false;
	}, [ hasUrlBinding ] );

	// Cleanup blur timeout on unmount
	useEffect( () => {
		return () => {
			if ( blurTimeoutRef.current ) {
				clearTimeout( blurTimeoutRef.current );
			}
		};
	}, [] );

	return (
		<ToolsPanel
			label={ __( 'Settings' ) }
			resetAll={ () => {
				setAttributes( {
					label: '',
					url: '',
					description: '',
					rel: '',
					opensInNewTab: false,
				} );
			} }
			dropdownMenuProps={ dropdownMenuProps }
		>
			<ToolsPanelItem
				hasValue={ () => !! label }
				label={ __( 'Text' ) }
				onDeselect={ () => setAttributes( { label: '' } ) }
				isShownByDefault
			>
				<TextControl
					__nextHasNoMarginBottom
					__next40pxDefaultSize
					label={ __( 'Text' ) }
					value={ label ? stripHTML( label ) : '' }
					onChange={ ( labelValue ) => {
						setAttributes( { label: labelValue } );
					} }
					autoComplete="off"
				/>
			</ToolsPanelItem>

			<ToolsPanelItem
				ref={ linkContainerRef }
				hasValue={ () => !! url }
				label={ __( 'Link' ) }
				onDeselect={ () => setAttributes( { url: '' } ) }
				isShownByDefault
			>
				<div
					onFocus={ () => {
						// Clear any pending blur timeout
						if ( blurTimeoutRef.current ) {
							clearTimeout( blurTimeoutRef.current );
						}
						setIsInputFocused( true );
					} }
					onBlur={ () => {
						// Delay hiding suggestions to allow clicking on them
						blurTimeoutRef.current = setTimeout( () => {
							setIsInputFocused( false );
						}, 150 );
					} }
				>
					<LinkControlSearchInput
						className="navigation-link-control__search-input"
						value={ inputValue ? safeDecodeURI( inputValue ) : '' }
						currentLink={
							// When not focused, set currentLink.url to match the decoded value
							// to trigger disableSuggestions in URLInput
							! isInputFocused
								? {
										url: inputValue
											? safeDecodeURI( inputValue )
											: '',
										title: label && stripHTML( label ),
										kind: attributes.kind,
										type: attributes.type,
										id: attributes.id,
								  }
								: {
										url,
										title: label && stripHTML( label ),
										kind: attributes.kind,
										type: attributes.type,
										id: attributes.id,
								  }
						}
						suggestionsQuery={ getSuggestionsQuery(
							attributes.type,
							attributes.kind
						) }
						onChange={ ( newValue ) => {
							// Update local input state when typing
							setInputValue( newValue );
						} }
						onSelect={ ( suggestion ) => {
							// When a suggestion is selected (or Enter pressed)
							if ( suggestion ) {
								const attrs = {
									url: suggestion.url,
									kind: suggestion.kind,
									type: suggestion.type,
									id: suggestion.id,
									title: suggestion.title,
								};
								updateAttributes(
									attrs,
									setAttributes,
									attributes
								);
								// Create entity binding if we have entity data
								if ( suggestion.id ) {
									createBinding( attrs );
									shouldFocusUnsyncButtonRef.current = true;
								}
							} else if ( inputValue ) {
								// Freeform URL entry
								updateAttributes(
									{ url: inputValue },
									setAttributes,
									attributes
								);
							}
						} }
						allowDirectEntry={ ! hasUrlBinding }
						showSuggestions={ isInputFocused }
						showInitialSuggestions={ isInputFocused }
						isEntity={ hasUrlBinding }
						suffix={
							hasUrlBinding && (
								<Button
									ref={ unsyncButtonRef }
									icon={ unlinkIcon }
									onClick={ () => {
										unsyncBoundLink();
										shouldFocusURLInputRef.current = true;
									} }
									aria-describedby={ helpTextId }
									showTooltip
									label={ __( 'Unsync and edit' ) }
									__next40pxDefaultSize
									className={
										hasUrlBinding &&
										! isBoundEntityAvailable
											? 'navigation-link-control__error-suffix-button'
											: undefined
									}
								/>
							)
						}
					/>
				</div>
				{ hasUrlBinding && ! isBoundEntityAvailable && (
					<p id={ helpTextId }>
						<MissingEntityHelpText
							type={ attributes.type }
							kind={ attributes.kind }
						/>
					</p>
				) }
				{ isBoundEntityAvailable && (
					<p>
						<BindingHelpText
							type={ attributes.type }
							kind={ attributes.kind }
						/>
					</p>
				) }
			</ToolsPanelItem>

			<ToolsPanelItem
				hasValue={ () => !! opensInNewTab }
				label={ __( 'Open in new tab' ) }
				onDeselect={ () => setAttributes( { opensInNewTab: false } ) }
				isShownByDefault
			>
				<CheckboxControl
					__nextHasNoMarginBottom
					label={ __( 'Open in new tab' ) }
					checked={ opensInNewTab }
					onChange={ ( value ) =>
						setAttributes( { opensInNewTab: value } )
					}
				/>
			</ToolsPanelItem>

			<ToolsPanelItem
				hasValue={ () => !! description }
				label={ __( 'Description' ) }
				onDeselect={ () => setAttributes( { description: '' } ) }
				isShownByDefault
			>
				<TextareaControl
					__nextHasNoMarginBottom
					label={ __( 'Description' ) }
					value={ description || '' }
					onChange={ ( descriptionValue ) => {
						setAttributes( { description: descriptionValue } );
					} }
					help={ __(
						'The description will be displayed in the menu if the current theme supports it.'
					) }
				/>
			</ToolsPanelItem>

			<ToolsPanelItem
				hasValue={ () => !! rel }
				label={ __( 'Rel attribute' ) }
				onDeselect={ () => setAttributes( { rel: '' } ) }
				isShownByDefault
			>
				<TextControl
					__nextHasNoMarginBottom
					__next40pxDefaultSize
					label={ __( 'Rel attribute' ) }
					value={ rel || '' }
					onChange={ ( relValue ) => {
						setAttributes( { rel: relValue } );
					} }
					autoComplete="off"
					help={ __(
						'The relationship of the linked URL as space-separated link types.'
					) }
				/>
			</ToolsPanelItem>
		</ToolsPanel>
	);
}

/**
 * Component to display help text for bound URL attributes.
 *
 * @param {Object} props      - Component props
 * @param {string} props.type - The entity type
 * @param {string} props.kind - The entity kind
 * @return {string} Help text for the bound URL
 */
export function BindingHelpText( { type, kind } ) {
	const entityType = getEntityTypeName( type, kind );
	return sprintf(
		/* translators: %s is the entity type (e.g., "page", "post", "category") */
		__( 'Synced with the selected %s.' ),
		entityType
	);
}

/**
 * Component to display error help text for missing entity bindings.
 *
 * @param {Object} props      - Component props
 * @param {string} props.type - The entity type
 * @param {string} props.kind - The entity kind
 * @return {JSX.Element} Error help text component
 */
export function MissingEntityHelpText( { type, kind } ) {
	const entityType = getEntityTypeName( type, kind );
	return sprintf(
		/* translators: %s is the entity type (e.g., "page", "post", "category") */
		__( 'Synced %s is missing. Please update or remove this link.' ),
		entityType
	);
}
