/**
 * WordPress dependencies
 */
import { __experimentalUnitControl as UnitControl } from '@wordpress/components';
import { Platform } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const isWeb = Platform.OS === 'web';

const CSS_UNITS = [
	{
		value: 'px',
		label: isWeb ? 'px' : __( 'Pixels (px)' ),
		default: '2',
	},
	{
		value: 'em',
		label: isWeb ? 'em' : __( 'Relative to parent font size (em)' ),
		default: '.2',
	},
	{
		value: 'rem',
		label: isWeb ? 'rem' : __( 'Relative to root font size (rem)' ),
		default: '.2',
	},
];

/**
 * Control for letter-spacing.
 *
 * @param  {Object}   props                 Component props.
 * @param  {string}   props.value           Currently selected letter-spacing.
 * @param  {Function} props.onChange        Handles change in letter-spacing selection.
 * @return {WPElement}                      Letter-spacing control.
 */
export default function LetterSpacingControl( { value, onChange } ) {
	return (
		<UnitControl
			label={ __( 'Letter-spacing' ) }
			value={ value }
			__unstableInputWidth="60px"
			units={ CSS_UNITS }
			onChange={ onChange }
		/>
	);
}
