import { Progress as _Progress } from '@base-ui/react/progress';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { Text } from '../text';
import type { LabelProps } from './types';
import styles from './style.module.css';

const DEFAULT_RENDER = <Text />;

/**
 * The visible label, automatically used as the progress bar's accessible name.
 */
const Label = forwardRef< HTMLSpanElement, LabelProps >( function ProgressLabel(
	{ className, render = DEFAULT_RENDER, ...props },
	ref
) {
	return (
		<_Progress.Label
			ref={ ref }
			render={ render }
			className={ clsx( styles.label, className ) }
			{ ...props }
		/>
	);
} );

export { Label };
