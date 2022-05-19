/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { InspectorControls, HtmlElementControl } from '@wordpress/block-editor';

export default function CommentsInspectorControls( {
	attributes: { TagName },
	setAttributes,
} ) {
	return (
		<InspectorControls>
			<InspectorControls __experimentalGroup="advanced">
				<HtmlElementControl
					options={ [
						{ label: __( 'Default (<div>)' ), value: 'div' },
						{ label: '<section>', value: 'section' },
						{ label: '<aside>', value: 'aside' },
					] }
					value={ TagName }
					onChange={ ( value ) =>
						setAttributes( { tagName: value } )
					}
				/>
			</InspectorControls>
		</InspectorControls>
	);
}
