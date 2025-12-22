/**
 * WordPress dependencies
 */
import {
	InspectorControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { PanelBody, TextControl, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import AddTabToolbarControl from './add-tab-toolbar-control';
import slugFromLabel from './slug-from-label';

export default function Controls( {
	attributes,
	setAttributes,
	tabsClientId,
	blockIndex,
	isDefaultTab,
} ) {
	const { label } = attributes;

	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	return (
		<>
			<AddTabToolbarControl
				tabsClientId={ tabsClientId }
				attributes={ attributes }
			/>
			<InspectorControls>
				<PanelBody title={ __( 'Tab Settings' ) }>
					<TextControl
						label={ __( 'Tab Label' ) }
						value={ decodeEntities( label ) }
						onChange={ ( value ) => {
							setAttributes( {
								label: value,
								anchor: slugFromLabel( value, blockIndex ),
							} );
						} }
						__next40pxDefaultSize
					/>
					<ToggleControl
						label={ __( 'Default Tab' ) }
						checked={ isDefaultTab }
						onChange={ ( value ) => {
							updateBlockAttributes( tabsClientId, {
								activeTabIndex: value ? blockIndex : 0,
							} );
						} }
						help={ __(
							'If toggled, this tab will be selected when the page loads.'
						) }
					/>
				</PanelBody>
			</InspectorControls>
		</>
	);
}
