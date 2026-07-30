import clsx from 'clsx';
import { Field as _Field } from '@base-ui/react/field';
import { forwardRef } from '@wordpress/element';
import defenseStyles from '../../../utils/css/global-css-defense.module.css';
import fieldStyles from '../../../utils/css/field.module.css';
import type { FieldDescriptionProps } from './types';

export const Description = forwardRef<
	HTMLParagraphElement,
	FieldDescriptionProps
>( function Description( { className, ...restProps }, ref ) {
	return (
		<_Field.Description
			ref={ ref }
			className={ clsx(
				defenseStyles.p,
				fieldStyles.description,
				className
			) }
			{ ...restProps }
		/>
	);
} );
