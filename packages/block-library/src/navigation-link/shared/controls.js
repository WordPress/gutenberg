/**
 * WordPress dependencies
 */
import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalInputControl as InputControl,
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
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../../utils/hooks';
import { updateAttributes } from './update-attributes';
import { useEntityBinding } from './use-entity-binding';

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
	const urlInputRef = useRef();
	const shouldFocusURLInputRef = useRef( false );
	const inputId = useInstanceId( Controls, 'link-input' );
	const helpTextId = `${ inputId }__help`;

	// Local state to control the input value
	const [ inputValue, setInputValue ] = useState( url );

	// Sync local state when url prop changes (e.g., from undo/redo or external updates)
	useEffect( () => {
		setInputValue( url );
		lastURLRef.current = url;
	}, [ url ] );

	// Use the entity binding hook internally
	const { hasUrlBinding, clearBinding } = useEntityBinding( {
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

	useEffect( () => {
		// Checking for ! hasUrlBinding is a defensive check, as we would
		// only want to focus the input if the url is not bound to an entity.
		if ( ! hasUrlBinding && shouldFocusURLInputRef.current ) {
			// focuses and highlights the url input value, giving the user
			// the ability to delete the value quickly or edit it.
			urlInputRef.current?.select();
		}
		shouldFocusURLInputRef.current = false;
	}, [ hasUrlBinding ] );

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
				hasValue={ () => !! url }
				label={ __( 'Link' ) }
				onDeselect={ () => setAttributes( { url: '' } ) }
				isShownByDefault
			>
				<InputControl
					ref={ urlInputRef }
					__nextHasNoMarginBottom
					__next40pxDefaultSize
					id={ inputId }
					label={ __( 'Link' ) }
					value={ inputValue ? safeDecodeURI( inputValue ) : '' }
					autoComplete="off"
					type="url"
					disabled={ hasUrlBinding }
					onChange={ ( newValue ) => {
						if ( hasUrlBinding ) {
							return;
						}

						// Defer updating the url attribute until onBlur to prevent the canvas from
						// treating a temporary empty value as a committed value, which replaces the
						// label with placeholder text.
						setInputValue( newValue );
					} }
					onFocus={ () => {
						if ( hasUrlBinding ) {
							return;
						}
						lastURLRef.current = url;
					} }
					onBlur={ () => {
						if ( hasUrlBinding ) {
							return;
						}

						const finalValue = ! inputValue
							? lastURLRef.current
							: inputValue;

						// Update local state immediately so input reflects the reverted value if the value was cleared
						setInputValue( finalValue );

						// Defer the updateAttributes call to ensure entity connection isn't severed by accident.
						updateAttributes( { url: finalValue }, setAttributes, {
							...attributes,
							url: lastURLRef.current,
						} );
					} }
					help={
						hasUrlBinding && (
							<BindingHelpText
								type={ attributes.type }
								kind={ attributes.kind }
							/>
						)
					}
					suffix={
						hasUrlBinding && (
							<Button
								icon={ unlinkIcon }
								onClick={ () => {
									unsyncBoundLink();
									// Focus management to send focus to the URL input
									// on next render after disabled state is removed.
									shouldFocusURLInputRef.current = true;
								} }
								aria-describedby={ helpTextId }
								showTooltip
								label={ __( 'Unsync and edit' ) }
								__next40pxDefaultSize
							/>
						)
					}
				/>
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
function BindingHelpText( { type, kind } ) {
	const entityType = getEntityTypeName( type, kind );
	return sprintf(
		/* translators: %s is the entity type (e.g., "page", "post", "category") */
		__( 'Synced with the selected %s.' ),
		entityType
	);
}
