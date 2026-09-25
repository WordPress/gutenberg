import { mergeProps, useRender } from '@base-ui/react';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import fieldStyles from '../../../utils/css/field.module.css';
import type { FieldVisualLabelProps } from './types';

/**
 * Renders a purely visual label with the same styling as `Field.Label`.
 *
 * It can be used outside `Field.Root` when the control is already
 * accessibly labeled, but a visual label is still needed for layout
 * consistency.
 *
 * Unlike `Field.Label`, this component does not carry semantics and is not
 * associated with a control.
 */
export const VisualLabel = forwardRef< HTMLSpanElement, FieldVisualLabelProps >(
	function VisualLabel( { className, render, variant, ...restProps }, ref ) {
		return useRender( {
			defaultTagName: 'span',
			render,
			ref,
			props: mergeProps< 'span' >( restProps, {
				className: clsx(
					fieldStyles.label,
					variant && fieldStyles[ `is-${ variant }` ],
					className
				),
			} ),
		} );
	}
);

VisualLabel.displayName = 'Field.VisualLabel';
