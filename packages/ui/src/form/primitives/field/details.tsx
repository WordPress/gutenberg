import clsx from 'clsx';
import { Field as _Field } from '@base-ui/react/field';
import { forwardRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import fieldStyles from '../../../utils/css/field.module.css';
import type { FieldDetailsProps } from './types';
import { VisuallyHidden } from '../../../visually-hidden';

/**
 * A component for showing additional information about the field,
 * styled similarly to a normal `Field.Description`.
 * Unlike a normal description, it can include links and other semantic elements.
 *
 * Although this content is not associated with the field using direct semantics,
 * it is made discoverable to screen reader users via a visually hidden description,
 * alerting them to the presence of additional information below.
 *
 * If the content only includes plain text, use `Field.Description` instead,
 * so the readout is not unnecessarily verbose for screen reader users.
 */
export const Details = forwardRef< HTMLDivElement, FieldDetailsProps >(
	function Details( { className, ...restProps }, ref ) {
		return (
			<>
				<_Field.Description render={ <VisuallyHidden /> }>
					{ __( 'More details follow the field.' ) }
				</_Field.Description>
				<div
					ref={ ref }
					className={ clsx( fieldStyles.description, className ) }
					{ ...restProps }
				></div>
			</>
		);
	}
);
