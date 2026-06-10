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
		const label = (
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

		// VisuallyHidden is the host so that _Field.Label's semantic
		// element is preserved. See VisuallyHidden docs for details.
		if ( hideFromVision ) {
			return <VisuallyHidden render={ label } />;
		}

		return label;
	}
);
