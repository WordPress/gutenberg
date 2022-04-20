/**
 * WordPress dependencies
 */
import { useCallback, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import * as styles from './styles';
import { parseQuantityAndUnitFromRawValue } from '../unit-control';
import { useContextSystem, WordPressComponentProps } from '../ui/context';
import { useCx } from '../utils/hooks/use-cx';

import type { UnitRangeControlProps } from './types';

export function useUnitRangeControl(
	props: WordPressComponentProps< UnitRangeControlProps, 'div' >
) {
	const {
		className,
		onChange,
		value: valueWithUnit,
		unitControlProps,
		rangeControlProps,
		...otherProps
	} = useContextSystem( props, 'UnitRangeControl' );

	const [ value, unit ] = parseQuantityAndUnitFromRawValue( valueWithUnit );

	const onSliderChange = useCallback(
		( newValue: string ) => onChange( `${ newValue }${ unit }` ),
		[ onChange, unit ]
	);

	const cx = useCx();
	const classes = useMemo( () => {
		return cx( styles.unitRangeControl, className );
	}, [ className, cx ] );

	const unitControlClasses = useMemo( () => {
		return cx( styles.unitControl, unitControlProps?.className );
	}, [ cx, unitControlProps?.className ] );

	const rangeControlClasses = useMemo( () => {
		return cx( styles.rangeControl, rangeControlProps?.className );
	}, [ cx, rangeControlProps?.className ] );

	const defaultSliderStep = [ 'px', '%' ].includes( unit ) ? 1 : 0.1;

	return {
		...otherProps,
		className: classes,
		rangeControlProps: {
			...rangeControlProps,
			className: rangeControlClasses,
			onChange: onSliderChange,
			value,
			withInputField: false,
			step: rangeControlProps?.step || defaultSliderStep,
		},
		unitControlProps: {
			...unitControlProps,
			className: unitControlClasses,
			onChange,
			value: valueWithUnit,
			step: unitControlProps?.step || defaultSliderStep,
		},
	};
}
