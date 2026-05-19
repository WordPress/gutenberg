import { Combobox as _Combobox } from '@base-ui/react/combobox';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { chevronDown } from '@wordpress/icons';
import { Icon } from '../../../icon';
import focusStyles from '../../../utils/css/focus.module.css';
import selectTriggerStyles from '../../../utils/css/select-trigger.module.css';
import { InputLayout } from '../input-layout';
import type { ComboboxTriggerProps } from './types';

export const Trigger = forwardRef< HTMLButtonElement, ComboboxTriggerProps >(
	function Trigger(
		{
			className,
			children,
			size = 'default',
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
					{
						// Combobox.Value does not currently render an element, so this
						// wrapper lets it share the same trigger text styles as Select.
						// See https://github.com/mui/base-ui/issues/4864
					 }
					<div className={ selectTriggerStyles[ 'trigger-value' ] }>
						<_Combobox.Value placeholder={ placeholder }>
							{ children }
						</_Combobox.Value>
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
