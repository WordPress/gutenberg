/**
 * Internal dependencies
 */
import EmbedBottomSheet from './embed-bottom-sheet';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody, ToggleControl } from '@wordpress/components';
import { InspectorControls } from '@wordpress/block-editor';

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
	themeSupportsResponsive,
	allowResponsive,
	toggleResponsive,
	bottomSheetLabel,
	url,
	onEmbedBottomSheetSubmit,
	onEmbedBottomSheetClose,
	showEmbedBottomSheet,
} ) => (
	<>
		<InspectorControls>
			{ themeSupportsResponsive && blockSupportsResponsive && (
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
			) }
			<PanelBody title={ __( 'Link settings' ) }>
				<EmbedBottomSheet
					value={ url }
					label={ bottomSheetLabel }
					isVisible={ showEmbedBottomSheet }
					onClose={ onEmbedBottomSheetClose }
					onSubmit={ onEmbedBottomSheetSubmit }
					withBottomSheet={ false }
				/>
			</PanelBody>
		</InspectorControls>
	</>
);

export default EmbedControls;
