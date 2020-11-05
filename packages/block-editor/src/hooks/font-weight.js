/**
 * WordPress dependencies
 */
import { hasBlockSupport } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { cleanEmptyObject } from './utils';
import FontWeightControl from '../components/font-weight';
import useEditorFeature from '../components/use-editor-feature';

export const FONT_WEIGHT_SUPPORT_KEY = '__experimentalFontWeight';

export function FontWeightEdit( {
	name,
	setAttributes,
	attributes: { style = {} },
} ) {
	const isDisable = useIsFontWeightDisabled( { name } );

	if ( isDisable ) {
		return null;
	}

	const fontWeight = style.typography?.fontWeight || '';

	function onChange( newValue ) {
		setAttributes( {
			style: cleanEmptyObject( {
				...style,
				typography: {
					...( style.typography || {} ),
					fontWeight: newValue || undefined,
				},
			} ),
		} );
	}

	return (
		<FontWeightControl
			className="block-editor-hooks-font-weight-control"
			value={ fontWeight }
			onChange={ onChange }
		/>
	);
}

/**
 * Custom hook that checks if font-family functionality is disabled.
 *
 * @param {string} name The name of the block.
 * @return {boolean} Whether setting is disabled.
 */
export function useIsFontWeightDisabled( { name } ) {
	return (
		! useEditorFeature( 'typography.fontWeight' ) ||
		! hasBlockSupport( name, FONT_WEIGHT_SUPPORT_KEY )
	);
}
