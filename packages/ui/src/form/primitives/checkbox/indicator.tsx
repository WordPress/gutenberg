import { Checkbox as _Checkbox } from '@base-ui/react/checkbox';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { check, reset } from '@wordpress/icons';
import { Icon } from '../../../icon';
import styles from './style.module.css';
import type { CheckboxIndicatorProps } from './types';

const DEFAULT_CHILDREN = (
	<>
		<Icon
			className={ clsx(
				styles[ 'indicator-icon' ],
				styles[ 'checked-icon' ]
			) }
			icon={ check }
			size={ 18 }
		/>
		<Icon
			className={ clsx(
				styles[ 'indicator-icon' ],
				styles[ 'indeterminate-icon' ]
			) }
			icon={ reset }
			size={ 18 }
		/>
	</>
);

/**
 * Visual indicator rendered when the checkbox is checked or indeterminate.
 */
export const Indicator = forwardRef< HTMLSpanElement, CheckboxIndicatorProps >(
	function Indicator(
		{ className, children = DEFAULT_CHILDREN, ...restProps },
		ref
	) {
		return (
			<_Checkbox.Indicator
				ref={ ref }
				className={ clsx( styles.indicator, className ) }
				{ ...restProps }
			>
				{ children }
			</_Checkbox.Indicator>
		);
	}
);
