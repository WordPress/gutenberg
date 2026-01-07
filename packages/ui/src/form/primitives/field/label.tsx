import clsx from 'clsx';
import { Field as _Field } from '@base-ui/react/field';
import { forwardRef } from '@wordpress/element';
import fieldStyles from '../../../utils/css/field.module.css';
import type { FieldLabelProps } from './types';

export const Label = forwardRef< HTMLLabelElement, FieldLabelProps >(
	function Label( { className, variant, ...restProps }, ref ) {
		return (
			<_Field.Label
				ref={ ref }
				className={ clsx(
					fieldStyles.label,
					variant && fieldStyles[ `is-${ variant }` ],
					className
				) }
				{ ...restProps }
			/>
		);
	}
);
