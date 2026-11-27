import { Input as _Input } from '@base-ui/react/input';
import clsx from 'clsx';
import { useMergeRefs } from '@wordpress/compose';
import { forwardRef } from '@wordpress/element';
import defenseStyles from '../../../utils/css/global-css-defense.module.css';
import focusStyles from '../../../utils/css/focus.module.scss';
import styles from './style.module.css';
import type { InputProps } from './types';
import { InputLayout } from '../input-layout';
import { useNumberValueText } from './use-number-value-text';

/**
 * A low-level primitive for an input field.
 *
 * Prefer `InputControl` when using with a standard label and description.
 */
export const Input = forwardRef< HTMLElement, InputProps >(
	function UnforwardedInput(
		{
			className,
			size = 'default',
			prefix,
			suffix,
			style,
			'aria-valuetext': ariaValueText,
			onValueChange,
			...restProps
		},
		ref
	) {
		const { ref: valueTextRef, ...valueTextProps } = useNumberValueText( {
			type: restProps.type,
			value: restProps.value,
			defaultValue: restProps.defaultValue,
			'aria-valuetext': ariaValueText,
			onValueChange,
		} );
		const mergedRef = useMergeRefs( [ ref, valueTextRef ] );

		return (
			<InputLayout
				className={ clsx(
					styles.layout,
					focusStyles[ 'outset-ring--focus-within' ],
					className
				) }
				style={ style }
				size={ size }
				visuallyDisabled={ restProps.disabled }
				prefix={ prefix }
				suffix={ suffix }
			>
				<_Input
					ref={ mergedRef }
					className={ clsx( defenseStyles.input, styles.input ) }
					{ ...valueTextProps }
					{ ...restProps }
				/>
			</InputLayout>
		);
	}
);
