/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Platform } from '@wordpress/element';
import { getBlockSupport } from '@wordpress/blocks';
import { __experimentalBoxControl as BoxControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import useThemeSetting from '../components/use-theme-setting';
import { SPACING_SUPPORT_KEY, useCustomSides } from './spacing';
import { cleanEmptyObject } from './utils';
import { useCustomUnits } from '../components/unit-control';

const isWeb = Platform.OS === 'web';
const CSS_UNITS = [
	{
		value: '%',
		label: isWeb ? '%' : __( 'Percentage (%)' ),
		default: '',
	},
	{
		value: 'px',
		label: isWeb ? 'px' : __( 'Pixels (px)' ),
		default: '',
	},
	{
		value: 'em',
		label: isWeb ? 'em' : __( 'Relative to parent font size (em)' ),
		default: '',
	},
	{
		value: 'rem',
		label: isWeb ? 'rem' : __( 'Relative to root font size (rem)' ),
		default: '',
	},
	{
		value: 'vw',
		label: isWeb ? 'vw' : __( 'Viewport width (vw)' ),
		default: '',
	},
];

/**
 * Determines if there is padding support.
 *
 * @param  {string|Object} blockType Block name or Block Type object.
 * @return {boolean}                 Whether there is support.
 */
export function hasPaddingSupport( blockType ) {
	const support = getBlockSupport( blockType, SPACING_SUPPORT_KEY );
	return !! ( true === support || support?.padding );
}

/**
 * Custom hook that checks if padding settings have been disabled.
 *
 * @param  {string} name The name of the block.
 * @return {boolean}                 Whether padding setting is disabled.
 */
export function useIsPaddingDisabled( { name: blockName } = {} ) {
	const isDisabled = ! useThemeSetting( 'spacing.customPadding' );
	return ! hasPaddingSupport( blockName ) || isDisabled;
}

/**
 * Inspector control panel containing the padding related configuration
 *
 * @param {Object} props
 *
 * @return {WPElement} Padding edit element.
 */
export function PaddingEdit( props ) {
	const {
		name: blockName,
		attributes: { style },
		setAttributes,
	} = props;

	const units = useCustomUnits( CSS_UNITS );
	const sides = useCustomSides( blockName, 'padding' );

	if ( ! hasPaddingSupport( blockName ) ) {
		return null;
	}

	const onChange = ( next ) => {
		const newStyle = {
			...style,
			spacing: {
				...style?.spacing,
				padding: next,
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
				padding: next,
			},
		};

		setAttributes( {
			style: cleanEmptyObject( newStyle ),
		} );
	};

	return Platform.select( {
		web: (
			<>
				<BoxControl
					values={ style?.spacing?.padding }
					onChange={ onChange }
					onChangeShowVisualizer={ onChangeShowVisualizer }
					label={ __( 'Padding' ) }
					sides={ sides }
					units={ units }
				/>
			</>
		),
		native: null,
	} );
}
