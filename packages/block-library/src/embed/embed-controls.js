/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	ToolbarButton,
	PanelBody,
	ToggleControl,
	ToolbarGroup,
	__experimentalBoxControl as BoxControl,
} from '@wordpress/components';
import { BlockControls, InspectorControls } from '@wordpress/block-editor';
import { edit } from '@wordpress/icons';

function getResponsiveHelp( checked ) {
	return checked
		? __(
				'This embed will preserve its aspect ratio when the browser is resized.'
		  )
		: __(
				'This embed may not preserve its aspect ratio when the browser is resized.'
		  );
}

const EmbedControls = ( {
	blockSupportsResponsive,
	showEditButton,
	themeSupportsResponsive,
	allowResponsive,
	toggleResponsive,
	switchBackToURLInput,
	addMargin,
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
					title={ __( 'Spacing settings' ) }
					className="blocks-responsive"
				>
					<BoxControl
						label={ __( 'Margin' ) }
						onChange={ addMargin }
					/>
				</PanelBody>
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
