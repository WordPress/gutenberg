/**
 * WordPress dependencies
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function Edit( { attributes, setAttributes } ) {
	const { openInNewTab } = attributes;

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Link settings' ) }>
					<ToggleControl
						label={ __( 'Open in a new tab' ) }
						checked={ openInNewTab }
						onChange={ () =>
							setAttributes( {
								openInNewTab: ! openInNewTab,
							} )
						}
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...useBlockProps() }>
				<a href="#edit-comment-pseudo-link">{ __( 'Edit' ) }</a>
			</div>
		</>
	);
}
