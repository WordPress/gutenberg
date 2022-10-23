/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Platform } from '@wordpress/element';
import { getBlockSupport } from '@wordpress/blocks';
import {
	__experimentalUseCustomUnits as useCustomUnits,
	__experimentalBoxControl as BoxControl,
	__experimentalUnitControl as UnitControl,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { __unstableUseBlockRef as useBlockRef } from '../components/block-list/use-block-props/use-block-refs';
import { getSpacingPresetCssVar } from '../components/spacing-sizes-control/utils';
import SpacingSizesControl from '../components/spacing-sizes-control';
import useSetting from '../components/use-setting';
import { AXIAL_SIDES, SPACING_SUPPORT_KEY, useCustomSides } from './dimensions';
import { cleanEmptyObject } from './utils';

/**
 * Determines if there is gap support.
 *
 * @param {string|Object} blockType Block name or Block Type object.
 * @return {boolean}                Whether there is support.
 */
export function hasGapSupport( blockType ) {
	const support = getBlockSupport( blockType, SPACING_SUPPORT_KEY );
	return !! ( true === support || support?.blockGap );
}

/**
 * Checks if there is a current value in the gap block support attributes.
 *
 * @param {Object} props Block props.
 * @return {boolean}      Whether or not the block has a gap value set.
 */
export function hasGapValue( props ) {
	return props.attributes.style?.spacing?.blockGap !== undefined;
}

/**
 * Returns a BoxControl object value from a given blockGap style value.
 * The string check is for backwards compatibility before Gutenberg supported
 * split gap values (row and column) and the value was a string n + unit.
 *
 * @param {string? | Object?} blockGapValue A block gap string or axial object value, e.g., '10px' or { top: '10px', left: '10px'}.
 * @return {Object|null}                    A value to pass to the BoxControl component.
 */
export function getGapBoxControlValueFromStyle( blockGapValue ) {
	if ( ! blockGapValue ) {
		return null;
	}

	const isValueString = typeof blockGapValue === 'string';
	return {
		top: isValueString ? blockGapValue : blockGapValue?.top,
		left: isValueString ? blockGapValue : blockGapValue?.left,
	};
}

/**
 * Returns a CSS value for the `gap` property from a given blockGap style.
 *
 * @param {string? | Object?} blockGapValue A block gap string or axial object value, e.g., '10px' or { top: '10px', left: '10px'}.
 * @param {string?}           defaultValue  A default gap value.
 * @return {string|null}                    The concatenated gap value (row and column).
 */
export function getGapCSSValue( blockGapValue, defaultValue = '0' ) {
	const blockGapBoxControlValue =
		getGapBoxControlValueFromStyle( blockGapValue );
	if ( ! blockGapBoxControlValue ) {
		return null;
	}

	const row =
		getSpacingPresetCssVar( blockGapBoxControlValue?.top ) || defaultValue;
	const column =
		getSpacingPresetCssVar( blockGapBoxControlValue?.left ) || defaultValue;

	return row === column ? row : `${ row } ${ column }`;
}

/**
 * Resets the gap block support attribute. This can be used when disabling
 * the gap support controls for a block via a progressive discovery panel.
 *
 * @param {Object} props               Block props.
 * @param {Object} props.attributes    Block's attributes.
 * @param {Object} props.setAttributes Function to set block's attributes.
 */
export function resetGap( { attributes = {}, setAttributes } ) {
	const { style } = attributes;

	setAttributes( {
		style: {
			...style,
			spacing: {
				...style?.spacing,
				blockGap: undefined,
			},
		},
	} );
}

/**
 * Custom hook that checks if gap settings have been disabled.
 *
 * @param {string} name The name of the block.
 * @return {boolean}     Whether the gap setting is disabled.
 */
export function useIsGapDisabled( { name: blockName } = {} ) {
	const isDisabled = ! useSetting( 'spacing.blockGap' );
	return ! hasGapSupport( blockName ) || isDisabled;
}

/**
 * Inspector control panel containing the gap related configuration
 *
 * @param {Object} props
 *
 * @return {WPElement} Gap edit element.
 */
export function GapEdit( props ) {
	const {
		clientId,
		attributes: { style },
		name: blockName,
		setAttributes,
	} = props;

	const spacingSizes = useSetting( 'spacing.spacingSizes' );

	const units = useCustomUnits( {
		availableUnits: useSetting( 'spacing.units' ) || [
			'%',
			'px',
			'em',
			'rem',
			'vw',
		],
	} );
	const sides = useCustomSides( blockName, 'blockGap' );
	const ref = useBlockRef( clientId );

	if ( useIsGapDisabled( props ) ) {
		return null;
	}

	const splitOnAxis =
		sides && sides.some( ( side ) => AXIAL_SIDES.includes( side ) );

	const onChange = ( next ) => {
		let blockGap = next;

		// If splitOnAxis activated we need to return a BoxControl object to the BoxControl component.
		if ( !! next && splitOnAxis ) {
			blockGap = { ...getGapBoxControlValueFromStyle( next ) };
		} else if ( next?.hasOwnProperty( 'top' ) ) {
			// If splitOnAxis is not enabled, treat the 'top' value as the shorthand gap value.
			blockGap = next.top;
		}

		const newStyle = {
			...style,
			spacing: {
				...style?.spacing,
				blockGap,
			},
		};

		setAttributes( {
			style: cleanEmptyObject( newStyle ),
		} );

		// In Safari, changing the `gap` CSS value on its own will not trigger the layout
		// to be recalculated / re-rendered. To force the updated gap to re-render, here
		// we replace the block's node with itself.
		const isSafari =
			window?.navigator.userAgent &&
			window.navigator.userAgent.includes( 'Safari' ) &&
			! window.navigator.userAgent.includes( 'Chrome ' ) &&
			! window.navigator.userAgent.includes( 'Chromium ' );

		if ( ref.current && isSafari ) {
			ref.current.parentNode?.replaceChild( ref.current, ref.current );
		}
	};

	const gapValue = getGapBoxControlValueFromStyle( style?.spacing?.blockGap );

	// The BoxControl component expects a full complement of side values.
	// Gap row and column values translate to top/bottom and left/right respectively.
	const boxControlGapValue = splitOnAxis
		? {
				...gapValue,
				right: gapValue?.left,
				bottom: gapValue?.top,
		  }
		: {
				top: gapValue?.top,
		  };

	return Platform.select( {
		web: (
			<>
				{ ( ! spacingSizes || spacingSizes?.length === 0 ) &&
					( splitOnAxis ? (
						<BoxControl
							label={ __( 'Block spacing' ) }
							min={ 0 }
							onChange={ onChange }
							units={ units }
							sides={ sides }
							values={ boxControlGapValue }
							allowReset={ false }
							splitOnAxis={ splitOnAxis }
						/>
					) : (
						<UnitControl
							label={ __( 'Block spacing' ) }
							__unstableInputWidth="80px"
							min={ 0 }
							onChange={ onChange }
							units={ units }
							// Default to `row` for combined values.
							value={ boxControlGapValue }
						/>
					) ) }
				{ spacingSizes?.length > 0 && (
					<SpacingSizesControl
						values={ boxControlGapValue }
						onChange={ onChange }
						label={ __( 'Block spacing' ) }
						sides={ splitOnAxis ? sides : [ 'top' ] } // Use 'top' as the shorthand property in non-axial configurations.
						units={ units }
						allowReset={ false }
						splitOnAxis={ splitOnAxis }
					/>
				) }
			</>
		),
		native: null,
	} );
}
