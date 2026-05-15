import { Combobox as _Combobox } from '@base-ui/react/combobox';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { chevronDown } from '@wordpress/icons';
import { Icon } from '../../../icon';
import focusStyles from '../../../utils/css/focus.module.css';
import selectTriggerStyles from '../../../utils/css/select-trigger.module.css';
import { InputLayout } from '../input-layout';
import type { ComboboxTriggerProps } from './types';

export const Trigger = forwardRef< HTMLButtonElement, ComboboxTriggerProps >(
	function Trigger(
		{ className, children, size = 'default', ...restProps },
		ref
	) {
		return (
			<InputLayout
				className={ clsx(
					focusStyles[ 'outset-ring--focus-within-except-active' ],
					selectTriggerStyles[ 'trigger-wrapper' ],
					className
				) }
				size={ size }
			>
				<_Combobox.Trigger
					{ ...restProps }
					className={ selectTriggerStyles.trigger }
					data-can-disable-input-layout
					ref={ ref }
				>
					<div className={ selectTriggerStyles[ 'trigger-value' ] }>
						<_Combobox.Value>{ children }</_Combobox.Value>
					</div>
					<Icon
						className={ selectTriggerStyles[ 'trigger-caret' ] }
						icon={ chevronDown }
						size={ 18 }
					/>
				</_Combobox.Trigger>
			</InputLayout>
		);
	}
);
