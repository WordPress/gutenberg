/**
 * WordPress dependencies
 */
import { getBlockSupport } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useSetting from '../components/use-setting';
import HeightControl from '../components/height-control';
import { DIMENSIONS_SUPPORT_KEY } from './dimensions';
import { cleanEmptyObject } from './utils';

/**
 * Determines if there is minHeight support.
 *
 * @param {string|Object} blockType Block name or Block Type object.
 * @return {boolean} Whether there is support.
 */
export function hasMinHeightSupport( blockType ) {
	const support = getBlockSupport( blockType, DIMENSIONS_SUPPORT_KEY );
	return !! ( true === support || support?.minHeight );
}

/**
 * Checks if there is a current value in the minHeight block support attributes.
 *
 * @param {Object} props Block props.
 * @return {boolean} Whether or not the block has a minHeight value set.
 */
export function hasMinHeightValue( props ) {
	return props.attributes.style?.dimensions?.minHeight !== undefined;
}

/**
 * Resets the minHeight block support attributes. This can be used when disabling
 * the padding support controls for a block via a `ToolsPanel`.
 *
 * @param {Object} props               Block props.
 * @param {Object} props.attributes    Block's attributes.
 * @param {Object} props.setAttributes Function to set block's attributes.
 */
export function resetMinHeight( { attributes = {}, setAttributes } ) {
	const { style } = attributes;

	setAttributes( {
		style: cleanEmptyObject( {
			...style,
			dimensions: {
				...style?.dimensions,
				minHeight: undefined,
			},
		} ),
	} );
}

/**
 * Custom hook that checks if minHeight controls have been disabled.
 *
 * @param {string} name The name of the block.
 * @return {boolean} Whether minHeight control is disabled.
 */
export function useIsMinHeightDisabled( { name: blockName } = {} ) {
	const isDisabled = ! useSetting( 'dimensions.minHeight' );
	return ! hasMinHeightSupport( blockName ) || isDisabled;
}

/**
 * Inspector control panel containing the minHeight related configuration.
 *
 * @param {Object} props Block props.
 * @return {WPElement} Edit component for height.
 */
export function MinHeightEdit( props ) {
	const {
		attributes: { style },
		setAttributes,
	} = props;

	if ( useIsMinHeightDisabled( props ) ) {
		return null;
	}

	const onChange = ( next ) => {
		const newStyle = {
			...style,
			dimensions: {
				...style?.dimensions,
				minHeight: next,
			},
		};

		setAttributes( { style: cleanEmptyObject( newStyle ) } );
	};

	return (
		<HeightControl
			label={ __( 'Min. height' ) }
			value={ style?.dimensions?.minHeight }
			onChange={ onChange }
		/>
	);
}
