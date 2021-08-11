/**
 * WordPress dependencies
 */
import { getBlockSupport } from '@wordpress/blocks';
import {
	__experimentalUseCustomUnits as useCustomUnits,
	__experimentalUnitControl as UnitControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useSetting from '../components/use-setting';
import { DIMENSIONS_SUPPORT_KEY } from './dimensions';
import { cleanEmptyObject } from './utils';

/**
 * Determines if there is min-height support.
 *
 * @param {string|Object} blockType Block name or Block Type object.
 * @return {boolean} Whether there is support.
 */
export function hasMinHeightSupport( blockType ) {
	const support = getBlockSupport( blockType, DIMENSIONS_SUPPORT_KEY );
	return !! ( true === support || support?.minHeight );
}

/**
 * Checks if there is a current value in the min-height block support attributes.
 *
 * @param {Object} props Block props.
 * @return {boolean} Whether or not the block has a min-height value set.
 */
export function hasMinHeightValue( props ) {
	return props.attributes.style?.dimensions?.minHeight !== undefined;
}

/**
 * Resets the min-height block support attributes. This can be used when
 * disabling the min-height support controls for a block via a progressive
 * discovery panel.
 *
 * @param {Object} props               Block props.
 * @param {Object} props.attributes    Block's attributes.
 * @param {Object} props.setAttributes Function to set block's attributes.
 */
export function resetMinHeight( { attributes = {}, setAttributes } ) {
	const { style } = attributes;

	setAttributes( {
		style: {
			...style,
			dimensions: {
				...style?.dimensions,
				minHeight: undefined,
			},
		},
	} );
}

/**
 * Custom hook that checks if min-height controls have been disabled.
 *
 * @param {Object} props Block props.
 * @param {string} props.name The name of the block.
 * @return {boolean} Whether min-height control is disabled.
 */
export function useIsMinHeightDisabled( { name: blockName } = {} ) {
	const isDisabled = ! useSetting( 'dimensions.customMinHeight' );
	return ! hasMinHeightSupport( blockName ) || isDisabled;
}

/**
 * Inspector control panel containing the min-height related configuration.
 *
 * @param {Object} props Block props.
 * @return {WPElement} Edit component for min-height.
 */
export function MinHeightEdit( props ) {
	const {
		attributes: { style },
		setAttributes,
	} = props;

	const units = useCustomUnits( {
		availableUnits: useSetting( 'dimensions.units' ) || [
			'%',
			'px',
			'em',
			'rem',
			'vh',
			'vw',
		],
	} );

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
		<UnitControl
			label={ __( 'Minimum height' ) }
			value={ style?.dimensions?.minHeight }
			units={ units }
			onChange={ onChange }
			min={ 0 }
		/>
	);
}
