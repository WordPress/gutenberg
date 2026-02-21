/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { BlockControls, InspectorControls } from '@wordpress/block-editor';
import {
	PanelBody,
	TextControl,
	ToolbarButton,
	ToolbarGroup,
} from '@wordpress/components';

export function InspectorPanel( { dialogLabel, setAttributes } ) {
	return (
		<InspectorControls>
			<PanelBody title={ __( 'Settings' ) }>
				<TextControl
					__nextHasNoMarginBottom
					__next40pxDefaultSize
					label={ __( 'Accessible label' ) }
					help={ __(
						'Describes the dialog for screen readers. Used as the accessible name when no heading is present.'
					) }
					value={ dialogLabel }
					onChange={ ( value ) =>
						setAttributes( { dialogLabel: value } )
					}
				/>
			</PanelBody>
		</InspectorControls>
	);
}

export function Toolbar( {
	buttonLabel,
	dialogElementClientId,
	toggleDialog,
} ) {
	return (
		<BlockControls __experimentalShareWithChildBlocks>
			<ToolbarGroup>
				<ToolbarButton
					label={ buttonLabel }
					onClick={ () => {
						if ( ! dialogElementClientId ) {
							return;
						}
						toggleDialog();
					} }
				>
					{ buttonLabel }
				</ToolbarButton>
			</ToolbarGroup>
		</BlockControls>
	);
}
