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
 * Determines if there is height support.
 *
 * @param  {string|Object} blockType Block name or Block Type object.
 * @return {boolean}                 Whether there is support.
 */
export function hasHeightSupport( blockType ) {
	const support = getBlockSupport( blockType, DIMENSIONS_SUPPORT_KEY );
	return !! ( true === support || support?.height );
}

/**
 * Checks if there is a current value in the height block support attributes.
 *
 * @param  {Object} props Block props.
 * @return {boolean}      Whether or not the block has a height value set.
 */
export function hasHeightValue( props ) {
	return props.attributes.style?.dimensions?.height !== undefined;
}

/**
 * Resets the height block support attributes. This can be used when
 * disabling the height support controls for a block via a progressive
 * discovery panel.
 *
 * @param {Object} props               Block props.
 * @param {Object} props.attributes    Block's attributes.
 * @param {Object} props.setAttributes Function to set block's attributes.
 */
export function resetHeight( { attributes = {}, setAttributes } ) {
	const { style } = attributes;

	setAttributes( {
		style: {
			...style,
			dimensions: {
				...style?.dimensions,
				height: undefined,
			},
		},
	} );
}

/**
 * Custom hook that checks if height controls have been disabled.
 *
 * @param  {string} name The name of the block.
 * @return {boolean}     Whether height control is disabled.
 */
export function useIsHeightDisabled( { name: blockName } = {} ) {
	const isDisabled = ! useSetting( 'dimensions.customHeight' );
	return ! hasHeightSupport( blockName ) || isDisabled;
}

/**
 * Inspector control panel containing the height related configuration.
 *
 * @param  {Object} props Block props.
 * @return {WPElement}    Edit component for height.
 */
export function HeightEdit( props ) {
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

	if ( useIsHeightDisabled( props ) ) {
		return null;
	}

	const onChange = ( next ) => {
		const newStyle = {
			...style,
			dimensions: {
				...style?.dimensions,
				height: next,
			},
		};

		setAttributes( { style: cleanEmptyObject( newStyle ) } );
	};

	return (
		<UnitControl
			label={ __( 'Height' ) }
			value={ style?.dimensions?.height }
			units={ units }
			onChange={ onChange }
			min={ 0 }
		/>
	);
}
