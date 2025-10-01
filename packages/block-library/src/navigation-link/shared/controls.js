/**
 * WordPress dependencies
 */
import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	CheckboxControl,
	TextControl,
	TextareaControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useRef } from '@wordpress/element';
import { safeDecodeURI } from '@wordpress/url';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../../utils/hooks';
import { updateAttributes } from '../update-attributes';

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
 */
export function Controls( {
	attributes,
	setAttributes,
	setIsEditingControl = () => {},
} ) {
	const { label, url, description, rel, opensInNewTab } = attributes;
	const lastURLRef = useRef( url );
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

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
				<TextControl
					__nextHasNoMarginBottom
					__next40pxDefaultSize
					label={ __( 'Link' ) }
					value={ url ? safeDecodeURI( url ) : '' }
					onChange={ ( urlValue ) => {
						setAttributes( {
							url: encodeURI( safeDecodeURI( urlValue ) ),
						} );
					} }
					autoComplete="off"
					type="url"
					onFocus={ () => {
						lastURLRef.current = url;
						setIsEditingControl( true );
					} }
					onBlur={ () => {
						// Defer the updateAttributes call to ensure entity connection isn't severed by accident.
						updateAttributes(
							{ url: ! url ? lastURLRef.current : url },
							setAttributes,
							{ ...attributes, url: lastURLRef.current }
						);
						setIsEditingControl( false );
					} }
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
