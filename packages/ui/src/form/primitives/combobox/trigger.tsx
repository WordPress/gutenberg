import { Combobox as _Combobox } from '@base-ui/react/combobox';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { chevronDown } from '@wordpress/icons';
import { Icon } from '../../../icon';
import focusStyles from '../../../utils/css/focus.module.css';
import selectTriggerStyles from '../../../utils/css/select-trigger.module.css';
import { InputLayout } from '../input-layout';
import type { ComboboxTriggerProps } from './types';

const DEFAULT_RENDER = ( {
	className,
	children,
	disabled,
	...restProps
}: Omit< ComboboxTriggerProps, 'children' > & {
	children?: React.ReactNode;
} ) => (
	<InputLayout
		className={ clsx(
			focusStyles[ 'outset-ring--focus-within-except-active' ],
			selectTriggerStyles[ 'trigger-wrapper' ],
			className
		) }
	>
		<button
			className={ clsx( selectTriggerStyles.trigger, className ) }
			role="combobox"
			disabled={ disabled }
			data-can-disable-input-layout
			{ ...restProps }
		>
			<div className={ selectTriggerStyles[ 'trigger-value' ] }>
				{ children }
			</div>
			<Icon
				className={ selectTriggerStyles[ 'trigger-caret' ] }
				icon={ chevronDown }
				size={ 18 }
			/>
		</button>
	</InputLayout>
);

export const Trigger = forwardRef< HTMLButtonElement, ComboboxTriggerProps >(
	function Trigger(
		{ children, render = DEFAULT_RENDER, ...restProps },
		ref
	) {
		return (
			<_Combobox.Trigger ref={ ref } render={ render } { ...restProps }>
				<_Combobox.Value>{ children }</_Combobox.Value>
			</_Combobox.Trigger>
		);
	}
);
