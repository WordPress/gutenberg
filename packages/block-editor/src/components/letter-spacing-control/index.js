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
 * @param {Object}   props              Component props.
 * @param {string}   props.value        Currently selected letter-spacing.
 * @param {Function} props.onChange     Handles change in letter-spacing selection.
 * @param {boolean}  props.withMaxWidth Whether to restrict the field's max width.
 * @return {WPElement}                  Letter-spacing control.
 */
export default function LetterSpacingControl( {
	value,
	onChange,
	withMaxWidth = true,
} ) {
	const units = useCustomUnits( {
		availableUnits: useSetting( 'spacing.units' ) || [ 'px', 'em', 'rem' ],
		defaultValues: { px: '2', em: '.2', rem: '.2' },
	} );
	return (
		<UnitControl
			label={ __( 'Letter-spacing' ) }
			value={ value }
			__unstableInputWidth={ withMaxWidth ? '60px' : undefined }
			units={ units }
			onChange={ onChange }
		/>
	);
}
