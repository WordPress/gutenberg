/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton, Toolbar, PanelBody, ToggleControl } from '@wordpress/components';
import { BlockControls, InspectorControls } from '@wordpress/block-editor';

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
				<Toolbar>
					{ showEditButton && (
						<IconButton
							className="components-toolbar__control"
							label={ __( 'Edit URL' ) }
							icon="edit"
							onClick={ switchBackToURLInput }
						/>
					) }
				</Toolbar>
			</BlockControls>
			{ themeSupportsResponsive && blockSupportsResponsive && (
				<InspectorControls>
					<PanelBody title={ __( 'Media Settings' ) } className="blocks-responsive">
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
