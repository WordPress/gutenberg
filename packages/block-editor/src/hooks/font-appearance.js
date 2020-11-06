/**
 * WordPress dependencies
 */
import { hasBlockSupport } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import FontAppearanceControl from '../components/font-appearance-control';
import useEditorFeature from '../components/use-editor-feature';
import { cleanEmptyObject } from './utils';

/**
 * Key within block settings' support array indicating support for font
 * appearance options e.g. font weight and style.
 */
export const FONT_APPEARANCE_SUPPORT_KEY = '__experimentalFontAppearance';

/**
 * Inspector control panel containing the font appearance options.
 *
 * @param  {Object} props Block properties.
 * @return {WPElement}    Font appearance edit element.
 */
export function FontAppearanceEdit( props ) {
	const {
		attributes: { style },
		setAttributes,
	} = props;

	const fontStyles = useEditorFeature( 'typography.fontStyles' );
	const fontWeights = useEditorFeature( 'typography.fontWeights' );
	const isDisabled = useIsFontAppearanceDisabled( props );

	if ( isDisabled ) {
		return null;
	}

	const onChange = ( newStyles ) => {
		setAttributes( {
			style: cleanEmptyObject( {
				...style,
				typography: {
					...style?.typography,
					...newStyles,
				},
			} ),
		} );
	};

	const currentSelection = {
		fontStyle: style?.typography?.fontStyle,
		fontWeight: style?.typography?.fontWeight,
	};

	return (
		<FontAppearanceControl
			value={ currentSelection }
			options={ { fontStyles, fontWeights } }
			onChange={ onChange }
		/>
	);
}

/**
 * Checks if font appearance support has been disabled.
 *
 * @param  {Object} props      Block properties.
 * @param  {string} props.name Name for the block type.
 * @return {boolean}           Whether font appearance support has been disabled.
 */
export function useIsFontAppearanceDisabled( { name: blockName } = {} ) {
	const notSupported = ! hasBlockSupport(
		blockName,
		FONT_APPEARANCE_SUPPORT_KEY
	);
	const fontStyles = useEditorFeature( 'typography.fontStyles' );
	const fontWeights = useEditorFeature( 'typography.fontWeights' );
	const hasFontAppearance = !! fontStyles?.length && !! fontWeights?.length;

	return notSupported || ! hasFontAppearance;
}
