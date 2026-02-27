import { Select as _Select } from '@base-ui/react/select';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { chevronDown } from '@wordpress/icons';
import focusStyles from '../../../utils/css/focus.module.css';
import selectTriggerStyles from '../../../utils/css/select-trigger.module.css';
import { InputLayout } from '../input-layout';
import { Icon } from '../../../icon';
import type { SelectTriggerProps } from './types';

export const Trigger = forwardRef< HTMLButtonElement, SelectTriggerProps >(
	function Trigger(
		{ className, size, variant, children, ...restProps },
		ref
	) {
		return (
			<InputLayout
				className={ clsx(
					focusStyles[ 'outset-ring--focus-within-except-active' ],
					selectTriggerStyles[ 'trigger-wrapper' ],
					variant === 'minimal' &&
						selectTriggerStyles[ 'is-minimal' ],
					className
				) }
				size={ size }
				isBorderless={ variant === 'minimal' }
			>
				<_Select.Trigger
					{ ...restProps }
					className={ clsx(
						selectTriggerStyles.trigger,
						variant === 'minimal' &&
							selectTriggerStyles[ 'is-minimal' ]
					) }
					data-can-disable-input-layout
					ref={ ref }
				>
					<_Select.Value
						className={ ( state ) =>
							clsx(
								selectTriggerStyles[ 'trigger-value' ],
								state.value === '' &&
									selectTriggerStyles[ 'is-placeholder' ]
							)
						}
					>
						{ children }
					</_Select.Value>
					<Icon
						className={ selectTriggerStyles[ 'trigger-caret' ] }
						icon={ chevronDown }
						size={ 18 }
					/>
				</_Select.Trigger>
			</InputLayout>
		);
	}
);
