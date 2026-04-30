import { Checkbox as _Checkbox } from '@base-ui/react/checkbox';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import focusStyles from '../../../utils/css/focus.module.css';
import resetStyles from '../../../utils/css/resets.module.css';
import styles from './style.module.css';
import { Indicator } from './indicator';
import type { CheckboxRootProps } from './types';

/**
 * A low-level checkbox primitive for selecting one or more options.
 */
export const Root = forwardRef< HTMLElement, CheckboxRootProps >( function Root(
	{ className, children = <Indicator />, ...restProps },
	ref
) {
	return (
		<_Checkbox.Root
			ref={ ref }
			className={ clsx(
				resetStyles[ 'box-sizing' ],
				focusStyles[ 'outset-ring--focus-visible' ],
				styles.root,
				className
			) }
			{ ...restProps }
		>
			{ children }
		</_Checkbox.Root>
	);
} );
