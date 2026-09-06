import clsx from 'clsx';
import { forwardRef, useEffect, useId } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import fieldStyles from '../../../utils/css/field.module.css';
import { useFieldsetContext } from './context';
import { VisuallyHidden } from '../../../visually-hidden';
import type { FieldsetDetailsProps } from './types';

/**
 * A component for showing additional information about the fieldset,
 * styled similarly to a normal `Fieldset.Description`.
 * Unlike a normal description, it can include links and other semantic elements.
 *
 * Although this content is not associated with the fieldset using direct semantics,
 * it is made discoverable to screen reader users via a visually hidden description,
 * alerting them to the presence of additional information below.
 *
 * If the content only includes plain text, use `Fieldset.Description` instead,
 * so the readout is not unnecessarily verbose for screen reader users.
 */
export const FieldsetDetails = forwardRef<
	HTMLDivElement,
	FieldsetDetailsProps
>( function FieldsetDetails( { className, ...restProps }, ref ) {
	const id = useId();
	const { registerDescriptionId, unregisterDescriptionId } =
		useFieldsetContext();

	useEffect( () => {
		registerDescriptionId( id );
		return unregisterDescriptionId;
	}, [ registerDescriptionId, unregisterDescriptionId, id ] );

	return (
		<>
			<VisuallyHidden id={ id }>
				{ __( 'More details follow.' ) }
			</VisuallyHidden>
			<div
				ref={ ref }
				className={ clsx( fieldStyles.description, className ) }
				{ ...restProps }
			/>
		</>
	);
} );
