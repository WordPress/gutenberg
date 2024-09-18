/**
 * WordPress dependencies
 */
import {
	getComputedFluidTypographyValue,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { unlock } from '../../../lock-unlock';
const { useGlobalStyle } = unlock( blockEditorPrivateApis );

function FontSizePreview( { fontSize } ) {
	const [ font ] = useGlobalStyle( 'typography' );

	const input =
		fontSize?.fluid?.min && fontSize?.fluid?.max
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
			className="edit-site-typography-preview"
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
