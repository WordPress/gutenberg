/**
 * WordPress dependencies
 */
import {
	__experimentalUnitControl as UnitControl,
	__experimentalUseCustomUnits as useCustomUnits,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useSetting from '../../components/use-setting';

/**
 * Control for letter-spacing.
 *
 * @param {Object}   props          Component props.
 * @param {string}   props.value    Currently selected letter-spacing.
 * @param {Function} props.onChange Handles change in letter-spacing selection.
 * @return {WPElement}                      Letter-spacing control.
 */
export default function LetterSpacingControl( { value, onChange } ) {
	const units = useCustomUnits( {
		availableUnits: useSetting( 'layout.units' ) || [ 'px', 'em', 'rem' ],
	} );
	return (
		<UnitControl
			label={ __( 'Letter-spacing' ) }
			value={ value }
			__unstableInputWidth="60px"
			units={ units }
			onChange={ onChange }
		/>
	);
}
