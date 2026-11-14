import { Select as _Select } from '@base-ui/react/select';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import focusStyles from '../../../utils/css/focus.module.scss';
import selectTriggerStyles from '../../../utils/css/select-trigger.module.css';
import { Caret } from '../../../utils/caret';
import { InputLayout } from '../input-layout';
import type { SelectTriggerProps } from './types';

export const Trigger = forwardRef< HTMLButtonElement, SelectTriggerProps >(
	function UnforwardedTrigger(
		{
			className,
			size,
			variant,
			children,
			placeholder = __( 'Select' ),
			...restProps
		},
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
						placeholder={ placeholder }
						className={ selectTriggerStyles[ 'trigger-value' ] }
					>
						{ children }
					</_Select.Value>
					<Caret />
				</_Select.Trigger>
			</InputLayout>
		);
	}
);
