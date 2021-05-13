/**
 * WordPress dependencies
 */
import { Platform } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useSetting from '../use-setting';

const isWeb = Platform.OS === 'web';

/**
 * An array of all available CSS length units.
 */
export const CSS_UNITS = [
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
	{
		value: 'vh',
		label: isWeb ? 'vh' : __( 'Viewport height (vh)' ),
		default: '',
	},
	{
		value: 'vmin',
		label: isWeb ? 'vmin' : __( 'Viewport smallest dimension (vmin)' ),
		default: '',
	},
	{
		value: 'vmax',
		label: isWeb ? 'vmax' : __( 'Viewport largest dimension (vmax)' ),
		default: '',
	},
	{
		value: 'ch',
		label: isWeb ? 'ch' : __( 'Width of the zero (0) character (ch)' ),
		default: '',
	},
	{
		value: 'ex',
		label: isWeb ? 'ex' : __( 'x-height of the font (ex)' ),
		default: '',
	},
	{
		value: 'lh',
		label: isWeb ? 'lh' : __( 'Relative to the line-height (lh)' ),
		default: '',
	},
	{
		value: 'cm',
		label: isWeb ? 'cm' : __( 'Centimeters (cm)' ),
		default: '',
	},
	{
		value: 'mm',
		label: isWeb ? 'mm' : __( 'Millimeters (mm)' ),
		default: '',
	},
	{
		value: 'Q',
		label: isWeb ? 'Q' : __( 'Quarter-millimeters (Q)' ),
		default: '',
	},
	{
		value: 'in',
		label: isWeb ? 'in' : __( 'Inches (in)' ),
		default: '',
	},
	{
		value: 'pc',
		label: isWeb ? 'pc' : __( 'Picas (pc)' ),
		default: '',
	},
	{
		value: 'pt',
		label: isWeb ? 'pt' : __( 'Points (pt)' ),
		default: '',
	},
];

/**
 * Filters available units based on values defined by settings.
 *
 * @param {Array} settings Collection of preferred units.
 * @param {Array} units Collection of available units.
 *
 * @return {Array} Filtered units based on settings.
 */
function filterUnitsWithSettings( settings = [], units = [] ) {
	return units.filter( ( unit ) => {
		return settings.includes( unit.value );
	} );
}

/**
 * Custom hook to retrieve and consolidate units setting from add_theme_support().
 *
 * @param {Object} args              An object containing units, settingPath & defaultUnits.
 * @param {Object} args.units        Collection of available units.
 * @param {string} args.settingPath  The setting path. Defaults to 'spacing.units'.
 * @param {Array}  args.defaultUnits Array of default units.
 * @param {Object} args.defaultValues Collection of default values for defined units. Example: { px: '350', em: '15' }.
 *
 * @return {Array} Filtered units based on settings.
 */
export const useCustomUnits = ( {
	units,
	settingPath,
	defaultUnits,
	defaultValues,
} ) => {
	defaultUnits = defaultUnits || [];
	units = units || CSS_UNITS;
	const availableUnits = useSetting( settingPath ) || defaultUnits;
	const usedUnits = filterUnitsWithSettings(
		! availableUnits ? [] : availableUnits,
		units
	);

	if ( defaultValues ) {
		usedUnits.forEach( ( unit, i ) => {
			if ( defaultValues[ unit.value ] ) {
				usedUnits[ i ].default = defaultValues[ unit.value ];
			}
		} );
	}

	return usedUnits.length === 0 ? false : usedUnits;
};
