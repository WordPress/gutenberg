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
import { safeDecodeURI } from '@wordpress/url';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
import { linkOff as unlinkIcon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../../utils/hooks';
import { updateAttributes } from './update-attributes';

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
 * @param {Object}   props                     - Component props
 * @param {Object}   props.attributes          - Block attributes
 * @param {Function} props.setAttributes       - Function to update block attributes
 * @param {Function} props.setIsEditingControl - Function to set editing state (optional)
 * @param {Function} props.updateBlockBindings - Function to update block bindings
 * @param {boolean}  props.hasUrlBinding       - Whether the URL is bound to an entity
 */
export function Controls( {
	attributes,
	setAttributes,
	setIsEditingControl = () => {},
	updateBlockBindings,
	hasUrlBinding,
} ) {
	const { label, url, description, rel, opensInNewTab } = attributes;
	const lastURLRef = useRef( url );
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	const editBoundLink = () => {
		// Remove the binding
		updateBlockBindings( { url: undefined } );

		// Clear url and id to allow picking a new entity (keep type and kind)
		setAttributes( { url: undefined, id: undefined } );
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
					onFocus={ () => setIsEditingControl( true ) }
					onBlur={ () => setIsEditingControl( false ) }
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
						setIsEditingControl( true );
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
						setIsEditingControl( false );
					} }
					help={
						hasUrlBinding &&
						( () => {
							const entityType = getEntityTypeName(
								attributes.type,
								attributes.kind
							);
							return sprintf(
								/* translators: %s is the entity type (e.g., "page", "post", "category") */
								__(
									'Link stays in sync with the selected %s.'
								),
								entityType
							);
						} )()
					}
					suffix={
						hasUrlBinding && (
							<Button
								icon={ unlinkIcon }
								onClick={ editBoundLink }
								aria-label={ __( 'Unlink and edit' ) }
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
