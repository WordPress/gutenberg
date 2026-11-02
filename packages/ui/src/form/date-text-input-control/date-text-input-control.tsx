import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import * as Field from '../primitives/field';
import type { ControlProps } from '../types';
import { DateInput } from '../primitives/date-text-input/date-input';
import { DateRangeInput } from '../primitives/date-text-input/date-range-input';
import { TimeInput } from '../primitives/date-text-input/time-input';
import type {
	DateInputProps,
	DateRangeInputProps,
	TimeInputProps,
} from '../primitives/date-text-input/types';
import styles from '../input-control/style.module.css';

/** A date input with the same label and description composition as InputControl. */
export const DateInputControl = forwardRef<
	HTMLInputElement,
	DateInputProps & ControlProps
>( function UnforwardedDateInputControl(
	{ className, label, description, details, hideLabelFromVision, ...props },
	ref
) {
	return (
		<Field.Root className={ clsx( styles.root, className ) }>
			<Field.Label hideFromVision={ hideLabelFromVision }>
				{ label }
			</Field.Label>
			<DateInput ref={ ref } { ...props } />
			{ description && (
				<Field.Description>{ description }</Field.Description>
			) }
			{ details && <Field.Details>{ details }</Field.Details> }
		</Field.Root>
	);
} );

/** A range input with an associated label and description. */
export const DateRangeInputControl = forwardRef<
	HTMLInputElement,
	DateRangeInputProps & ControlProps
>( function UnforwardedDateRangeInputControl(
	{ className, label, description, details, hideLabelFromVision, ...props },
	ref
) {
	return (
		<Field.Root className={ clsx( styles.root, className ) }>
			<Field.Label hideFromVision={ hideLabelFromVision }>
				{ label }
			</Field.Label>
			<DateRangeInput ref={ ref } { ...props } />
			{ description && (
				<Field.Description>{ description }</Field.Description>
			) }
			{ details && <Field.Details>{ details }</Field.Details> }
		</Field.Root>
	);
} );

/** A time input with an associated label and description. */
export const TimeInputControl = forwardRef<
	HTMLInputElement,
	TimeInputProps & ControlProps
>( function UnforwardedTimeInputControl(
	{ className, label, description, details, hideLabelFromVision, ...props },
	ref
) {
	return (
		<Field.Root className={ clsx( styles.root, className ) }>
			<Field.Label hideFromVision={ hideLabelFromVision }>
				{ label }
			</Field.Label>
			<TimeInput ref={ ref } { ...props } />
			{ description && (
				<Field.Description>{ description }</Field.Description>
			) }
			{ details && <Field.Details>{ details }</Field.Details> }
		</Field.Root>
	);
} );
