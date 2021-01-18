/**
 * WordPress dependencies
 */
import { PanelBody, ToggleControl } from '@wordpress/components';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import ServerSideRender from '@wordpress/server-side-render';

export default function PagesEdit( {
	attributes,
	setAttributes,
	hasSubmenuIndicatorSetting = true,
} ) {
	return (
		<div { ...useBlockProps() }>
			<InspectorControls>
				{ hasSubmenuIndicatorSetting && (
					<PanelBody title={ __( 'Display settings' ) }>
						<ToggleControl
							checked={ attributes.showSubmenuIcon }
							onChange={ ( value ) => {
								setAttributes( {
									showSubmenuIcon: value,
								} );
							} }
							label={ __( 'Show submenu indicator icons' ) }
						/>
					</PanelBody>
				) }
			</InspectorControls>
			<ServerSideRender block="core/pages" attributes={ attributes } />
		</div>
	);
}
