import { Meter as _Meter } from '@base-ui/react/meter';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { Stack } from '../stack';
import type { RootProps } from './types';
import resetStyles from '../utils/css/resets.module.css';

const DEFAULT_RENDER = ( props: React.ComponentProps< typeof Stack > ) => (
	<Stack { ...props } direction="column" gap="sm" />
);

/**
 * Groups the meter, label, and value for a measured quantity.
 * Use `Meter.Label`, `aria-label`, or `aria-labelledby` to name the quantity.
 */
const Root = forwardRef< HTMLDivElement, RootProps >( function MeterRoot(
	{ className, render = DEFAULT_RENDER, ...props },
	ref
) {
	return (
		<_Meter.Root
			ref={ ref }
			render={ render }
			className={ clsx( resetStyles[ 'box-sizing' ], className ) }
			{ ...props }
		/>
	);
} );

export { Root };
