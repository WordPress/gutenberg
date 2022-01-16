/**
 * WordPress dependencies
 */
import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export function BlockInspector( props ) {
	const { attributes, setAttributes } = props;
	const { makeEntirePostClickable } = attributes;

	const setMakeEntirePostClickable = ( newValue ) =>
		setAttributes( { makeEntirePostClickable: newValue } );

	return (
		<InspectorControls>
			<PanelBody title={ __( '' ) }>
				<ToggleControl
					checked={ makeEntirePostClickable }
					onChange={ setMakeEntirePostClickable }
					label={ __( 'Make entire post clickable' ) }
					help={ __(
						'When enabled the entire post will be clickable and direct the user to the post page.'
					) }
				/>
			</PanelBody>
		</InspectorControls>
	);
}
