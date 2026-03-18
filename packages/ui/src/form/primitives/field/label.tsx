import clsx from 'clsx';
import { Field as _Field } from '@base-ui/react/field';
import { forwardRef } from '@wordpress/element';
import fieldStyles from '../../../utils/css/field.module.css';
import { VisuallyHidden } from '../../../visually-hidden';
import type { FieldLabelProps } from './types';

export const Label = forwardRef< HTMLLabelElement, FieldLabelProps >(
	function Label(
		{ className, hideFromVision, variant, ...restProps },
		ref
	) {
		return (
			<_Field.Label
				ref={ ref }
				className={ clsx(
					fieldStyles.label,
					variant && fieldStyles[ `is-${ variant }` ],
					className
				) }
				{ ...( hideFromVision && {
					render: <VisuallyHidden />,
					nativeLabel: false,
				} ) }
				{ ...restProps }
			/>
		);
	}
);
