import { Checkbox as _Checkbox } from '@base-ui/react/checkbox';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { check, reset } from '@wordpress/icons';
import { Icon } from '../../../icon';
import resetStyles from '../../../utils/css/resets.module.css';
import focusStyles from '../../../utils/css/focus.module.css';
import styles from './style.module.css';
import type { CheckboxProps } from './types';

export const Checkbox = forwardRef< HTMLSpanElement, CheckboxProps >(
	function Checkbox( { className, indeterminate, ...restProps }, ref ) {
		return (
			<_Checkbox.Root
				ref={ ref }
				className={ clsx(
					resetStyles[ 'box-sizing' ],
					focusStyles[ 'outset-ring--focus' ],
					styles.root,
					className
				) }
				indeterminate={ indeterminate }
				{ ...restProps }
			>
				<_Checkbox.Indicator
					className={ styles[ 'indicator-icon' ] }
					render={ ( props, state ) => (
						<Icon
							{ ...props }
							icon={ state.indeterminate ? reset : check }
							viewBox="4 4 16 16"
							size={ 16 }
						/>
					) }
				/>
			</_Checkbox.Root>
		);
	}
);
