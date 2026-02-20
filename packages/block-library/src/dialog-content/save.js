/**
 * WordPress dependencies
 */
import { useBlockProps, InnerBlocks } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	// Build CSS custom properties for backdrop color
	const customColorStyles = {};

	if ( attributes.customBackdropColor ) {
		customColorStyles[ '--wp--style--dialog-backdrop-color' ] =
			attributes.customBackdropColor;
	}

	const blockProps = useBlockProps.save( {
		style: customColorStyles,
	} );

	return (
		<dialog { ...blockProps }>
			<div className="wp-block-dialog-content__inner">
				<InnerBlocks.Content />
			</div>
		</dialog>
	);
}
