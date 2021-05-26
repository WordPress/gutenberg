/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { InspectorControls, BlockControls } from '@wordpress/block-editor';
import {
	PanelBody,
	RangeControl,
	ToolbarGroup,
	ToolbarButton,
	BottomSheetSelectControl,
} from '@wordpress/components';
import { link } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import ColorEdit from './color-edit';

const MIN_BORDER_RADIUS_VALUE = 0;
const MAX_BORDER_RADIUS_VALUE = 50;

function WidthPanel( { selectedWidth, setAttributes } ) {
	function handleChange( newWidth ) {
		// Check if we are toggling the width off
		let width = selectedWidth === newWidth ? undefined : newWidth;
		if ( newWidth === 'auto' ) {
			width = undefined;
		}
		// Update attributes
		setAttributes( { width } );
	}

	const options = [
		{ value: 'auto', label: __( 'Auto' ) },
		{ value: 25, label: '25%' },
		{ value: 50, label: '50%' },
		{ value: 75, label: '75%' },
		{ value: 100, label: '100%' },
	];

	if ( ! selectedWidth ) {
		selectedWidth = 'auto';
	}

	return (
		<PanelBody title={ __( 'Width Settings' ) }>
			<BottomSheetSelectControl
				label={ __( 'Button width' ) }
				value={ selectedWidth }
				onChange={ handleChange }
				options={ options }
			/>
		</PanelBody>
	);
}

export default function Controls ( {
	attributes,
	setAttributes,
	clientId,
	borderRadiusValue,
	getLinkSettings,
	onShowLinkSettings,
	onChangeBorderRadius,
} ) {
	const { url, width } = attributes;

	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton
						title={ __( 'Edit link' ) }
						icon={ link }
						onClick={ onShowLinkSettings }
						isActive={ url }
					/>
				</ToolbarGroup>
			</BlockControls>
			{ getLinkSettings( false ) }
			<ColorEdit
				attributes={ attributes }
				setAttributes={ setAttributes }
				clientId={ clientId }
			/>
			<InspectorControls>
				<PanelBody title={ __( 'Border Settings' ) }>
					<RangeControl
						label={ __( 'Border Radius' ) }
						minimumValue={ MIN_BORDER_RADIUS_VALUE }
						maximumValue={ MAX_BORDER_RADIUS_VALUE }
						value={ borderRadiusValue }
						onChange={ onChangeBorderRadius }
					/>
				</PanelBody>
				<WidthPanel
					selectedWidth={ width }
					setAttributes={ setAttributes }
				/>
				<PanelBody title={ __( 'Link Settings' ) }>
					{ getLinkSettings( true ) }
				</PanelBody>
			</InspectorControls>
		</>
	);
}
