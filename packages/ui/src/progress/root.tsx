import { Progress as _Progress } from '@base-ui/react/progress';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Stack } from '../stack';
import type { RootProps } from './types';
import resetStyles from '../utils/css/resets.module.css';

const DEFAULT_RENDER = ( props: React.ComponentProps< typeof Stack > ) => (
	<Stack { ...props } direction="column" gap="sm" />
);

/**
 * Groups the progress bar, label, and value for a task.
 * Pass `null` as the value for indeterminate progress.
 * Use `Progress.Label`, `aria-label`, or `aria-labelledby` to name the task.
 */
const Root = forwardRef< HTMLDivElement, RootProps >( function ProgressRoot(
	{ className, render = DEFAULT_RENDER, ...props },
	ref
) {
	return (
		<_Progress.Root
			ref={ ref }
			render={ render }
			getAriaValueText={ ( formattedValue ) =>
				formattedValue || __( 'In progress' )
			}
			className={ clsx( resetStyles[ 'box-sizing' ], className ) }
			{ ...props }
		/>
	);
} );

export { Root };
