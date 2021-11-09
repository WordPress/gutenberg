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
export const TEXT_DECORATION_SUPPORT_KEY =
	'typography.__experimentalTextDecoration';

/**
 * Inspector control panel containing the text decoration options.
 *
 * @param {Object} props Block properties.
 *
 * @return {WPElement} Text decoration edit element.
 */
export function TextDecorationEdit( props ) {
	const {
		attributes: { style },
		setAttributes,
	} = props;

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
 * @param {string} name Name of the block.
 *
 * @return {boolean} Whether or not the setting is disabled.
 */
export function useIsTextDecorationDisabled( { name: blockName } = {} ) {
	const notSupported = ! hasBlockSupport(
		blockName,
		TEXT_DECORATION_SUPPORT_KEY
	);
	const hasTextDecoration = useSetting( 'typography.textDecoration' );

	return notSupported || ! hasTextDecoration;
}

/**
 * Checks if there is a current value set for the text decoration block support.
 *
 * @param {Object} props Block props.
 * @return {boolean}     Whether or not the block has a text decoration set.
 */
export function hasTextDecorationValue( props ) {
	return !! props.attributes.style?.typography?.textDecoration;
}

/**
 * Resets the text decoration block support attribute. This can be used when
 * disabling the text decoration support controls for a block via a progressive
 * discovery panel.
 *
 * @param {Object} props               Block props.
 * @param {Object} props.attributes    Block's attributes.
 * @param {Object} props.setAttributes Function to set block's attributes.
 */
export function resetTextDecoration( { attributes = {}, setAttributes } ) {
	const { style } = attributes;

	setAttributes( {
		style: cleanEmptyObject( {
			...style,
			typography: {
				...style?.typography,
				textDecoration: undefined,
			},
		} ),
	} );
}
