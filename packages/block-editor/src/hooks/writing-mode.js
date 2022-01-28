/**
 * WordPress dependencies
 */
import { hasBlockSupport } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import WritingModeControl from '../components/writing-mode-control';
import useSetting from '../components/use-setting';
import { cleanEmptyObject } from './utils';

/**
 * Key within block settings' supports array indicating support for writing mode
 * e.g. settings found in `block.json`.
 */
export const WRITING_MODE_SUPPORT_KEY = 'typography.__experimentalWritingMode';

/**
 * Inspector control panel containing the writing mode options.
 *
 * @param {Object} props Block properties.
 *
 * @return {WPElement} Writing mode edit element.
 */
export function WritingModeEdit( props ) {
	const {
		attributes: { style },
		setAttributes,
	} = props;

	function onChange( newWritingMode ) {
		setAttributes( {
			style: cleanEmptyObject( {
				...style,
				typography: {
					...style?.typography,
					writingMode: newWritingMode,
				},
			} ),
		} );
	}

	return (
		<WritingModeControl
			value={ style?.typography?.writingMode }
			onChange={ onChange }
		/>
	);
}

/**
 * Checks if writing mode settings have been disabled.
 *
 * @param {string} name Name of the block.
 *
 * @return {boolean} Whether or not the setting is disabled.
 */
export function useIsWritingModeDisabled( { name: blockName } = {} ) {
	const notSupported = ! hasBlockSupport(
		blockName,
		WRITING_MODE_SUPPORT_KEY
	);
	const hasWritingMode = useSetting( 'typography.writingMode' );

	return notSupported || ! hasWritingMode;
}

/**
 * Checks if there is a current value set for the writing modeblock support.
 *
 * @param {Object} props Block props.
 * @return {boolean}     Whether or not the block has a writing mode set.
 */
export function hasWritingModeValue( props ) {
	return !! props.attributes.style?.typography?.writingMode;
}

/**
 * Resets the writing mode block support attribute. This can be used when
 * disabling the writing mode support controls for a block via a progressive
 * discovery panel.
 *
 * @param {Object} props               Block props.
 * @param {Object} props.attributes    Block's attributes.
 * @param {Object} props.setAttributes Function to set block's attributes.
 */
export function resetWritingMode( { attributes = {}, setAttributes } ) {
	const { style } = attributes;

	setAttributes( {
		style: cleanEmptyObject( {
			...style,
			typography: {
				...style?.typography,
				writingMode: undefined,
			},
		} ),
	} );
}
