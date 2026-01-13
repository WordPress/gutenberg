import clsx from 'clsx';
import { mergeProps, useRender } from '@base-ui/react';
import { forwardRef, useEffect, useId } from '@wordpress/element';
import fieldStyles from '../../../utils/css/field.module.css';
import { useFieldsetContext } from './context';
import type { FieldsetDescriptionProps } from './types';

export const FieldsetDescription = forwardRef<
	HTMLParagraphElement,
	FieldsetDescriptionProps
>( function FieldsetDescription(
	{ className, id: idProp, render, ...restProps },
	ref
) {
	const generatedId = useId();
	const id = idProp ?? generatedId;
	const { registerDescriptionId, unregisterDescriptionId } =
		useFieldsetContext();

	useEffect( () => {
		registerDescriptionId( id );
		return unregisterDescriptionId;
	}, [ registerDescriptionId, unregisterDescriptionId, id ] );

	const element = useRender( {
		defaultTagName: 'p',
		render,
		ref,
		props: mergeProps< 'p' >(
			{ className: clsx( fieldStyles.description, className ), id },
			restProps
		),
	} );

	return element;
} );
