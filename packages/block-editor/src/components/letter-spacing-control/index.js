/**
 * WordPress dependencies
 */
import {
	__experimentalUnitControl as UnitControl,
	__experimentalUseCustomUnits as useCustomUnits,
} from '@wordpress/components';
import deprecated from '@wordpress/deprecated';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSettings } from '../../components/use-settings';

/**
 * Control for letter-spacing.
 *
 * @param {Object}                  props                       Component props.
 * @param {boolean}                 props.__next40pxDefaultSize Start opting into the larger default height that will become the default size in a future version.
 * @param {string}                  props.value                 Currently selected letter-spacing.
 * @param {Function}                props.onChange              Handles change in letter-spacing selection.
 * @param {string|number|undefined} props.__unstableInputWidth  Input width to pass through to inner UnitControl. Should be a valid CSS value.
 *
 * @return {Element} Letter-spacing control.
 */
export default function LetterSpacingControl( {
	__next40pxDefaultSize = false,
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

	if (
		! __next40pxDefaultSize &&
		( otherProps.size === undefined || otherProps.size === 'default' )
	) {
		deprecated(
			`36px default size for wp.blockEditor.__experimentalLetterSpacingControl`,
			{
				since: '6.8',
				version: '7.1',
				hint: 'Set the `__next40pxDefaultSize` prop to true to start opting into the new default size, which will become the default in a future version.',
			}
		);
	}

	return (
		<UnitControl
			__next40pxDefaultSize={ __next40pxDefaultSize }
			__shouldNotWarnDeprecated36pxSize
			{ ...otherProps }
			label={ __( 'Letter spacing' ) }
			value={ value }
			__unstableInputWidth={ __unstableInputWidth }
			units={ units }
			onChange={ onChange }
		/>
	);
}
