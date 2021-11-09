/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Platform } from '@wordpress/element';
import { getBlockSupport } from '@wordpress/blocks';
import {
	__experimentalUseCustomUnits as useCustomUnits,
	__experimentalUnitControl as UnitControl,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { __unstableUseBlockRef as useBlockRef } from '../components/block-list/use-block-props/use-block-refs';
import useSetting from '../components/use-setting';
import { SPACING_SUPPORT_KEY } from './dimensions';
import { cleanEmptyObject } from './utils';

/**
 * Determines if there is gap support.
 *
 * @param {string|Object} blockType Block name or Block Type object.
 * @return {boolean}                 Whether there is support.
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
		setAttributes,
	} = props;

	const units = useCustomUnits( {
		availableUnits: useSetting( 'spacing.units' ) || [
			'%',
			'px',
			'em',
			'rem',
			'vw',
		],
	} );

	const ref = useBlockRef( clientId );

	if ( useIsGapDisabled( props ) ) {
		return null;
	}

	const onChange = ( next ) => {
		const newStyle = {
			...style,
			spacing: {
				...style?.spacing,
				blockGap: next,
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

	return Platform.select( {
		web: (
			<>
				<UnitControl
					label={ __( 'Block spacing' ) }
					__unstableInputWidth="80px"
					min={ 0 }
					onChange={ onChange }
					units={ units }
					value={ style?.spacing?.blockGap }
				/>
			</>
		),
		native: null,
	} );
}
