import { mergeProps, useRender } from '@base-ui/react';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import defenseStyles from '../../../utils/css/global-css-defense.module.css';
import fieldStyles from '../../../utils/css/field.module.css';
import type { FieldVisualDescriptionProps } from './types';

/**
 * Renders a purely visual description with the same styling as
 * `Field.Description`.
 *
 * It can be used outside `Field.Root` when supplementary text is needed
 * for layout consistency, but should not be associated with a control
 * using `aria-describedby`.
 *
 * Unlike `Field.Description`, this component does not carry semantics and is
 * not associated with a control.
 */
export const VisualDescription = forwardRef<
	HTMLParagraphElement,
	FieldVisualDescriptionProps
>( function VisualDescription( { className, render, ...restProps }, ref ) {
	return useRender( {
		defaultTagName: 'p',
		render,
		ref,
		props: mergeProps< 'p' >( restProps, {
			className: clsx(
				defenseStyles.p,
				fieldStyles.description,
				className
			),
		} ),
	} );
} );

VisualDescription.displayName = 'Field.VisualDescription';
