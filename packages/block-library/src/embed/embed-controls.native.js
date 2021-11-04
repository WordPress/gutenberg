/**
 * Internal dependencies
 */
import EmbedLinkSettings from './embed-link-settings';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody, ToggleControl } from '@wordpress/components';
import { InspectorControls } from '@wordpress/block-editor';
import { useDispatch } from '@wordpress/data';
import { store as editPostStore } from '@wordpress/edit-post';

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
	url,
	linkLabel,
	onEditURL,
} ) => {
	const { closeGeneralSidebar: closeSettingsBottomSheet } = useDispatch(
		editPostStore
	);

	return (
		<>
			<InspectorControls>
				{ themeSupportsResponsive && blockSupportsResponsive && (
					<PanelBody title={ __( 'Media settings' ) }>
						<ToggleControl
							label={ __( 'Resize for smaller devices' ) }
							checked={ allowResponsive }
							help={ getResponsiveHelp }
							onChange={ toggleResponsive }
						/>
					</PanelBody>
				) }
				<PanelBody title={ __( 'Link settings' ) }>
					<EmbedLinkSettings
						value={ url }
						label={ linkLabel }
						onSubmit={ ( value ) => {
							closeSettingsBottomSheet();
							onEditURL( value );
						} }
					/>
				</PanelBody>
			</InspectorControls>
		</>
	);
};

export default EmbedControls;
