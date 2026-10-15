import {
	__experimentalUnitControl as UnitControl,
	__experimentalUseCustomUnits as useCustomUnits,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSettings } from '../../components/use-settings';
import type { LetterSpacingControlProps } from './types';

/**
 * Control for letter-spacing.
 *
 * @param props                       Component props.
 * @param props.__next40pxDefaultSize Start opting into the larger default height that will become the default size in a future version.
 * @param props.value                 Currently selected letter-spacing.
 * @param props.onChange              Handles change in letter-spacing selection.
 * @param props.__unstableInputWidth  Input width to pass through to inner UnitControl. Should be a valid CSS value.
 *
 * @return Letter-spacing control.
 */
export default function LetterSpacingControl( {
	value,
	onChange,
	__unstableInputWidth = '60px',
	...otherProps
}: LetterSpacingControlProps ) {
	const [ availableUnits ] = useSettings( 'spacing.units' );
	const units = useCustomUnits( {
		// The setting lists unit strings.
		availableUnits: ( availableUnits as string[] | undefined ) || [
			'px',
			'em',
			'rem',
		],
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
