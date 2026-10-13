import { Meter as _Meter } from '@base-ui/react/meter';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { Text } from '../text';
import type { ValueProps } from './types';
import styles from './style.module.css';

const DEFAULT_RENDER = <Text />;

/**
 * Displays the formatted meter value. Use a child function to customize it.
 */
const Value = forwardRef< HTMLSpanElement, ValueProps >( function MeterValue(
	{ className, render = DEFAULT_RENDER, ...props },
	ref
) {
	return (
		<_Meter.Value
			ref={ ref }
			render={ render }
			className={ clsx( styles.value, className ) }
			{ ...props }
		/>
	);
} );

export { Value };
