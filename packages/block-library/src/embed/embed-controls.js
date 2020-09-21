/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	ToolbarButton,
	PanelBody,
	ToggleControl,
	ToolbarGroup,
} from '@wordpress/components';
import { BlockControls, InspectorControls } from '@wordpress/block-editor';
import { edit } from '@wordpress/icons';

const EmbedControls = ( {
	blockSupportsResponsive,
	showEditButton,
	themeSupportsResponsive,
	allowResponsive,
	getResponsiveHelp,
	toggleResponsive,
	switchBackToURLInput,
} ) => (
	<>
		<BlockControls>
			<ToolbarGroup>
				{ showEditButton && (
					<ToolbarButton
						className="components-toolbar__control"
						label={ __( 'Edit URL' ) }
						icon={ edit }
						onClick={ switchBackToURLInput }
					/>
				) }
			</ToolbarGroup>
		</BlockControls>
		{ themeSupportsResponsive && blockSupportsResponsive && (
			<InspectorControls>
				<PanelBody
					title={ __( 'Media settings' ) }
					className="blocks-responsive"
				>
					<ToggleControl
						label={ __( 'Resize for smaller devices' ) }
						checked={ allowResponsive }
						help={ getResponsiveHelp }
						onChange={ toggleResponsive }
					/>
				</PanelBody>
			</InspectorControls>
		) }
	</>
);

export default EmbedControls;
