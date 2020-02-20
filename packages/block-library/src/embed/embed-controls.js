/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Button,
	PanelBody,
	ToggleControl,
	ToolbarGroup,
} from '@wordpress/components';
import { BlockControls, InspectorControls } from '@wordpress/block-editor';
import { pencil } from '@wordpress/icons';

const EmbedControls = ( props ) => {
	const {
		blockSupportsResponsive,
		showEditButton,
		themeSupportsResponsive,
		allowResponsive,
		getResponsiveHelp,
		toggleResponsive,
		switchBackToURLInput,
	} = props;
	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					{ showEditButton && (
						<Button
							className="components-toolbar__control"
							label={ __( 'Edit URL' ) }
							icon={ pencil }
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
};

export default EmbedControls;
