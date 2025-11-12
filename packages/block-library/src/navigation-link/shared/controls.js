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
import { useRef } from '@wordpress/element';
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
	const inputId = useInstanceId( Controls, 'link-input' );
	const helpTextId = `${ inputId }__help`;

	// Use the entity binding hook internally
	const { hasUrlBinding, clearBinding } = useEntityBinding( {
		clientId,
		attributes,
	} );

	// Get direct store dispatch to bypass setBoundAttributes wrapper
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const editBoundLink = () => {
		// Clear the binding first
		clearBinding();

		// Use direct store dispatch to bypass block bindings safeguards
		// which prevent updates to bound attributes when calling setAttributes.
		// setAttributes is actually setBoundAttributes, a wrapper function that
		// processes attributes through the binding system.
		// See: packages/block-editor/src/components/block-edit/edit.js
		updateBlockAttributes( clientId, { url: '', id: undefined } );
	};

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
					__nextHasNoMarginBottom
					__next40pxDefaultSize
					id={ inputId }
					label={ __( 'Link' ) }
					value={ url ? safeDecodeURI( url ) : '' }
					onChange={ ( urlValue ) => {
						if ( hasUrlBinding ) {
							return; // Prevent editing when URL is bound
						}
						setAttributes( {
							url: encodeURI( safeDecodeURI( urlValue ) ),
						} );
					} }
					autoComplete="off"
					type="url"
					disabled={ hasUrlBinding }
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
						// Defer the updateAttributes call to ensure entity connection isn't severed by accident.
						updateAttributes(
							{ url: ! url ? lastURLRef.current : url },
							setAttributes,
							{ ...attributes, url: lastURLRef.current }
						);
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
								onClick={ editBoundLink }
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
