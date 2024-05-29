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
import { useSettings } from '../../components/use-settings';

/**
 * Control for letter-spacing.
 *
 * @param {Object}                  props                      Component props.
 * @param {string}                  props.value                Currently selected letter-spacing.
 * @param {Function}                props.onChange             Handles change in letter-spacing selection.
 * @param {string|number|undefined} props.__unstableInputWidth Input width to pass through to inner UnitControl. Should be a valid CSS value.
 *
 * @return {Element} Letter-spacing control.
 */
export default function LetterSpacingControl( {
	value,
	onChange,
	__unstableInputWidth = '60px',
	...otherProps
} ) {
	const [ availableUnits ] = useSettings( 'spacing.units' );
	const units = useCustomUnits( {
		availableUnits: availableUnits || [ 'px', 'em', 'rem' ],
		defaultValues: { px: 2, em: 0.2, rem: 0.2 },
	} );
	return (
		<UnitControl
			{ ...otherProps }
			label={ __( 'Letter spacing' ) }
			value={ value }
			__unstableInputWidth={ __unstableInputWidth }
			units={ units }
			onChange={ onChange }
		/>
	);
}
