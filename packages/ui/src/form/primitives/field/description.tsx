import clsx from 'clsx';
import { Field as _Field } from '@base-ui/react/field';
import { forwardRef } from '@wordpress/element';
import fieldStyles from '../../../utils/css/field.module.css';
import type { FieldDescriptionProps } from './types';

export const Description = forwardRef<
	HTMLParagraphElement,
	FieldDescriptionProps
>( function Description( { className, ...restProps }, ref ) {
	return (
		<_Field.Description
			ref={ ref }
			className={ clsx( fieldStyles.description, className ) }
			{ ...restProps }
		/>
	);
} );
