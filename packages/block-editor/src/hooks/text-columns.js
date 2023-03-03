/**
 * WordPress dependencies
 */
import { hasBlockSupport } from '@wordpress/blocks';
import { __experimentalNumberControl as NumberControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useSetting from '../components/use-setting';
import { cleanEmptyObject } from './utils';

/**
 * Key within block settings' supports array indicating support for text
 * columns e.g. settings found in `block.json`.
 */
export const TEXT_COLUMNS_SUPPORT_KEY = 'typography.textColumns';

const MIN_COLUMNS = 1;
const MAX_COLUMNS = 6;

/**
 * Inspector control containing the text columns option.
 *
 * @param {Object} props Block properties.
 *
 * @return {WPElement} Text columns edit element.
 */
export function TextColumnsEdit( props ) {
	const {
		attributes: { style },
		setAttributes,
	} = props;

	function onChange( newColumns ) {
		setAttributes( {
			style: cleanEmptyObject( {
				...style,
				typography: {
					...style?.typography,
					textColumns: newColumns,
				},
			} ),
		} );
	}

	return (
		<NumberControl
			label={ __( 'Text columns' ) }
			max={ MAX_COLUMNS }
			min={ MIN_COLUMNS }
			onChange={ onChange }
			size="__unstable-large"
			spinControls="custom"
			value={ style?.typography?.textColumns }
			initialPosition={ 1 }
		/>
	);
}

/**
 * Checks if text columns setting has been disabled.
 *
 * @param {string} name Name of the block.
 *
 * @return {boolean} Whether or not the setting is disabled.
 */
export function useIsTextColumnsDisabled( { name: blockName } = {} ) {
	const notSupported = ! hasBlockSupport(
		blockName,
		TEXT_COLUMNS_SUPPORT_KEY
	);
	const hasTextColumns = useSetting( 'typography.textColumns' );
	return notSupported || ! hasTextColumns;
}

/**
 * Checks if there is a current value set for the text columns block support.
 *
 * @param {Object} props Block props.
 * @return {boolean}     Whether or not the block has a text columns set.
 */
export function hasTextColumnsValue( props ) {
	return !! props.attributes.style?.typography?.textColumns;
}

/**
 * Resets the text columns block support attribute. This can be used when
 * disabling the text columns support controls for a block via a progressive
 * discovery panel.
 *
 * @param {Object} props               Block props.
 * @param {Object} props.attributes    Block's attributes.
 * @param {Object} props.setAttributes Function to set block's attributes.
 */
export function resetTextColumns( { attributes = {}, setAttributes } ) {
	const { style } = attributes;

	setAttributes( {
		style: cleanEmptyObject( {
			...style,
			typography: {
				...style?.typography,
				textColumns: undefined,
			},
		} ),
	} );
}
