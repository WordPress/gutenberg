import { Input as _Input } from '@base-ui/react/input';
import clsx from 'clsx';
import { useMergeRefs } from '@wordpress/compose';
import { forwardRef, useEffect, useRef, useState } from '@wordpress/element';
import defenseStyles from '../../../utils/css/global-css-defense.module.css';
import focusStyles from '../../../utils/css/focus.module.scss';
import styles from './style.module.css';
import type { InputProps } from './types';
import { InputLayout } from '../input-layout';

function toValueText(
	value: InputProps[ 'value' ] | InputProps[ 'defaultValue' ]
) {
	return value === undefined || value === null ? '' : String( value );
}

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
			onValueChange,
			...restProps
		},
		ref
	) {
		// VoiceOver reads a number input with a `max` as a percentage of its
		// range, unless it has an `aria-valuetext`.
		const needsValueText =
			restProps.type === 'number' &&
			restProps[ 'aria-valuetext' ] === undefined;
		const tracksValue = needsValueText && restProps.value === undefined;

		const inputRef = useRef< HTMLInputElement >( null );
		const mergedRef = useMergeRefs( [ ref, inputRef ] );
		const [ uncontrolledValue, setUncontrolledValue ] = useState( () =>
			toValueText( restProps.defaultValue )
		);

		useEffect( () => {
			const input = inputRef.current;
			if ( ! tracksValue || ! input ) {
				return;
			}
			setUncontrolledValue( input.value );

			// A form reset restores the default value without an input event.
			const onReset = ( event: Event ) => {
				if ( event.target !== input.form ) {
					return;
				}
				// `reset` fires before the form restores its values.
				setTimeout( () => setUncontrolledValue( input.value ) );
			};
			const { ownerDocument } = input;
			ownerDocument.addEventListener( 'reset', onReset );
			return () => ownerDocument.removeEventListener( 'reset', onReset );
		}, [ tracksValue ] );

		const valueText = tracksValue
			? uncontrolledValue
			: toValueText( restProps.value );
		const ariaValueText =
			needsValueText && valueText !== '' ? valueText : undefined;

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
					aria-valuetext={ ariaValueText }
					onValueChange={ ( value, eventDetails ) => {
						if ( tracksValue ) {
							setUncontrolledValue( value );
						}
						onValueChange?.( value, eventDetails );
					} }
					{ ...restProps }
				/>
			</InputLayout>
		);
	}
);
