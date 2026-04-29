import clsx from 'clsx';
import { forwardRef, useEffect, useId } from '@wordpress/element';
import fieldStyles from '../../../utils/css/field.module.css';
import { Text } from '../../../text';
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

	return (
		<Text
			render={ render ?? <p ref={ ref } id={ id } { ...restProps } /> }
			variant="body-sm"
			className={ clsx( fieldStyles.description, className ) }
		/>
	);
} );
