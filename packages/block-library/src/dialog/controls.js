/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { lock, unlock } from '@wordpress/icons';
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
	editorIsDialogOpen,
	editorIsDialogLocked,
	toggleLock,
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
				{ editorIsDialogOpen && (
					<ToolbarButton
						icon={ editorIsDialogLocked ? lock : unlock }
						label={
							editorIsDialogLocked
								? __( 'Unlock dialog' )
								: __( 'Lock dialog open' )
						}
						isPressed={ editorIsDialogLocked }
						onClick={ toggleLock }
					/>
				) }
			</ToolbarGroup>
		</BlockControls>
	);
}
