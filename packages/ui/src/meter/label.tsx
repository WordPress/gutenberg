import { Meter as _Meter } from '@base-ui/react/meter';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { Text } from '../text';
import type { LabelProps } from './types';
import styles from './style.module.css';

const DEFAULT_RENDER = <Text />;

/**
 * The visible label, automatically used as the meter bar's accessible name.
 */
const Label = forwardRef< HTMLSpanElement, LabelProps >( function MeterLabel(
	{ className, render = DEFAULT_RENDER, ...props },
	ref
) {
	return (
		<_Meter.Label
			ref={ ref }
			render={ render }
			className={ clsx( styles.label, className ) }
			{ ...props }
		/>
	);
} );

export { Label };
