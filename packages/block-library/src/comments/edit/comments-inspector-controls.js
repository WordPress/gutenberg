/**
 * WordPress dependencies
 */
import { SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { InspectorControls } from '@wordpress/block-editor';

export default function CommentsInspectorControls( {
	attributes: { tagName },
	setAttributes,
} ) {
	const htmlElementMessages = {
		section: __(
			"The <section> element should represent a standalone portion of the document that can't be better represented by another element."
		),
		aside: __(
			"The <aside> element should represent a portion of a document whose content is only indirectly related to the document's main content."
		),
	};
	return (
		<InspectorControls>
			<InspectorControls group="advanced">
				<SelectControl
					__nextHasNoMarginBottom
					__next40pxDefaultSize
					label={ __( 'HTML element' ) }
					options={ [
						{ label: __( 'Default (<div>)' ), value: 'div' },
						{ label: '<section>', value: 'section' },
						{ label: '<aside>', value: 'aside' },
					] }
					value={ tagName }
					onChange={ ( value ) =>
						setAttributes( { tagName: value } )
					}
					help={ htmlElementMessages[ tagName ] }
				/>
			</InspectorControls>
		</InspectorControls>
	);
}
