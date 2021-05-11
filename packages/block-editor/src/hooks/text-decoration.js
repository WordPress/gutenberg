/**
 * WordPress dependencies
 */
import { hasBlockSupport } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import TextDecorationControl from '../components/text-decoration-control';
import useSetting from '../components/use-setting';
import { cleanEmptyObject } from './utils';

/**
 * Key within block settings' supports array indicating support for text
 * decorations e.g. settings found in `block.json`.
 */
export const TEXT_DECORATION_SUPPORT_KEY = '__experimentalTextDecoration';

/**
 * Inspector control panel containing the text decoration options.
 *
 * @param  {Object} props Block properties.
 * @return {WPElement}    Text decoration edit element.
 */
export function TextDecorationEdit( props ) {
	const {
		attributes: { style },
		setAttributes,
	} = props;
	const isDisabled = useIsTextDecorationDisabled( props );

	if ( isDisabled ) {
		return null;
	}

	function onChange( newDecoration ) {
		setAttributes( {
			style: cleanEmptyObject( {
				...style,
				typography: {
					...style?.typography,
					textDecoration: newDecoration,
				},
			} ),
		} );
	}

	return (
		<TextDecorationControl
			value={ style?.typography?.textDecoration }
			onChange={ onChange }
		/>
	);
}

/**
 * Checks if text-decoration settings have been disabled.
 *
 * @param  {string} name Name of the block.
 * @return {boolean}     Whether or not the setting is disabled.
 */
export function useIsTextDecorationDisabled( { name: blockName } = {} ) {
	const notSupported = ! hasBlockSupport(
		blockName,
		TEXT_DECORATION_SUPPORT_KEY
	);
	const hasTextDecoration = useSetting( 'typography.customTextDecorations' );

	return notSupported || ! hasTextDecoration;
}
