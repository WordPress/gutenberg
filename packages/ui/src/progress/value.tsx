import { Progress as _Progress } from '@base-ui/react/progress';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { Text } from '../text';
import type { ValueProps } from './types';
import styles from './style.module.css';

const DEFAULT_RENDER = <Text />;

/**
 * Displays the formatted progress value. Use a child function to customize it.
 */
const Value = forwardRef< HTMLSpanElement, ValueProps >( function ProgressValue(
	{ className, render = DEFAULT_RENDER, ...props },
	ref
) {
	return (
		<_Progress.Value
			ref={ ref }
			render={ render }
			className={ clsx( styles.value, className ) }
			{ ...props }
		/>
	);
} );

export { Value };
