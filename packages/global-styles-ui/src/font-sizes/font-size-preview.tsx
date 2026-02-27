/**
 * WordPress dependencies
 */
// @ts-expect-error: Not typed yet.
import { getComputedFluidTypographyValue } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import type { FontSize } from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import { useStyle } from '../hooks';

interface FontSizePreviewProps {
	fontSize: FontSize;
}

function FontSizePreview( { fontSize }: FontSizePreviewProps ) {
	const [ font ] = useStyle< { fontFamily?: string } >( 'typography' );

	const input =
		typeof fontSize?.fluid === 'object' &&
		fontSize?.fluid?.min &&
		fontSize?.fluid?.max
			? {
					minimumFontSize: fontSize.fluid.min,
					maximumFontSize: fontSize.fluid.max,
			  }
			: {
					fontSize: fontSize.size,
			  };

	const computedFontSize = getComputedFluidTypographyValue( input );
	return (
		<div
			className="global-styles-ui-typography-preview"
			style={ {
				fontSize: computedFontSize,
				fontFamily: font?.fontFamily ?? 'serif',
			} }
		>
			{ __( 'Aa' ) }
		</div>
	);
}

export default FontSizePreview;
