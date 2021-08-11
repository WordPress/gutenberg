/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Platform } from '@wordpress/element';
import { getBlockSupport } from '@wordpress/blocks';
import {
	__experimentalUseCustomUnits as useCustomUnits,
	__experimentalBoxControl as BoxControl,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import useSetting from '../components/use-setting';
import { SPACING_SUPPORT_KEY, useCustomSides } from './dimensions';
import { cleanEmptyObject } from './utils';

/**
 * Determines if there is gap support.
 *
 * @param {string|Object} blockType Block name or Block Type object.
 * @return {boolean}                 Whether there is support.
 */
export function hasGapSupport( blockType ) {
	const support = getBlockSupport( blockType, SPACING_SUPPORT_KEY );
	return !! ( true === support || support?.gap );
}

/**
 * Checks if there is a current value in the gap block support attributes.
 *
 * @param {Object} props Block props.
 * @return {boolean}      Whether or not the block has a gap value set.
 */
export function hasGapValue( props ) {
	return props.attributes.style?.spacing?.gap !== undefined;
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
				gap: undefined,
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
	const isDisabled = ! useSetting( 'spacing.customGap' );
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
		name: blockName,
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
	const sides = useCustomSides( blockName, 'gap' );

	if ( useIsGapDisabled( props ) ) {
		return null;
	}

	const onChange = ( next ) => {
		const newStyle = {
			...style,
			spacing: {
				...style?.spacing,
				gap: { row: next?.top, column: next?.left },
			},
		};

		setAttributes( {
			style: cleanEmptyObject( newStyle ),
		} );
	};

	const onChangeShowVisualizer = ( next ) => {
		const newStyle = {
			...style,
			visualizers: {
				gap: { row: next?.top, column: next?.left },
			},
		};

		setAttributes( {
			style: cleanEmptyObject( newStyle ),
		} );
	};

	const boxValues = {
		top: style?.spacing?.gap?.row,
		right: style?.spacing?.gap?.column,
		bottom: style?.spacing?.gap?.row,
		left: style?.spacing?.gap?.column,
	};

	return Platform.select( {
		web: (
			<>
				<BoxControl
					values={ boxValues }
					onChange={ onChange }
					onChangeShowVisualizer={ onChangeShowVisualizer }
					label={ __( 'Gap' ) }
					sides={ sides }
					units={ units }
					allowReset={ false }
					splitOnAxis={ true }
				/>
			</>
		),
		native: null,
	} );
}
